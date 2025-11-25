import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";
import { parseOSMStartupData } from "@/lib/osm-parser";

export async function GET(request: NextRequest) {
    const accessToken = await getAccessToken();

    if (!accessToken) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const timestamp = Date.now();
        const startupUrl = `${process.env.OSM_API_BASE_URL}/ext/generic/startup/?action=getData&client_time=${timestamp}`;

        console.log("[Debug Startup] Fetching from:", startupUrl);

        const response = await fetch(startupUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        console.log("[Debug Startup] Response status:", response.status);

        const responseText = await response.text();
        console.log("[Debug Startup] Response text length:", responseText.length);
        console.log("[Debug Startup] First 200 chars:", responseText.substring(0, 200));

        // Parse the JavaScript response
        const data = parseOSMStartupData(responseText);

        return NextResponse.json({
            status: response.status,
            url: startupUrl,
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
