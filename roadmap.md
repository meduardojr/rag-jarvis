# Jarvis Roadmap

## Overview
This document outlines the planned, in-progress, and completed features for the Jarvis knowledge base application.

## Legend
- ✅ Completed
- 🚧 In Progress
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

## In Progress
- 🚧 UI indicators for chunking status (badge/showing "unchunked" entries)
- 🚧 Retry mechanism for failed chunking from the UI
- 🚧 Improved error reporting for chunking/embedding failures
- 🚧 Pagination and search/filtering for knowledge entries list
- 🚧 Tag management UI enhancements
- 🚧 Root-cause fix for embedding pipeline failure
- 🚧 Frontend: "Chunk Now" (single) + "Chunk All" (bulk) buttons wired to existing endpoints
- 🚧 History view with model tracking
- 🚧 File upload ingestion (.md/.pdf)
- 🚧 Export/import knowledge base
- 🚧 Session expiry + rate limiting

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
- For detailed implementation notes, see the commit messages and PR descriptions.