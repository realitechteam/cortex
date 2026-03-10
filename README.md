# Cortex — AI Document Intelligence

**Upload documents and get AI-powered answers, summaries, and cross-document insights.**

---

## Overview

Cortex is a full-stack document intelligence platform that turns your unstructured files into a searchable, queryable knowledge base. Upload text, markdown, CSV, or JSON documents, and Cortex will automatically chunk, index, and summarize them — then let you ask natural-language questions and receive cited answers drawn from your entire library.

Built for researchers, analysts, and knowledge workers who need to extract insights from growing document collections without manually re-reading everything. Cortex is powered by **Next.js 14**, **Claude AI** (Anthropic), and **SQLite**, and ships as a single Docker container for zero-friction deployment.

---

## Features

- **Document Management** — Upload and organize text, markdown, CSV, and JSON files with automatic chunking and indexing
- **AI-Powered Q&A** — Ask questions in natural language and get precise answers with source citations
- **Auto-Summarization** — Every document is summarized by Claude on upload, no manual effort required
- **Smart Search** — TF-IDF cosine-similarity retrieval finds the most relevant document chunks for each query
- **Cross-Document Insights** — Discover patterns, contradictions, and themes across your entire library
- **Conversation History** — Multi-turn conversations with full context awareness (up to 10 messages of history)
- **Dark Mode UI** — Polished, responsive interface built with Tailwind CSS

---

## Architecture

```
┌──────────┐       ┌──────────────────────────────────────────────┐
│          │       │              Next.js 14                      │
│  Browser │◄─────►│  React UI    +    API Routes (App Router)   │
│          │       └──────┬──────────────┬──────────────┬─────────┘
└──────────┘              │              │              │
                          ▼              ▼              ▼
                    ┌──────────┐  ┌────────────┐  ┌──────────┐
                    │ Claude   │  │  SQLite     │  │  File    │
                    │ API      │  │  (WAL mode) │  │  Storage │
                    │          │  │             │  │          │
                    │ • Q&A    │  │ • documents │  │ uploads/ │
                    │ • Summary│  │ • chunks    │  │          │
                    │ • Insights│ │ • conversations│          │
                    └──────────┘  │ • messages  │  └──────────┘
                                  └────────────┘
```

**Key design decisions:**

| Decision | Rationale |
|---|---|
| Full-stack Next.js (App Router) | Single codebase for UI + API; fast iteration, simple deployment |
| SQLite with WAL mode | Zero-config persistence; no external database to manage |
| TF-IDF cosine similarity | Good-enough retrieval for MVP; upgradeable to embedding-based search |
| Background summarization | Documents are available instantly; summaries arrive asynchronously |
| Standalone Docker build | `next build` outputs a self-contained `server.js`; single container, no orchestration |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, standalone output) |
| **Language** | TypeScript 5.5 |
| **UI** | React 18, Tailwind CSS 3.4, [Lucide Icons](https://lucide.dev/) |
| **AI** | [Anthropic Claude](https://docs.anthropic.com/) (claude-sonnet-4-20250514) |
| **Database** | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| **Search** | Custom TF-IDF cosine similarity (in-memory) |
| **Runtime** | Node.js 20+ |
| **Deployment** | Docker (multi-stage Alpine build) |

---

## Getting Started

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com/)

### Quick Start

```bash
git clone <repo-url>
cd cortex
cp .env.example .env
```

Add your API key to `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_PATH=./data/cortex.db
UPLOAD_DIR=./uploads
```

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — upload a document and start asking questions.

### Docker

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

docker-compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000). Data is persisted across restarts via named Docker volumes (`cortex-data` and `cortex-uploads`).

---

## Project Structure

