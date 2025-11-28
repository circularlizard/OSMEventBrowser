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
    body?: any,
    customHeaders?: HeadersInit
): Promise<ExternalOsmApiResponse<T>> {
    let accessToken = await getAccessToken();

    if (!accessToken) {
        // Try to refresh immediately if no access token but we have a refresh token
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
    // Logic: Split by '?', check base path, reassemble
    // Exception: 'ext/members/patrols' fails with a trailing slash
    let apiPath = path;
    const [urlPath, query] = apiPath.split("?");
    
    if (urlPath.startsWith("ext/") && !urlPath.endsWith("/") && !urlPath.includes("members/patrols")) {
         apiPath = `${urlPath}/${query ? `?${query}` : ""}`;
    }

    const osmUrl = `${OSM_API_BASE_URL}/${apiPath}`;

    // Default headers
    const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...customHeaders,
    };

    let requestBody = body;
    
    // Handle JSON stringification if Content-Type is application/json
    // Check if Content-Type header is present and equals application/json
    const contentType = (headers as Record<string, string>)["Content-Type"];
    if (contentType === "application/json" && body && typeof body !== "string") {
        requestBody = JSON.stringify(body);
    }

    const debug = process.env.NODE_ENV === "development";

    if (debug) {
        console.log(`[OSM-DEBUG] Request: ${method} ${osmUrl}`);
        if (requestBody) console.log(`[OSM-DEBUG] Body:`, requestBody);
    }

    let response = await fetch(osmUrl, {
        method,
        headers,
        body: requestBody,
    });

    // 401 Retry Logic
    if (response.status === 401) {
        if (debug) console.log("[OSM-DEBUG] 401 Unauthorized, attempting token refresh...");
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            const refreshResult = await refreshAccessToken(refreshToken);
            if (refreshResult.success) {
                (headers as Record<string, string>).Authorization = `Bearer ${refreshResult.accessToken}`;
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
        const text = await response.text();
        if (debug) {
            console.log(`[OSM-DEBUG] Response: ${response.status} ${response.statusText}`);
            console.log(`[OSM-DEBUG] Response Body (First 500 chars):`, text.substring(0, 500));
        }
        data = text ? JSON.parse(text) : null;
    } catch (e) {
        console.error(`[OSM-DEBUG] JSON Parse Error:`, e);
        data = null;
    }

    return {
        data,
        status: response.status,
        headers: response.headers,
        error: !response.ok ? (data?.error || "External API Error") : undefined
    };
}
