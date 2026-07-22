"""
Knowledge graph service.

Extracts equipment tags and person names from document text via regex
heuristics, then upserts them as nodes/edges in a lightweight SQLite
graph (graph_nodes / graph_edges) — not a graph database, per the project
brief. Owns its own SQLite file (core.config.graph_db_path), separate
from the main app's database.

Node IDs are deterministic: "{type}:{normalized_key}" where
normalized_key = the entity's raw text, uppercased and trimmed. This is
what gives us dedup-by-normalized-key "for free" via INSERT OR IGNORE
against a TEXT PRIMARY KEY — the same tag/name always produces the same
node id, whichever document it was first seen in, and callers (including
tests) can compute a node's id directly without a separate lookup.

Edges are rebuilt per-document on every call to build_graph_for_document:
that document's existing edges are deleted first, then reinserted from a
fresh extraction. This makes re-indexing a document idempotent (its edge
count doesn't grow on re-runs), while nodes themselves are never deleted
(other documents may still reference them).
"""

from __future__ import annotations

import logging
import os
import re
import sqlite3
import uuid

from core.config import settings

logger = logging.getLogger(__name__)

# \b[A-Z]{1,4}-\d{2,5}\b matches tags like P-204, V-101, TK-3050.
_EQUIPMENT_TAG_PATTERN = re.compile(r"\b[A-Z]{1,4}-\d{2,5}\b")

# Capitalized two-word sequence immediately following one of these phrases,
# e.g. "Inspected by John Smith" -> "John Smith".
_PERSON_PATTERN = re.compile(
    r"(?:Inspected by|Reported by|Approved by)\s+([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)"
)

_INCIDENT_REPORT_DOCUMENT_TYPE = "Incident Report"


def extract_equipment_tags(text: str) -> list[str]:
    """
    Find equipment tags in text, e.g. "P-204", "V-101", "TK-3050".

    Returns:
        Unique tags in first-occurrence order. [] if text is empty or no
        tags are found.
    """
    if not text:
        return []

    seen: set[str] = set()
    tags: list[str] = []
    for match in _EQUIPMENT_TAG_PATTERN.finditer(text):
        tag = match.group(0)
        if tag not in seen:
            seen.add(tag)
            tags.append(tag)
    return tags


def extract_persons(text: str) -> list[str]:
    """
    Find person names immediately following "Inspected by", "Reported by",
    or "Approved by" — a heuristic, not a general name detector.

    Returns:
        Unique names ("Firstname Lastname") in first-occurrence order.
        [] if text is empty or no matches are found.
    """
    if not text:
        return []

    seen: set[str] = set()
    names: list[str] = []
    for match in _PERSON_PATTERN.finditer(text):
        name = match.group(1).strip()
        if name not in seen:
            seen.add(name)
            names.append(name)
    return names


# --------------------------------------------------------------------------
# SQLite plumbing
# --------------------------------------------------------------------------

