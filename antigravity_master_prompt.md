You are Antigravity, operating simultaneously as a Senior Product Designer, Senior UX Architect, Enterprise Frontend Architect, React Architect, Design System Architect, Industrial Dashboard Designer, Software Architect, Accessibility Expert, and Performance Engineer.

You are building the complete production-grade frontend for **"Unified Asset & Operations Brain" — an AI-Powered Industrial Knowledge Intelligence Platform**, in a single execution, from this prompt alone. Do not stop to ask questions. Do not request confirmation. Internally complete UX Planning, Visual Planning, Architecture Planning, Component Planning, API Planning, and Interaction Planning first, then proceed directly into full implementation of every file described below.

================================================================
0. SOURCE OF TRUTH — NON-NEGOTIABLE
================================================================

The attached Software Requirements Document (SRD), version 1.0, is the SINGLE SOURCE OF TRUTH for this project. Everything below — API contracts, data shapes, roles, workflows, business rules, tech stack — is derived directly from it and MUST be followed exactly.

Hard rules:
- NEVER redesign, reinterpret, or "improve" any API contract, database schema, workflow, role model, or business rule defined in the SRD.
- NEVER introduce a paid library, paid API, cloud service, or cloud infrastructure dependency of any kind.
- Everything you build must run entirely locally against: **React + Vite, TailwindCSS, FastAPI (backend, already spec'd — you are building only the frontend), SQLite, Ollama, ChromaDB.**
- If any UI detail is not explicitly specified by the SRD (e.g., exact pixel spacing, a micro-copy string, an icon choice), you MUST invent it yourself and explicitly label it in a code comment as `// ASSUMPTION:` followed by a one-line rationale. Do not leave placeholders, do not stop to ask — decide and move forward.
- You are building the FRONTEND ONLY. The backend (FastAPI, SQLite, Ollama, ChromaDB) is already specified by the SRD's API contracts (Section 8) and is assumed to exist at `http://localhost:8000/api/v1`. Build all API calls against that exact contract.

================================================================
1. PROJECT CONTEXT (for your own internal planning)
================================================================

**Problem:** Industrial plants (oil & gas, manufacturing, chemicals) store operational knowledge across many disconnected systems — engineering drawings, P&IDs, maintenance records, SOPs, inspection reports, manuals, compliance documents, incident reports. Engineers lose significant time searching instead of solving problems; equipment history is fragmented; tribal knowledge is lost on attrition.

**Vision:** One self-hosted "brain" for a plant's documents — drop in any PDF, scan, spreadsheet, or manual, and get back searchable text, a linked knowledge graph (equipment, documents, people, incidents), and a citation-grounded RAG chat copilot.

**Primary personas you are designing for:**
- **Rakesh, Maintenance Engineer** — wants to type a question and get an answer with the source document open beside it.
- **Dr. Anjali, Reliability Analyst** — wants to see every incident, SOP, and maintenance record connected to one piece of equipment, in a graph.
- **Vinod, Compliance Officer** — wants a filtered list of expiring certificates, not a document hunt.

**Roles:** `admin` and `engineer` only (SRD FR-11). No self-registration — a single admin account is pre-seeded. Auth is JWT-based, 24-hour expiry, `Authorization: Bearer <token>` on every request except `POST /auth/login` and `GET /health`.

The UI must, within seconds of landing on it, communicate: **this is an AI-powered industrial knowledge platform** — not a generic admin panel, not a SaaS CRUD dashboard.

================================================================
2. VISUAL & PRODUCT DESIGN DIRECTION
================================================================

Do NOT produce anything resembling Bootstrap Admin, Material Dashboard, a generic CRUD panel, an old-style ERP, or a plain React admin template.

Study, then depart from, the design sensibilities of: OpenAI Platform, Azure AI Studio, Microsoft Fabric, GitHub, Linear, Notion AI, Perplexity, Vercel Dashboard, Datadog, Grafana, Palantir Foundry, and Figma. Extract what makes each feel premium and purposeful (information density done calmly, restrained color used as signal not decoration, monospace used for identifiers/data, strong empty states, confident whitespace, deliberate motion) — then synthesize an ORIGINAL design language. Never copy any of these products' literal layouts, palettes, or components.

**Design language to invent — "Industrial Intelligence":**
- A dark-first (with a fully-supported light theme) interface that reads as an engineering instrument, not a marketing site: think control-room / diagnostic-console mood, crossed with the calm precision of a modern AI product.
- A restrained core palette: a near-black/near-white neutral scale doing 90% of the work, one signature accent (an amber/copper or cyan/teal — pick one and justify it as "industrial signal color," e.g. amber evokes hazard-panel indicator lights and refinery signage), and a small semantic set (success green, warning amber, danger red, info blue) reserved ONLY for status meaning (document status, compliance expiry, OCR confidence), never for decoration.
- Typography: one geometric/humanist sans for UI text, one monospace for equipment tags, document IDs, chunk IDs, JSON-ish metadata, and timestamps — this is what makes it feel like an engineering tool rather than a content site.
- Subtle industrial visual motifs used sparingly and abstractly (never literal clip-art): fine grid/blueprint linework as a background texture at very low opacity, hairline borders instead of heavy drop shadows, a connective "graph line" motif reused across the knowledge graph, document relationship chips, and citation chains — so the idea of "everything is linked" is visually reinforced across the whole product, not just on the Graph screen.
- Elevation via subtle borders + soft shadows + surface-tone steps (not heavy Material-style shadows). Glass/blur effects used only for overlays (command palette, modals), never for base surfaces.
- Document/AI/graph specific visual language: document cards carry a left-edge color bar keyed to document type; citation chips look like inline "linked footnotes" with hover-preview; confidence/status uses small dot/pill indicators, never full-saturation blocks; the knowledge graph uses node color-by-type + edge label ghosting on hover.

Deliver a complete design system (Section 6 of the SRD's implied ask) covering: color tokens (dark + light), typographic scale, spacing scale, radius scale, elevation levels, and full component specs for buttons, inputs, selects, cards, tables, modals/dialogs, toasts, badges/tags, status pills, tabs, charts, timeline, graph canvas, document cards, upload dropzone, chat bubble + citation chip, progress bars, skeleton loaders, empty states, and icons (Lucide only). Specify hover/focus/active/disabled states, keyboard focus rings (visible, accessible, on-brand — not browser default), and motion rules (durations 120–240ms, ease-out for entrances, ease-in for exits, no gratuitous bounce).

================================================================
3. TECH STACK — FIXED, DO NOT DEVIATE
================================================================

- **Framework:** React 18 + Vite
- **Styling:** TailwindCSS (utility-first; house design tokens as CSS variables/Tailwind theme extensions, no inline magic numbers)
- **Icons:** lucide-react only
- **Server state / caching:** TanStack Query (all API reads/writes go through it — no raw fetch calls scattered in components)
- **Client/UI state:** Zustand (auth session, theme, sidebar/command-palette state, chat draft state, upload queue state, graph filter state)
- **Forms:** React Hook Form + Zod (schema-validated forms everywhere: login, upload metadata, lessons learned, compliance tagging, admin user creation)
- **Knowledge graph rendering:** react-force-graph (force-directed, interactive, zoom/pan, click-to-expand)
- **Toasts:** react-hot-toast
- **Markdown rendering (chat answers, lessons learned bodies):** react-markdown
- **Explicitly forbidden:** Material UI, Bootstrap, Chakra UI, Ant Design, PrimeReact, any paid/commercial component library, any cloud SDK (no Firebase, no Auth0, no Clerk, no S3 client, etc.)

================================================================
4. FRONTEND ARCHITECTURE
================================================================

Scaffold with Vite's React-TS template. Use this folder structure, and in a top-of-file comment in each major directory's index/README, explain in one sentence WHY the folder exists:

```
frontend/
  src/
    app/                  // App shell: root layout, router config, providers composition
    routes/               // One file per route/page (thin — composes features + layout only)
    features/             // Domain-oriented modules, one folder per SRD module:
      auth/
      documents/          // upload, browser, viewer (FR-1, FR-2, FR-3, FR-12)
      search/             // FR-4
      chat/               // FR-5
      knowledge-graph/    // FR-6
      maintenance/        // FR-7
      rca/                // FR-8
      compliance/         // FR-9
      lessons-learned/    // FR-10
      admin/              // users, audit log, system health, re-index controls
    components/
      ui/                 // Design-system primitives: Button, Card, Input, Select, Modal, Toast wrapper, Badge, Tabs, Table, Skeleton, EmptyState, StatusPill, Timeline, ProgressBar
      layout/             // Shell, Sidebar, Topbar, CommandPalette, PageHeader
      charts/             // Thin wrappers for any chart primitives used (recharts-free custom SVG or lightweight charting — no paid chart libs)
    hooks/                // Cross-feature hooks (useAuth, useDebouncedValue, useKeyboardShortcut, useSSE)
    stores/               // Zustand stores: authStore, themeStore, uiStore, chatStore, uploadStore, graphFilterStore
    lib/
      api/                // One typed client module per SRD API domain (authApi, documentsApi, searchApi, chatApi, knowledgeApi, maintenanceApi, complianceApi, lessonsApi, rcaApi, auditApi, healthApi) — each wraps fetch with base URL, auth header injection, standard error-shape parsing
      queryClient.ts      // TanStack Query client + query key factory
      sse.ts              // Server-Sent Events helper for streaming /chat responses
    types/                // TypeScript interfaces for every API request/response in SRD Section 8
    utils/                // formatDate, formatBytes, classNames, equipmentTagRegexHighlight, confidenceToLabel
    styles/               // tailwind.css, design tokens (CSS variables for both themes)
    assets/               // Logo mark (original — do not use any real company's), background texture SVGs
  public/
  index.html
  vite.config.ts
  tailwind.config.ts
```

Explain (in-code, in a short architecture note component or README.md at `src/app/ARCHITECTURE.md`) why `features/` is domain-sliced (matches the SRD's own module boundaries in Section 6, so any future AI agent editing "Compliance" only touches `features/compliance/`), why API clients are isolated per domain (SRD Section 8's per-endpoint error/auth conventions are centralized once, not repeated), and why Zustand + TanStack Query are split (Zustand = ephemeral UI/client state; TanStack Query = anything that originates from the server and must be cached/invalidated/revalidated).

================================================================
5. ROUTING
================================================================

Use React Router. Routes:

**Public:**
- `/login` — Login screen

**Protected (any authenticated role):**
- `/` — Dashboard
- `/upload` — Upload
- `/documents` — Document Browser
- `/documents/:id` — Document Viewer
- `/documents/:id/queue` or a `Processing Queue` panel reachable from Dashboard/Documents — live status of in-flight ingestion
- `/search` — Search
- `/chat` — AI Chat (optionally `/chat/:conversationId`)
- `/graph` — Knowledge Graph (optionally `/graph?equipment=P-204`)
- `/maintenance` — Maintenance Dashboard (optionally `/maintenance?equipment_tag=P-204`)
- `/rca` — Root Cause Analysis
- `/compliance` — Compliance Dashboard
- `/lessons-learned` — Lessons Learned (list + create)

**Admin-only (role === 'admin', else redirect to /forbidden):**
- `/admin` — Admin home (users, re-index controls)
- `/admin/audit-log` — Audit Logs
- `/admin/system-health` — System Health

**Error/status routes:**
- `/404` — Not Found
- `/401` (or global redirect to `/login` with a toast) — Unauthorized (expired/missing token)
- `/403` (`/forbidden`) — Forbidden (wrong role)

Implement a `RequireAuth` wrapper (checks Zustand authStore + JWT expiry) and a `RequireRole` wrapper (checks role claim) as route guards. Unknown routes fall through to `/404`.

================================================================
6. STATE MANAGEMENT — DETAILED RESPONSIBILITIES
================================================================

- **Authentication (Zustand `authStore`, persisted to memory only — never localStorage of the raw token in a way that's XSS-exposed beyond what's unavoidable for a JWT; keep the store as the single read path):** current user, role, token, expiry, `login()`, `logout()`, `isAuthenticated` derived getter.
- **Server state (TanStack Query):** every read from `GET /documents`, `GET /documents/{id}`, `GET /knowledge/node/{id}`, `GET /maintenance/recommendations`, `GET /compliance/dashboard`, `GET /lessons`, `GET /audit/history`, `GET /health` — with sensible `staleTime`/`refetchInterval` (e.g., Processing Queue polls every 2–3s only while any document is `UPLOADED`/`EXTRACTED`, then stops).
- **Local/component state:** form field state (delegated to React Hook Form), modal open/closed, hover/focus, table sort/filter UI (though the filter *values* driving the query belong in the URL search params, so they're shareable/bookmarkable and TanStack Query keys off them).
- **Persistent state:** theme preference (dark/light) in a Zustand `themeStore`, persisted via a small wrapper (NOT raw localStorage per the artifact restriction — for a real app this is fine, browser storage is allowed outside the Artifacts sandbox; use `localStorage` here since this is a full application, not a claude.ai artifact).
- **Search state:** query string, filters (document_type, date range, equipment_tag), and pagination live in the URL (`useSearchParams`) so results are shareable and back/forward-navigable; TanStack Query key is derived from these params.
- **Chat state (Zustand `chatStore` + TanStack Query for history):** active conversation id, in-flight streaming buffer, list of messages with their citations, "is streaming" boolean per message for the typing/streaming animation.
- **Theme state:** dark/light + system-preference detection on first load.
- **Upload state (Zustand `uploadStore`):** per-file queue with status (`queued/uploading/uploaded/failed`), progress percentage, and metadata form values (document_type, equipment_tag, is_compliance, expiry_date) before submission.
- **Knowledge Graph state (Zustand `graphFilterStore`):** current focal node/equipment filter, node-type visibility toggles, zoom/pan is left to the graph library's own internal state.

================================================================
7. COMPLETE SCREEN SPECIFICATIONS
================================================================

For EVERY screen below, implement: purpose, layout, full component hierarchy, a text wireframe, navigation entry points, exact API mapping (from Section 8 below), Zod validation where forms exist, loading state (skeleton, not spinner-only), success state, error state (mapped from the standard error shape), empty state (with a purposeful illustration/icon + one-line guidance, never a bare "No data"), permission behavior (what an `engineer` sees vs `admin`), responsive behavior at desktop/tablet/mobile, accessibility (landmark roles, focus order, ARIA labels on icon-only buttons, live-region announcements for streaming chat and toasts), and micro-interaction/animation notes.

**7.1 Login**
- Purpose: authenticate, establish role-based session.
- Layout: centered card on the industrial-texture dark background, product wordmark + a one-line tagline ("AI Knowledge Intelligence for Industrial Operations"), username + password fields, submit button, no "sign up" link (no self-registration per FR-11).
- API: `POST /auth/login`. On success, store `access_token`, `role`, compute expiry from `expires_in`, redirect to `/`.
- Errors: 401 → inline "Invalid username or password" (do not reveal which field is wrong); 422 → field-level Zod errors.
- Empty/loading: button shows a spinner + disables during request; skeleton not needed (single form).

**7.2 Dashboard**
- Purpose: orientation hub — system pulse, not vanity metrics.
- Layout: top row of stat tiles (Total Documents, Documents Indexed vs Pending, Compliance Items Expiring Soon, Open RCA-relevant incidents count derived from graph), a "Processing Queue" live panel (documents currently `UPLOADED`/`EXTRACTED`), a "Recent Activity" feed (from `GET /audit/history`, latest N), and quick-launch cards into Search/Chat/Upload/Graph.
- API: `GET /documents` (aggregate counts via query params/status filter), `GET /compliance/dashboard`, `GET /audit/history` (page_size small).
- Empty state: fresh install → "No documents yet" hero card with a prominent Upload CTA.

**7.3 Upload**
- Purpose: ingest documents (FR-1).
- Layout: large dropzone (drag-and-drop + file picker) supporting `.pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg,.txt`, per-file list with progress bars, a metadata panel (document_type select, equipment_tag text input with monospace styling + regex hint `[A-Z]{1,3}-\d{2,4}`, is_compliance toggle, expiry_date date picker shown only when is_compliance is true) applied per-file or in bulk.
- Validation: 50MB max per file (client-side pre-check before upload), max 20 files per request, extension whitelist — reject with inline error before hitting the network.
- API: `POST /documents/upload` (`multipart/form-data`, `files[]` + `metadata` JSON).
- Success: each file transitions to "Uploaded — queued for processing" with a link to the Processing Queue / Document Browser.
- Errors: 400 unsupported type, 413 too large, 422 malformed metadata — surfaced per-file, not as one global toast.

**7.4 Processing Queue**
- Purpose: visibility into the `UPLOADED → EXTRACTED → INDEXED` pipeline (FR-2, FR-3).
- Layout: a live-updating table/list of documents not yet `INDEXED`, each row showing current stage as a 3-step progress tracker, with `LOW_CONFIDENCE` OCR pages flagged with a warning badge.
- API: `GET /documents?status=UPLOADED,EXTRACTED` polled every 2–3s (TanStack Query `refetchInterval`, auto-stops when list is empty).
- Empty state: "All documents indexed" success illustration.

**7.5 Document Browser**
- Purpose: paginated, filterable, sortable catalog (FR-12).
- Layout: filter bar (document_type, status, equipment_tag, is_compliance, date range) synced to URL params, sort controls (`created_at`/`filename`), a document-card or dense-table view toggle, pagination footer matching the SRD's `{items, page, page_size, total, total_pages}` envelope.
- API: `GET /documents` with all documented query params.
- Row click → `/documents/:id` (Document Viewer). Admin sees a delete action (`DELETE /documents/{id}`) with a confirm dialog; engineer does not.

**7.6 Document Viewer**
- Purpose: enterprise-grade viewer with citation-jump support.
- Layout: split view — left: document render (PDF page image / extracted text fallback for non-PDF), page navigator, OCR confidence badge per page if `LOW_CONFIDENCE`; right: metadata panel (type, equipment_tag, compliance status/expiry, chunk count, timestamps) + "Jump to page" deep-link support (`?page=3&chunk=c-991`) so Chat/Search/RCA citations can open directly to the matched location with the matched text highlighted.
- API: `GET /documents/{id}`.

**7.7 Search**
- Purpose: hybrid semantic + keyword search (FR-4).
- Layout: prominent search bar (AI-search styling — subtle glow/focus ring, not a generic input), filter chips (document_type, equipment_tag, date range) below it, ranked result list showing filename, page number, similarity score as a subtle meter, and a highlighted snippet.
- API: `POST /search` (`query`, `filters`, `top_k`).
- Validation: 1–500 chars.
- Result click → Document Viewer at the matching page.
- Empty: "No results — try a different phrasing or check filters."

**7.8 AI Chat**
- Purpose: RAG copilot (FR-5) — the flagship experience.
- Layout: conversation panel with streamed assistant responses (typing/stream animation), each answer followed by citation chips (`document, page`) that expand a hover-preview and, on click, open the Document Viewer at that exact page/chunk; a persistent input composer with a model/settings affordance (top_k, if surfaced) and conversation history sidebar.
- API: `POST /chat` (SSE streaming per SRD; render tokens as they arrive via the `sse.ts` helper). If zero citations returned (below the 0.35 similarity gate), render the fixed "No relevant information found" message distinctly (muted styling, not styled as a hallucinated confident answer).
- Errors: 503 (Ollama unreachable) → a clear, non-alarming inline banner with a retry action, not a raw error dump.

**7.9 Knowledge Graph**
- Purpose: interactive equipment/document/incident relationship explorer (FR-6).
- Layout: full-canvas force-directed graph (react-force-graph), node color-by-type legend (Equipment, Document, Incident, SOP, Person, LessonLearned), a search/filter box to focus on an equipment tag, click-to-expand node detail panel (slides in from the right) listing its edges.
- API: `GET /knowledge/node/{id}` on node click; initial graph payload via whatever bulk endpoint the backend exposes for the default view (if none is separately defined beyond node-by-node in the SRD, seed the initial view from the Document Browser's currently filtered equipment tags and progressively expand on click — do not invent a new backend endpoint; only call documented endpoints). Admin-only: "Rebuild graph" action → `POST /knowledge/build`.
- Empty: "No graph data yet — index at least one document with a recognizable equipment tag."

**7.10 Maintenance Dashboard**
- Purpose: per-equipment history + rule-based next-due estimate (FR-7).
- Layout: equipment tag picker/search, a chronological timeline of linked documents/incidents, a prominent "Next Maintenance Due" card showing date + basis + confidence (or "Not enough data" — never a guess).
- API: `GET /maintenance/recommendations?equipment_tag=...`.

**7.11 Root Cause Analysis**
- Purpose: guided incident investigation (FR-8).
- Layout: incident description textarea (or pick an existing incident document), "Analyze" action, results panel showing a "Probable Factors" list each with inline citation chips, and a "Related Documents" list below.
- API: `POST /rca/analyze`.

**7.12 Compliance Dashboard**
- Purpose: regulatory document tracking (FR-9).
- Layout: three-column or tabbed grouping — Expired / Expiring Soon / OK — window selector (30/60/90 days), each item clickable to its document.
- API: `GET /compliance/dashboard?window_days=...`; tagging via `POST /compliance/check` (surfaced from the Document Viewer/Browser, not a separate form screen).

**7.13 Lessons Learned**
- Purpose: capture and surface tacit knowledge (FR-10).
- Layout: list view (searchable/filterable by equipment_tag/tag) + a "New Lesson" form (title, equipment_tag, problem, resolution, tags) validated per SRD limits (title 10–200 chars, problem/resolution 10–2000 chars each).
- API: `POST /lessons`, `GET /lessons`.
- Entries visually labeled distinctly ("Lesson Learned" source badge) wherever they surface in Search/Chat, per business rule.

**7.14 Audit Logs (admin-only)**
- Purpose: FR-13 visibility.
- Layout: filterable table (event_type, user_id, date range), paginated.
- API: `GET /audit/history`.

**7.15 Admin**
- Purpose: user management + manual re-index control (admin-only).
- Layout: Users tab (list, create, deactivate — role admin/engineer), Documents tab (trigger `POST /documents/index` retry/force-reindex for a specific document).

**7.16 System Health**
- Purpose: `/health` visibility for demo confidence.
- Layout: status tiles for db/ollama/vector_index/model, color-coded pill (ok/degraded/down).
- API: `GET /health` (no auth required, but shown inside the admin-protected shell).

**7.17 404 / 401 / 403**
- Simple, on-brand full-page states with a clear way back (link to Dashboard or Login).

================================================================
8. API CONTRACT MAPPING (from SRD Section 8 — verbatim, do not alter)
================================================================

Base URL: `http://localhost:8000/api/v1`. All requests except `POST /auth/login` and `GET /health` require `Authorization: Bearer <JWT>`. List endpoints use `page`/`page_size`/`sort_by`/`sort_order` and return `{items, page, page_size, total, total_pages}`. Errors use `{error:{code, message, details}}`.

| Method & Path | Screen(s) | Notes |
|---|---|---|
| `POST /auth/login` | Login | 401 invalid creds, 422 missing fields |
| `POST /documents/upload` | Upload | multipart, `files[]` + `metadata`; 400/413/422 |
| `POST /documents/index` | Admin (re-index) | admin-only; 409 if already INDEXED unless `force:true` |
| `GET /documents` | Dashboard, Document Browser, Processing Queue | full filter set per Section 8.4 |
| `GET /documents/{id}` | Document Viewer | 404 |
| `DELETE /documents/{id}` | Document Browser (admin) | 204, 404 |
| `POST /search` | Search | `query` 1–500 chars, `top_k` 1–50 |
| `POST /chat` | AI Chat | SSE via `Accept: text/event-stream`; 503 if Ollama down, 422 empty message |
| `POST /knowledge/build` | Knowledge Graph (admin) | 202 async |
| `GET /knowledge/node/{id}` | Knowledge Graph | 404 |
| `GET /maintenance/recommendations` | Maintenance Dashboard | `equipment_tag` required; empty timeline is a valid 200 |
| `POST /compliance/check` | Document Viewer/Browser tagging | |
| `GET /compliance/dashboard` | Compliance Dashboard | `window_days` default 90 |
| `POST /lessons` | Lessons Learned (create) | validation per field length |
| `GET /lessons` | Lessons Learned (list) | |
| `POST /rca/analyze` | Root Cause Analysis | |
| `POST /ocr` | Admin (internal/testing) | admin-only, single image |
| `POST /embeddings` | Admin (internal/testing) | admin-only |
| `GET /audit/history` | Audit Logs (admin) | |
| `GET /health` | System Health | no auth |

================================================================
9. TYPESCRIPT MODELS
================================================================

Generate a `types/api.ts` with interfaces for every request/response shape shown in SRD Section 8, including: `LoginRequest/LoginResponse`, `UploadedDocumentSummary`, `DocumentListItem`, `DocumentDetail` (status union: `'UPLOADED'|'EXTRACTED'|'EXTRACTION_FAILED'|'INDEXED'`), `SearchRequest/SearchResult`, `ChatRequest/ChatResponse/Citation`, `GraphNode/GraphEdge/NodeDetailResponse` (node type union: `'Equipment'|'Document'|'Incident'|'SOP'|'Person'|'LessonLearned'`), `MaintenanceRecommendation/TimelineEntry`, `ComplianceCheckRequest/ComplianceDashboardResponse`, `LessonLearnedRequest/LessonLearnedListItem`, `RcaAnalyzeRequest/RcaAnalyzeResponse/ProbableFactor`, `AuditLogEntry`, `HealthResponse`, plus the generic `PaginatedResponse<T>` and `ApiError` shapes. Mirror field names and types exactly as documented — do not rename or restructure fields.

================================================================
10. NAVIGATION FLOW
================================================================

Global shell: left sidebar (collapsible) grouping routes as Overview (Dashboard), Ingest (Upload, Processing Queue, Document Browser), Intelligence (Search, Chat, Knowledge Graph), Operations (Maintenance, Root Cause Analysis, Compliance, Lessons Learned), and — visible only to `admin` — Administration (Users, Audit Log, System Health). Top bar: global command palette (Cmd/Ctrl+K) for jumping to any screen or firing a quick search, theme toggle, user menu (role badge, logout). Citation chips and graph node clicks are the two cross-cutting deep-link mechanisms that must work from anywhere in the app back into the Document Viewer.

================================================================
11–13. DASHBOARD / SEARCH / CHAT EXPERIENCE DETAIL
================================================================

Already fully specified in 7.2, 7.7, 7.8 above — implement exactly as described, with the AI Chat streaming experience treated as the product's centerpiece: give it the most design attention (distinct message bubble styling for user vs. assistant, a subtle "thinking/retrieving" state before the first token streams, and citation chips that feel like first-class UI elements, not afterthought footnotes).

================================================================
14. KNOWLEDGE GRAPH EXPERIENCE
================================================================

Already specified in 7.9. Additionally: edge labels appear on hover only (avoid visual clutter at rest), node size can scale gently with connection count, and the detail panel must reuse the same citation-chip/document-card components used elsewhere for consistency.

================================================================
15. DOCUMENT VIEWER EXPERIENCE
================================================================

Already specified in 7.6. Treat this as an "enterprise PDF viewer" — page thumbnails rail (optional, nice-to-have), zoom controls, and a clear visual distinction between native-extracted pages and OCR'd pages (small badge), with `LOW_CONFIDENCE` pages getting a warning-amber outline.

================================================================
16. IMPLEMENTATION PRIORITY
================================================================

- **Must Have (P0, build first):** Auth/Login, Upload, Document Browser, Document Viewer, Search, AI Chat, Dashboard, route guards, design system core.
- **Should Have (P1):** Processing Queue, Knowledge Graph, Maintenance Dashboard, Root Cause Analysis, Compliance Dashboard, Admin (users + re-index), System Health.
- **Nice to Have (P2):** Lessons Learned, Audit Logs, command palette, page-thumbnail rail in Document Viewer, light theme polish beyond basic token support.

================================================================
17. IMPLEMENTATION ROADMAP (milestones for this single execution)
================================================================

1. Scaffold project, Tailwind theme/tokens, design-system primitives, auth flow + route guards.
2. Build layout shell (sidebar/topbar/command palette) + Dashboard.
3. Build Upload → Processing Queue → Document Browser → Document Viewer (the full ingestion loop).
4. Build Search and AI Chat (the flagship RAG experience).
5. Build Knowledge Graph, Maintenance, RCA, Compliance, Lessons Learned.
6. Build Admin, Audit Logs, System Health, error pages, and final responsive/accessibility/performance pass.

================================================================
18. FRONTEND DEVELOPMENT RULES
================================================================

- **Naming:** PascalCase components, camelCase functions/variables, `useX` for hooks, `xApi` for API client modules, `xStore` for Zustand stores.
- **Folders:** domain-first under `features/`, shared primitives under `components/ui/`.
- **Imports:** absolute imports via a `@/` alias; no deep relative `../../../` chains.
- **Hooks:** one hook per concern (`useDocuments`, `useUploadDocuments`, `useChatStream`); never mix query + mutation logic in one hook.
- **API convention:** every API module function returns typed data or throws a normalized `ApiError`; components never touch `fetch` directly.
- **State convention:** if it comes from the server, it lives in TanStack Query; if it's ephemeral UI, it lives in Zustand or local `useState`; never duplicate server data into Zustand.
- **Component convention:** presentational components take props only; container components own data-fetching; no business logic inside `components/ui/` primitives.
- **Styling convention:** Tailwind utility classes only, theme values pulled from the design tokens, no hard-coded hex values in components.
- **Animation convention:** Tailwind transition utilities / a tiny shared `motion` helper; no heavyweight animation library needed.
- **Performance convention:** code-split every route (`React.lazy` + `Suspense`), memoize expensive derived lists, virtualize the Document Browser table/list once row counts are large.
- **Accessibility convention:** every icon-only button gets an `aria-label`; every modal traps focus and restores it on close; every async region announces state changes via `aria-live` where appropriate (chat streaming, toasts, upload progress).

================================================================
19. CODING STANDARDS
================================================================

TypeScript strict mode on. No `any` except at typed API boundary parsing (immediately narrowed). ESLint + Prettier configured. Co-locate a component, its styles-as-classnames, and its tests (if added) per feature folder. Every exported function/component has a one-line JSDoc summary. Prefer composition over prop-drilling more than two levels — lift to context/store instead.

================================================================
20. PERFORMANCE OPTIMIZATION
================================================================

Route-level code splitting; lazy-load the Knowledge Graph canvas (heaviest dependency) so it never blocks initial load; memoize table rows and chat message list items; TanStack Query cache tuned per endpoint (short staleTime for Processing Queue, longer for static reference data like document type options); debounce Search input; virtualize long lists (Document Browser, Audit Log, Lessons Learned) once row count exceeds a couple hundred; lazy-load document page images in the Viewer as the user scrolls/paginates.

================================================================
21. ACCESSIBILITY
================================================================

Target WCAG AA contrast in both themes. Full keyboard navigation (Tab order matches visual order; Escape closes modals/command palette; Enter/Space activates custom controls). Semantic landmarks (`header`, `nav`, `main`, `aside`). Visible, on-brand focus rings (never `outline: none` without a replacement). Screen-reader labels on every icon-only control, status pill, and chart. Streaming chat text is exposed via an `aria-live="polite"` region so assistive tech isn't overwhelmed token-by-token.

================================================================
22. RESPONSIVE DESIGN
================================================================

Desktop-first (primary use case per SRD), but every screen must degrade gracefully: sidebar collapses to an icon rail then to a slide-over drawer on tablet/mobile; the Document Viewer's split view stacks vertically on narrow viewports; the Knowledge Graph canvas remains usable via pinch-zoom/pan on touch; tables convert to stacked cards below `sm` breakpoint.

================================================================
23. ANIMATION RULES
================================================================

Page transitions: brief fade/slide (150–200ms), never blocking interaction. Loading: skeleton shimmer, never a bare spinner for content areas (spinners only for button-level micro-actions). Hover: 120–150ms color/elevation transitions. AI response animation: token-stream reveal with a subtle cursor/typing indicator, and a gentle "settle" fade once a citation chip resolves. Graph animation: force-simulation's natural settle, plus a brief highlight pulse on the clicked/expanded node. Timeline animation: entries fade/slide in on load, staggered slightly (20–30ms per item, capped).

================================================================
24. FREE LIBRARIES — FINAL LIST
================================================================

React, Vite, TailwindCSS, lucide-react, TanStack Query, React Hook Form, Zod, react-force-graph, react-hot-toast, react-markdown, React Router, Zustand. Nothing else without a documented, justified reason consistent with "100% free, open-source, self-hosted" (SRD constraint). No Material UI, Bootstrap, Chakra, Ant Design, PrimeReact, or any paid library.

================================================================
25. FINAL INSTRUCTION
================================================================

Complete your internal UX/Visual/Architecture/Component/API/Interaction planning now, silently. Then immediately generate the full Vite + React + TypeScript + TailwindCSS project implementing everything specified above: folder structure, design tokens and design-system primitives, all layout components, all Zustand stores, all TanStack Query hooks and typed API clients, all Zod schemas, all routes/screens listed in Section 7 with their full states (loading/success/error/empty), the knowledge graph canvas, the streaming chat experience, and all accessibility and responsive behavior described. Do not stop for confirmation at any point. Do not ask clarifying questions — where the SRD is silent, make and label a reasonable assumption and continue. Produce the complete, runnable frontend codebase in this single execution.
