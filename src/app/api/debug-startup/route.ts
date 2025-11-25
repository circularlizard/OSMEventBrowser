import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";

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

        const data = await response.json();

        return NextResponse.json({
            status: response.status,
            url: startupUrl,
            dataSize: JSON.stringify(data).length,
            data,
        });
    } catch (error: any) {
        console.error("[Debug Startup] Error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
