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

### Phase 8: Data Engine & API Verification (API First) ✅
- [x] **8.1: State Management Foundation**
    - [x] Install `zustand`.
    - [x] Define `OsmStore` interface (Normalized Events, Members, Patrols).
    - [x] **Multi-Section Logic:** Implement state for selecting/managing up to 3 active sections.
    - [x] **Debug Mode:** Implement persistent toggle (localStorage) to enable verbose logging.
    - [x] Create `src/lib/store.ts`.
- [x] **8.2: Smart Request Queue (Rate Limiting)**
    - [x] Implement `SmartQueue` class:
        - [x] Singleton instance.
        - [x] Task priority management.
        - [x] **Rate Limit Logic:** Intercept responses to read `X-RateLimit` headers.
        - [x] **Pause/Resume:** Automatically pause queue on 429 or low remaining limit.
    - [x] Connect Queue to `OsmStore` actions.
- [x] **8.3: API Diagnostic Harness (Live Verification)**
    - [x] Create `/debug/diagnostics` page.
    - [x] Implement test runner that executes real API calls via the `SmartQueue` to verify rate limiting behavior.
    - [x] Display Pass/Fail status, Latency, and Payload validation.
- [ ] **8.4: Mock Data Layer (Offline/Dev Mode)**
    - [ ] Create `src/lib/osm/mock-data.ts` with realistic fixtures (Startup, Events, Members).
    - [ ] Update `SmartQueue` to intercept requests when `mockMode` is enabled.
    - [ ] Add UI toggle for Mock Mode in `/debug` or Store.

### Phase 9: Reactive UI Implementation & Migration
- [ ] **9.0: Section Picker (Entry Point)**
    - [ ] Implement a modal/view to select up to 3 sections.
    - [ ] **Temporary Logic:** Upon selection, redirect immediately to `/debug/diagnostics` to verify the `SmartQueue` logic against the live API.
- [ ] **9.1: Dashboard Refactor**
    - [ ] Once diagnostics pass, redirect Section Picker to the main Dashboard.
    - [ ] Connect Dashboard to `OsmStore`.
    - [ ] Remove direct API calls (`getEvents`) from `page.tsx`.
- [ ] **9.2: Detail Views**
    - [ ] Connect Member/Patrol/Event details to Store.
    - [ ] **Multi-Section UI:** Update views to clearly indicate which section an item belongs to (e.g., color-coded badges).
    - [ ] Implement "Live Update" visual indicators as hydration completes.

### Exclusions (What NOT to Change)
- **Authentication:** `src/lib/auth.ts` and OAuth callback logic remain unchanged.
- **Server Proxy:** `src/app/api/osm/[...path]` remains unchanged (except for header forwarding if needed).
- **Styles:** Global CSS and Tailwind config are stable.
