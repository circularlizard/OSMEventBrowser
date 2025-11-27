# Implementation Plan

## Goal
To build an OSM Event Browser with read access to events and member data.

## OAuth Scopes
The application requests the following OAuth scopes (using **dot notation**):
- `section.event:read` - Read access to events
- `section.member:read` - Read access to member personal details
- `section.programme:read` - Read access to programme data

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
- [x] Request correct OAuth scopes (section.event:read, section.member:read, section.programme:read)

### Phase 3: API Proxy Layer ✅
- [x] Create generic proxy handler `/api/osm/[...path]`
- [x] Implement middleware/logic to attach access token
- [x] Implement automatic token refresh on 401
- [x] Secure API routes (ensure internal use only/valid session)
- [x] Monitor rate limit headers
- [x] Handle 429 responses
- [x] Check for X-Blocked and X-Deprecated headers
- [x] Create client-side API helpers

### Phase 4: API Refinement & Data Extraction ✅
- [x] Extract section and term data
    - [x] Implement `getTerms` to retrieve terms for all sections (Used startup data extraction)
    - [x] Implement logic to identify the *current* term (required for other API calls)
    - [x] Store/Cache `termid` for use in subsequent requests (Managed via React state)
- [x] Implement events API integration
    - [x] Target endpoint: `ext/events/summary/?action=get` (requires `sectionid` + `termid`)
    - [x] Verify response structure (expecting `items` array)
    - [x] Handle rate limiting headers (`X-RateLimit-*`) (Handled by proxy)
- [x] Implement participant/attendance data retrieval
    - [x] Target endpoint: `ext/events/event/?action=getAttendance` (requires `sectionid` + `termid` + `eventid`)
    - [x] Verify attendance data structure
    - [x] Ensure member details are sufficient (or if `getMembersGrid` is needed)

> [!NOTE]
> Analysis of reference implementation shows that `termid` is critical for almost all OSM API calls. We must successfully fetch and identify the current term before we can fetch events or attendance.

### Phase 5: Frontend Development ✅
- [x] Create Dashboard layout
- [x] Build Event Browser UI
    - [x] List events with filtering/sorting
    - [x] Event detail view
    - [x] Member attendance view
- [x] Implement proper error handling and loading states
- [x] Add responsive design for mobile
- [x] Theme and styling (Modern Violet/Scout theme)
- [x] Create dedicated API Browser for debugging (`/debug/api-browser`)

### Phase 6: Enhanced UI & Navigation
- [ ] **Dashboard Refactor**:
    - [x] Display event statistics (Invited/Yes/No) segmented by Members/Leaders.
    - [ ] Implement sorting controls for the event list (Sort by: Date, Name, Attendees Accepted).
    - [ ] Default sorting: Most recent first.
- [ ] **Event Details Page** (`/dashboard/events/[eventId]`):
    - [x] Create dedicated page layout.
    - [x] Display comprehensive event metadata.
    - [ ] **Layout Fixes**:
        - [ ] Remove internal scrollbar from attendee list; allow full page scrolling.
    - [ ] **Attendee List Enhancements**:
        - [ ] Display all available attendee details (e.g., DOB, Photo, Patrol ID, etc.).
        - [ ] Display "Medical/Dietary" info (from available attendance data initially).
        - [ ] Implement Sorting: Name, Patrol, Age (Years/Months).
        - [ ] Implement Filtering: Role (Member/Leader), Patrol, Attendance Status.
    - [ ] **Data Enrichment**:
        - [ ] Investigate and implement Patrol Name resolution (Likely `ext/members/patrols/?action=getPatrols` or similar, as `getSectionConfig` is insufficient).
- [ ] **General**:
    - [ ] Update Favicon to match app logo.

### Phase 7: Data Export
- [ ] Implement PDF Export (`pdfkit` or `puppeteer` server-side)
    - [ ] Event summary reports
    - [ ] Attendance reports
- [ ] Implement Spreadsheet Export (CSV/XLSX server-side)
    - [ ] Event data export
    - [ ] Member data export
