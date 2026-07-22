# Software Requirements Document (SRD)
## Unified Asset & Operations Brain — AI-Powered Industrial Knowledge Intelligence Platform

**Document Type:** Enterprise Software Requirements Document
**Project Category:** Hackathon Prototype (Problem Statement 8 — AI for Industrial Knowledge Intelligence)
**Team Size Assumption:** 3–4 students
**Cost Constraint:** 100% free, open-source, self-hosted, locally executable
**Version:** 1.0
**Status:** Baseline — Single Source of Truth for the entire project lifecycle

> **Reading note for AI coding agents:** This document is written to be consumed directly by AI coding agents (Claude, ChatGPT, Gemini, Codex). Every functional and technical decision below is final and non-ambiguous. Do not introduce paid services, cloud infrastructure, or technologies outside the stack fixed in Section 15. Where a decision had multiple options, the cheapest/simplest free option has already been chosen and justified — do not re-litigate it.

---

## 1. Executive Summary

### 1.1 Problem

Industrial organizations (oil & gas, manufacturing, chemicals, process plants) store operational knowledge across ten or more disconnected systems — engineering drawings, P&IDs, maintenance records, SOPs, inspection reports, work orders, email archives, equipment manuals, compliance documents, and incident reports. Engineers reportedly spend close to a third of their working time simply searching for information rather than solving problems, maintenance teams frequently cannot reconstruct complete equipment history, and knowledge held only in the heads of experienced engineers is lost when they retire.

### 1.2 Vision

Build a single, self-hosted "brain" for a plant's documents: one platform where any PDF, scanned image, spreadsheet, or manual can be dropped in, and comes back out as searchable text, linked entities (equipment, documents, people, incidents), and a chat interface that answers operational questions with citations back to the source document.

### 1.3 Objectives

1. Ingest heterogeneous industrial documents (PDF, scanned image, DOCX, XLSX, plain text) into one searchable repository.
2. Automatically extract text from both digital and scanned documents using free OCR.
3. Build a lightweight knowledge graph connecting equipment, documents, incidents, and maintenance actions.
4. Provide a Retrieval-Augmented Generation (RAG) chat copilot that answers questions using only ingested documents, with citations.
5. Surface maintenance history and simple predictive/rule-based maintenance recommendations per equipment.
6. Provide a basic root-cause-analysis assistant that correlates incident reports with equipment and SOP data.
7. Flag compliance-relevant documents and track their review/expiry status.
8. Capture "lessons learned" as a structured, searchable log distinct from raw documents.
9. Run the entire system on a single laptop with zero recurring cost.

### 1.4 Expected Outcomes

A working, demoable prototype where a judge can: upload a folder of mixed industrial documents, watch them get OCR'd and indexed, ask a natural-language question in a chat UI and receive a cited answer, view a knowledge graph of equipment ↔ documents ↔ incidents, and see a maintenance dashboard for a specific asset — all running from `localhost`, no internet dependency after initial model download.

### 1.5 Business Value

- Reduces engineer search time by centralizing fragmented knowledge into one queryable interface.
- Preserves institutional knowledge that would otherwise leave with retiring staff.
- Improves auditability: every AI answer is traceable to a source document and page.
- Zero licensing cost makes it deployable by resource-constrained plants and is directly aligned with the hackathon's free-only constraint.

---

## 2. Problem Analysis

### 2.1 Current Workflow

An engineer needing information today (a) recalls which of ~10 systems might hold it, (b) manually searches each one with keyword search or browses folders, (c) opens multiple PDFs/scans to visually confirm relevance, (d) cross-references paper or email trails for context, and (e) often ends up asking a senior colleague directly because search failed.

### 2.2 Pain Points

| Pain Point | Impact |
|---|---|
| Knowledge scattered across many disconnected systems | No single search entry point |
| Scanned/handwritten documents are not text-searchable | Keyword search fails silently |
| No linkage between a piece of equipment and its full document history | Incomplete maintenance picture |
| Tribal knowledge lives only with senior engineers | Lost on retirement/attrition |
| Compliance documents are not tracked for expiry/review | Regulatory risk |
| Incident reports are not cross-referenced with root causes across time | Repeated failures |

### 2.3 Root Causes

- Documents were digitized department-by-department with no shared taxonomy or ID scheme linking them to physical assets.
- No OCR/text layer exists for legacy scanned documents.
- No incentive or tool existed to structure "lessons learned" separately from routine paperwork.

### 2.4 Stakeholders

**2.4.1 Primary Users**
- Plant/Maintenance Engineers — day-to-day searchers and question-askers.
- Reliability/Root-Cause Analysts — investigate recurring failures.

**2.4.2 Secondary Users**
- Compliance/QA Officers — track regulatory document status.
- Plant Managers — oversight, dashboards.
- System Administrator — manages users, re-indexing, document lifecycle (hackathon: a single admin role).

### 2.5 Personas

**Persona A — Rakesh, Maintenance Engineer (Primary).** 8 years on the floor, needs to know a pump's full history before he approves a repair. Currently calls three different departments. Wants: type a question, get an answer with the document open next to it.

**Persona B — Dr. Anjali, Reliability Analyst (Primary).** Investigates why a compressor tripped for the third time this year. Wants: see every incident, SOP, and maintenance record connected to that specific compressor, in one graph.

**Persona C — Vinod, Compliance Officer (Secondary).** Needs to know which safety certificates expire this quarter. Wants: a filtered list, not a document hunt.

### 2.6 Use Cases

| ID | Use Case | Primary Actor |
|---|---|---|
| UC-1 | Upload and auto-index a batch of documents | Admin/Engineer |
| UC-2 | Ask a natural-language question and receive a cited answer | Engineer |
| UC-3 | View an equipment's full connected history via knowledge graph | Analyst |
| UC-4 | Get maintenance recommendation for a selected asset | Engineer |
| UC-5 | Run root-cause correlation for a reported incident | Analyst |
| UC-6 | List compliance documents nearing expiry | Compliance Officer |
| UC-7 | Log and search a "lesson learned" entry | Engineer |
| UC-8 | Browse/search all documents with filters | Any user |

### 2.7 User Journey (Illustrative — Rakesh, UC-2)

1. Rakesh opens the app on his laptop browser (`localhost:5173`).
2. Types: *"What was the last inspection finding on Pump P-204?"*
3. System retrieves top-matching chunks from OCR'd inspection reports mentioning P-204, builds a prompt, calls the local Ollama model.
4. Answer streams back with a one-line finding plus a citation chip: *"Inspection Report #INS-2024-118, page 3."*
5. Rakesh clicks the citation, the original PDF opens in a side panel at the matching page.

---

## 3. Scope

### 3.1 In Scope (Hackathon Deliverable)

- Document upload (PDF, DOCX, XLSX/CSV, PNG/JPG scans, TXT) via web UI.
- OCR pipeline for scanned/image-based documents using Tesseract.
- Text extraction, cleaning, and chunking pipeline for all supported formats.
- Local embedding generation (Sentence-Transformers) and vector search (FAISS or ChromaDB).
- RAG-based chat copilot with citation of source document + page.
- Lightweight knowledge graph (SQLite-backed nodes/edges, not a dedicated graph DB) linking Equipment, Document, Incident, SOP, Person entities via simple NER + regex/tag extraction (equipment tag patterns, e.g. `P-204`, `V-101`).
- Maintenance Intelligence: per-equipment timeline view + simple rule-based "next maintenance due" recommendation (based on stated maintenance intervals in documents/metadata, not ML failure prediction).
- Root Cause Analysis: a guided assistant that, given an incident description, retrieves and ranks related documents (incidents, SOPs, maintenance records) mentioning the same equipment tag/keywords, and asks the LLM to summarize probable contributing factors **from retrieved evidence only**.
- Regulatory Compliance Intelligence: document tagging as "compliance-relevant" (manual tag or keyword-based auto-tag) with an expiry-date field and a dashboard of upcoming/expired items.
- Lessons Learned Engine: a structured form (equipment, issue, resolution, tags) stored and made searchable/embeddable alongside documents.
- Basic local authentication (single admin + engineer role, hashed password, session token) — not enterprise SSO.
- Responsive web frontend (desktop-first, usable on mobile browser viewport).
- Audit log of uploads, indexing runs, and chat queries.

