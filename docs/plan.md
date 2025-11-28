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

## Completed Phases
Refer to [completed-phases.md](./completed-phases.md) for the archive of Phases 1-7.

## Upcoming Phases

### Phase 8: Client-Side Data Engine (New Architecture)
- [ ] **State Management Setup**:
    - [ ] Install `zustand`.
    - [ ] Define `OsmStore` interface (Normalized Events, Members, Patrols).
    - [ ] Create `src/lib/store.ts`.
- [ ] **Progressive Hydration**:
    - [ ] Implement `Stage 1` logic: Fetch Lists (Patrols, Members, Events Summary).
    - [ ] Implement `HydrationQueue`: A background manager to fetch `v3/events/event/{id}/summary` sequentially.
    - [ ] Connect Queue to Store: Update `events` and `members` (attendance) as requests complete.
- [ ] **Refactor UI to Store**:
    - [ ] **Dashboard**: Bind to `useOsmStore`. Remove direct API calls from `page.tsx`.
    - [ ] **Event Details**: Read from Store. If empty (deep link), trigger single-event hydration.
    - [ ] **Member/Patrol Details**: Read directly from Store (computed views).

### Phase 9: Data Export
- [ ] Implement PDF Export (`pdfkit` or `puppeteer` server-side)
    - [ ] Event summary reports
    - [ ] Attendance reports
- [ ] Implement Spreadsheet Export (CSV/XLSX server-side)
    - [ ] Event data export
    - [ ] Member data export
