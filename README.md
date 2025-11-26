# OSM Event Browser

A secure, Next.js-based application to browse and export event data from [Online Scout Manager (OSM)](https://www.onlinescoutmanager.co.uk/).

## Features

- **Secure Authentication**: Implements OAuth 2.0 Authorization Code Flow with OSM. Access and refresh tokens are stored securely in HTTP-Only cookies.
- **API Proxy**: A dedicated server-side proxy handles all communication with the OSM API, managing token refreshing and rate limiting automatically.
- **Event Browsing**: View events for your sections across different terms.
- **Data Insights**: View attendance and member participation for events.
- **Developer Tools**: Includes an API Browser for inspecting raw OSM API responses.

## Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- An OAuth 2.0 Client ID and Secret from Online Scout Manager.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd OSMEventBrowser
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Copy the example environment file:
    ```bash
    cp .env.example .env.local
    ```
    Edit `.env.local` and add your OSM credentials:
    ```env
    OSM_CLIENT_ID=your_client_id
    OSM_CLIENT_SECRET=your_client_secret
    OSM_REDIRECT_URI=https://localhost:3000/api/oauth-callback
    SESSION_SECRET=your_random_secret_string
    ```
    *Note: The redirect URI must match what is configured in your OSM developer settings. The SESSION_SECRET is used to encrypt cookies.*

### Running Locally (HTTPS)

OSM's OAuth requires a secure callback URL. This project includes a custom server setup for local HTTPS.

1.  **Generate Certificates:**
    Follow the instructions in [HTTPS_SETUP.md](./HTTPS_SETUP.md) to generate local certificates using `mkcert`.
    Ensure `.cert/cert.pem` and `.cert/key.pem` exist.

2.  **Start the Development Server:**
    ```bash
    npm run dev:https
    ```
    The server will start at `https://localhost:3000`.

### Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/app/api`: API Routes (Auth callback, OSM Proxy).
- `src/components`: Reusable React components.
- `src/lib`: Core logic (API definitions, Auth helpers, OSM client).
- `docs`: Detailed architectural documentation and plans.

## Documentation

For more detailed information, check the `docs/` directory:
- [Architecture](./docs/architecture.md): Security model and architectural decisions.
- [Plan](./docs/plan.md): Implementation roadmap and status.
- [API Mapping](./docs/api-mapping.md): Notes on OSM API endpoints.