def _get_connection() -> sqlite3.Connection:
    db_dir = os.path.dirname(settings.graph_db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(settings.graph_db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    _ensure_schema(conn)
    return conn


def _ensure_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS graph_nodes (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            label TEXT NOT NULL,
            normalized_key TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS graph_edges (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            type TEXT NOT NULL,
            document_id TEXT NOT NULL,
            FOREIGN KEY (source_id) REFERENCES graph_nodes(id),
            FOREIGN KEY (target_id) REFERENCES graph_nodes(id)
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_graph_edges_document_id ON graph_edges(document_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_graph_edges_source_id ON graph_edges(source_id)")
    conn.commit()


def _make_node_id(node_type: str, normalized_key: str) -> str:
    return f"{node_type}:{normalized_key}"


def _upsert_node(conn: sqlite3.Connection, node_type: str, label: str) -> tuple[str, bool]:
    """Insert a node if it doesn't already exist (deduped by normalized_key).

    Returns (node_id, was_newly_created)."""
    normalized_key = label.strip().upper()
    node_id = _make_node_id(node_type, normalized_key)
    cursor = conn.execute(
        "INSERT OR IGNORE INTO graph_nodes (id, type, label, normalized_key) VALUES (?, ?, ?, ?)",
        (node_id, node_type, label.strip(), normalized_key),
    )
    return node_id, cursor.rowcount == 1


def _insert_edge(conn: sqlite3.Connection, source_id: str, target_id: str, edge_type: str, document_id: str) -> None:
    conn.execute(
        "INSERT INTO graph_edges (id, source_id, target_id, type, document_id) VALUES (?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), source_id, target_id, edge_type, document_id),
    )


# --------------------------------------------------------------------------
# Public interface
# --------------------------------------------------------------------------

def build_graph_for_document(document_id: str, text: str, document_type: str) -> dict:
    """
    Extract entities from a document and (re)build its graph edges.

    Creates a Document node for document_id, an Equipment node per unique
    tag found, a Person node per unique name found, and MENTIONED_IN edges
    from each entity node to the Document node. If document_type is
    "Incident Report", equipment nodes also get an additional HAS_INCIDENT
    edge to the Document node.

    This document's existing edges are deleted before rebuilding, so
    re-running with the same (or updated) text is idempotent — edge count
    for this document never grows across repeated calls. Nodes are never
    deleted, since other documents may still reference the same entity.

    Args:
        document_id: Stable ID for the source document.
        text: Full text to extract entities from (e.g. all pages joined).
        document_type: e.g. "Incident Report", "Inspection Report", "SOP".
            Only "Incident Report" (exact match) triggers HAS_INCIDENT edges.

    Returns:
        {"nodes_created": int, "edges_created": int} — counts of new rows
        actually written in this call (nodes_created excludes entities
        that already existed from a prior document).

    Raises:
        ValueError: if document_id is empty.
    """
    if not document_id or not document_id.strip():
        raise ValueError("build_graph_for_document requires a non-empty document_id")

    conn = _get_connection()
    try:
        nodes_created = 0
        edges_created = 0

        # Idempotent rebuild: clear this document's previously created
        # edges before reinserting from a fresh extraction.
        conn.execute("DELETE FROM graph_edges WHERE document_id = ?", (document_id,))

        document_node_id, doc_created = _upsert_node(conn, "Document", document_id)
        nodes_created += int(doc_created)

        for tag in extract_equipment_tags(text):
            equipment_node_id, created = _upsert_node(conn, "Equipment", tag)
            nodes_created += int(created)

            _insert_edge(conn, equipment_node_id, document_node_id, "MENTIONED_IN", document_id)
            edges_created += 1

            if document_type == _INCIDENT_REPORT_DOCUMENT_TYPE:
                _insert_edge(conn, equipment_node_id, document_node_id, "HAS_INCIDENT", document_id)
                edges_created += 1

        for person in extract_persons(text):
            person_node_id, created = _upsert_node(conn, "Person", person)
            nodes_created += int(created)

            _insert_edge(conn, person_node_id, document_node_id, "MENTIONED_IN", document_id)
            edges_created += 1

        conn.commit()
        return {"nodes_created": nodes_created, "edges_created": edges_created}
    finally:
        conn.close()


def get_node_with_edges(node_id: str) -> dict:
    """
    Look up a node and its outgoing edges (this node as the edge source).

    Args:
        node_id: e.g. "Equipment:P-204" — see module docstring for the
            "{type}:{normalized_key}" id scheme.

    Returns:
        {"node": {"id", "type", "label"},
         "edges": [{"type", "target": {"id", "type", "label"}}, ...]}

    Raises:
        ValueError: if no node with that id exists.
    """
    conn = _get_connection()
    try:
        row = conn.execute(
            "SELECT id, type, label FROM graph_nodes WHERE id = ?", (node_id,)
        ).fetchone()
        if row is None:
            raise ValueError(f"No graph node found with id '{node_id}'")

        node = {"id": row[0], "type": row[1], "label": row[2]}

        edge_rows = conn.execute(
            """
            SELECT e.type, n.id, n.type, n.label
            FROM graph_edges e
            JOIN graph_nodes n ON n.id = e.target_id
            WHERE e.source_id = ?
            """,
            (node_id,),
        ).fetchall()

        edges = [
            {"type": edge_type, "target": {"id": target_id, "type": target_type, "label": target_label}}
            for edge_type, target_id, target_type, target_label in edge_rows
        ]

        return {"node": node, "edges": edges}
    finally:
        conn.close()