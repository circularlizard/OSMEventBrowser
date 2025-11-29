import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";
import { parseOSMStartupData } from "@/lib/osm/parser";
import { callExternalOsmApi } from "@/lib/osm/server-api";
import { mockStartupData } from "@/lib/osm/mock-data";

export async function GET(request: NextRequest) {
    // MOCK MODE: Bypass auth and return mock data
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        console.log("[Debug Startup] Serving MOCK data.");
        return NextResponse.json({
            status: 200,
            url: "MOCK_MODE",
            data: mockStartupData,
        });
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const timestamp = Date.now();
        const apiPath = `ext/generic/startup/?action=getData&client_time=${timestamp}`;

        console.log("[Debug Startup] Calling OSM API via callExternalOsmApi:", apiPath);

        const response = await callExternalOsmApi(apiPath, "GET");

        if (response.error || response.status >= 400 || !response.data) { // Check status for errors
            console.error("[Debug Startup] callExternalOsmApi error:", response.error);
            return NextResponse.json(
                { error: response.error || "Failed to fetch startup data from OSM", details: response.data }, // include details
                { status: response.status || 500 }
            );
        }

        const responseText: string = response.data; // Now callExternalOsmApi returns raw text for text/javascript
        console.log("[Debug Startup] Response text length:", responseText.length);
        console.log("[Debug Startup] First 200 chars:", responseText.substring(0, 200));

        // Parse the JavaScript response
        const data = parseOSMStartupData(responseText);

        return NextResponse.json({
            status: response.status,
            url: apiPath, // Use apiPath for clarity
            responseTextLength: responseText.length,
            dataSize: JSON.stringify(data).length,
            data,
        });
    } catch (error: any) {
        console.error("[Debug Startup] Error:", error);
        return NextResponse.json(
            { error: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