### 3.2 Out of Scope (Explicitly Not Built)

- Any paid/cloud AI API, cloud vector DB, cloud storage, or cloud compute.
- True machine-learning-based predictive maintenance (failure prediction models trained on time-series sensor data) — no sensor/IoT data is available in this hackathon; only document-derived intervals are used.
- Multi-tenant, multi-plant enterprise deployment; SSO/LDAP/OAuth enterprise auth.
- Full computer-vision-based P&ID symbol recognition (schematic parsing into structured graph elements) — treated as a stretch/future item; hackathon scope only OCRs P&IDs as image+text like any other scanned document.
- Kubernetes, Docker orchestration, horizontal scaling, or high-availability clustering.
- Mobile native apps (iOS/Android) — mobile is covered via responsive web only.
- Automated document version-control/redlining workflows.

### 3.3 Future Scope

- Fine-tuned/local vision-language model for true P&ID symbol-to-graph extraction.
- Integration with real IoT/SCADA sensor feeds for genuine predictive maintenance.
- Multi-plant, multi-tenant deployment with role-based access control (RBAC) and SSO.
- Offline mobile app with local sync.
- Neo4j (Community Edition, self-hosted) migration once graph complexity outgrows SQLite adjacency tables.

---

## 4. Functional Requirements

Priority scale: **P0** = must-have for demo, **P1** = important, should attempt, **P2** = nice-to-have if time remains.

### FR-1: Universal Document Ingestion — P0
- **Description:** Users upload one or more files (PDF, DOCX, XLSX, CSV, PNG, JPG, TXT) via drag-and-drop or file picker.
- **Inputs:** Multipart file(s), optional metadata (document type, equipment tag, compliance flag).
- **Outputs:** Stored file on local filesystem, a `documents` DB row with status `UPLOADED`.
- **Validation Rules:** Max file size 50 MB per file (configurable); allowed extensions only (`.pdf, .docx, .xlsx, .csv, .png, .jpg, .jpeg, .txt`); reject files with mismatched MIME type vs extension.
- **Business Rules:** Every uploaded file gets a UUID-based storage name to prevent collisions; original filename preserved in DB.
- **Dependencies:** Local filesystem write access under `/data/uploads/`.
- **Acceptance Criteria:** Given a valid PDF ≤ 50MB, when uploaded, a `documents` row is created with status `UPLOADED` and the file exists on disk within 2 seconds.

### FR-2: OCR & Text Extraction — P0
- **Description:** Background worker picks up `UPLOADED` documents, extracts text (native extraction for PDF/DOCX/XLSX/TXT; Tesseract OCR for images and scanned PDFs), and stores raw extracted text.
- **Inputs:** Document ID.
- **Outputs:** `document_text` row(s) with page number and extracted text; status transitions to `EXTRACTED` or `EXTRACTION_FAILED`.
- **Validation Rules:** If OCR confidence average < 40% for a page, flag page as `LOW_CONFIDENCE` but still store the text.
- **Business Rules:** PDFs are first tried with native text extraction (PyMuPDF); if a page returns < 20 characters, it is treated as scanned and re-run through Tesseract on a rasterized image of that page.
- **Dependencies:** FR-1 complete.
- **Acceptance Criteria:** A scanned PNG of a typed SOP page produces extracted text with ≥ 80% word accuracy on clean scans (manually spot-checked during demo).

### FR-3: Chunking & Embedding Indexing — P0
- **Description:** Extracted text is split into overlapping chunks, embedded with a local sentence-transformer model, and stored in the vector index.
- **Inputs:** Document ID with status `EXTRACTED`.
- **Outputs:** Vector index entries (FAISS/Chroma) + `chunks` table rows (chunk text, document_id, page_number, char_offset). Status transitions to `INDEXED`.
- **Validation Rules:** Chunk size 500–800 characters with 100-character overlap; skip empty/whitespace-only chunks.
- **Business Rules:** Re-indexing a document deletes its previous chunks/vectors before inserting new ones (no duplicate vectors).
- **Dependencies:** FR-2 complete.
- **Acceptance Criteria:** After indexing, `GET /documents/{id}` shows status `INDEXED` and chunk count > 0 for any non-empty document.

### FR-4: Semantic + Keyword Search — P0
- **Description:** A search bar lets users query across all indexed documents, returning ranked results with snippet highlights.
- **Inputs:** Query string, optional filters (document type, date range, equipment tag).
- **Outputs:** Ranked list of chunks with document metadata, page number, and similarity score.
- **Validation Rules:** Query must be 1–500 characters.
- **Business Rules:** Hybrid ranking = 0.7 × vector similarity + 0.3 × keyword (BM25-style via SQLite FTS5) match score.
- **Dependencies:** FR-3.
- **Acceptance Criteria:** Searching an exact phrase present in an indexed document returns that document in the top 3 results.

### FR-5: Expert Knowledge Copilot (RAG Chat) — P0
- **Description:** Conversational interface where the user asks a question; system retrieves top-k relevant chunks and asks the local LLM (via Ollama) to answer strictly from that context, with citations.
- **Inputs:** User question (text), optional conversation history (last 5 turns).
- **Outputs:** Streamed answer text + list of citation objects `{document_id, document_name, page_number, chunk_id}`.
- **Validation Rules:** If retrieval returns zero chunks above similarity threshold (0.35), respond with "No relevant information found in the indexed documents" rather than hallucinating.
- **Business Rules:** The system prompt instructs the model to answer only from provided context and to say so explicitly if the context is insufficient.
- **Dependencies:** FR-3, FR-4, Ollama running locally with a pulled model.
- **Acceptance Criteria:** Asking a question whose answer exists verbatim in an indexed document returns an answer citing that exact document.

### FR-6: Knowledge Graph Generation — P1
- **Description:** During indexing, a lightweight entity extractor scans text for equipment tags (regex pattern, e.g. `[A-Z]{1,3}-\d{2,4}`), known document types, and dates, creating graph nodes and edges (`Document —MENTIONS→ Equipment`, `Equipment —HAS_INCIDENT→ Incident`, etc.) stored in SQLite `graph_nodes`/`graph_edges` tables.
- **Inputs:** Extracted document text.
- **Outputs:** Graph node/edge rows; graph JSON payload for frontend visualization.
- **Validation Rules:** Deduplicate nodes by normalized entity key (uppercase, trimmed).
- **Business Rules:** Hackathon Implementation — entity extraction is regex + keyword-based, not a trained NER model, to stay within free/local constraints and hackathon timeline.
- **Dependencies:** FR-2.
- **Acceptance Criteria:** After indexing two documents that both mention "P-204," the graph shows one Equipment node "P-204" connected to both documents.

### FR-7: Maintenance Intelligence Dashboard — P1
- **Description:** Per-equipment view showing all linked documents chronologically, and a simple next-maintenance-due estimate.
- **Inputs:** Equipment tag/ID.
- **Outputs:** Timeline of linked documents/incidents; computed next-due date if a maintenance interval was found in metadata or document text (e.g., "every 6 months").
- **Validation Rules:** If no interval information exists, display "Not enough data" rather than guessing.
- **Business Rules:** Hackathon Implementation — this is rule-based (last known service date + stated interval), explicitly not a trained predictive-maintenance ML model.
- **Dependencies:** FR-6.
- **Acceptance Criteria:** Selecting an equipment tag with ≥1 linked maintenance record shows a non-empty timeline.

### FR-8: Root Cause Analysis Assistant — P1
- **Description:** User selects/describes an incident; system retrieves related documents (same equipment tag + semantically similar incidents/SOPs) and asks the LLM to summarize likely contributing factors, citing sources.
- **Inputs:** Incident description text or existing incident document ID.
- **Outputs:** Structured summary: probable factors list, each with supporting citation(s).
- **Validation Rules:** Same no-hallucination rule as FR-5 — factors must be traceable to retrieved text.
- **Business Rules:** Hackathon Implementation — correlation only, not statistical causal inference.
- **Dependencies:** FR-4, FR-5.
- **Acceptance Criteria:** Given an incident mentioning "P-204 vibration," output includes at least one cited document that also mentions P-204.

