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

## In Progress
- 🚧 UI indicators for chunking status (badge/showing "unchunked" entries)
- 🚧 Retry mechanism for failed chunking from the UI
- 🚧 Improved error reporting for chunking/embedding failures
- 🚧 Pagination and search/filtering for knowledge entries list
- 🚧 Tag management UI enhancements

## Upcoming
- 🔜 Export/import knowledge base (JSON/Markdown)
- 🔜 Version history for knowledge entries
- 🔜 Advanced search with semantic similarity
- 🔜 Integration with additional AI models/providers
- 🔜 User authentication and multi‑user support
- 🔜 Analytics dashboard (usage, popular entries, etc.)

## Notes
- This roadmap is updated whenever there is a significant change related to planned features.
- For detailed implementation notes, see the commit messages and PR descriptions.