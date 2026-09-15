# JARVIS - Personal Knowledge RAG Assistant

A web-based application that ingests your personal technical knowledge base and uses Retrieval-Augmented Generation (RAG) to generate ready-to-use AI prompts grounded in your real preferences and standards.

## Overview

When using AI coding tools, you repeatedly re-explain your stack, conventions, and architectural preferences. JARVIS externalizes this knowledge once into a searchable base, then auto-injects relevant parts into any prompt generation request.

> "Generate an AI prompt for a REST API spec using my usual stack" → JARVIS retrieves your documented preferences (e.g., "I use FastAPI + Postgres + repository pattern") and produces a tailored prompt.

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

### 1.3 Chat / Ask Interface
- ✅ Natural language questions
- ✅ **Prompt-generation mode** - generates structured, tool-ready prompts
- ✅ Shows retrieved knowledge chunks for transparency

### 1.4 Prompt Templates
- ✅ Claude-style (detailed, XML-tagged)
- ✅ Bolt/v0-style (concise, UI-focused)
- ✅ Cursor/Copilot-style (code-context focused)
- ✅ General AI template

### 1.5 History
- ✅ Save past generated prompts
- ✅ View, copy, regenerate with tweaks
- ✅ Model used tracking for traceability

### 1.6 Out-of-Scope Detection
- ✅ Similarity-score threshold on retrieval
- ✅ Clear messaging when topic not in knowledge base
- ✅ Suggestions to add relevant notes

### 1.7 Selectable LLM Model
- ✅ User-selectable per request or default in settings
- ✅ Free tier: Gemini Flash, Groq-hosted models
- ✅ Paid tier: Claude, GPT, DeepSeek, Qwen
- ✅ Separate selection for embeddings vs generation

### 1.8 Password Protection
- ✅ Password gate for adding/editing knowledge entries
- ✅ Password gate for paid model usage
- ✅ Session-based verification (30-min timeout, configurable)
- ✅ Rate limiting on password attempts (5 attempts = cooldown)
- ✅ Password hash stored (bcrypt compatible)

### 1.9 Branching Decision Scoring
- ✅ Log preference choices per category
- ✅ Score based on frequency + recency (decay function)
- ✅ Auto-pick when threshold exceeded (90% + min sample)
- ✅ Demoted options shown as alternatives
- ✅ Configurable threshold and sample size

### 1.10 About Me Chat
- ✅ Constrained Q&A mode scoped to questions about the user's own knowledge base
- ✅ Two-step pipeline: lightweight classification (in-scope/out-of-scope) then grounded answer generation
- ✅ Automatic scope rejection for unrelated questions with configurable message
- ✅ Owner vs. visitor recognition via existing password session (jarvis-session cookie)
- ✅ In-content redaction notes using `REDACTION:` convention for visitor-specific filtering
- ✅ Full question logging to `about_me_chat_log` table (question, scope, answer, owner status, timestamp)

### 1.11 Knowledge Base Viewing (Password‑Gated & Paginated)
- ✅ Password required to view actual entry content (title, content, tags)
- ✅ When unverified, API returns placeholder data (masked title, empty content/tags) to prevent leakage via network/DOM
- ✅ Owner/visitor recognition via existing password session (same jarvis‑session cookie)
- ✅ Pagination support with `page` and `limit` query parameters (default 10 per page)
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
| GET | `/api/knowledge-entries?page=1&limit=10` | List entries with pagination. Returns masked placeholder data when unverified; full data when verified. |
| POST | `/api/knowledge-entries` | Create entry (auto-chunks & embeds) |
| PUT | `/api/knowledge-entries?id=xxx` | Update entry |
| DELETE | `/api/knowledge-entries?id=xxx` | Delete entry |

### Chat / Prompt Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Generate AI prompt with RAG |

Request body:
```json
{
  "query": "Create a REST API for user auth",
  "target_tool": "claude",
  "model": "gemini-2.0-flash"
}
```

### About Me Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/about-me-chat` | Ask a question about the user's knowledge base (stack, skills, projects) |

Request body:
```json
{
  "question": "What is my preferred backend stack?",
  "model": "gemini-2.0-flash" // optional, defaults to gemini-2.0-flash
}
```

Response body (in-scope):
```json
{
  "answer": "Based on your knowledge base, I prefer using FastAPI with Postgres...",
  "in_scope": true,
  "is_owner": true
}
```

Response body (out-of-scope):
```json
{
  "answer": "I'm designed to answer questions about your technical knowledge base, skills, past projects, and what you know/do. Please ask a question related to your own expertise.",
  "in_scope": false,
  "is_owner": false
}
```

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

### History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/generated-prompts` | List history |
| POST | `/api/generated-prompts` | Save prompt |
| DELETE | `/api/generated-prompts` | Clear history |

## Password Protection

JARVIS uses two-tier password protection:

1. **Knowledge Base Writes**: Adding, editing, or deleting entries requires password verification
2. **Paid Model Usage**: Using Claude, GPT, or other paid models requires password verification
3. **Knowledge Base Reads**: Viewing the knowledge base list (GET /api/knowledge-entries) requires password verification to see real content; unverified sessions receive only placeholder data.

Free tier models (Gemini Flash, Groq Llama) work without password verification.

## Performance Metrics

| Goal | Target |
|------|--------|
| Time to generate prompt | < 30 seconds |
| Prompt acceptance rate | > 80% |
| Retrieval accuracy | > 90% (spot-check) |

## Security Notes

- Password stored as bcrypt-compatible hash
- Session tokens short-lived (default 30 min)
- Basic rate-limiting on auth attempts
- All data in your own Neon database
- Exportable as JSON/Markdown

## License

MIT