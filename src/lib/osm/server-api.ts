import { getAccessToken, getRefreshToken, refreshAccessToken } from "@/lib/auth";

const OSM_API_BASE_URL = process.env.OSM_API_BASE_URL;

export interface ExternalOsmApiResponse<T = any> {
    data?: T;
    error?: string;
    status: number;
    headers: Headers;
}

/**
 * Server-side helper to call the external OSM API directly.
 * Handles token retrieval, refresh on 401, and basic header management.
 */
export async function callExternalOsmApi<T = any>(
    path: string,
    method: string = "GET",
    body?: any
): Promise<ExternalOsmApiResponse<T>> {
    let accessToken = await getAccessToken();

    if (!accessToken) {
        // Try to refresh immediately if no access token but we have a refresh token?
        // Or just fail. Typically auth middleware handles this, but here we return 401.
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
             const refresh = await refreshAccessToken(refreshToken);
             if (refresh.success && refresh.accessToken) {
                 accessToken = refresh.accessToken;
             } else {
                 return { status: 401, error: "Not authenticated", headers: new Headers() };
             }
        } else {
            return { status: 401, error: "Not authenticated", headers: new Headers() };
        }
    }

    // Ensure trailing slash for 'ext/' routes if missing
    let apiPath = path;
    if (apiPath.startsWith("ext/") && !apiPath.endsWith("/") && !apiPath.includes("?")) {
        // Only add if no query params. If query params exist, we need to be careful.
        // But typically path passed here might not have params embedded if we want to support clean composition.
        // The proxy passed params in the URL string.
        // Let's assume 'path' is the full relative URL including query params.
        const [urlPath, query] = apiPath.split("?");
        if (urlPath.startsWith("ext/") && !urlPath.endsWith("/")) {
             apiPath = `${urlPath}/${query ? `?${query}` : ""}`;
        }
    }

    const osmUrl = `${OSM_API_BASE_URL}/${apiPath}`;

    const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
    };

    const requestBody = body ? JSON.stringify(body) : undefined;

    console.log(`[ServerAPI] ${method} ${osmUrl}`);

    let response = await fetch(osmUrl, {
        method,
        headers,
        body: requestBody,
    });

    // 401 Retry Logic
    if (response.status === 401) {
        console.log("[ServerAPI] 401 received, attempting refresh...");
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            const refreshResult = await refreshAccessToken(refreshToken);
            if (refreshResult.success) {
                headers.Authorization = `Bearer ${refreshResult.accessToken}`;
                response = await fetch(osmUrl, {
                    method,
                    headers,
                    body: requestBody,
                });
            }
        }
    }

    let data;
    try {
        data = await response.json();
    } catch (e) {
        // Handle empty or non-JSON responses
        data = null;
    }

    return {
        data,
        status: response.status,
        headers: response.headers,
        error: !response.ok ? (data?.error || "External API Error") : undefined
    };
}
