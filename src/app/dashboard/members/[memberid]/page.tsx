"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMembersEventsSummary, type AggregatedMember } from "@/lib/osm/services";
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

export default function MemberDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const memberid = params.memberid as string;

    const [member, setMember] = useState<AggregatedMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!memberid) return;
            setLoading(true);
            setError(null);

            try {
                let sectionId = searchParams.get("sectionId");
                let termId = searchParams.get("termId");

                // Fallback to defaults if missing
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

                if (!sectionId || !termId) {
                    throw new Error("Could not determine context.");
                }

                const summary = await getMembersEventsSummary(sectionId, termId);
                const foundMember = summary.members.find(m => String(m.member_id) === memberid);

                if (foundMember) {
                    setMember(foundMember);
                } else {
                    setError("Member not found.");
                }

            } catch (err: any) {
                console.error("Failed to load member:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [memberid, searchParams]);

    if (loading) return <div className="p-8 text-center">Loading member details...</div>;
    if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
    if (!member) return <div className="p-8 text-center">Member not found.</div>;

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background px-6 py-4 shadow-sm">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <h1 className="text-xl font-bold">{member.first_name} {member.last_name}</h1>
            </header>

            <main className="flex-1 p-8 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Member Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="font-semibold">Age:</span> {member.age}</div>
                        <div><span className="font-semibold">Patrol:</span> {member.patrol}</div>
                        <div><span className="font-semibold">Status:</span> {member.active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Event Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {member.attendance.map((record) => (
                                    <TableRow key={record.eventId}>
                                        <TableCell>{record.eventDate}</TableCell>
                                        <TableCell>{record.eventName}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                record.attending === "Yes" ? "default" :
                                                record.attending === "No" ? "destructive" : "secondary"
                                            }>{record.attending}</Badge>
                                        </TableCell>
                                        <TableCell>{record.payment}</TableCell>
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
