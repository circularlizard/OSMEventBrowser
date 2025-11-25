import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { parseOSMStartupData } from "@/lib/osm-parser";

const OSM_TOKEN_URL = `${process.env.OSM_API_BASE_URL}/oauth/token`;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Handle OAuth error
    if (error) {
        return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    // Validate code parameter
    if (!code) {
        return NextResponse.redirect(
            new URL("/?error=missing_code", request.url)
        );
    }

    try {
        // Exchange authorization code for tokens
        const tokenResponse = await fetch(OSM_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                client_id: process.env.OSM_CLIENT_ID!,
                client_secret: process.env.OSM_CLIENT_SECRET!,
                redirect_uri: process.env.OSM_REDIRECT_URI!,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("Token exchange failed:", errorText);
            return NextResponse.redirect(
                new URL("/?error=token_exchange_failed", request.url)
            );
        }

        const tokens = await tokenResponse.json();

        // Set tokens in HTTP-Only cookies
        const cookieStore = await cookies();

        cookieStore.set("osm_access_token", tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: tokens.expires_in || 3600, // Default 1 hour
            path: "/",
        });

        if (tokens.refresh_token) {
            cookieStore.set("osm_refresh_token", tokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: "/",
            });
        }

        // Fetch startup data from OSM
        try {
            const timestamp = Date.now();
            const startupUrl = `${process.env.OSM_API_BASE_URL}/ext/generic/startup/?action=getData&client_time=${timestamp}`;

            console.log("[OAuth Callback] Fetching startup data from:", startupUrl);

            const startupResponse = await fetch(startupUrl, {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            });

            console.log("[OAuth Callback] Startup response status:", startupResponse.status);

            if (startupResponse.ok) {
                const responseText = await startupResponse.text();
                console.log("[OAuth Callback] Response text length:", responseText.length);

                // Parse the JavaScript response (var data_holder = {...})
                const startupData = parseOSMStartupData(responseText);
                const dataSize = JSON.stringify(startupData).length;
                console.log("[OAuth Callback] Startup data parsed, size:", dataSize, "bytes");

                // Cookies have a 4KB limit, so we'll store a flag and keep data in memory
                // In production, you'd want to use Redis or a database
                if (dataSize < 3000) {
                    // Small enough for cookie
                    cookieStore.set("osm_startup_data", JSON.stringify(startupData), {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 60 * 60, // 1 hour
                        path: "/",
                    });
                    console.log("[OAuth Callback] Startup data stored in cookie");
                } else {
                    // Too large for cookie, store in global cache
                    const { setStartupDataCache } = await import("@/lib/startup-cache");
                    const userId = startupData.globals?.userid?.toString() || "unknown";
                    setStartupDataCache(userId, startupData);

                    // Store just the user ID in cookie
                    cookieStore.set("osm_user_id", userId, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 60 * 60, // 1 hour
                        path: "/",
                    });
                    console.log("[OAuth Callback] Startup data too large (", dataSize, "bytes), stored in cache for user:", userId);
                }
            } else {
                const errorText = await startupResponse.text();
                console.error("[OAuth Callback] Startup data fetch failed:", startupResponse.status, errorText);
            }
        } catch (error) {
            console.error("[OAuth Callback] Failed to fetch startup data:", error);
            // Don't fail the login if startup data fetch fails
        }

        // Redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
        console.error("OAuth callback error:", error);
        return NextResponse.redirect(
            new URL("/?error=internal_error", request.url)
        );
    }
}
