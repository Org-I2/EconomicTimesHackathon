# Industrial Knowledge Intelligence Platform (UAO Brain)

**UAO Brain** (Unified Asset & Operations Brain) is a state-of-the-art, AI-powered intelligence platform built for the Economic Times Hackathon. It acts as a centralized "brain" for industrial operations by unifying scattered and unstructured data (SOPs, Incident Reports, Manuals, Compliance Documents) into a highly interconnected, searchable Knowledge Graph. Furthermore, it provides an intuitive Retrieval-Augmented Generation (RAG) Copilot interface, allowing operators to gain instant, cited, and actionable operational insights simply by chatting with the system.

---

## 🚀 Live Application
Access the deployed production environment here:
**[https://economic-times-hackathon.vercel.app/](https://economic-times-hackathon.vercel.app/)**

## 🎥 Video Demonstration
Watch a full walkthrough of the UAO Brain platform in action:
**[View Demo on Google Drive](https://drive.google.com/file/d/1cLL1J1y2N_YHheDnNv4mgJGJCHlhSwRw/view?usp=drive_link)**

---

## 🏗️ System Architecture

The application is built on a modern, robust, and decoupled architecture designed for scalability and performance:

- **Interactive User Interface (React / Vite / Tailwind)**: A high-performance, dynamic frontend that features complex data visualizations (including a D3-based semantic knowledge graph), real-time document processing queues, hybrid search, and a conversational AI chat interface.
- **Robust API Backend (FastAPI / Python)**: A fast, async REST API that handles secure authentication, multi-part document uploads, background processing tasks, and orchestration of the ML model inference pipelines.
- **Relational Database (PostgreSQL via SQLAlchemy)**: Persistent relational storage for user accounts, chat session histories, system audit logs, and rich document metadata.
- **Vector Storage (ChromaDB)**: A local vector database optimized for storing dense document chunk embeddings. This empowers the semantic search and serves as the retrieval engine for the RAG workflows.
- **Cloud Storage (Cloudinary)**: Secure, scalable cloud storage for all uploaded PDF and text documents, ensuring high availability and fast retrieval.
- **ML Intelligence Pipeline (SentenceTransformers / Groq LLM)**: State-of-the-art semantic embedding generation combined with lightning-fast LLM inference to perform deep knowledge extraction, entity resolution, and conversational AI generation.

---

## 📁 Repository Structure

```text
EconomicTimesHackathon/
├── Backend/                 # FastAPI Backend Application
│   ├── main.py              # Application entrypoint & health checks
│   ├── database.py          # SQLAlchemy PostgreSQL connection
│   ├── models.py            # Database tables schema
│   ├── schemas.py           # Pydantic validation models
│   ├── routers/             # API Endpoints (auth, documents, copilot, kg)
│   └── services/            # Business logic (Cloudinary, document ingestion)
├── frontend/                # React / Vite Frontend Application
│   ├── src/                 
│   │   ├── components/      # Reusable UI components (buttons, cards, layout)
│   │   ├── features/        # Feature-specific pages (auth, chat, graph, search)
│   │   ├── lib/api/         # API clients to communicate with the backend
│   │   ├── stores/          # Zustand global state management
│   │   └── types/           # TypeScript interfaces and API schemas
│   ├── vite.config.ts       # Vite bundler and proxy configuration
│   └── tailwind.config.ts   # Design system and custom colors
├── ml/                      # Machine Learning & AI Services
│   └── services/            
│       ├── chunking.py      # Semantic chunking of documents
│       ├── embeddings.py    # Vector embedding via SentenceTransformers
│       ├── extraction.py    # LLM-based Knowledge Graph entity extraction
│       └── llm.py           # Groq-powered completion service
├── alembic/                 # Database Migration Scripts
├── data/                    # Local ChromaDB vector storage persistence
└── .env                     # Environment Variables Configuration
```

---

## ⚙️ Running the Project Locally

Running the project locally allows the application to proxy API requests seamlessly from the UI to the backend without complex CORS configurations.

### 1. Start the Backend API
Open a terminal, activate your virtual environment, and start the FastAPI server:
```bash
cd Backend
# Ensure your virtual environment is active (e.g., .venv\Scripts\Activate.ps1)
uvicorn Backend.main:app --reload --port 8000
```
*The backend API will be available at `http://127.0.0.1:8000` and Interactive API documentation (Swagger) at `http://127.0.0.1:8000/docs`.*

### 2. Start the Application UI
Open a second terminal window to launch the interactive UI:
```bash
cd frontend
npm install
npm run dev
```
*The application will be accessible at `http://localhost:5173`. Ensure that `VITE_API_BASE_URL` in your `.env` or `config.ts` is empty so that the local proxy handles API routing.*

---

## 🌐 Live Deployment Links
- **Application UI**: **[https://economic-times-hackathon.vercel.app/](https://economic-times-hackathon.vercel.app/)**
- **Backend API**: **[https://economictimeshackathon.onrender.com](https://economictimeshackathon.onrender.com)**

---

## 🛠️ Key Features & Workflow

1. **Intelligent Document Ingestion**: Users can upload complex manuals, SOPs, or incident reports. The system securely uploads the file to the cloud, semantically chunks the text, generates vector embeddings (stored in ChromaDB), and utilizes advanced LLMs to extract critical entities and relationships for the Knowledge Graph.
2. **AI Copilot (RAG Chat)**: A seamless conversational interface where users can ask complex questions about their industrial assets. The system performs semantic vector search across the knowledge base and feeds the retrieved context into an LLM to provide highly accurate answers backed by inline citations.
3. **Semantic Knowledge Graph**: A highly interactive, visual node-based explorer that illustrates semantic relationships between equipment, procedures, and historical incidents, allowing operators to visualize the blast radius of failures.
4. **Specialized Agent Workflows**: Advanced AI endpoints that can execute automated Root Cause Analysis (RCA) on incident reports or perform deep Compliance Checks against newly uploaded industry regulations.

---

## 📖 User Walkthrough & Modules Guide

Here is a step-by-step guide on how to navigate the UAO Brain UI and access its various modules:

### 1. Authentication & Onboarding
- **Sign Up / Login** (`/signup`, `/login`): Start by creating an account. The system uses secure JWT authentication to verify users before granting access to the internal dashboard.

### 2. Document Ingestion (Overview & Ingest)
- **Dashboard** (`/dashboard`): The main landing view providing a high-level summary of system statistics.
- **Upload Documents** (`/upload`): Navigate here to upload your PDFs, P&IDs, or TXT files. You can tag files by `Document Type` (e.g., SOP, Manual, Incident Report) and `Equipment Tag`.
- **Processing Queue** (`/processing`): Monitor the real-time status of your uploads as the backend extracts text, generates embeddings, and maps Knowledge Graph entities.
- **Document Browser** (`/documents`): A searchable list of all successfully ingested documents in the system.

### 3. Intelligence Modules
- **AI Copilot** (`/chat`): The conversational RAG interface. Ask questions like *"What is the shutdown procedure for Pump 104A?"* and receive cited answers based strictly on uploaded documents.
- **Search** (`/search`): A hybrid search interface allowing you to quickly find documents by matching text or filtering by equipment tags.
- **Knowledge Graph** (`/graph`): An interactive D3 visualizer. Use this to explore the semantic web of relationships between your industrial entities (Equipment, Procedures, Personnel, etc).

### 4. Specialized Operations
- **Maintenance Intelligence** (`/maintenance`): Review predictive maintenance schedules based on historical data.
- **Root Cause Analysis (RCA)** (`/rca`): Select an equipment tag to trigger an automated AI analysis of probable failure causes based on incident history.
- **Compliance Check** (`/compliance`): Automatically cross-reference regulatory standards against internal SOPs to identify gaps.
- **Lessons Learned** (`/lessons-learned`): Review a repository of past operational mistakes and their corresponding AI-generated mitigation strategies.

### 5. Administration
- **Admin Dashboard** (`/admin`): Restricted to admin roles. Manage users and system settings.
- **Audit Logs** (`/admin/audit-log`): Track all actions taken by users within the platform.
- **System Health** (`/admin/system-health`): Monitor the live connectivity status of PostgreSQL, ChromaDB, Cloudinary, and the LLM provider.