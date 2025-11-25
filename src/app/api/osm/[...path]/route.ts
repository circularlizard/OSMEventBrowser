import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, getRefreshToken, refreshAccessToken } from "@/lib/auth";

const OSM_API_BASE_URL = process.env.OSM_API_BASE_URL;

/**
 * Generic proxy handler for OSM API requests
 * Handles token attachment and automatic refresh on 401
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return handleOSMRequest(request, await params, "GET");
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return handleOSMRequest(request, await params, "POST");
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return handleOSMRequest(request, await params, "PUT");
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return handleOSMRequest(request, await params, "DELETE");
}

async function handleOSMRequest(
    request: NextRequest,
    params: { path: string[] },
    method: string
) {
    // Get access token
    let accessToken = await getAccessToken();

    if (!accessToken) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    // Construct OSM API URL - pass through the path as-is
    // Client calls /api/osm/v3/events/... which becomes https://osm.co.uk/v3/events/...
    // Client calls /api/osm/ext/generic/... which becomes https://osm.co.uk/ext/generic/...
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const osmUrl = `${OSM_API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ""
        }`;

    // Prepare request options
    const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
    };

    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
        try {
            const requestBody = await request.json();
            body = JSON.stringify(requestBody);
        } catch {
            // No body or invalid JSON
        }
    }

    // Make the request to OSM API
    let response = await fetch(osmUrl, {
        method,
        headers,
        body,
    });

    // If 401, try to refresh the token and retry
    if (response.status === 401) {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
            return NextResponse.json(
                { error: "Session expired, please login again" },
                { status: 401 }
            );
        }

        // Attempt token refresh
        const refreshResult = await refreshAccessToken(refreshToken);

        if (!refreshResult.success) {
            return NextResponse.json(
                { error: "Failed to refresh token, please login again" },
                { status: 401 }
            );
        }

        // Retry the request with new token
        headers.Authorization = `Bearer ${refreshResult.accessToken}`;
        response = await fetch(osmUrl, {
            method,
            headers,
            body,
        });
    }

    // Return the response from OSM API
    const data = await response.json();

    // Monitor rate limit headers
    const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
    const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
    const rateLimitReset = response.headers.get("X-RateLimit-Reset");

    if (rateLimitLimit && rateLimitRemaining) {
        console.log(
            `[Rate Limit] ${rateLimitRemaining}/${rateLimitLimit} remaining, resets in ${rateLimitReset}s`
        );

        // Warn if approaching limit
        const remaining = parseInt(rateLimitRemaining);
        const limit = parseInt(rateLimitLimit);
        if (remaining < limit * 0.1) {
            console.warn(
                `[Rate Limit Warning] Only ${remaining} requests remaining!`
            );
        }
    }

    // Check for deprecation warning
    const deprecated = response.headers.get("X-Deprecated");
    if (deprecated) {
        console.warn(
            `[API Deprecation Warning] This endpoint will be removed after: ${deprecated}`
        );
    }

    // Check for blocked status
    const blocked = response.headers.get("X-Blocked");
    if (blocked) {
        console.error(
            `[API Blocked] Application has been blocked: ${blocked}`
        );
        return NextResponse.json(
            { error: "Application has been blocked by OSM API" },
            { status: 403 }
        );
    }

    // Handle 429 Too Many Requests
    if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        console.error(
            `[Rate Limit Exceeded] Retry after ${retryAfter} seconds`
        );
        return NextResponse.json(
            {
                error: "Rate limit exceeded",
                retryAfter: retryAfter ? parseInt(retryAfter) : null
            },
            { status: 429 }
        );
    }

    return NextResponse.json(data, { status: response.status });
}
