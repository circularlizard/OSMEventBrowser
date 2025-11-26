"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OSM_ENDPOINTS, ApiEndpoint } from "@/lib/api-definitions";
import { Trash2, Plus } from "lucide-react";

interface ParamRow {
    key: string;
    value: string;
    enabled: boolean;
}

export default function ApiBrowserPage() {
    const [selectedEndpointIndex, setSelectedEndpointIndex] = useState<string>("");

    // Request State
    const [method, setMethod] = useState<"GET" | "POST">("GET");
    const [path, setPath] = useState<string>("");
    const [params, setParams] = useState<ParamRow[]>([]);

    // Response State
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [requestUrl, setRequestUrl] = useState<string>("");

    const handleEndpointChange = (index: string) => {
        setSelectedEndpointIndex(index);
        const endpoint = OSM_ENDPOINTS[parseInt(index)];

        if (endpoint) {
            setMethod(endpoint.method);
            setPath(endpoint.path);

            // Build params list
            const newParams: ParamRow[] = [];

            // Add default params
            if (endpoint.defaultParams) {
                Object.entries(endpoint.defaultParams).forEach(([key, value]) => {
                    newParams.push({ key, value, enabled: true });
                });
            }

            // Add required params (empty)
            endpoint.params.forEach(p => {
                // Avoid duplicates if already in defaultParams
                if (!newParams.find(row => row.key === p)) {
                    newParams.push({ key: p, value: "", enabled: true });
                }
            });

            setParams(newParams);
            setResponse(null);
            setRequestUrl("");
        }
    };

    const addParam = () => {
        setParams([...params, { key: "", value: "", enabled: true }]);
    };

    const removeParam = (index: number) => {
        const newParams = [...params];
        newParams.splice(index, 1);
        setParams(newParams);
    };

    const updateParam = (index: number, field: "key" | "value", newValue: string) => {
        const newParams = [...params];
        newParams[index][field] = newValue;
        setParams(newParams);
    };

    const executeRequest = async () => {
        setLoading(true);
        setResponse(null);

        try {
            // Construct URL
            const queryParams = new URLSearchParams();
            params.forEach(p => {
                if (p.enabled && p.key) {
                    queryParams.append(p.key, p.value);
                }
            });

            // Ensure path doesn't start with / if user typed it
            const cleanPath = path.startsWith("/") ? path.substring(1) : path;
            const url = `/api/osm/${cleanPath}?${queryParams.toString()}`;
            setRequestUrl(url);

            const res = await fetch(url, {
                method: method,
            });

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                data = await res.text();
            }

            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                data: data,
            });
        } catch (error: any) {
            setResponse({
                error: error.message || "Unknown error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">OSM API Browser</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Configuration</CardTitle>
                            <CardDescription>Load a template or build custom request</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            {/* Template Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Load Template</label>
                                <Select value={selectedEndpointIndex} onValueChange={handleEndpointChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an endpoint..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {OSM_ENDPOINTS.map((endpoint, index) => (
                                            <SelectItem key={index} value={index.toString()}>
                                                {endpoint.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-t my-4"></div>

                            {/* Method & Path */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="col-span-1">
                                    <label className="text-sm font-medium">Method</label>
                                    <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GET">GET</SelectItem>
                                            <SelectItem value="POST">POST</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-3">
                                    <label className="text-sm font-medium">Path</label>
                                    <Input
                                        value={path}
                                        onChange={(e) => setPath(e.target.value)}
                                        placeholder="ext/events/summary/"
                                    />
                                </div>
                            </div>

                            {/* Parameters */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Parameters</label>
                                    <Button variant="outline" size="sm" onClick={addParam}>
                                        <Plus className="h-3 w-3 mr-1" /> Add
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {params.map((param, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <Input
                                                className="h-8 text-xs"
                                                placeholder="Key"
                                                value={param.key}
                                                onChange={(e) => updateParam(index, "key", e.target.value)}
                                            />
                                            <Input
                                                className="h-8 text-xs"
                                                placeholder="Value"
                                                value={param.value}
                                                onChange={(e) => updateParam(index, "value", e.target.value)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => removeParam(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {params.length === 0 && (
                                        <div className="text-xs text-muted-foreground text-center py-2">
                                            No parameters
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full mt-4"
                                onClick={executeRequest}
                                disabled={loading || !path}
                            >
                                {loading ? "Sending..." : "Send Request"}
                            </Button>

                        </CardContent>
                    </Card>
                </div>

                {/* Results Column */}
                <div className="lg:col-span-2 space-y-6">
                    {requestUrl && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle>Request Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Local Proxy URL</div>
                                    <code className="bg-muted p-2 rounded block break-all text-sm font-mono">
                                        {method} {requestUrl}
                                    </code>
                                </div>
                                {response?.headers?.["x-debug-target-url"] && (
                                    <div>
                                        <div className="text-xs font-medium text-blue-600 mb-1">Target OSM URL (Upstream)</div>
                                        <code className="bg-blue-50 p-2 rounded block break-all text-sm font-mono border border-blue-100 text-blue-900">
                                            {response.headers["x-debug-target-url"]}
                                        </code>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {response && (
                        <Card className="h-full">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle>Response</CardTitle>
                                    <div className={`px-2 py-1 rounded text-sm font-bold ${response.status >= 200 && response.status < 300
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}>
                                        {response.status} {response.statusText}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {response.error ? (
                                    <div className="text-red-500 p-4 bg-red-50 rounded border border-red-100">
                                        {response.error}
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Headers</h3>
                                            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-32 font-mono">
                                                {JSON.stringify(response.headers, null, 2)}
                                            </pre>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Body</h3>
                                            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[600px] font-mono">
                                                {typeof response.data === 'string'
                                                    ? response.data
                                                    : JSON.stringify(response.data, null, 2)}
                                            </pre>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
