# JARVIS - Personal Knowledge RAG Assistant

A web-based application that ingests your personal technical knowledge base and uses Retrieval-Augmented Generation (RAG) to power a **Chat Consultant** that answers technical questions and gives advice grounded in your documented stack, skills, and experience.

## Overview

When using AI coding tools, you repeatedly re-explain your stack, conventions, and architectural preferences. JARVIS externalizes this knowledge once into a searchable base, then retrieves relevant parts to answer questions about your technical work.

> "What's my preferred backend stack?" → JARVIS retrieves your documented preferences (e.g., "I use FastAPI + Postgres + repository pattern") and answers with citations.

## Features

### 1.1 Knowledge Base Ingestion
- ✅ Manual text entry (title + content + tags)
- ✅ File upload (`.md`, `.txt`, `.pdf`) - coming soon
- ✅ Paste-in quick capture
- ✅ Categories: Stack, Architecture Pattern, Convention, Anti-pattern/Avoid, Tooling, Project-specific
- ✅ Edit/delete entries
- ✅ Searchable/filterable by tag
- ✅ Password required for write operations

### 1.2 Chunking & Embedding Pipeline
- ✅ Automatic semantic chunking (~400 tokens)
- ✅ Vector embeddings stored with pgvector
- ✅ Metadata: source title, tag, date added
- ✅ Similarity search for retrieval

### 1.3 Chat Consultant
- ✅ Natural language questions about software, architecture, tooling, and deployment
- ✅ Answers grounded in the knowledge base via RAG with similarity search
- ✅ Opens with a "not covered in your knowledge base" notice when nothing relevant is retrieved
- ✅ Declines unrelated questions through the Jev scope gate (threshold 0.85)
- ✅ Owner vs. visitor recognition via existing password session (jarvis-session cookie)
- ✅ In-content redaction notes using `REDACTION:` convention for visitor-specific filtering
- ✅ Source titles shown to the owner only
- ✅ Full question logging to `about_me_chat_log` table (question, scope, answer, owner status, timestamp)
- ✅ Each question is answered independently (no multi-turn memory yet)

### 1.4 Out-of-Scope Detection
- ✅ Similarity-score threshold on retrieval
- ✅ Clear messaging when topic not in knowledge base
- ✅ Suggestions to add relevant notes

### 1.5 Selectable LLM Model
- ✅ User-selectable per request or default in settings
- ✅ Free tier: Gemini Flash, Groq-hosted models
- ✅ Paid tier: Claude, GPT, DeepSeek, Qwen
- ✅ Separate selection for embeddings vs generation

### 1.6 Password Protection
- ✅ Password gate for adding/editing knowledge entries
- ✅ Password gate for paid model usage
- ✅ Session-based verification (30-min timeout, configurable)
- ✅ Rate limiting on password attempts (5 attempts = cooldown)
- ✅ Password hash stored (bcrypt compatible)

### 1.7 Branching Decision Scoring
- ✅ Log preference choices per category
- ✅ Score based on frequency + recency (decay function)
- ✅ Auto-pick when threshold exceeded (90% + min sample)
- ✅ Demoted options shown as alternatives
- ✅ Configurable threshold and sample size

### 1.8 Knowledge Base Viewing (Password‑Gated & Paginated)
- ✅ Password required to view actual entry content (title, content, tags)
- ✅ When unverified, API returns placeholder data (masked title, empty content/tags) to prevent leakage via network/DOM
- ✅ Owner/visitor recognition via existing password session (same jarvis‑session cookie)
- ✅ Pagination support with `page` query parameter (fixed 5 entries per page)
- ✅ UI shows locked/blurred treatment when unverified, normal list when verified
- ✅ Tabs interface: "Add Entry" form vs. "Browse Knowledge Base" list
- ✅ Full compatibility with existing add/edit/delete operations (still password‑gated for writes)

## Tech Stack

| Layer | Choice |
|------|--------|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS + Glassmorphism |
| UI Components | Shadcn/UI + Lucide Icons |
| Database | Neon (Postgres + pgvector) |
| Embeddings | OpenAI text-embedding-3-small |
| LLM Generation | Multiple providers (Gemini, Claude, Groq, etc.) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- Neon account with pgvector extension enabled
- API keys for LLM providers (optional for basic usage)

### Environment Variables

Create a `.env.local` file with:

```env
# Database (from Neon Console)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Optional: OpenAI for embeddings (required for RAG)
OPENAI_API_KEY=sk-...

# Optional: LLM Provider API Keys
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
GROQ_API_KEY=...

# Required: TypeSafe Jev for scope classification
TYPESAFE_API_KEY=...
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using JARVIS.

### Database Setup

On first run, JARVIS will automatically create the required tables:

- `knowledge_entries` - Your technical knowledge base
- `chunks` - Vector embeddings with pgvector
- `generated_prompts` - Prompt history
- `app_settings` - Configuration and password hash
- `preference_choices` - Branching decision logs
- `password_attempts` - Rate limiting
- `about_me_chat_log` - Log of about-me chat interactions

## API Endpoints

### Knowledge Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge-entries?page=1` | List entries with pagination (5 per page). Returns masked placeholder data when unverified; full data when verified. |
| POST | `/api/knowledge-entries` | Create entry (auto-chunks & embeds) |
| PUT | `/api/knowledge-entries?id=xxx` | Update entry |
| DELETE | `/api/knowledge-entries?id=xxx` | Delete entry |

### Chat Consultant

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/consultant-chat` | Answer a technical question grounded in the knowledge base via RAG |

Request body:
```json
{
  "question": "What is my preferred backend stack?"
}
```

Response body (in-scope):
```json
{
  "answer": "Based on your knowledge base, I prefer using FastAPI with Postgres...",
  "in_scope": true,
  "is_owner": true,
  "grounded": true,
  "sources": ["FastAPI + Postgres"]
}
```

Response body (out-of-scope):
```json
{
  "answer": "This assistant only helps with software, architecture, tooling, and questions about the author's technical work. Please ask a question related to those topics.",
  "in_scope": false,
  "is_owner": true,
  "grounded": false
}
```

### History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/generated-prompts` | List history — **retained but not used by the UI** |
| POST | `/api/generated-prompts` | Save prompt — **retained but not used by the UI** |
| DELETE | `/api/generated-prompts` | Clear history — **retained but not used by the UI** |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth` | Set/change password |
| GET | `/api/auth` | Check if password configured |
| POST | `/api/auth/verify` | Verify password & create session |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get app settings |
| PUT | `/api/settings` | Update settings |

### Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/preferences` | Get preference scores |
| POST | `/api/preferences` | Log a choice |

## Password Protection

JARVIS uses two-tier password protection:

1. **Knowledge Base Writes**: Adding, editing, or deleting entries requires password verification
2. **Paid Model Usage**: Using Claude, GPT, or other paid models requires password verification
3. **Knowledge Base Reads**: Viewing the knowledge base list (GET /api/knowledge-entries) requires password verification to see real content; unverified sessions receive only placeholder data.

Free tier models (Gemini Flash, Groq Llama) work without password verification.

## Performance Metrics

| Goal | Target |
|------|--------|
| Time to answer question | < 30 seconds |
| Answer relevance rate | > 80% |
| Retrieval accuracy | > 90% (spot-check) |

## Security Notes

- Password stored as bcrypt-compatible hash
- Session tokens short-lived (default 30 min)
- Basic rate-limiting on auth attempts
- All data in your own Neon database
- Exportable as JSON/Markdown

## License

MIT