### FR-9: Regulatory Compliance Intelligence — P1
- **Description:** Documents can be tagged compliance-relevant (manually, or auto-tagged when keywords like "certificate," "permit," "audit," "regulation" appear) with an optional expiry date; a dashboard lists items expiring within 30/60/90 days.
- **Inputs:** Document metadata (`is_compliance`, `expiry_date`).
- **Outputs:** Filtered/sorted compliance list.
- **Validation Rules:** `expiry_date` must be a valid future or past date; past dates are shown as "Expired."
- **Business Rules:** Auto-tag is a suggestion the user can override.
- **Dependencies:** FR-1.
- **Acceptance Criteria:** A document with `expiry_date` within 30 days appears in the "expiring soon" list.

### FR-10: Lessons Learned Engine — P2
- **Description:** A structured form (title, equipment tag, problem, resolution, tags) that engineers fill after resolving an issue; entries are embedded and become searchable/chat-able alongside regular documents.
- **Inputs:** Form fields.
- **Outputs:** `lessons_learned` DB row + corresponding vector chunk.
- **Validation Rules:** Title and problem/resolution fields required, 10–2000 characters each.
- **Business Rules:** Lessons Learned entries are treated as a first-class document type in search/chat (source label "Lesson Learned").
- **Dependencies:** FR-3.
- **Acceptance Criteria:** A submitted lesson appears in search results for a query matching its content.

### FR-11: Local Authentication — P0
- **Description:** Simple username/password login; two roles — `admin`, `engineer`.
- **Inputs:** Username, password.
- **Outputs:** Session token (JWT, locally signed) on success.
- **Validation Rules:** Password ≥ 8 characters at account creation; bcrypt-hashed at rest.
- **Business Rules:** Admin can create/deactivate users; no self-registration in hackathon build (admin seeds users).
- **Dependencies:** None.
- **Acceptance Criteria:** Invalid credentials return 401; valid credentials return a usable JWT.

### FR-12: Document Browser & Filters — P0
- **Description:** Paginated, filterable, sortable list of all documents.
- **Inputs:** Filters: document type, status, date range, equipment tag, compliance flag.
- **Outputs:** Paginated document list with metadata.
- **Validation Rules:** `page ≥ 1`, `page_size` between 1–100.
- **Dependencies:** FR-1.
- **Acceptance Criteria:** Filtering by document type returns only matching documents.

### FR-13: Audit Log — P2
- **Description:** Every upload, indexing run, and chat query is logged with timestamp and user.
- **Inputs:** System events.
- **Outputs:** `audit_log` rows, viewable by admin.
- **Dependencies:** FR-11.
- **Acceptance Criteria:** After a chat query, a corresponding audit_log row appears within 1 second.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Search/chat retrieval responds within 3 seconds for a corpus of ≤ 2,000 chunks on a standard laptop (8GB+ RAM); OCR of a single scanned page completes within 10 seconds. |
| **Availability** | Single-machine local availability during demo; no uptime SLA required (hackathon prototype). |
| **Scalability** | Designed to comfortably handle a few hundred documents / tens of thousands of chunks on FAISS/Chroma with local disk; horizontal scaling explicitly out of scope. |
| **Security** | Passwords bcrypt-hashed; JWT session tokens; file upload MIME/extension validation; parameterized SQL only (no string-concatenated queries); path traversal prevention on file storage paths. |
| **Reliability** | Indexing failures are caught and logged per-document without crashing the ingestion worker for other documents; failed documents can be retried. |
| **Usability** | Web UI usable by a non-technical engineer with no training; upload → search → chat is discoverable within 3 clicks. |
| **Accessibility** | Semantic HTML, sufficient color contrast (WCAG AA target where feasible), keyboard-navigable forms — best-effort for a hackathon, not a certified audit. |
| **Maintainability** | Modular FastAPI routers per domain (documents, search, chat, graph, maintenance, compliance, lessons, auth); typed Pydantic schemas for all request/response bodies. |
| **Portability** | Runs on Windows/macOS/Linux with Python 3.10+ and Node 18+; no OS-specific code paths beyond Tesseract binary install instructions per-OS. |
| **Logging** | Structured logging (Python `logging` module, JSON formatter) for all API requests, indexing steps, and errors, written to a local rotating log file. |
| **Monitoring** | Lightweight: a `/health` endpoint reporting DB connectivity, Ollama reachability, and vector index status; no external monitoring stack (Prometheus/Grafana out of scope). |

---

## 6. System Modules

### 6.1 Ingestion Module
- **Purpose:** Accept and store raw documents.
- **Responsibilities:** File validation, storage, DB row creation, triggering the extraction queue.
- **Inputs:** Uploaded files + metadata.
- **Outputs:** `documents` rows, files on disk.
- **Interactions:** Hands off to Extraction Module via an internal task queue (simple in-process background task using FastAPI `BackgroundTasks`, or a lightweight polling worker — see Section 15 justification).

### 6.2 Extraction Module (OCR + Text Extraction)
- **Purpose:** Convert any supported file into clean, page-tagged text.
- **Responsibilities:** Format-specific extraction (PyMuPDF/python-docx/openpyxl), OCR fallback via Tesseract, text cleaning.
- **Inputs:** Document ID.
- **Outputs:** `document_text` rows.
- **Interactions:** Reads from Ingestion Module's storage; hands off to Indexing Module.

### 6.3 Indexing Module (Chunking + Embeddings)
- **Purpose:** Turn extracted text into searchable vectors.
- **Responsibilities:** Chunking, embedding generation (Sentence-Transformers), vector store upsert, SQLite FTS5 upsert for keyword search.
- **Inputs:** `document_text` rows.
- **Outputs:** `chunks` rows, vector index entries.
- **Interactions:** Also feeds the Knowledge Graph Module with raw text for entity extraction.

### 6.4 Knowledge Graph Module
- **Purpose:** Maintain entity relationships across documents.
- **Responsibilities:** Regex/keyword entity extraction, node/edge upsert, graph query API.
- **Inputs:** Extracted text + chunk metadata.
- **Outputs:** `graph_nodes`, `graph_edges` rows; graph JSON for visualization.
- **Interactions:** Consumed by Maintenance Intelligence and Root Cause Analysis modules.

### 6.5 Search & RAG Module
- **Purpose:** Serve search and chat queries.
- **Responsibilities:** Hybrid retrieval (vector + keyword), prompt assembly, Ollama call, citation formatting.
- **Inputs:** User query/question.
- **Outputs:** Ranked results or streamed chat answer with citations.
- **Interactions:** Reads Indexing Module's vector store and FTS5 index.

### 6.6 Maintenance Intelligence Module
- **Purpose:** Present equipment-centric history and due-date estimates.
- **Responsibilities:** Query graph for equipment-linked documents; compute rule-based next-due date.
- **Inputs:** Equipment tag.
- **Outputs:** Timeline + recommendation.
- **Interactions:** Reads from Knowledge Graph Module.

### 6.7 Root Cause Analysis Module
- **Purpose:** Assist incident investigation.
- **Responsibilities:** Retrieve related documents; orchestrate LLM summarization with strict citation grounding.
- **Inputs:** Incident text/ID.
- **Outputs:** Cited factor summary.
- **Interactions:** Reuses Search & RAG Module's retrieval + Ollama call pathway.

### 6.8 Compliance Module
- **Purpose:** Track regulatory document status.
- **Responsibilities:** Tagging (manual/auto), expiry tracking, dashboard aggregation.
- **Inputs:** Document metadata.
- **Outputs:** Compliance dashboard data.
- **Interactions:** Reads/writes `documents` table compliance fields.

### 6.9 Lessons Learned Module
- **Purpose:** Capture and surface tacit knowledge.
- **Responsibilities:** Form intake, storage, embedding hand-off.
- **Inputs:** Form submission.
- **Outputs:** `lessons_learned` rows + chunks.
- **Interactions:** Feeds Indexing Module for embeddings.

