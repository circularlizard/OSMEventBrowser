# Architecture

## Overview
This document outlines the core architectural decisions and implementation mandates for building a secure, server-side application to interface with the Online Scout Manager (OSM) REST API.

## **I. Architectural Decisions (The "What")**

The following technologies and protocols have been selected to ensure security, rapid development, and cost-effective hosting.

### **A. Development Framework**

* **Decision:** **Next.js** (React-based Full-Stack Framework)  
* **Rationale:** Next.js provides a unified environment for both the client-side UI (React) and the necessary server-side logic (API Routes/Serverless Functions) required for secure OAuth handling.

### **B. Hosting Platform**

* **Decision:** **Vercel** (Free Tier)  
* **Rationale:** Vercel offers seamless deployment for Next.js and robust, zero-configuration support for serverless functions, aligning with the project's non-functional requirement for cost-effective, scalable hosting.

### **C. Authentication Flow**

* **Decision:** **OAuth 2.0 Authorization Code Flow**  
* **Rationale:** This flow is mandated for secure user-based access, ensuring the application never directly handles user credentials and protecting the confidential client\_secret.

### **D. Token Storage Strategy**

* **Decision:** **Secure HTTP-Only Cookies**  
* **Rationale:** Access tokens and refresh tokens **MUST** be stored in cookies marked with HttpOnly to prevent client-side JavaScript access (mitigating XSS vulnerabilities). Tokens are read and used exclusively by server-side Next.js API Routes.

## **II. Security and Authentication Mandates (The "How")**

These are non-negotiable guidelines for handling sensitive credentials and the OAuth flow.

### **A. Environment Variable Management**

1. **OSM\_CLIENT\_SECRET MUST** be configured as a **Sensitive Environment Variable** within the Vercel dashboard. This prevents the secret from being exposed in any build logs or client bundles.  
2. **DO NOT** expose any sensitive environment variables (those without the NEXT\_PUBLIC\_ prefix) to the client-side code.  
3. The following variables **MUST** be defined in Vercel for the **Production** and **Preview** environments:  
   * OSM\_CLIENT\_ID  
   * OSM\_CLIENT\_SECRET  
   * OSM\_REDIRECT\_URI (The full Vercel deployment URL to the callback API route, e.g., https://your-app.vercel.app/api/oauth-callback).

### **B. OAuth Token Exchange (/api/oauth-callback)**

The API Route designated as the redirect URI **MUST** perform the following actions sequentially:

1. Receive the temporary code from the URL query parameters.  
2. Make a secure **server-to-server POST request** to the OSM access token endpoint (https://www.onlinescoutmanager.co.uk/oauth/token).  
3. The request payload **MUST** include the code, client\_id, and client\_secret (read from process.env).  
4. Upon successful response, extract the access\_token and refresh\_token.  
5. Set both tokens in separate, secure **HTTP-Only cookies** on the response. The Secure and SameSite=Lax attributes are mandatory.  
6. Finally, redirect the user's browser to the main application dashboard (e.g., /dashboard).

## **III. Data Flow and API Proxy Mandates**

All requests to the poorly documented OSM REST API **MUST** be proxied through a Next.js API Route layer to abstract complexity and enforce security.

### **A. API Proxy Implementation (/api/osm/\*)**

1. All client-side components **SHOULD** only communicate with internal API routes (e.g., /api/osm/events), never directly with the external OSM API domain.  
2. The proxy route **MUST** read the access\_token from the secure HTTP-Only cookie.
3. The proxy **MUST** handle OSM API quirks, specifically ensuring that endpoints under `ext/` have a trailing slash (e.g., `ext/events/summary/`), otherwise the upstream API returns 404 or 403 errors.

### **B. Token Refresh Logic**

1. The proxy layer **MUST** check the validity of the access\_token before making an external request.  
2. If the external request to OSM returns a "401 Unauthorized" due to an expired token, the proxy layer **MUST** immediately attempt to refresh the token using the stored refresh\_token.  
3. The refresh request **MUST** be a server-to-server POST request to the token endpoint with grant\_type=refresh\_token.  
4. Upon receiving a new access\_token and refresh\_token, the proxy layer **MUST** update the user's HTTP-Only cookies before retrying the original request.

## **IV. Frontend and Export Mandates**

### **A. Frontend Display**

1. The React frontend **MUST** feature a clean, responsive UI suitable for mobile and desktop viewing, utilizing **shadcn/ui** components (styled with **Tailwind CSS**) for consistency and rapid development. **Theme Preference:** Blue.  
2. A data discovery utility **SHOULD** be included during development to display the raw JSON response structure for new endpoints, assisting with the poorly documented API.

### **B. Server-Side Data Export**

All data export functionality **MUST** be handled by dedicated serverless API routes to avoid client-side performance issues.

| Export Format | Implementation Mandate |
| :---- | :---- |
| **PDF Report** | Use a Node.js library like pdfkit or puppeteer (for complex styling) to generate a PDF buffer on the server. The route must set the Content-Type: application/pdf header. |
| **Spreadsheet** | Use a lightweight Node.js library (or simple string construction) to generate CSV or XLSX data on the server. The route must set the appropriate Content-Disposition: attachment header to trigger a download. |
| **Data Source** | Export routes **MUST** use the API Proxy layer to fetch the necessary OSM data, ensuring the token refresh logic is applied before data retrieval. |

## **V. Code Organization & Best Practices**

To ensure maintainability and scalability, the codebase follows specific organizational patterns.

### **A. Domain-Driven Directory Structure**

Code related to specific domains (e.g., OSM integration) **MUST** be grouped together rather than scattered by file type.

1.  **Library Logic (`src/lib/osm/`)**:
    *   `api.ts`: Low-level client wrapper for the internal API proxy.
    *   `services.ts`: High-level business logic functions (e.g., `getEvents`) that type-cast responses and handle specific endpoint logic.
    *   `data-helpers.ts`: Pure functions for extracting and transforming data (e.g., `extractSections`) from raw API responses.
    *   `parser.ts`: Specialized parsers for non-standard API responses (e.g., OSM's JS variable assignment format).

2.  **Components (`src/components/osm/`)**:
    *   UI components specific to the OSM domain (e.g., `SectionSelector`, `TermSelector`) reside here, separate from generic UI components in `src/components/ui`.

### **B. API Interaction Patterns**

1.  **Service Layer Access**: Components **SHOULD NOT** call `osmGet` (from `api.ts`) directly. They should use strongly-typed functions from `services.ts`.
2.  **Debugging Tools**: A dedicated API Browser (`/debug/api-browser`) is maintained to facilitate exploring the undocumented API. This tool allows developers to test endpoints and inspect raw responses without modifying application code.