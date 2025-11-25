import { cookies } from "next/headers";

const OSM_TOKEN_URL = `${process.env.OSM_API_BASE_URL}/oauth/token`;

export interface TokenRefreshResult {
    success: boolean;
    accessToken?: string;
    error?: string;
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(
    refreshToken: string
): Promise<TokenRefreshResult> {
    try {
        const response = await fetch(OSM_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: process.env.OSM_CLIENT_ID!,
                client_secret: process.env.OSM_CLIENT_SECRET!,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Token refresh failed:", errorText);
            return { success: false, error: "refresh_failed" };
        }

        const tokens = await response.json();

        // Update cookies with new tokens
        const cookieStore = await cookies();

        cookieStore.set("osm_access_token", tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: tokens.expires_in || 3600,
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

        return { success: true, accessToken: tokens.access_token };
    } catch (error) {
        console.error("Token refresh error:", error);
        return { success: false, error: "internal_error" };
    }
}

/**
 * Get the current access token from cookies
 */
export async function getAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("osm_access_token");
    return accessToken?.value || null;
}

/**
 * Get the current refresh token from cookies
 */
export async function getRefreshToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("osm_refresh_token");
    return refreshToken?.value || null;
}

/**
 * Clear all authentication tokens
 */
export async function clearTokens(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("osm_access_token");
    cookieStore.delete("osm_refresh_token");
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const accessToken = await getAccessToken();
    return !!accessToken;
}
