# Jarvis Roadmap

## Overview
This document outlines the planned, in-progress, and completed features for the Jarvis knowledge base application.

## Legend
- ✅ Completed (verified working by me)
- 🚧 In Progress
- ⚠️ Needs re-verification (status unconfirmed after recent git reset)
- 🔜 Upcoming

## Completed
- ✅ Core knowledge entry CRUD operations (create, read, update, delete)
- ✅ Password protection and verification
- ✅ Automatic chunking and embedding generation for knowledge entries
- ✅ Skeleton loading states for data fetching
- ✅ Handling of empty query states (show default UI instead of skeletons)
- ✅ Secure password storage using bcrypt hashing
- ✅ Chunking failure handling: entries are saved even if chunking fails, with a flag to indicate status
- ✅ Fixed duplicate-column bug in `knowledge_entries` table:
  - Removed redundant `is_chunked` column
  - Corrected `chunked` column default to `false`
  - Backfilled `chunked` based on actual presence of chunks
  - Updated API routes to set `chunked = true` only after successful chunking
  - Added endpoints for manual chunking:
    - `POST /api/knowledge-entries/[id]/chunk` (chunk now)
    - `POST /api/knowledge-entries/chunk-all` (bulk chunk unchunked entries)
- ✅ Neon setup with pgvector, embedding pipeline
- ✅ Basic ask/answer using free-tier model
- ✅ Target-tool templates (Claude / Bolt / Cursor)
- ✅ Structured prompt output mode
- ✅ Paid model options + password gate
- ✅ Retrieved sources display
- ✅ Pagination and search/filtering for knowledge entries list
- ✅ Password‑gated knowledge base viewing with pagination, tabs, and placeholder data for unverified sessions
- ✅ Root cause of embedding pipeline failure identified: missing/inactive RAG API key
- ✅ Localized loading/error states — each section manages its own loading/error independently (no shared state across sections)
- ✅ Merged hero + "AI-powered prompt assistant" intro section, with tabbed interface (About Me Chat / Generate AI Prompt) below it
- ✅ Inline knowledge entry editing (edit directly in the list, not via the add-entry form)
- ✅ Agent + model selection for Generate AI Prompt (pick agent first, then a model valid for that agent)


## In Progress
- 🚧 UI indicators for chunking status (badge/showing "unchunked" entries)
- 🚧 Retry mechanism for failed chunking from the UI
- 🚧 Tag management UI enhancements
- 🚧 Frontend: "Chunk Now" (single) + "Chunk All" (bulk) buttons wired to existing endpoints
- 🚧 History view with model tracking
- 🚧 File upload ingestion (.md/.pdf)
- 🚧 Export/import knowledge base
- 🚧 Session expiry + rate limiting
- 🚧 Improved error reporting for chunking/embedding failures
- 🚧 About Me Chat: constrained Q&A mode scoped to user's knowledge base with owner recognition, in-content redaction notes (REDACTION: convention), and full question logging
- 🚧 Desktop layout fixes (side-by-side hero/intro, square aspect ratio, tag contrast, general max-width/grid cleanup)
- 🚧 Jev-based scope classification for About Me Chat (planned: schema/payload doc → guardrail swap → shadow-mode validation, not yet started)



## Upcoming
- 🔜 Version history for knowledge entries
- 🔜 Advanced search with semantic similarity
- 🔜 Integration with additional AI models/providers
- 🔜 User authentication and multi‑user support
- 🔜 Analytics dashboard (usage, popular entries, etc.)
- 🔜 Agentic mode (multi-step retrieval)
- 🔜 Browser extension for quick capture
- 🔜 Auto-ingest from GitHub, Notion, Obsidian
- 🔜 Multi-user auth (if needed)

## Notes
- This roadmap is updated whenever there is a significant change related to planned features.
- Items are only marked ✅ after manual verification in the running app — not on an AI assistant's self-report of success.
- For detailed implementation notes, see the commit messages and PR descriptions.