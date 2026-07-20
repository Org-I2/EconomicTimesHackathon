import os
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import settings
import services.graph as graph
from services.chunking import process_and_index_document


def _write_visual_graph(output_path: str | None = None) -> str:
    output_path = output_path or os.path.join(os.path.dirname(settings.graph_db_path), "knowledge_graph_visual.svg")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    conn = sqlite3.connect(settings.graph_db_path)
    try:
        nodes = conn.execute("SELECT id, type, label FROM graph_nodes ORDER BY type, label").fetchall()
        edges = conn.execute("SELECT source_id, target_id, type FROM graph_edges ORDER BY type").fetchall()
    finally:
        conn.close()

    if not nodes:
        svg = "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='white'/><text x='20' y='30'>No graph nodes found</text></svg>"
        Path(output_path).write_text(svg, encoding="utf-8")
        return output_path

    width, height = 700, 260
    node_width = 140
    node_height = 50
    spacing_x = 180
    spacing_y = 80

    positions = {}
    for idx, (node_id, node_type, label) in enumerate(nodes):
        col = idx % 3
        row = idx // 3
        x = 80 + col * spacing_x
        y = 70 + row * spacing_y
        positions[node_id] = (x, y)

    svg_parts = [
        f"<svg xmlns='http://www.w3.org/2000/svg' width='{width}' height='{height}'>",
        "<rect width='100%' height='100%' fill='white'/>",
        "<g>",
    ]

    for source_id, target_id, edge_type in edges:
        x1, y1 = positions[source_id]
        x2, y2 = positions[target_id]
        svg_parts.append(
            f"<line x1='{x1}' y1='{y1 + node_height/2}' x2='{x2}' y2='{y2 + node_height/2}' stroke='gray' stroke-width='2' marker-end='url(#arrow)' />"
        )
        svg_parts.append(
            f"<text x='{(x1 + x2) / 2}' y='{(y1 + y2) / 2 - 6}' font-size='12' fill='gray'>{edge_type}</text>"
        )

    svg_parts.extend([
        "<defs><marker id='arrow' markerWidth='10' markerHeight='10' refX='8' refY='3' orient='auto' markerUnits='strokeWidth'><path d='M0,0 L0,6 L9,3 z' fill='gray' /></marker></defs>",
        "</g>",
    ])

    for node_id, node_type, label in nodes:
        x, y = positions[node_id]
        color = {
            "Document": "#8ecae6",
            "Equipment": "#ffb703",
            "Person": "#90be6d",
        }.get(node_type, "#d9d9d9")
        svg_parts.append(
            f"<rect x='{x}' y='{y}' width='{node_width}' height='{node_height}' rx='8' fill='{color}' stroke='black' />"
        )
        svg_parts.append(
            f"<text x='{x + 10}' y='{y + 28}' font-size='12' font-family='Arial'>{label}</text>"
        )

    svg_parts.append("</svg>")
    Path(output_path).write_text("\n".join(svg_parts), encoding="utf-8")
    return output_path


def test_settings_expose_graph_db_path() -> None:
    assert hasattr(settings, "graph_db_path")


def test_build_graph_for_document_creates_nodes_and_edges() -> None:
    sample_text = "Pump P-204 tripped on high vibration. Inspected by John Smith."
    result = graph.build_graph_for_document(
        "doc-graph-test",
        sample_text,
        "Incident Report",
    )

    process_and_index_document(
        "doc-graph-test",
        [{"page_number": 1, "text": sample_text}],
        filename="graph_sample.txt",
    )

    visual_path = _write_visual_graph()
    assert os.path.exists(visual_path)
    assert result["edges_created"] >= 3


if __name__ == "__main__":
    test_settings_expose_graph_db_path()
    test_build_graph_for_document_creates_nodes_and_edges()
    print("Graph visual written to:", _write_visual_graph())
