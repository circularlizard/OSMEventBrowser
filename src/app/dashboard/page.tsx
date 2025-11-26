"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionSelector } from "@/components/section-selector";
import { TermSelector } from "@/components/term-selector";
import { osmGet } from "@/lib/osm-api";
import {
    extractSections,
    extractTermsForSection,
    getCurrentTerm,
    getDefaultSection,
    type OSMSection,
    type OSMTerm,
} from "@/lib/osm-data-helpers";

export default function DashboardPage() {
    const [startupData, setStartupData] = useState<any>(null);
    const [sections, setSections] = useState<OSMSection[]>([]);
    const [selectedSection, setSelectedSection] = useState<OSMSection | null>(null);
    const [terms, setTerms] = useState<OSMTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<OSMTerm | null>(null);

    const [apiPath, setApiPath] = useState("sections");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch startup data on mount
    useEffect(() => {
        async function fetchStartupData() {
            try {
                const response = await fetch("/api/debug-startup");
                const result = await response.json();

                console.log("[Dashboard] Startup data result:", result);

                if (result.data) {
                    setStartupData(result.data);

                    // Extract sections
                    const extractedSections = extractSections(result.data);
                    console.log("[Dashboard] Extracted sections:", extractedSections);
                    setSections(extractedSections);

                    // Set default section
                    const defaultSection = getDefaultSection(result.data);
                    console.log("[Dashboard] Default section:", defaultSection);
                    if (defaultSection) {
                        setSelectedSection(defaultSection);

                        // Extract terms for default section
                        const sectionTerms = extractTermsForSection(result.data, defaultSection.sectionId);
                        console.log("[Dashboard] Terms for section", defaultSection.sectionId, ":", sectionTerms);
                        setTerms(sectionTerms);

                        // Set current term
                        const currentTerm = getCurrentTerm(result.data, defaultSection.sectionId);
                        console.log("[Dashboard] Current term:", currentTerm);
                        setSelectedTerm(currentTerm);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch startup data:", error);
            }
        }

        fetchStartupData();
    }, []);

    const handleSectionChange = (sectionId: string) => {
        console.log("[Dashboard] Section changed to:", sectionId);
        const section = sections.find((s) => s.sectionId === sectionId);
        console.log("[Dashboard] Found section:", section);

        if (section && startupData) {
            setSelectedSection(section);

            // Update terms for new section
            const sectionTerms = extractTermsForSection(startupData, sectionId);
            console.log("[Dashboard] Terms for new section:", sectionTerms);
            setTerms(sectionTerms);

            // Set current term for new section
            const currentTerm = getCurrentTerm(startupData, sectionId);
            console.log("[Dashboard] Current term for new section:", currentTerm);
            setSelectedTerm(currentTerm);
        }
    };

    const handleTermChange = (termId: string) => {
        const term = terms.find((t) => t.termId === termId);
        if (term) {
            setSelectedTerm(term);
        }
    };

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

            {/* Section and Term Selectors */}
            <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-xl font-semibold">Section & Term Selection</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium">Section</label>
                        <SectionSelector
                            sections={sections}
                            selectedSectionId={selectedSection?.sectionId || null}
                            onSectionChange={handleSectionChange}
                        />
                        {selectedSection && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                Type: {selectedSection.sectionType}
                                {selectedSection.isDefault && " (Default)"}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">Term</label>
                        <TermSelector
                            terms={terms}
                            selectedTermId={selectedTerm?.termId || null}
                            onTermChange={handleTermChange}
                        />
                        {selectedTerm && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                {selectedTerm.startDate} to {selectedTerm.endDate}
                            </div>
                        )}
                    </div>
                </div>

                {selectedSection && selectedTerm && (
                    <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                        <strong>Selected:</strong> {selectedSection.sectionName} - {selectedTerm.name}
                        <div className="mt-1 text-xs text-muted-foreground">
                            Section ID: {selectedSection.sectionId} | Term ID: {selectedTerm.termId}
                        </div>
                    </div>
                )}
            </div>

            {/* API Discovery Utility */}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setApiPath(e.target.value)
                            }
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                                e.key === "Enter" && testApi()
                            }
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
