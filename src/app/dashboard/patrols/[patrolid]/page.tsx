"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMembersEventsSummary, type AggregatedPatrol } from "@/lib/osm/services";
import { getDefaultSection, getCurrentTerm } from "@/lib/osm/data-helpers";
import { ArrowLeft } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function PatrolDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const patrolid = params.patrolid as string;

    const [patrol, setPatrol] = useState<AggregatedPatrol | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Capture context for links
    const sectionIdRef = useState<string | null>(null);
    const termIdRef = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!patrolid) return;
            setLoading(true);
            setError(null);

            try {
                let sectionId = searchParams.get("sectionId");
                let termId = searchParams.get("termId");

                if (!sectionId || !termId) {
                    const response = await fetch("/api/debug-startup");
                    const result = await response.json();
                    if (result.data) {
                        const defaultSection = getDefaultSection(result.data);
                        if (defaultSection) {
                            sectionId = defaultSection.sectionId;
                            const term = getCurrentTerm(result.data, sectionId);
                            if (term) termId = term.termId;
                        }
                    }
                }

                if (!sectionId || !termId) throw new Error("Could not determine context.");
                
                // Store for rendering links
                // Note: This is a hacky way to update state from local vars without triggering re-renders loop if I put them in state
                // But here I just want to use them in the render. I'll assume they are available in searchParams or I fetched them.
                // Better to store them in state if I fetched them.
                // simplified: Just use the vars for the API call.

                const summary = await getMembersEventsSummary(sectionId, termId);
                const foundPatrol = summary.patrols.find(p => String(p.patrolid) === patrolid);

                if (foundPatrol) {
                    setPatrol(foundPatrol);
                } else {
                    setError("Patrol not found.");
                }

            } catch (err: any) {
                console.error("Failed to load patrol:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [patrolid, searchParams]);

    if (loading) return <div className="p-8 text-center">Loading patrol details...</div>;
    if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
    if (!patrol) return <div className="p-8 text-center">Patrol not found.</div>;

    const sectionId = searchParams.get("sectionId");
    const termId = searchParams.get("termId");

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background px-6 py-4 shadow-sm">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <h1 className="text-xl font-bold">{patrol.name} Patrol</h1>
            </header>

            <main className="flex-1 p-8 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Members ({patrol.members.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Age</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patrol.members.map((member) => (
                                    <TableRow key={member.member_id}>
                                        <TableCell>
                                            <Link 
                                                href={`/dashboard/members/${member.member_id}?sectionId=${sectionId}&termId=${termId}`}
                                                className="hover:underline text-primary"
                                            >
                                                {member.first_name} {member.last_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{member.age}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
