# JARVIS - Personal Knowledge RAG Assistant

A web-based application that ingests your personal technical knowledge base and uses Retrieval-Augmented Generation (RAG) to generate ready-to-use AI prompts grounded in your real preferences and standards.

## Overview

When using AI coding tools, you repeatedly re-explain your stack, conventions, and architectural preferences. JARVIS externalizes this knowledge once into a searchable base, then auto-injects relevant parts into any prompt generation request.

> "Generate an AI prompt for a REST API spec using my usual stack" → JARVIS retrieves your documented preferences (e.g., "I use FastAPI + Postgres + repository pattern") and produces a tailored prompt.

## Features

### 5.1 Knowledge Base Ingestion
- ✅ Manual text entry (title + content + tags)
- ✅ File upload (`.md`, `.txt`, `.pdf`) - coming soon
- ✅ Paste-in quick capture
- ✅ Categories: Stack, Architecture Pattern, Convention, Anti-pattern/Avoid, Tooling, Project-specific
- ✅ Edit/delete entries
- ✅ Searchable/filterable by tag
- ✅ Password required for write operations

### 5.2 Chunking & Embedding Pipeline
- ✅ Automatic semantic chunking (~400 tokens)
- ✅ Vector embeddings stored with pgvector
- ✅ Metadata: source title, tag, date added
- ✅ Similarity search for retrieval

### 5.3 Chat / Ask Interface
- ✅ Natural language questions
- ✅ **Prompt-generation mode** - generates structured, tool-ready prompts
- ✅ Shows retrieved knowledge chunks for transparency

### 5.4 Prompt Templates
- ✅ Claude-style (detailed, XML-tagged)
- ✅ Bolt/v0-style (concise, UI-focused)
- ✅ Cursor/Copilot-style (code-context focused)
- ✅ General AI template

### 5.5 History
- ✅ Save past generated prompts
- ✅ View, copy, regenerate with tweaks
- ✅ Model used tracking for traceability

### 5.6 Out-of-Scope Detection
- ✅ Similarity-score threshold on retrieval
- ✅ Clear messaging when topic not in knowledge base
- ✅ Suggestions to add relevant notes

### 5.7 Selectable LLM Model
- ✅ User-selectable per request or default in settings
- ✅ Free tier: Gemini Flash, Groq-hosted models
- ✅ Paid tier: Claude, GPT, DeepSeek, Qwen
- ✅ Separate selection for embeddings vs generation

### 5.8 Password Protection
- ✅ Password gate for adding/editing knowledge entries
- ✅ Password gate for paid model usage
- ✅ Session-based verification (30-min timeout, configurable)
- ✅ Rate limiting on password attempts (5 attempts = cooldown)
- ✅ Password hash stored (bcrypt compatible)

### 5.9 Branching Decision Scoring
- ✅ Log preference choices per category
- ✅ Score based on frequency + recency (decay function)
- ✅ Auto-pick when threshold exceeded (90% + min sample)
- ✅ Demoted options shown as alternatives
- ✅ Configurable threshold and sample size

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

## API Endpoints

### Knowledge Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge-entries` | List all entries |
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

Free tier models (Gemini Flash, Groq Llama) work without password verification.

## Performance Metrics

| Goal | Target |
|------|--------|
| Time to generate prompt | < 30 seconds |
| Prompt acceptance rate | > 80% |
| Retrieval accuracy | > 90% (spot-check) |

## Roadmap

### Phase 1 - MVP ✅
- Manual knowledge entry (CRUD), password-gated
- Neon setup with pgvector, embedding pipeline
- Basic ask/answer using free-tier model

### Phase 2 - Prompt Generation + Paid Models ✅
- Target-tool templates (Claude / Bolt / Cursor)
- Structured prompt output mode
- Paid model options + password gate
- Retrieved sources display

### Phase 3 - Polish 🚧
- History view with model tracking
- File upload ingestion (.md/.pdf)
- Export/import knowledge base
- Tag filtering + search UI
- Session expiry + rate limiting

### Phase 4 - Future
- Agentic mode (multi-step retrieval)
- Browser extension for quick capture
- Auto-ingest from GitHub, Notion, Obsidian
- Multi-user auth (if needed)

## Security Notes

- Password stored as bcrypt-compatible hash
- Session tokens short-lived (default 30 min)
- Basic rate-limiting on auth attempts
- All data in your own Neon database
- Exportable as JSON/Markdown

## License

MIT
