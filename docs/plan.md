# Implementation Plan

## Goal
To build an OSM Event Browser with read access to events and member data.

## OAuth Scopes
The application requests the following OAuth scopes:
- `section:event:read` - Read access to events
- `section:member:read` - Read access to member personal details

## API Rate Limiting
The OSM API enforces rate limits per authenticated user. The application must:
- Monitor `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers
- Handle HTTP 429 responses with `Retry-After` header
- Check for `X-Blocked` header (application blocked)
- Check for `X-Deprecated` header (endpoint deprecation warnings)
- Validate all responses to avoid invalid requests

## Proposed Changes

### Phase 1: Project Setup & Foundation ✅
- [x] Initialize Next.js project (enable Tailwind CSS)
- [x] Initialize shadcn/ui (configure `components.json`, Theme: Blue)
- [x] Configure project structure (api routes, components, lib)
- [x] Set up HTTPS for local development (mkcert)

### Phase 2: Authentication (OAuth 2.0) ✅
- [x] Create `.env.example` and `.env.local` templates
- [x] Implement `GET /api/oauth-callback`
    - Exchange code for tokens
    - Store tokens in HTTP-Only cookies
- [x] Implement Token Refresh logic
- [x] Create helper functions for cookie management
- [x] Request correct OAuth scopes (event:read, member:read)

### Phase 3: API Proxy Layer ✅
- [x] Create generic proxy handler `/api/osm/[...path]`
- [x] Implement middleware/logic to attach access token
- [x] Implement automatic token refresh on 401
- [x] Secure API routes (ensure internal use only/valid session)
- [x] Monitor rate limit headers
- [x] Handle 429 responses
- [x] Check for X-Blocked and X-Deprecated headers
- [x] Create client-side API helpers

### Phase 4: API Refinement & Data Extraction
- [ ] Extract section and term data from user data
    - [ ] Identify correct API endpoint(s) for user sections
    - [ ] Parse section structure and available terms
    - [ ] Handle multiple sections if applicable
- [ ] Implement events API integration
    - [ ] Determine correct events API endpoint
    - [ ] Test with different section/term combinations
    - [ ] Validate event data structure
- [ ] Implement participant/attendance data retrieval
    - [ ] Identify endpoint for event participants
    - [ ] Test participant data structure
    - [ ] Ensure data completeness for attendance tracking

> [!NOTE]
> This phase involves iterative exploration of the poorly documented OSM API. Each sub-task may require multiple attempts to identify the correct endpoints and data structures.

### Phase 5: Frontend Development
- [x] Create Dashboard layout with API Discovery Utility
- [ ] Build Event Browser UI
    - [ ] List events with filtering/sorting
    - [ ] Event detail view
    - [ ] Member attendance view
- [ ] Implement proper error handling and loading states
- [ ] Add responsive design for mobile

### Phase 6: Data Export
- [ ] Implement PDF Export (`pdfkit` or `puppeteer`)
    - [ ] Event summary reports
    - [ ] Attendance reports
- [ ] Implement Spreadsheet Export (CSV/XLSX)
    - [ ] Event data export
    - [ ] Member data export
