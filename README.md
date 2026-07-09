# Document Intelligence

A full-stack, multi-tenant document intelligence platform that combines role-based access control, RAG-powered document Q&A, analytics dashboards, and AI-assisted research workspaces into one cohesive internal tool.

---

## What It Does

Organizations upload documents. Users ask questions about them using natural language. The system retrieves relevant passages, answers the question using an LLM, and highlights the exact source sections in the PDF. Users can save findings from any conversation into collaborative Workspace documents — structured like Notion pages — and build audit reports, compliance reviews, or research notes from them.

---

## Features

### Multi-Tenant Organization Management
- **Global Admin** creates and manages organizations, invites org admins via email
- **Org Admin** creates departments, invites department admins, manages documents and permissions
- **Dept Admin** manages department members, invites users, controls member-level permissions
- **User** accesses assigned documents and performs Q&A

All role transitions happen through time-limited invite links. Memberships carry a granular permission system on top of the role hierarchy.

### Invite & Onboarding Flow
- Email invites generated with expiry timers
- Accept-invite page handles token validation and account creation
- Countdown timers show remaining invite validity in the members list
- Expired invites can be re-sent without leaving the page

### Document Management
- Org admins upload documents to S3-compatible object storage
- Documents are assigned to departments; department members inherit access
- Processing pipeline runs asynchronously via SQS: download → parse → chunk → embed → store in ChromaDB
- SQS worker uses at-least-once delivery: messages are deleted from the queue only after successful ingestion; failures leave the message in the queue for automatic retry
- Worker POSTs status transitions (`PROCESSING` → `COMPLETED` / `FAILED`) to the MERN backend webhook
- Webhook notifies the MERN backend when processing completes, updating the document status in MongoDB
- Document list shows processing status, file size, type, and upload date

### PDF Viewer with RAG Q&A
- Side-by-side layout: PDF preview on the left, chat panel on the right
- Type a question; the RAG pipeline retrieves relevant chunks and answers using an LLM
- Source chunks are highlighted directly on the PDF with color-coded overlays
- Each chunk shows the page number and category; clicking a chunk scrolls the PDF to that location
- Full conversation history within the session

**Retrieval strategy** — The pipeline uses section-tree expansion: if the top similarity match is a `Title` element, all sibling and child elements on that page (up to the next `Title`) are pulled in as context, giving the LLM a complete section rather than an isolated snippet. For non-title matches, the single most relevant chunk is used. Embeddings use HuggingFace `all-MiniLM-L6-v2`; generation uses Groq `llama-3.3-70b-versatile`.

### Analytics Dashboards

**Org Admin Dashboard**
- Total documents, active members, departments, daily user additions, daily document assignments
- Total RAG queries across the entire organization
- Daily Additions chart (bar chart, 7 / 14 / 30-day selectable range)
- Per-department query breakdown

**Department Admin Dashboard**
- Total users, active users, assigned documents, workload percentage (department share of org docs)
- Total RAG queries from the entire department
- 7-day traffic chart (users added + documents added)

**Department Detail (Org Admin view)**
- Same metrics as dept admin dashboard, with the addition of permission management for the department admin

### Member Profile Analytics
- Clicking any active member in the department users list opens a slide-in profile drawer
- Displays role, status, joined date, and assigned permissions
- Shows total documents in the department and total queries performed by that member
- Per-document query breakdown: lists every document the user has queried, with a query count and proportional bar

### Workspaces
A workspace is a personal research document, similar to a Notion page, built from AI findings and freeform notes.

**Creating and managing workspaces**
- Any authenticated user can create named workspaces from the sidebar
- Workspace list page shows all owned workspaces with last-updated timestamps
- Workspaces can be renamed inline or deleted with a confirmation prompt

**The workspace editor**
- Full rich-text editor powered by TipTap (ProseMirror)
- Toolbar: H1, H2, H3, bold, italic, bullet list, numbered list, horizontal rule, undo/redo
- Content auto-saves 1.5 seconds after the last keystroke; save status shown in the header
- Title is editable inline and saves separately with a 600ms debounce

**Saving findings**
When an AI response has source chunks, a **Save to Workspace** button appears below the sources in the chat panel. Clicking it opens a modal where the user can:
- Pick an existing workspace from a list
- Or create a new workspace on the spot

The finding is appended to the selected workspace as fully editable paragraphs:
- **Query** — the question the user asked, in bold
- The query text
- **AI Response** — in bold
- The answer text
- **Source · Document Name** — in bold
- Each source chunk's text with its page number

