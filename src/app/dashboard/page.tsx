"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { osmGet } from "@/lib/osm-api";

export default function DashboardPage() {
    const [apiPath, setApiPath] = useState("sections");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const testApi = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);

        const result = await osmGet(apiPath);

        if (result.error) {
            setError(result.error);
        } else {
            setResponse(result.data);
        }

        setLoading(false);
    };

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/";
    };

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">
                    OSM Event Browser - Dashboard
                </h1>
                <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                        <a href="/startup-data">Startup Data</a>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                        <a href="/debug">Debug</a>
                    </Button>
                    <Button onClick={handleLogout} variant="outline">
                        Logout
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-xl font-semibold">API Discovery Utility</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                    Test OSM API endpoints. The proxy will automatically handle
                    authentication and token refresh.
                </p>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            placeholder="Enter API path (e.g., sections, events)"
                            value={apiPath}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiPath(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && testApi()}
                        />
                    </div>
                    <Button onClick={testApi} disabled={loading || !apiPath}>
                        {loading ? "Loading..." : "Test API"}
                    </Button>
                </div>

                {error && (
                    <div className="mt-4 rounded-md border border-destructive bg-destructive/10 p-4">
                        <p className="text-sm text-destructive">
                            <strong>Error:</strong> {error}
                        </p>
                    </div>
                )}

                {response && (
                    <div className="mt-4">
                        <h3 className="mb-2 font-semibold">Response:</h3>
                        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            <div className="rounded-lg border p-6">
                <h2 className="mb-2 text-xl font-semibold">Common Endpoints</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                    Click to test common OSM API endpoints:
                </p>
                <div className="flex flex-wrap gap-2">
                    {["sections", "events", "members", "badges", "programme"].map(
                        (endpoint) => (
                            <Button
                                key={endpoint}
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setApiPath(endpoint);
                                    setTimeout(() => testApi(), 100);
                                }}
                            >
                                {endpoint}
                            </Button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