### 6.10 Auth & Admin Module
- **Purpose:** Authentication and user management.
- **Responsibilities:** Login, JWT issuance, user CRUD (admin-only), audit log viewing.
- **Inputs:** Credentials, admin actions.
- **Outputs:** JWT tokens, user records.
- **Interactions:** Middleware used by all other modules for route protection.

---

## 7. Complete User Flows

**7.1 Upload → OCR → Indexing (End-to-End Ingestion)**
1. User selects file(s) in the Upload screen and submits.
2. `POST /documents/upload` stores file, creates DB row (`UPLOADED`).
3. Background worker polls for `UPLOADED` documents, extracts text (native or Tesseract OCR), updates status to `EXTRACTED`.
4. Same worker chunk-splits text, generates embeddings, writes to FAISS/Chroma + FTS5, updates status to `INDEXED`.
5. Knowledge Graph Module extracts entities from the same text and upserts graph nodes/edges.
6. Frontend polls `GET /documents/{id}` (or receives a WebSocket/SSE status push) to reflect status changes live.

**7.2 Search**
1. User types a query in the Search bar.
2. `POST /search` performs hybrid retrieval, returns ranked snippets.
3. User clicks a result → opens document viewer at the matching page.

**7.3 RAG Chat**
1. User types a question in Chat.
2. `POST /chat` retrieves top-k chunks, assembles prompt, streams Ollama response with citations.
3. User clicks a citation chip → document viewer opens at that page, highlighting the matched chunk.

**7.4 Knowledge Graph Exploration**
1. User opens Graph view, optionally filters by equipment tag.
2. `GET /knowledge/node/{id}` (or `/knowledge/graph?equipment=P-204`) returns nodes/edges.
3. Frontend renders an interactive graph (force-directed) using a lightweight JS graph library.

**7.5 Maintenance Intelligence**
1. User selects an equipment tag from a dropdown/search.
2. `GET /maintenance/recommendations?equipment_tag=P-204` returns timeline + next-due estimate.
3. Timeline rendered chronologically with clickable document links.

**7.6 Root Cause Analysis**
1. User opens RCA screen, enters an incident description or selects an existing incident document.
2. `POST /rca/analyze` retrieves related documents and returns an LLM-generated, cited factor summary.
3. User reviews cited sources inline.

**7.7 Compliance**
1. User opens Compliance dashboard.
2. `GET /compliance/check` (or `/compliance/dashboard`) returns items grouped by Expired / Expiring Soon / OK.
3. User can click through to the source document.

**7.8 Lessons Learned**
1. User opens "Add Lesson Learned," fills the form, submits.
2. `POST /lessons` stores the entry and triggers embedding.
3. Entry appears in Search and is retrievable via Chat like any other document.

**7.9 Administration**
1. Admin logs in, opens Admin panel.
2. Can view audit log, create/deactivate users, trigger manual re-index of a document, view system `/health`.

---

## 8. API Contracts

**General conventions (apply to all endpoints unless stated otherwise):**
- **Base URL:** `http://localhost:8000/api/v1`
- **API Version:** `v1`, included in the URL path.
- **Authentication:** `Authorization: Bearer <JWT>` header, except `POST /auth/login`. JWT issued by FR-11, 24-hour expiry.
- **Content-Type:** `application/json` except file upload endpoints (`multipart/form-data`).
- **Pagination:** Query params `page` (default 1) and `page_size` (default 20, max 100) for all list endpoints. Response includes `{ "items": [...], "page": 1, "page_size": 20, "total": 137, "total_pages": 7 }`.
- **Sorting:** Query param `sort_by` + `sort_order` (`asc`/`desc`), field-specific per endpoint (documented below).
- **Filtering:** Endpoint-specific query params, documented per endpoint.
- **Idempotency:** All `POST` create endpoints are non-idempotent by default (each call creates a new resource) unless the endpoint explicitly states idempotency via a client-supplied `idempotency_key`.
- **Rate Limiting:** Hackathon Implementation — a simple in-memory token bucket, 60 requests/minute per user, returns `429` with `Retry-After` header when exceeded. No distributed rate limiting (single-instance app).
- **Standard Error Shape:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "file size exceeds 50MB limit",
    "details": {}
  }
}
```
- **Standard Status Codes:** `200` OK, `201` Created, `204` No Content, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `413` Payload Too Large, `422` Unprocessable Entity, `429` Too Many Requests, `500` Internal Server Error.

### 8.1 `POST /auth/login`
- **Purpose:** Authenticate a user and issue a JWT.
- **Auth:** None.
- **Request:**
```json
{ "username": "rakesh.eng", "password": "SecurePass123" }
```
- **Response 200:**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 86400,
  "role": "engineer"
}
```
- **Errors:** `401` invalid credentials; `422` missing fields.

### 8.2 `POST /documents/upload`
- **Purpose:** Upload one or more documents.
- **Auth:** Required (`engineer` or `admin`).
- **Request:** `multipart/form-data` with `files[]` and optional JSON field `metadata` (`{"document_type": "SOP", "equipment_tag": "P-204", "is_compliance": false, "expiry_date": null}`).
- **Response 201:**
```json
{
  "uploaded": [
    { "document_id": "d3f1...", "filename": "SOP_Pump_204.pdf", "status": "UPLOADED", "size_bytes": 204800 }
  ]
}
```
- **Validation Rules:** File extension whitelist; 50MB max per file; max 20 files per request.
- **Errors:** `400` unsupported file type; `413` file too large; `422` malformed metadata JSON.

### 8.3 `POST /documents/index`
- **Purpose:** Manually (re)trigger extraction + indexing for a document (normally automatic, exposed for admin retry/demo control).
- **Auth:** Required (`admin`).
- **Request:**
```json
{ "document_id": "d3f1..." }
```
- **Response 202:**
```json
{ "document_id": "d3f1...", "status": "QUEUED_FOR_EXTRACTION" }
```
- **Errors:** `404` document not found; `409` document already `INDEXED` (client must pass `"force": true` to override).

### 8.4 `GET /documents`
- **Purpose:** List/browse documents with filters.
- **Auth:** Required.
- **Query Params:** `page`, `page_size`, `sort_by` (`created_at|filename`), `sort_order`, `document_type`, `status`, `equipment_tag`, `is_compliance`, `date_from`, `date_to`.
- **Response 200:**
```json
{
  "items": [
    { "document_id": "d3f1...", "filename": "SOP_Pump_204.pdf", "document_type": "SOP", "status": "INDEXED", "equipment_tag": "P-204", "created_at": "2026-06-01T10:00:00Z" }
  ],
  "page": 1, "page_size": 20, "total": 42, "total_pages": 3
}
```

### 8.5 `GET /documents/{id}`
- **Purpose:** Fetch full metadata + processing status for one document.
- **Auth:** Required.
- **Response 200:**
```json
{
  "document_id": "d3f1...",
  "filename": "SOP_Pump_204.pdf",
  "document_type": "SOP",
  "status": "INDEXED",
  "equipment_tag": "P-204",
  "is_compliance": false,
  "expiry_date": null,
  "page_count": 6,
  "chunk_count": 14,
  "created_at": "2026-06-01T10:00:00Z",
  "updated_at": "2026-06-01T10:00:42Z"
}
```
- **Errors:** `404` not found.

### 8.6 `DELETE /documents/{id}`
- **Purpose:** Delete a document, its file, extracted text, chunks, and vector entries.
- **Auth:** Required (`admin`).
- **Response:** `204 No Content`.
- **Errors:** `404` not found.

### 8.7 `POST /search`
- **Purpose:** Hybrid semantic + keyword search across indexed content.
- **Auth:** Required.
- **Request:**
```json
{
  "query": "last inspection finding on P-204",
  "filters": { "document_type": "Inspection Report", "equipment_tag": "P-204" },
  "top_k": 10
}
```
- **Response 200:**
```json
{
  "results": [
    {
      "chunk_id": "c-991",
      "document_id": "d3f1...",
      "filename": "INS-2024-118.pdf",
      "page_number": 3,
      "snippet": "...visible corrosion noted on pump housing near flange B...",
      "score": 0.87
    }
  ]
}
```
- **Validation:** `query` 1–500 chars; `top_k` 1–50.
- **Errors:** `422` invalid query length.

