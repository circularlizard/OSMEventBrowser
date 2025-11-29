"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { OSMSection, extractSections } from "@/lib/osm/data-helpers";
import { useOsmStore } from "@/lib/store";
import { Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export function SectionPicker() {
    const router = useRouter();
    const { setSelectedSectionIds } = useOsmStore();
    
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState<OSMSection[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadSections() {
            try {
                // We fetch startup data to get the list of sections.
                // In Mock Mode, this returns the mock fixtures.
                const response = await fetch("/api/debug-startup");
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error("Not authenticated. Please log in.");
                    }
                    const data = await response.json();
                    throw new Error(data.error || "Failed to load sections.");
                }
                
                const result = await response.json();
                if (!result.data) throw new Error("No data returned from startup.");

                const extracted = extractSections(result.data);
                setSections(extracted);
                
                // Pre-select the first one if available
                if (extracted.length > 0 && selected.length === 0) {
                    // Optional: Pre-select default? 
                    // const defaultSec = extracted.find(s => s.isDefault);
                    // if (defaultSec) setSelected([defaultSec.sectionId]);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadSections();
    }, []);

    const toggleSection = (sectionId: string) => {
        setSelected(prev => {
            if (prev.includes(sectionId)) {
                return prev.filter(id => id !== sectionId);
            } else {
                if (prev.length >= 3) return prev; // Max 3
                return [...prev, sectionId];
            }
        });
    };

    const handleContinue = () => {
        if (selected.length === 0) return;
        
        // Save to Store
        setSelectedSectionIds(selected);
        
        // Temporary: Redirect to Diagnostics as per plan Phase 9.0
        router.push("/debug/diagnostics");
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading sections...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Unable to load sections</h3>
                <p className="text-muted-foreground max-w-md">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 md:p-8">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Select Sections</CardTitle>
                    <CardDescription>
                        Choose the sections you want to browse (Max 3).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {sections.map((section) => {
                            const isSelected = selected.includes(section.sectionId);
                            return (
                                <div
                                    key={section.sectionId}
                                    className={`relative flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-all hover:bg-accent ${
                                        isSelected ? "border-primary bg-primary/5" : "border-muted"
                                    }`}
                                    onClick={() => toggleSection(section.sectionId)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold leading-none tracking-tight">
                                                {section.sectionName}
                                            </h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {section.groupName}
                                            </p>
                                        </div>
                                        <Checkbox 
                                            checked={isSelected} 
                                            onCheckedChange={() => toggleSection(section.sectionId)}
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="secondary" className="text-xs capitalize">
                                            {section.sectionType}
                                        </Badge>
                                        {section.isDefault && (
                                            <Badge variant="outline" className="text-xs">Default</Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between border-t pt-6">
                        <div className="text-sm text-muted-foreground">
                            {selected.length} of 3 selected
                        </div>
                        <Button 
                            onClick={handleContinue} 
                            disabled={selected.length === 0}
                            className="w-full sm:w-auto"
                        >
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
