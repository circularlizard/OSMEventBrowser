import { NextRequest, NextResponse } from "next/server";
import { callExternalOsmApi } from "@/lib/osm/server-api";

/**
 * Generic proxy handler for OSM API requests
 * Handles token attachment and automatic refresh on 401 (via callExternalOsmApi)
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
    // Reconstruct path from params
    // e.g. /api/osm/ext/events/summary -> path: ["ext", "events", "summary"]
    let apiPath = params.path.join("/");

    // Append query parameters
    const searchParams = request.nextUrl.searchParams.toString();
    if (searchParams) {
        apiPath += `?${searchParams}`;
    }

    let body: any;
    if (method !== "GET" && method !== "DELETE") {
        try {
            body = await request.json();
        } catch {
            // No body
        }
    }

    const response = await callExternalOsmApi(apiPath, method, body);

    // Monitor rate limit headers
    const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
    const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
    const rateLimitReset = response.headers.get("X-RateLimit-Reset");

    if (rateLimitLimit && rateLimitRemaining) {
        const remaining = parseInt(rateLimitRemaining);
        const limit = parseInt(rateLimitLimit);
        
        if (remaining < limit * 0.1) {
            console.warn(`[Rate Limit Warning] Only ${remaining} requests remaining!`);
        }
    }

    // Check for blocked status
    const blocked = response.headers.get("X-Blocked");
    if (blocked) {
        console.error(`[API Blocked] Application has been blocked: ${blocked}`);
        return NextResponse.json(
            { error: "Application has been blocked by OSM API" },
            { status: 403 }
        );
    }

    // Handle 429 Too Many Requests
    if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        return NextResponse.json(
            {
                error: "Rate limit exceeded",
                retryAfter: retryAfter ? parseInt(retryAfter) : null
            },
            { status: 429 }
        );
    }

    return NextResponse.json(response.data, { status: response.status });
}
