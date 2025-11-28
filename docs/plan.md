# Implementation Plan

## Goal
To build an OSM Event Browser with read access to events and member data.

## OAuth Scopes
The application requests the following OAuth scopes (using **colon notation**):
- `section:event:read` - Read access to events
- `section:member:read` - Read access to member personal details
- `section:programme:read` - Read access to programme data

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
    - [x] Corrected OAuth scopes to use colon notation (`section:member:read`, etc.) in all relevant files and documentation, resolving permission-related issues.
- [x] Create helper functions for cookie management
- [x] Request correct OAuth scopes (section:event:read, section:member:read, section:programme:read)

### Phase 3: API Proxy Layer ✅
- [x] Create generic proxy handler `/api/osm/[...path]`
- [x] Implement middleware/logic to attach access token
- [x] Implement automatic token refresh on 401
- [x] Secure API routes (ensure internal use only/valid session)
- [x] Monitor rate limit headers
- [x] Handle 429 responses
- [x] Check for `X-Blocked` and `X-Deprecated` headers
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

### Phase 6: Enhanced UI & Navigation ✅
- [x] **Dashboard Refactor**:
    - [x] Display event statistics (Invited/Yes/No) segmented by Members/Leaders.
    - [x] Implement sorting controls for the event list (Sort by: Date, Name, Attendees Accepted).
    - [x] Default sorting: Most recent first.
    - [x] **Enhancement: State Persistence**: Updated dashboard to read/write `sectionId` to URL search params, ensuring section selection is preserved when navigating back from details.
    - [x] **Enhancement: Date Ranges**: Updated both Dashboard and Event Details to display date ranges (Start - End) if dates differ.
    - [x] **Enhancement: Past Events**: Past events on the dashboard are now visually de-emphasized (greyscale/opacity). Fixed logic to correctly parse UK-formatted dates (DD/MM/YYYY) to avoid ambiguity with US formats (e.g., 01/12 vs 12/01).
    - [x] Improved the layout of the section selector area to be more responsive and less cramped, allowing the section ID and current term to wrap.
- [x] **Event Details Page** (`/dashboard/events/[eventId]`):
    - [x] Create dedicated page layout.
    - [x] Display comprehensive event metadata.
    - [x] **Layout Fixes**:
        - [x] Remove internal scrollbar from attendee list; allow full page scrolling.
    - [x] **Attendee List Enhancements**:
        - [ ] Display "Medical/Dietary" info (from available attendance data initially).
        - [x] Implement Sorting: Name, Patrol, Age (Years/Months).
        - [x] Implement Filtering: Role (Member/Leader), Patrol, Attendance Status.
    - [x] **Data Enrichment**:
        - [x] Investigate and implement Patrol Name resolution.
        - [x] Added a conditional message near the Patrol column header indicating that patrol names require `member:read` permissions, based on the user's `startupData` permissions.
        - [x] Ensured `startupData` is always fetched and available for permission checks.
- [ ] **General**:
    - [ ] Update Favicon to match app logo.

### Phase 6.5: Member & Patrol Centric Views ✅
- [x] **Data Aggregation API (`/api/osm/members-events-summary`)**:
    - [x] Implement new server-side API route to fetch all events, patrols, and attendance records for a given section/term.
    - [x] Aggregates data into a member-centric and patrol-centric structure.
    - [x] Includes an in-memory caching mechanism (5-minute TTL) to optimize data retrieval and respect OSM API rate limits.
- [x] **Service Layer Refactoring for Client/Server Isolation**:
    - [x] Implement dynamic imports for server-only modules to prevent client-side bundling errors.
    - [x] Split service functions (`getEvents`, `getEventAttendance`, `getPatrols`) into `client-services.ts`/`client-patrols.ts` (using `osmGet`) and `server-services.ts` / `server-patrols.ts` (using `callExternalOsmApi`).
    - [x] Centralize shared types in `services-types.ts`.
    - [x] Update all call sites (components and API routes) to use the correct client/server service/patrol modules.
    - [x] **Verification**: Dashboard page loads correctly with member and patrol lists.
    - [x] Resolved `TypeError: Failed to parse URL` by ensuring correct absolute URL construction for server-side `fetch` calls.
    - [x] Fixed `SocketError: other side closed` by eliminating internal HTTP calls from server routes using direct service module imports.
- [x] **Member Details View (`/dashboard/members/[memberid]`)**:
    - [x] Created dedicated page to display member details and their event attendance across all events.
- [x] **Patrol Details View (`/dashboard/patrols/[patrolid]`)**:
    - [x] Created dedicated page to display patrol details and event attendance for all members within the patrol.
- [x] **Navigation Integration**:
    - [x] Update Dashboard to display lists of members and patrols, with links to their respective detail pages.
    - [x] Update Event Details page attendance table to make member names and patrol names clickable, linking to their respective detail pages.

### Phase 6.6: Stability & Optimization (Immediate) 🔄
- [ ] **Fix Detail Page Rendering**:
    - [ ] Investigate and fix rendering issues on Member, Patrol, and Event detail pages.
    - [ ] Ensure data is correctly passed and displayed.
- [ ] **Optimize API Calls**:
    - [ ] Integrate `/v3/events/event/{event ID}/summary` endpoint to fetch richer event data (including custom fields).
    - [ ] Optimize data fetching to prevent over-fetching.

### Phase 7: Baseline Testing
- [ ] **Test Infrastructure Setup**:
    - [ ] Install development dependencies: `jest` or `vitest`, `testing-library`.
    - [ ] Configure test runner.
- [ ] **Baseline Tests**:
    - [ ] Create "smoke tests" for critical pages (Dashboard, Event Details).
    - [ ] Ensure application builds and runs without errors.

### Phase 8: Data Export
- [ ] Implement PDF Export (`pdfkit` or `puppeteer` server-side)
    - [ ] Event summary reports
    - [ ] Attendance reports
- [ ] Implement Spreadsheet Export (CSV/XLSX server-side)
    - [ ] Event data export
    - [ ] Member data export