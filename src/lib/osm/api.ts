/**
 * Client-side helper for making requests to the OSM API via our proxy
 * 
 * Usage:
 * - osmGet('v3/events') -> proxies to https://osm.co.uk/v3/events
 * - osmGet('ext/generic/startup', { action: 'getData' }) -> proxies to https://osm.co.uk/ext/generic/startup?action=getData
 */

export interface OSMApiResponse<T = any> {
    data?: T;
    error?: string;
    status: number;
}

/**
 * Make a GET request to the OSM API
 */
export async function osmGet<T = any>(
    path: string,
    params?: Record<string, string>
): Promise<OSMApiResponse<T>> {
    const searchParams = params ? `?${new URLSearchParams(params)}` : "";
    const response = await fetch(`/api/osm/${path}${searchParams}`);
    const data = await response.json();

    return {
        data: data,
        error: !response.ok ? data.error || "Request failed" : undefined,
        status: response.status,
    };
}

/**
 * Make a POST request to the OSM API
 */
export async function osmPost<T = any>(
    path: string,
    body?: any
): Promise<OSMApiResponse<T>> {
    const response = await fetch(`/api/osm/${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();

    return {
        data: response.ok ? data : undefined,
        error: !response.ok ? data.error || "Request failed" : undefined,
        status: response.status,
    };
}

/**
 * Make a PUT request to the OSM API
 */
export async function osmPut<T = any>(
    path: string,
    body?: any
): Promise<OSMApiResponse<T>> {
    const response = await fetch(`/api/osm/${path}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();

    return {
        data: response.ok ? data : undefined,
        error: !response.ok ? data.error || "Request failed" : undefined,
        status: response.status,
    };
}

/**
 * Make a DELETE request to the OSM API
 */
export async function osmDelete<T = any>(
    path: string
): Promise<OSMApiResponse<T>> {
    const response = await fetch(`/api/osm/${path}`, {
        method: "DELETE",
    });
    const data = await response.json();

    return {
        data: response.ok ? data : undefined,
        error: !response.ok ? data.error || "Request failed" : undefined,
        status: response.status,
    };
}