### 8.8 `POST /chat`
- **Purpose:** RAG-based conversational Q&A over indexed documents.
- **Auth:** Required.
- **Request:**
```json
{
  "message": "What was the last inspection finding on Pump P-204?",
  "conversation_id": "conv-77",
  "top_k": 6
}
```
- **Response 200 (non-streaming variant shown; SSE streaming supported via `Accept: text/event-stream`):**
```json
{
  "answer": "The most recent inspection (INS-2024-118, 2024-11-02) noted visible corrosion near flange B on the pump housing.",
  "citations": [
    { "document_id": "d3f1...", "filename": "INS-2024-118.pdf", "page_number": 3, "chunk_id": "c-991" }
  ],
  "conversation_id": "conv-77"
}
```
- **Business Rule:** If no chunk scores above 0.35 similarity, `answer` is a fixed no-context message and `citations` is `[]`.
- **Errors:** `503` if Ollama is unreachable; `422` empty message.

### 8.9 `POST /knowledge/build`
- **Purpose:** Trigger/rebuild knowledge graph extraction for a document or the whole corpus.
- **Auth:** Required (`admin`).
- **Request:**
```json
{ "document_id": "d3f1..." }
```
*(omit `document_id` to rebuild the full graph — expensive, admin-only, used sparingly.)*
- **Response 202:**
```json
{ "status": "GRAPH_BUILD_QUEUED" }
```

### 8.10 `GET /knowledge/node/{id}`
- **Purpose:** Fetch a graph node and its immediate connections.
- **Auth:** Required.
- **Response 200:**
```json
{
  "node": { "id": "eq-p204", "type": "Equipment", "label": "P-204" },
  "edges": [
    { "type": "MENTIONED_IN", "target": { "id": "d3f1...", "type": "Document", "label": "INS-2024-118.pdf" } },
    { "type": "HAS_INCIDENT", "target": { "id": "inc-12", "type": "Incident", "label": "Vibration event 2024-03" } }
  ]
}
```
- **Errors:** `404` node not found.

### 8.11 `GET /maintenance/recommendations`
- **Purpose:** Equipment maintenance timeline + rule-based next-due estimate.
- **Auth:** Required.
- **Query Params:** `equipment_tag` (required).
- **Response 200:**
```json
{
  "equipment_tag": "P-204",
  "timeline": [
    { "date": "2024-11-02", "document_id": "d3f1...", "type": "Inspection Report", "summary": "Corrosion noted near flange B" }
  ],
  "next_due_estimate": { "date": "2025-05-02", "basis": "6-month interval stated in SOP_Pump_204.pdf", "confidence": "low" }
}
```
- **Errors:** `404` if no data exists for the tag → returns `200` with empty timeline and `next_due_estimate: null` (not an error condition, per business rule in FR-7).

### 8.12 `POST /compliance/check`
- **Purpose:** Tag/update compliance metadata for a document, or bulk-run auto-tag suggestions.
- **Auth:** Required (`engineer` or `admin`).
- **Request:**
```json
{ "document_id": "d3f1...", "is_compliance": true, "expiry_date": "2026-09-01" }
```
- **Response 200:**
```json
{ "document_id": "d3f1...", "is_compliance": true, "expiry_date": "2026-09-01", "status": "OK" }
```

### 8.13 `GET /compliance/dashboard`
- **Purpose:** Aggregated compliance view.
- **Auth:** Required.
- **Query Params:** `window_days` (default 90).
- **Response 200:**
```json
{
  "expired": [ { "document_id": "d9...", "filename": "Permit_2023.pdf", "expiry_date": "2026-01-01" } ],
  "expiring_soon": [ { "document_id": "d3f1...", "filename": "Cert_A.pdf", "expiry_date": "2026-08-01" } ],
  "ok": []
}
```

### 8.14 `POST /lessons`
- **Purpose:** Submit a Lessons Learned entry.
- **Auth:** Required.
- **Request:**
```json
{
  "title": "Recurring seal failure on P-204",
  "equipment_tag": "P-204",
  "problem": "Seal failed twice within 3 months under normal load.",
  "resolution": "Replaced with upgraded seal material rated for higher temperature.",
  "tags": ["seal", "pump", "P-204"]
}
```
- **Response 201:**
```json
{ "lesson_id": "l-55", "status": "STORED_AND_QUEUED_FOR_EMBEDDING" }
```
- **Validation:** `title` 10–200 chars; `problem`/`resolution` 10–2000 chars each.

### 8.15 `GET /lessons`
- **Purpose:** Browse/search lessons learned.
- **Auth:** Required.
- **Query Params:** `page`, `page_size`, `equipment_tag`, `tag`.
- **Response 200:** Paginated list, same envelope shape as `GET /documents`.

### 8.16 `POST /rca/analyze`
- **Purpose:** Root cause analysis assistant.
- **Auth:** Required.
- **Request:**
```json
{ "incident_description": "P-204 tripped on high vibration during startup on 2026-06-30", "equipment_tag": "P-204" }
```
- **Response 200:**
```json
{
  "probable_factors": [
    { "factor": "Recurring seal degradation noted in prior lesson learned entry", "citations": [ { "document_id": "l-55", "type": "LessonLearned" } ] }
  ],
  "related_documents": [ { "document_id": "d3f1...", "filename": "INS-2024-118.pdf" } ]
}
```

### 8.17 `POST /ocr`
- **Purpose:** Standalone OCR utility endpoint (used internally by the extraction worker; also exposed for direct testing/demo).
- **Auth:** Required (`admin`).
- **Request:** `multipart/form-data`, single image file.
- **Response 200:**
```json
{ "text": "extracted text...", "average_confidence": 0.83 }
```

### 8.18 `POST /embeddings`
- **Purpose:** Standalone embedding utility endpoint (internal use + testing).
- **Auth:** Required (`admin`).
- **Request:**
```json
{ "texts": ["chunk text one", "chunk text two"] }
```
- **Response 200:**
```json
{ "embeddings": [[0.012, -0.045, "..."], [0.031, 0.002, "..."]], "model": "all-MiniLM-L6-v2", "dimensions": 384 }
```

### 8.19 `GET /audit/history`
- **Purpose:** View audit log (admin).
- **Auth:** Required (`admin`).
- **Query Params:** `page`, `page_size`, `event_type`, `user_id`, `date_from`, `date_to`.
- **Response 200:** Paginated list of `{ event_id, event_type, user_id, timestamp, details }`.

### 8.20 `GET /health`
- **Purpose:** System health check.
- **Auth:** None.
- **Response 200:**
```json
{ "status": "ok", "db": "ok", "ollama": "ok", "vector_index": "ok", "model": "llama3.1:8b" }
```

---

## 9. Database Design (SQLite)

### 9.1 Tables

**`users`**
| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PRIMARY KEY |
| username | TEXT | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| role | TEXT | NOT NULL, CHECK(role IN ('admin','engineer')) |
| is_active | BOOLEAN | NOT NULL DEFAULT 1 |
| created_at | TEXT (ISO8601) | NOT NULL |

**`documents`**
| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PRIMARY KEY |
| filename | TEXT | NOT NULL |
| storage_path | TEXT | NOT NULL |
| document_type | TEXT | NULL (e.g. SOP, P&ID, Inspection Report, Manual, Incident Report, Work Order, Email, Compliance) |
| equipment_tag | TEXT | NULL, INDEXED |
| status | TEXT | NOT NULL, CHECK(status IN ('UPLOADED','EXTRACTED','EXTRACTION_FAILED','INDEXED')) |
| is_compliance | BOOLEAN | NOT NULL DEFAULT 0 |
| expiry_date | TEXT (ISO date) | NULL |
| page_count | INTEGER | NULL |
| uploaded_by | TEXT | FK → users.id |
| created_at | TEXT | NOT NULL |
| updated_at | TEXT | NOT NULL |

**`document_text`**
| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PRIMARY KEY |
| document_id | TEXT | FK → documents.id, NOT NULL |
| page_number | INTEGER | NOT NULL |
| text | TEXT | NOT NULL |
| ocr_confidence | REAL | NULL |
| created_at | TEXT | NOT NULL |

