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

### Phase 8: Data Engine & API Verification (API First)
- [ ] **8.1: State Management Foundation**
    - [ ] Install `zustand`.
    - [ ] Define `OsmStore` interface (Normalized Events, Members, Patrols).
    - [ ] Implement `HydrationQueue` logic (pure TS/JS class).
    - [ ] Create `src/lib/store.ts`.
- [ ] **8.2: Engine Testing (Unit/Integration)**
    - [ ] Write Vitest tests for `OsmStore` (mocking API responses).
    - [ ] Verify hydration logic correctly updates state.
    - [ ] Ensure "Skeleton" vs "Detailed" states are handled correctly.
- [ ] **8.3: API Diagnostic Harness (Live Verification)**
    - [ ] Create `/debug/diagnostics` page.
    - [ ] Implement a test runner that executes real API calls (`getEvents`, `getMembers`, `getEventDetails`).
    - [ ] Display Pass/Fail status, Latency, and Payload validation.
    - [ ] **Goal:** Prove the backend proxy is healthy *before* building the complex UI.

### Phase 9: Reactive UI Implementation
- [ ] **9.1: Dashboard Refactor**
    - [ ] Connect Dashboard to `OsmStore`.
    - [ ] Remove direct API calls from `page.tsx`.
    - [ ] Implement "Skeleton" loading state.
- [ ] **9.2: Detail Views**
    - [ ] Connect Member/Patrol/Event details to Store.
    - [ ] Implement "Live Update" visual indicators as hydration completes.

### Phase 10: Data Export
- [ ] Implement PDF Export (`pdfkit` or `puppeteer` server-side)
    - [ ] Event summary reports
    - [ ] Attendance reports
- [ ] Implement Spreadsheet Export (CSV/XLSX server-side)
    - [ ] Event data export
    - [ ] Member data export
