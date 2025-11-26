# OSM Library (`src/lib/osm`)

This module encapsulates all interaction with the Online Scout Manager (OSM) ecosystem.

## Files

- **api.ts**: The client-side proxy wrapper. Use `osmGet`, `osmPost`, etc., to make requests to the internal `/api/osm/*` proxy.
- **services.ts**: Higher-level service functions (e.g., `getEvents`, `getEventAttendance`) that fetch and format data for the UI.
- **data-helpers.ts**: Utilities for extracting structured data (Sections, Terms) from the raw OSM startup blob.
- **parser.ts**: Low-level parsing logic to handle OSM's non-standard "JavaScript variable assignment" response format.