**`chunks`**
| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PRIMARY KEY |
| document_id | TEXT | FK → documents.id, NOT NULL, INDEXED |
| page_number | INTEGER | NOT NULL |
| chunk_text | TEXT | NOT NULL |
| char_offset | INTEGER | NOT NULL |
| vector_index_ref | TEXT | NOT NULL (ID/row used to look up the vector in FAISS/Chroma) |
| created_at | TEXT | NOT NULL |

*(SQLite FTS5 virtual table `chunks_fts` mirrors `chunks.chunk_text` for keyword search, kept in sync via triggers on insert/delete.)*

**`graph_nodes`**
| Column | Type | Constraints |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| type | TEXT | NOT NULL, CHECK(type IN ('Equipment','Document','Incident','SOP','Person','LessonLearned')) |
| label | TEXT | NOT NULL |
| normalized_key | TEXT | NOT NULL, UNIQUE(type, normalized_key) |
| created_at | TEXT | NOT NULL |

**`graph_edges`**
| Column | Type | Constraints |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| source_node_id | TEXT | FK → graph_nodes.id, NOT NULL |
| target_node_id | TEXT | FK → graph_nodes.id, NOT NULL |
| relationship_type | TEXT | NOT NULL (e.g. MENTIONED_IN, HAS_INCIDENT, LINKED_TO) |
| created_at | TEXT | NOT NULL |

**`lessons_learned`**
| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PRIMARY KEY |
| title | TEXT | NOT NULL |
| equipment_tag | TEXT | NULL, INDEXED |
| problem | TEXT | NOT NULL |
| resolution | TEXT | NOT NULL |
| tags | TEXT | NULL (JSON array as text) |
| created_by | TEXT | FK → users.id |
| created_at | TEXT | NOT NULL |

**`audit_log`**
| Column | Type | Constraints |
|---|---|---|
| id | TEXT (UUID) | PRIMARY KEY |
| event_type | TEXT | NOT NULL (UPLOAD, INDEX, SEARCH, CHAT, LOGIN, DELETE, etc.) |
| user_id | TEXT | FK → users.id, NULL |
| details | TEXT | NULL (JSON as text) |
| created_at | TEXT | NOT NULL |

### 9.2 Relationships
- `documents.uploaded_by → users.id` (many-to-one)
- `document_text.document_id → documents.id` (many-to-one)
- `chunks.document_id → documents.id` (many-to-one)
- `graph_edges.source_node_id / target_node_id → graph_nodes.id` (many-to-many via edge table)
- `lessons_learned.created_by → users.id` (many-to-one)

### 9.3 Indexes
- `documents(equipment_tag)`, `documents(status)`, `documents(document_type)`, `documents(is_compliance, expiry_date)`
- `chunks(document_id)`
- `graph_nodes(type, normalized_key)` (unique composite)
- `lessons_learned(equipment_tag)`
- FTS5 virtual index on `chunks_fts(chunk_text)`

### 9.4 ER Diagram Description
`users` 1—∞ `documents` (uploaded_by); `documents` 1—∞ `document_text`; `documents` 1—∞ `chunks`; `graph_nodes` ∞—∞ `graph_nodes` through `graph_edges`; `documents`/`lessons_learned`/incidents are all represented as `graph_nodes` of differing `type`, allowing the graph to reference both DB-native rows and derived entities uniformly. `users` 1—∞ `lessons_learned` (created_by); `users` 1—∞ `audit_log` (user_id).

---

## 10. Knowledge Graph Design

### 10.1 Node Types
`Equipment`, `Document`, `Incident`, `SOP`, `Person` (Hackathon Implementation: extracted only when a name pattern appears near "reported by/inspected by," best-effort), `LessonLearned`.

### 10.2 Relationship Types
`MENTIONED_IN` (Equipment/Person → Document), `HAS_INCIDENT` (Equipment → Incident), `DERIVED_FROM` (LessonLearned → Document/Incident), `RELATED_TO` (generic co-occurrence link between two Equipment nodes appearing in the same document).

### 10.3 Metadata
Each node stores `label` (display name), `normalized_key` (for dedup), `type`. Each edge stores `relationship_type` and `created_at`; edges are not weighted in the hackathon build (a stretch enhancement would weight by co-occurrence frequency).

### 10.4 Entity Extraction
Hackathon Implementation — deterministic, not ML-based, for speed and reliability within a hackathon timeline:
- **Equipment tags:** regex `\b[A-Z]{1,4}-\d{2,5}\b` (matches patterns like `P-204`, `V-101`, `TK-3050`).
- **Document type / Incident / SOP nodes:** derived directly from the `documents.document_type` field set at upload.
- **Person names:** simple heuristic — capitalized two-word sequence following "Inspected by," "Reported by," "Approved by."

### 10.5 Document Linking
When a document is indexed, every distinct equipment tag found in its text creates/reuses an `Equipment` node and a `MENTIONED_IN` edge to the `Document` node representing that document. If the document's `document_type` is "Incident Report," an `Incident` node is also created and linked `HAS_INCIDENT` from the relevant `Equipment` node(s).

### 10.6 Update Strategy
Graph extraction re-runs whenever a document is (re-)indexed; existing edges from that document are deleted and rebuilt to avoid duplication (idempotent per document).

---

## 11. RAG Pipeline

1. **Document Upload** — see FR-1.
2. **OCR** — see FR-2; Tesseract fallback for scanned content.
3. **Cleaning** — strip excessive whitespace, de-hyphenate line-broken words, remove non-printable characters.
4. **Chunking** — 500–800 characters, 100-character overlap, chunk boundaries preferring sentence breaks where possible (using simple punctuation-based splitting, not a heavy NLP sentence tokenizer, to keep it fast and dependency-light).
5. **Embeddings** — `sentence-transformers/all-MiniLM-L6-v2` (384-dim, free, runs on CPU, ~80MB) generates one vector per chunk.
6. **Vector Search** — FAISS (`IndexFlatIP` for cosine-similarity-style search on normalized vectors) or ChromaDB (chosen per Section 15) retrieves top-k chunks for a query.
7. **Prompt Assembly** — system prompt instructs the model to answer using ONLY the provided context, cite by chunk reference, and explicitly say "I don't have enough information" if context is insufficient; the top-k chunks are concatenated with document/page labels.
8. **Response Generation** — local Ollama model (see Section 14) generates the answer, streamed to the client via Server-Sent Events.
9. **Citation Generation** — chunk IDs used in the prompt are mapped back to `{document_id, filename, page_number}` and returned alongside the answer; the frontend renders them as clickable chips.

---

## 12. OCR Pipeline

