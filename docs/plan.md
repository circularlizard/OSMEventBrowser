# Implementation Plan

## Goal
To build an OSM Event Browser.

## Proposed Changes
## Proposed Changes

### Phase 1: Project Setup & Foundation
- [ ] Initialize Next.js project (enable Tailwind CSS)
- [ ] Initialize shadcn/ui (configure `components.json`, Theme: Blue)
- [ ] Configure project structure (api routes, components, lib)

### Phase 2: Authentication (OAuth 2.0)
- [ ] Implement `GET /api/oauth-callback`
    - Exchange code for tokens
    - Store tokens in HTTP-Only cookies
- [ ] Implement Token Refresh logic
- [ ] Create helper functions for cookie management

### Phase 3: API Proxy Layer
- [ ] Create generic proxy handler `/api/osm/[...path]`
- [ ] Implement middleware/logic to attach access token
- [ ] Implement automatic token refresh on 401
- [ ] Secure API routes (ensure internal use only/valid session)

### Phase 4: Frontend Development
- [ ] Create Dashboard layout
- [ ] Implement Data Discovery Utility (JSON viewer for API responses)
- [ ] Build Event Browser UI

### Phase 5: Data Export
- [ ] Implement PDF Export (`pdfkit` or `puppeteer`)
- [ ] Implement Spreadsheet Export (CSV/XLSX)