Because the content is plain TipTap paragraphs, it can be edited, deleted, rearranged, or extended just like any other text in the document. Users write notes, headings, and lists around saved findings to build reports, audit summaries, or compliance reviews.

---

## Architecture

Three services run independently:

```
frontend/          React + Vite (port 5173)
backend/           Express + MongoDB (port 8000)
fastapi_rag/       FastAPI + ChromaDB (port 9000)
```

The MERN backend handles all user-facing APIs. When a document is uploaded, it pushes a message to SQS. The FastAPI worker consumes the message, processes the document (parse → chunk → embed → store), and calls a webhook back to the MERN backend to update the document status.

When a user queries a document, the MERN backend forwards the query to the FastAPI RAG service, which retrieves relevant chunks from ChromaDB, calls the LLM, and returns the answer with source chunks and coordinates.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, RTK Query, React Router v6, Tailwind CSS, Framer Motion, TipTap, react-pdf |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, Helmet, express-rate-limit, express-validator |
| RAG Service | FastAPI, LangChain, ChromaDB, SQS consumer |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` via sentence-transformers |
| LLM | Groq — `llama-3.3-70b-versatile` |
| PDF Parsing | Unstructured (hi-res, element mode) |
| Storage | AWS S3 |
| Queue | AWS SQS (async document processing) |
| Logging | Loguru (FastAPI service) |

---

## Repository Layout

```
frontend/
  src/
    pages/              # Full-page route components
      Home.jsx          # Role-based dashboard router
      OrgAdminDashboard.jsx
      Department.jsx    # Dept detail + permissions (org admin)
      DepartmentUsers.jsx  # Member list + profile drawer
      DocumentViewer.jsx   # PDF viewer + RAG chat + save to workspace
      WorkspacesPage.jsx   # Workspace list
      WorkspaceEditor.jsx  # TipTap editor (StarterKit, centered toolbar, auto-save)
      ...
    components/
      UI/               # AppLayout, Navbar, Sidebar, route guards
      home/             # Role-specific home views (DeptAdmin, OrgAdmin, Global)
    features/
      auth/             # Auth slice + API
      dashboard/        # Dashboard API slice
      departments/      # Departments API slice (includes member analytics)
      documents/        # Documents API slice
      workspaces/       # Workspaces API slice
      invites/          # Invite API slice
      memberships/      # Membership permissions API slice
    services/
      api.js            # RTK Query base with auth guard

backend/
  src/
    models/             # Mongoose schemas
      User, Organization, Department, OrganizationMembership
      OrganizationInvite, Document, DocumentAssignment
      RagQuery, Workspace
    repositories/       # DB query layer (one per model)
    services/           # Business logic
      authService, organizationService, departmentService
      documentService, dashboardService, workspaceService
      organizationInviteService, membershipService
    controllers/        # Route handlers (thin, delegate to services)
    routes/             # Express routers with validation middleware
    middleware/
      auth.js           # JWT verification → req.user + req.auth
      authorize.js      # Policy-based action check
      validate.js       # express-validator error collector
    security/
      policy.js         # ROLE_ACTION_MAP + permission-based fallback for DEPT_ADMIN/USER
    constants/
      roles.js, actions.js, documents.js
  server.js             # Express app wiring, CORS, rate limits, route registration

fastapi_rag/
  app/
    main.py             # FastAPI app bootstrap; mounts routers, starts SQS worker
    config.py           # Pydantic-style settings loaded from environment
    rag_pipeline.py     # ingest_pdf (parse → chunk → embed → store) + answer_query
    rag_router.py       # POST /rag/query — API-key-protected query endpoint
    sqs_worker.py       # SQSWorker class: long-poll loop, at-least-once delivery
    auth.py             # API key dependency (require_api_key)
    s3_client.py        # Streaming S3 object download helper
    webhook_client.py   # send_processing_update → MERN backend webhook
    logging_config.py   # Loguru sink configuration
    utils.py            # Shared helpers
