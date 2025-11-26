# OSM API Mapping

This document maps the `VikingsEventMgmt` proxy API endpoints to the underlying Online Scout Manager (OSM) API endpoints, based on the analysis of the `VikingsEventMgmtAPI` backend repository.

## Base URL
All OSM API calls are made to `https://www.onlinescoutmanager.co.uk`.

## API Endpoints

| Proxy Endpoint | OSM Endpoint | Method | Parameters | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `GET /get-terms` | `api.php?action=getTerms` | GET | None | |
| `GET /get-section-config` | `api.php?action=getSectionConfig` | GET | `sectionid` | |
| `GET /get-user-roles` | `api.php?action=getUserRoles` | GET | None | |
| `GET /get-events` | `ext/events/summary/?action=get` | GET | `sectionid`, `termid` | **Note:** Action is `get`, not `getEvents`. |
| `GET /get-event-attendance` | `ext/events/event/?action=getAttendance` | GET | `sectionid`, `termid`, `eventid` | |
| `GET /get-event-sharing-status` | `ext/events/event/sharing/?action=getStatus` | GET | `eventid`, `sectionid` | |
| `GET /get-shared-event-attendance` | `ext/events/event/sharing/?action=getAttendance` | GET | `eventid`, `sectionid` | |
| `GET /get-contact-details` | `ext/members/contact/?action=getIndividual` | GET | `sectionid`, `scoutid` | |
| `GET /get-list-of-members` | `ext/members/contact/?action=getListOfMembers` | GET | `sectionid`, `termid`, `section` | |
| `GET /get-flexi-records` | `ext/members/flexirecords/?action=getFlexiRecords` | GET | `sectionid`, `archived` (optional) | |
| `GET /get-flexi-structure` | `ext/members/flexirecords/?action=getStructure` | GET | `sectionid`, `flexirecordid` (`extraid`), `termid` | |
| `GET /get-single-flexi-record` | `ext/members/flexirecords/?action=getData` | GET | `sectionid`, `flexirecordid` (`extraid`), `termid` | Adds `nototal` param. |
| `GET /get-startup-data` | `ext/generic/startup/?action=getData` | GET | None | Returns JS code, needs parsing. |
| `POST /update-flexi-record` | `ext/members/flexirecords/?action=updateScout` | POST | `sectionid`, `scoutid`, `flexirecordid` (`extraid`), `column`, `value`, `termid` | Form-encoded. |
| `POST /multi-update-flexi-record` | `ext/members/flexirecords/?action=multiUpdate` | POST | `sectionid`, `scouts` (JSON array), `value`, `col`, `flexirecordid` (`extraid`) | Form-encoded. |

## Key Findings for Debugging

1.  **Events Endpoint**: The correct action for fetching events is `get`, not `getEvents`. The path is `ext/events/summary/`.
    -   Incorrect: `ext/events/summary/?action=getEvents`
    -   Correct: `ext/events/summary/?action=get`

2.  **Event Attendance Endpoint**: The path is `ext/events/event/` (singular), not `ext/events/summary/`.
    -   Incorrect: `ext/events/summary/?action=getAttendance`
    -   Correct: `ext/events/event/?action=getAttendance`

3.  **Flexi Records**:
    -   `flexirecordid` is mapped to `extraid` in the OSM API parameters.
    -   `update-flexi-record` uses `column` parameter.
    -   `multi-update-flexi-record` uses `col` parameter.
