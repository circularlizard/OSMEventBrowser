"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { osmGet } from "@/lib/osm/api";
import { getPatrols } from "@/lib/osm/patrols";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatrolsDebugPage() {
    const [patrols, setPatrols] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sectionId, setSectionId] = useState<string>(""); 

    useEffect(() => {
        // Try to get a section ID from local storage or hardcode one if known from previous logs (37458)
        const stored = localStorage.getItem('selectedSectionId');
        if (stored) setSectionId(stored);
        else setSectionId("37458"); // Default to one we saw in logs
    }, []);

    const fetchPatrols = async () => {
        if (!sectionId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getPatrols(sectionId);
            setPatrols(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Patrols Debug</h1>
            <div className="flex gap-4 mb-4">
                <Button onClick={fetchPatrols} disabled={loading}>
                    {loading ? "Loading..." : `Fetch Patrols for Section ${sectionId}`}
                </Button>
            </div>
            
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="grid gap-4">
                {patrols.map((p) => (
                    <Card key={p.patrolid}>
                        <CardHeader>
                            <CardTitle>{p.name} ({p.patrolid})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            Active: {p.active ? "Yes" : "No"}
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="mt-4">
                <h2 className="text-xl font-bold">Raw Data</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                    {JSON.stringify(patrols, null, 2)}
                </pre>
            </div>
        </div>
    );
}
