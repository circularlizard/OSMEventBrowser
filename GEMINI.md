# Gemini Context & Development Guidelines

This document provides context, architectural decisions, and coding standards for the **OSM Event Browser** project. It is intended to guide AI assistants and developers in maintaining consistency and adhering to project mandates.

## 1. Project Overview
**OSM Event Browser** is a secure, server-side web application interfacing with the Online Scout Manager (OSM) REST API. It allows users to browse events, view attendance, and export data securely.

## 2. Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (Radix UI based) + Lucide React icons
- **Runtime:** Node.js (v20+)
- **Package Manager:** npm

## 3. Architectural Patterns

### A. Security & Authentication (Critical)
- **OAuth 2.0:** Uses Authorization Code Flow.
- **Token Storage:** Access and Refresh tokens are stored **strictly** in HTTP-Only, Secure, SameSite=Lax cookies.
- **No Client-Side Tokens:** The client *never* sees the access token.
- **Proxy Pattern:** All communication with OSM happens via the internal API Proxy (`src/app/api/osm/[...path]/route.ts`). The client fetches from this proxy, which attaches the token server-side.

### B. Directory Structure
- `src/app`: Next.js App Router pages, layouts, and API routes.
- `src/app/api`: Backend logic (Auth, Proxy).
- `src/components/ui`: Reusable shadcn/ui components.
- `src/components`: Business-specific components.
- `src/lib`: Core utilities, API definitions, Auth helpers.
- `docs/`: Architectural documentation (Source of Truth).

### C. Data Fetching
- **Server Components:** Prefer fetching data in Server Components where possible.
- **Client Components:** Use `fetch` to call internal `/api/osm/...` endpoints.
- **Rate Limiting:** The Proxy layer handles OSM rate limits (429s) and token refreshing (401s) automatically.

## 4. Coding Conventions

### A. TypeScript
- Use `interface` for defining data structures (especially API responses).
- explicit return types for functions are preferred but not strictly enforced if inference is clear.
- Avoid `any`. Use `unknown` or specific types.

### B. Styling (Tailwind CSS v4)
- Use utility classes directly in JSX.
- Use `cn()` (from `lib/utils`) for conditional class merging.
- Follow the specific color theme (Blue) defined in `globals.css`.

### C. Naming
- **Files:** `kebab-case.tsx` or `kebab-case.ts`.
- **Components:** `PascalCase`.
- **Functions/Variables:** `camelCase`.

## 5. Development Workflow

### A. Local Server (HTTPS)
This project requires HTTPS for OAuth callbacks.
**Command:** `npm run dev:https`
**URL:** `https://localhost:3000`

### B. Certificates
Managed via `mkcert`. Located in `.cert/`.

## 6. Key Documentation References
Before implementing complex features, consult:
1. `docs/architecture.md` - Security & Data Flow mandates.
2. `docs/plan.md` - Current progress and roadmap.
3. `docs/api-mapping.md` - OSM API quirks and endpoints.
