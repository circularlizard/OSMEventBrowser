import { Button } from "@/components/ui/button";

export default function DebugPage() {
    const clientId = process.env.OSM_CLIENT_ID;
    const redirectUri = process.env.OSM_REDIRECT_URI;
    const baseUrl = process.env.OSM_API_BASE_URL;
    const hasSecret = !!process.env.OSM_CLIENT_SECRET;

    const oauthUrl = `${baseUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri!
    )}&response_type=code&scope=section:member:read section:event:read section:programme:read`;

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 p-4">
            <h1 className="text-3xl font-bold">OAuth Debug Info</h1>

            <div className="w-full max-w-2xl space-y-4 rounded-lg border p-6">
                <div>
                    <h2 className="font-semibold">Environment Variables:</h2>
                    <ul className="mt-2 space-y-1 text-sm">
                        <li>
                            <strong>OSM_API_BASE_URL:</strong> {baseUrl || "❌ NOT SET"}
                        </li>
                        <li>
                            <strong>OSM_CLIENT_ID:</strong> {clientId || "❌ NOT SET"}
                        </li>
                        <li>
                            <strong>OSM_CLIENT_SECRET:</strong>{" "}
                            {hasSecret ? "✅ SET" : "❌ NOT SET"}
                        </li>
                        <li>
                            <strong>OSM_REDIRECT_URI:</strong> {redirectUri || "❌ NOT SET"}
                        </li>
                    </ul>
                </div>

                <div>
                    <h2 className="font-semibold">Generated OAuth URL:</h2>
                    <div className="mt-2 break-all rounded bg-muted p-3 text-xs">
                        {oauthUrl}
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="font-semibold">Checklist:</h2>
                    <ul className="space-y-1 text-sm">
                        <li>
                            ✓ Does the Client ID above match what you registered with OSM?
                        </li>
                        <li>
                            ✓ Does the Redirect URI <strong>exactly</strong> match what you
                            registered? (including http vs https, trailing slashes, etc.)
                        </li>
                        <li>✓ Is the Client Secret correct in your .env.local?</li>
                    </ul>
                </div>

                <div className="flex gap-2">
                    <Button asChild>
                        <a href="/">Back to Home</a>
                    </Button>
                    <Button asChild variant="outline">
                        <a href={oauthUrl} target="_blank">
                            Test OAuth URL
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