```

---

## API Surface

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Authenticate, receive JWT |
| GET | `/api/auth/me` | Current user profile |

### Organizations
| Method | Path | Access |
|---|---|---|
| POST | `/api/organizations/create` | GLOBAL_ADMIN |
| GET | `/api/organizations/list` | GLOBAL_ADMIN |
| GET | `/api/organizations/:slug/:id` | GLOBAL_ADMIN |

### Departments
| Method | Path | Access |
|---|---|---|
| POST | `/api/departments/create` | ORG_ADMIN |
| GET | `/api/departments/list` | ORG_ADMIN, DEPT_ADMIN |
| GET | `/api/departments/department/:orgId/:deptId` | ORG_ADMIN, DEPT_ADMIN |
| GET | `/api/departments/department/:orgId/:deptId/analytics` | ORG_ADMIN, DEPT_ADMIN |
| GET | `/api/departments/department/:orgId/:deptId/members/:memberId/analytics` | ORG_ADMIN, DEPT_ADMIN |
| PATCH | `/api/departments/:id` | ORG_ADMIN |
| DELETE | `/api/departments/:id` | ORG_ADMIN |

### Documents
| Method | Path | Access |
|---|---|---|
| POST | `/api/documents/upload` | ORG_ADMIN |
| GET | `/api/documents/list` | ORG_ADMIN, DEPT_ADMIN |
| GET | `/api/documents/:id/view` | Authenticated |
| POST | `/api/documents/:id/query` | Authenticated |
| DELETE | `/api/documents/:id` | ORG_ADMIN |

### Dashboard
| Method | Path | Access |
|---|---|---|
| GET | `/api/dashboard/org-admin/summary` | ORG_ADMIN |

### Workspaces
| Method | Path | Description |
|---|---|---|
| GET | `/api/workspaces` | List user's workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces/:id` | Get workspace with content |
| PATCH | `/api/workspaces/:id` | Update title or content |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| POST | `/api/workspaces/:id/findings` | Append finding block to workspace |

### RAG Service (internal, port 9000)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/rag/query` | API key header | Retrieve chunks + LLM answer for a document |

Request body: `{ "query": "...", "document_id": "..." }`
Response: `{ "answer": "...", "document_id": "...", "chunks": [{ "text", "page_number", "coordinates", "category", "element_id" }] }`

---

## Security Model

Authorization is enforced in two layers:

1. **Role-based** — `GLOBAL_ADMIN` and `ORG_ADMIN` have a fixed set of allowed actions defined in `policy.js`. Any request for an action not in their set is rejected with 403.
2. **Permission-based** — `DEPT_ADMIN` and `USER` roles have no static action map. Instead, each membership carries a `permissions` array of action strings. The same policy check looks these up at request time.

Workspaces are owner-scoped: the service validates `workspace.owner === userId` on every read/write/delete. No additional role check is needed since workspaces are personal.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- AWS credentials (SQS + S3, or compatible alternatives)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, AWS keys, RAG_API_URL, WEBHOOK_SECRET
node server.js
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:8000/api
npm run dev
```

### FastAPI RAG Service

```bash
cd fastapi_rag
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in the vars below
uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload
```

Required environment variables for the RAG service:

| Variable | Description |
|---|---|
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_SQS_QUEUE_URL` | Full SQS queue URL |
| `AWS_S3_BUCKET` | S3 bucket name for stored PDFs |
| `GROQ_API_KEY` | Groq API key (LLM inference) |
| `MERN_WEBHOOK_URL` | URL the worker POSTs status updates to |
| `MERN_WEBHOOK_API_KEY` | Shared secret for the MERN webhook endpoint |
| `API_KEY` | API key the MERN backend sends on `/rag/query` requests |
| `CHROMA_PERSIST_DIR` | Path for ChromaDB persistence (defaults to `./chroma_db`) |

The three services are independent. The frontend talks only to the MERN backend. The MERN backend talks to the FastAPI service for document queries and uses SQS for async processing.

---

## Data Flow

### Document Upload & Processing
```
User uploads file
  → MERN: store metadata, upload to S3, push SQS message
  → FastAPI worker: receive SQS message, download from S3
  → Parse PDF → chunk text → generate embeddings → store in ChromaDB
  → Webhook to MERN: update document status to COMPLETED
```

### Document Query (RAG)
```
User sends question in DocumentViewer
  → MERN: authenticate, log RagQuery record
  → FastAPI /query: retrieve top-k chunks from ChromaDB
  → LLM: generate answer grounded in retrieved chunks
  → Return: answer text + chunk texts + PDF coordinates
  → Frontend: render answer, highlight PDF regions
  → User clicks "Save to Workspace": append FindingBlock to workspace doc
```

### Workspace Auto-save
```
User types in WorkspaceEditor
  → TipTap onUpdate fires
  → 1.5s debounce timer resets
  → PATCH /api/workspaces/:id with full TipTap JSON
  → Status indicator: Unsaved → Saving… → Saved
```