- **Supported Formats:** PNG, JPG/JPEG, scanned PDF pages (rasterized page-by-page).
- **Image Preprocessing:** Grayscale conversion, adaptive thresholding, and deskew (via OpenCV) before OCR to improve accuracy on photographed/scanned documents.
- **OCR Engine:** Tesseract OCR (`pytesseract` wrapper), English language pack by default (extensible to other language packs if needed — all free).
- **Post Processing:** Basic regex cleanup of common OCR artifacts (stray pipe characters, repeated whitespace); no spell-correction layer in hackathon scope (flagged as future scope).
- **Error Handling:** If Tesseract throws or returns empty text, the page is marked `LOW_CONFIDENCE`/`EXTRACTION_FAILED` at the page level without failing the whole document; other pages continue processing.
- **Confidence Thresholds:** Pages with mean word confidence < 40% are flagged `LOW_CONFIDENCE` in `document_text.ocr_confidence` and surfaced with a visual warning badge in the UI, but are still indexed (partial information is better than none, consistent with the platform's goal).

---

## 13. Document Processing Pipeline (Stage-by-Stage)

1. **Intake:** File received, validated (extension/MIME/size), stored under `/data/uploads/{uuid}_{original_filename}`.
2. **Format Detection:** File extension determines the extraction strategy (PDF → PyMuPDF first; DOCX → python-docx; XLSX/CSV → openpyxl/pandas; images → OCR directly; TXT → direct read).
3. **Native Text Extraction:** For PDF/DOCX/XLSX/TXT, attempt direct text extraction first (fast, high accuracy, no OCR needed for born-digital files).
4. **OCR Fallback:** Any PDF page yielding near-empty native text, plus all standalone images, are rasterized (if needed) and passed through the OCR Pipeline (Section 12).
5. **Cleaning & Normalization:** Whitespace/artifact cleanup as described in Section 11 step 3.
6. **Chunking:** Section 11 step 4.
7. **Embedding & Vector Upsert:** Section 11 step 5–6.
8. **Keyword Index Upsert:** Same chunk text also inserted into SQLite FTS5 for hybrid search.
9. **Entity Extraction & Graph Upsert:** Section 10.4–10.5.
10. **Status Finalization:** Document status set to `INDEXED`; audit log entry written; frontend status badge updates.

---

## 14. AI Components

| Component | Model | Why Selected | Free Alternatives |
|---|---|---|---|
| Chat/RAG generation & RCA summarization | **Ollama running `llama3.1:8b`** (or `qwen2.5:7b` on lower-RAM machines) | Strong instruction-following at a size that runs on a typical 8–16GB RAM laptop CPU/GPU via Ollama; simple local REST API (`localhost:11434`); no API key, no cost. | `mistral:7b`, `phi3:mini` (for machines with <8GB RAM), `gemma2:9b` |
| Text embeddings | **`sentence-transformers/all-MiniLM-L6-v2`** | Small (~80MB), fast on CPU, well-established general-purpose embedding quality, runs offline via the `sentence-transformers` Python package. | `nomic-embed-text` (via Ollama), `BAAI/bge-small-en-v1.5` |
| OCR | **Tesseract OCR** | Mature, free, offline, wide format/language support, simple Python binding (`pytesseract`). | `EasyOCR` (heavier, GPU-friendlier if available), `PaddleOCR` |
| Entity extraction (Knowledge Graph) | **Regex + rule-based extraction** (Hackathon Implementation) | Zero model overhead, deterministic, fast to implement and debug within a hackathon timeline; avoids adding a heavy NER model dependency. | spaCy's free small English NER model (`en_core_web_sm`) as a stretch upgrade for Person/Org extraction |
| Vector similarity search | **FAISS (`IndexFlatIP`)** or ChromaDB | Both are free, local, embeddable directly in the Python process with no separate server required (see Section 15 for final pick + rationale). | ChromaDB, SQLite + `sqlite-vss` extension |

All models above are pulled once (during setup) and run entirely offline thereafter — no runtime network dependency, satisfying the "no paid inference API" constraint absolutely.

---

## 15. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Backend Framework | **FastAPI (Python 3.11)** | Fast to build with, automatic OpenAPI docs (useful for a hackathon demo and for other AI agents consuming this SRD), native async support for streaming chat responses, free. |
| Background Processing | **FastAPI `BackgroundTasks` + a simple polling loop (APScheduler, free)** | A full message queue (Celery/RabbitMQ/Redis) is unnecessary complexity for a single-machine hackathon prototype; APScheduler running an in-process job every few seconds to pick up `UPLOADED`/`EXTRACTED` documents is sufficient and keeps the deployment to "one process, no extra services." |
| LLM Runtime | **Ollama** | The simplest free way to run open-weight LLMs locally with a clean REST API; handles model quantization/management automatically. |
| Embeddings | **sentence-transformers (HuggingFace, free)** | Runs locally via `pip install`, no account/API key required. |
| OCR | **Tesseract OCR + pytesseract + OpenCV (preprocessing)** | Free, offline, industry-standard baseline OCR. |
| Vector Store | **ChromaDB (embedded/local mode)** — chosen over raw FAISS for the hackathon build | ChromaDB wraps FAISS-like ANN search with a simpler local persistence API (SQLite-backed under the hood) and built-in metadata filtering, reducing boilerplate versus hand-rolling FAISS index persistence and ID-mapping. FAISS remains a documented fallback if ChromaDB's local performance is insufficient for the demo corpus size. |
| Keyword Search | **SQLite FTS5** | Ships with SQLite, zero extra service, good enough for hybrid re-ranking at hackathon-scale corpora. |
| Relational/Metadata DB | **SQLite** | Zero-config, file-based, matches the "SQLite preferred over cloud databases" constraint exactly; single file is trivial to demo, back up, or reset. |
| Frontend Framework | **React + Vite** | Fast dev/build cycle, large ecosystem, free. |
| Styling | **TailwindCSS** | Rapid, consistent UI styling without hand-rolled CSS or any paid component library. |
| Graph Visualization | **A free JS graph library (e.g., `react-force-graph` or `vis-network`, both open-source/MIT)** | Renders the knowledge graph interactively in-browser with no backend graph-DB dependency. |
| Authentication | **Custom local auth: bcrypt password hashing + PyJWT tokens** | Meets "simple local authentication" constraint without any paid auth provider (Auth0, Clerk, Firebase Auth are all explicitly avoided). |
| File Storage | **Local filesystem (`/data/uploads/`)** | Matches "local filesystem, no S3/Blob/GCS" constraint. |
| Containerization | **None required; optional single `docker-compose.yml` may be added later purely for convenience, never required to run the project** | Constraint explicitly states no Docker requirement. |
| Deployment (Demo) | **Local execution:** `uvicorn` for backend, `vite dev`/`vite build` + static preview for frontend; optional GitHub Pages for a static frontend-only landing/demo page | Satisfies "must run locally," with the only cloud-touching option being an explicitly optional free GitHub deployment for the frontend shell. |

**Note on vector store choice:** the constraint document lists FAISS, ChromaDB, and SQLite as acceptable equals. ChromaDB is selected as primary because its local persistence and metadata-filtering API reduces custom code the student team must write and debug during the hackathon; FAISS is documented as the drop-in fallback module (`vector_store.py` is designed with a small interface — `upsert()`, `query()`, `delete()` — so swapping the backend is a contained change).

---

## 16. Security

- **File Validation:** Extension whitelist + MIME-type sniffing (`python-magic`) cross-check on every upload; reject mismatches.
- **Prompt Injection Protection:** RAG system prompt explicitly instructs the model to treat retrieved document content as data, not instructions, and to ignore any instructions embedded within retrieved text (e.g., a document containing "ignore previous instructions" is treated as literal text to answer about, never executed as a system directive). Retrieved chunks are wrapped in clearly delimited context blocks (e.g., `<<<DOCUMENT_CONTEXT>>> ... <<<END_CONTEXT>>>`) so the model can distinguish user instructions from document content.
- **Path Traversal Prevention:** All stored filenames are UUID-generated server-side; user-supplied filenames are never used directly to construct filesystem paths; all file access is resolved against a fixed base directory with `os.path.realpath` checks to reject any path escaping `/data/uploads/`.
- **SQL Injection:** All database access uses parameterized queries via SQLAlchemy (or raw `sqlite3` with `?` placeholders) — no string-concatenated SQL anywhere in the codebase.
- **XSS:** React's default JSX escaping is relied upon for all rendered text; any place that must render HTML (none planned) would require explicit sanitization — avoided entirely by rendering only plain text/Markdown-safe content.
- **Rate Limiting:** In-memory token bucket per authenticated user, 60 requests/minute, `429` on excess (Section 8 general conventions).
- **Local Authentication:** bcrypt-hashed passwords (cost factor 12), JWT with 24-hour expiry signed with a locally generated secret stored in an environment variable (never committed to source control).

---

## 17. Error Handling Strategy

- All API errors return the standard error shape (Section 8) with a machine-readable `code` and human-readable `message`.
- Per-document processing failures (extraction/OCR/indexing) are caught at the document level and recorded on that document's row (`status = EXTRACTION_FAILED`) without halting the background worker's processing of other documents.
- LLM/Ollama unavailability returns `503 Service Unavailable` with a clear message rather than hanging indefinitely; a client-side timeout (30s) is enforced on chat requests.
- Unhandled exceptions are caught by a global FastAPI exception handler, logged with a stack trace, and returned to the client as a generic `500` with a correlation ID (also present in the log line) to aid debugging without leaking internals.

---

## 18. Logging Strategy

- Python `logging` module configured with a JSON formatter; one rotating log file (`app.log`, 10MB × 5 backups) under `/logs/`.
- Every API request logged with method, path, status code, duration, and (if authenticated) user ID.
- Every ingestion pipeline stage transition (`UPLOADED → EXTRACTED → INDEXED`, or `→ EXTRACTION_FAILED`) logged with document ID and duration.
- Every chat/search query logged (query text, top-k, latency, number of citations returned) — feeds both debugging and the Audit Log module (FR-13).
- Log levels: `INFO` for normal flow, `WARNING` for recoverable issues (e.g., low OCR confidence), `ERROR` for failures, `DEBUG` gated behind an environment flag for local development only.

---

## 19. Testing Strategy

- **Unit Testing:** `pytest` for backend modules — chunking logic, entity-tag regex extraction, JWT issuance/validation, file-extension validation — target core business logic in Sections 4 and 10–12.
- **Integration Testing:** `pytest` + FastAPI `TestClient` against a temporary SQLite DB and a small fixture set of sample documents (including one scanned image) covering the full upload → extract → index → search → chat flow end-to-end.
- **API Testing:** Every endpoint in Section 8 covered by at least one happy-path test and one validation-error test using `TestClient`; Postman/Thunder Client collection optionally exported for manual/demo testing.
- **Performance Testing:** A lightweight local script that times search/chat latency across a fixture corpus of ~200 chunks to confirm the 3-second NFR target (Section 5) — no dedicated load-testing infrastructure (e.g. Locust) required for a single-user hackathon demo, though the script can be adapted to Locust as a stretch item.

---

## 20. Deployment Guide (Local Only)

**Prerequisites:** Python 3.11+, Node.js 18+, Tesseract OCR binary installed (`apt install tesseract-ocr` / `brew install tesseract` / Windows installer), Ollama installed and a model pulled (`ollama pull llama3.1:8b`).

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # serves on http://localhost:5173
```

**Ollama (separate terminal, must be running before chat/RCA features work):**
```bash
ollama serve
ollama pull llama3.1:8b
```

**Database:** SQLite file auto-created on first run at `backend/data/app.db`; no separate DB server to install or start.

**Optional (frontend-only) GitHub Pages deployment** (for sharing a static demo shell — the backend still must run locally since it needs local compute/Ollama):
```bash
npm run build
# deploy the resulting dist/ folder via GitHub Pages, Vercel free tier, or Netlify free tier if desired
```
This step is explicitly optional and does not affect the core "runs entirely locally" requirement, since a deployed frontend with no locally-running backend/Ollama instance will not have chat/search functionality — it exists purely as an optional presentation convenience.

---

## 21. Development Roadmap

**Milestone 1 — Foundation (Days 1–2)**
- Objectives: Project scaffolding (FastAPI + React+Vite+Tailwind), SQLite schema migration, local auth (FR-11), file upload (FR-1).
- Deliverables: Running backend + frontend skeleton; login works; file upload stores a file and DB row.
- Completion Criteria: A user can log in and upload a PDF, and it appears in `GET /documents`.

**Milestone 2 — Extraction & Indexing Core (Days 3–4)**
- Objectives: OCR pipeline (FR-2), chunking + embeddings + vector store (FR-3), hybrid search (FR-4).
- Deliverables: Background worker moving documents `UPLOADED → EXTRACTED → INDEXED`; working Search screen.
- Completion Criteria: Uploading a scanned image and a native PDF both become searchable within a few minutes.

**Milestone 3 — RAG Chat & Knowledge Graph (Days 5–6)**
- Objectives: Chat copilot with citations (FR-5), knowledge graph extraction + viewer (FR-6).
- Deliverables: Working Chat screen with citation chips; Graph screen showing equipment/document nodes.
- Completion Criteria: A question about an uploaded document returns a correctly cited answer; graph shows at least one equipment node linked to ≥2 documents.

**Milestone 4 — Maintenance, RCA, Compliance, Lessons Learned (Days 7–8)**
- Objectives: FR-7, FR-8, FR-9, FR-10.
- Deliverables: Maintenance dashboard, RCA screen, Compliance dashboard, Lessons Learned form + search integration.
- Completion Criteria: Each of the four screens returns real data derived from previously ingested documents.

**Milestone 5 — Polish, Audit, Testing, Demo Prep (Days 9–10)**
- Objectives: Audit log (FR-13), error handling/logging hardening (Sections 17–18), test suite pass (Section 19), UI polish, demo script/dataset preparation.
- Deliverables: Stable end-to-end demo path; test suite green; seeded demo dataset (sample SOPs, a scanned inspection report, a couple of incident reports referencing the same equipment tag to make the graph/RCA demo compelling).
- Completion Criteria: Full demo flow (upload → index → search → chat → graph → maintenance → RCA → compliance → lessons learned) runs without errors in under 10 minutes.

---

## 22. Risks

### 22.1 Technical Risks
- **OCR accuracy on poor-quality scans** may be low, producing noisy chunks. *Mitigation:* confidence flagging (Section 12), demo dataset curated with reasonably clean scans.
- **Local LLM latency** on lower-spec laptops could exceed the 3-second NFR target. *Mitigation:* default to a smaller model (`phi3:mini` or `qwen2.5:3b`) as a documented fallback; keep `top_k` and prompt size modest.

### 22.2 Data Risks
- **Small/synthetic demo corpus** may not showcase the knowledge graph or RCA modules convincingly. *Mitigation:* deliberately author a small set of interlinked sample documents (Milestone 5) referencing shared equipment tags.

### 22.3 AI Risks
- **Hallucination** despite RAG grounding. *Mitigation:* strict "answer only from context" system prompt, similarity threshold gate (FR-5), citations mandatory in the UI so answers are always verifiable against source documents.
- **Regex-based entity extraction** will miss or mis-tag some equipment mentions (no true NER). *Mitigation:* explicitly labeled as "Hackathon Implementation" throughout this document; documented as a Future Scope upgrade path (spaCy NER).

### 22.4 Mitigations Summary
All identified risks are addressed either by an explicit fallback documented in this SRD (Sections 14–15) or by scoping the affected feature down to a clearly labeled "Hackathon Implementation" (Sections 4, 6, 10) so judges and future contributors understand the deliberate trade-off.

---

## 23. Assumptions

1. The demo machine has at least 8GB RAM (16GB preferred) to comfortably run an Ollama 7–8B model alongside the backend and frontend dev servers.
2. Ollama and Tesseract are installed prior to the demo; model weights are pulled once with an internet connection before the (offline-capable) demo itself.
3. The demo document corpus is a curated, realistic-but-synthetic set of industrial documents (since real proprietary plant data is not available), sized in the tens-to-low-hundreds of documents — sufficient to demonstrate every feature without requiring enterprise-scale performance tuning.
4. A single admin account is pre-seeded at first run (no public self-registration) — acceptable for a hackathon prototype per FR-11.
5. English-language documents only for the hackathon build (Tesseract/embedding model both support other languages if extended later, per Future Scope).

---

## 24. Appendix

### 24.1 Glossary
- **Chunk:** A fixed-size segment of a document's extracted text used as the unit of embedding and retrieval.
- **Citation:** A reference back to the exact document and page that supports a generated answer.
- **Equipment Tag:** A short alphanumeric code (e.g., `P-204`) identifying a specific physical asset in plant documentation.
- **Hackathon Implementation:** A label used throughout this SRD to mark a feature that has been deliberately simplified from its "ideal enterprise" version to be realistically buildable within a student hackathon timeframe, while preserving the original feature's intent.

### 24.2 Definitions
- **P&ID:** Piping and Instrumentation Diagram — a schematic showing the piping and process equipment of a physical process, along with instrumentation and control devices.
- **SOP:** Standard Operating Procedure.
- **RCA:** Root Cause Analysis.

### 24.3 Acronyms
| Acronym | Meaning |
|---|---|
| RAG | Retrieval-Augmented Generation |
| OCR | Optical Character Recognition |
| NER | Named Entity Recognition |
| FTS5 | Full-Text Search version 5 (SQLite module) |
| JWT | JSON Web Token |
| FAISS | Facebook AI Similarity Search |
| NFR | Non-Functional Requirement |
| SRD | Software Requirements Document |

---

**End of Document — Version 1.0**