```
cortex/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts            # POST /api/chat — send message, get AI answer
│   │   │   ├── conversations/
│   │   │   │   ├── route.ts            # GET/POST /api/conversations
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts        # GET/DELETE /api/conversations/:id
│   │   │   └── documents/
│   │   │       ├── route.ts            # GET/POST /api/documents (list & upload)
│   │   │       └── [id]/
│   │   │           ├── route.ts        # GET/DELETE /api/documents/:id
│   │   │           └── summary/
│   │   │               └── route.ts    # POST /api/documents/:id/summary (regenerate)
│   │   ├── chat/
│   │   │   └── page.tsx                # Chat page — conversations + AI Q&A
│   │   ├── documents/
│   │   │   └── page.tsx                # Documents page — upload, browse, detail view
│   │   ├── globals.css                 # Tailwind base styles
│   │   └── layout.tsx                  # Root layout with sidebar navigation
│   ├── components/
│   │   ├── ChatInterface.tsx           # Message input, response rendering
│   │   ├── ConversationList.tsx        # Conversation sidebar with CRUD
│   │   ├── DocumentDetail.tsx          # Document detail panel with summary
│   │   ├── DocumentList.tsx            # Document cards grid
│   │   ├── DocumentUpload.tsx          # Drag-and-drop file upload
│   │   └── Sidebar.tsx                 # App-wide navigation sidebar
│   └── lib/
│       ├── ai.ts                       # Claude API client (summarize, Q&A, insights)
│       ├── chunker.ts                  # Text chunker with smart boundary detection
│       ├── db.ts                       # SQLite schema, migrations, and query helpers
│       └── vectors.ts                  # TF-IDF cosine similarity search
├── data/                               # SQLite database (auto-created)
├── uploads/                            # Uploaded file storage
├── Dockerfile                          # Multi-stage production build
├── docker-compose.yml                  # One-command deployment
├── next.config.js                      # Standalone output + better-sqlite3 config
├── tailwind.config.ts                  # Custom Cortex design tokens
├── tsconfig.json                       # TypeScript configuration
├── package.json                        # Dependencies and scripts
└── .env.example                        # Environment variable template
```

---

## API Reference

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/documents` | List all documents |
| `POST` | `/api/documents` | Upload a new document (multipart form data) |
| `GET` | `/api/documents/:id` | Get document details + chunk count |
| `DELETE` | `/api/documents/:id` | Delete a document and its uploaded file |
| `POST` | `/api/documents/:id/summary` | Regenerate AI summary |

#### Upload a Document

```bash
curl -X POST http://localhost:3000/api/documents \
  -F "file=@./my-document.txt"
```

**Supported file types:** `text/plain`, `text/markdown`, `text/csv`, `application/json`

**Response** `201 Created`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "my-document",
  "filename": "my-document.txt",
  "file_size": 4096,
  "mime_type": "text/plain",
  "summary": null,
  "created_at": "2026-03-10T12:00:00",
  "updated_at": "2026-03-10T12:00:00"
}
```

> The `summary` field will be populated asynchronously after upload.

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message and receive an AI-generated answer |

#### Send a Message

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the key findings in my documents?",
    "conversationId": "optional-existing-conversation-id"
  }'
```

**Response** `200 OK`:

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": {
    "id": "msg-uuid",
    "role": "assistant",
    "content": "Based on your documents, the key findings are...",
    "sources": [
      { "chunkId": "chunk-uuid", "documentId": "doc-uuid" }
    ]
  },
  "relevantChunks": [
    {
      "chunkId": "chunk-uuid",
      "documentId": "doc-uuid",
      "content": "Relevant text excerpt...",
      "score": 0.85
    }
  ]
}
```

> Omit `conversationId` to start a new conversation. The response includes the new `conversationId` for subsequent messages.

### Conversations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/conversations` | List all conversations |
| `POST` | `/api/conversations` | Create a new conversation |
| `GET` | `/api/conversations/:id` | Get conversation with all messages |
| `DELETE` | `/api/conversations/:id` | Delete a conversation and its messages |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | *(required)* | Your Anthropic API key |
| `DATABASE_PATH` | `./data/cortex.db` | Path to SQLite database file |
| `UPLOAD_DIR` | `./uploads` | Directory for uploaded files |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build (standalone output) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Roadmap

- [ ] PDF and DOCX document support
- [ ] Embedding-based vector search (OpenAI / Cohere embeddings)
- [ ] Multi-user authentication
- [ ] Team workspaces with shared document libraries
- [ ] Webhook integrations for automated ingestion
- [ ] Export insights and conversations as reports
- [ ] Streaming AI responses
- [ ] Document tagging and folder organization

---

## License

MIT
