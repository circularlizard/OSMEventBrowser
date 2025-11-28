"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEventAttendance, getEventDetails, type OSMEvent, type OSMAttendance } from "@/lib/osm/services";
import { getDefaultSection, getCurrentTerm } from "@/lib/osm/data-helpers";
import { ArrowLeft, ArrowUpDown, User, Check, X } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type SortOption = "name_asc" | "name_desc" | "age_asc" | "age_desc" | "patrol_asc" | "patrol_desc" | "status_asc" | "status_desc" | "payment_asc" | "payment_desc";

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventid = params.eventid as string;

    const [event, setEvent] = useState<OSMEvent | null>(null);
    const [attendance, setAttendance] = useState<OSMAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sorting & Filtering State
    const [sortBy, setSortBy] = useState<SortOption>("name_asc");
    const [filterName, setFilterName] = useState("");
    const [filterAttending, setFilterAttending] = useState<string>("all");

    useEffect(() => {
        async function fetchEventAndAttendance() {
            if (!eventid) {
                setError("Event ID is missing.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                let sectionId = searchParams.get("sectionId");
                let termId = searchParams.get("termId");

                // If query params are missing (deep link), try to get defaults from startup data
                if (!sectionId || !termId) {
                    console.log("[EventDetail] Missing params, fetching defaults...");
                    const response = await fetch("/api/debug-startup");
                    const result = await response.json();
                    
                    if (result.data) {
                        const defaultSection = getDefaultSection(result.data);
                        if (defaultSection) {
                            sectionId = defaultSection.sectionId;
                            // Try to get term for this section
                            const term = getCurrentTerm(result.data, sectionId);
                            if (term) {
                                termId = term.termId;
                            }
                        }
                    }
                }

                if (!sectionId || !termId) {
                    setError("Could not determine Section or Term ID. Please launch from Dashboard.");
                    setLoading(false);
                    return;
                }
                
                // Fetch attendance for the specific event
                const attendanceData = await getEventAttendance(sectionId, termId, eventid);
                setAttendance(attendanceData);

                // Fetch event details
                const eventData = await getEventDetails(sectionId, termId, eventid);
                setEvent(eventData);

            } catch (err: any) {
                console.error("Failed to fetch event details or attendance:", err);
                setError(err.message || "Failed to load event details.");
            } finally {
                setLoading(false);
            }
        }

        fetchEventAndAttendance();
    }, [eventid, searchParams]);

    // Helper to calculate age string
    const calculateAge = (dob: string) => {
        if (!dob) return "N/A";
        const birthDate = new Date(dob);
        const today = new Date();
        let ageYears = today.getFullYear() - birthDate.getFullYear();
        let ageMonths = today.getMonth() - birthDate.getMonth();
        
        if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
            ageYears--;
            ageMonths += 12;
        }
        
        // Adjust months if day hasn't happened yet in current month
        if (today.getDate() < birthDate.getDate()) {
            ageMonths--;
            if (ageMonths < 0) {
                ageMonths += 12;
            }
        }

        if (ageYears >= 18) return "18+";
        return `${ageYears}y ${ageMonths}m`;
    };

    // Process attendance data
    const processedAttendance = useMemo(() => {
        let filtered = [...attendance];

        // Filter by Name
        if (filterName) {
            const lowerName = filterName.toLowerCase();
            filtered = filtered.filter(p => 
                (p.firstname + " " + p.lastname).toLowerCase().includes(lowerName)
            );
        }

        // Filter by Attendance Status
        if (filterAttending !== "all") {
            filtered = filtered.filter(p => p.attending === filterAttending);
        }

        // Sort
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case "name_asc":
                    return a.lastname.localeCompare(b.lastname) || a.firstname.localeCompare(b.firstname);
                case "name_desc":
                    return b.lastname.localeCompare(a.lastname) || b.firstname.localeCompare(a.firstname);
                case "age_asc":
                    return new Date(b.dob).getTime() - new Date(a.dob).getTime(); // Younger first (later DOB)
                case "age_desc":
                    return new Date(a.dob).getTime() - new Date(b.dob).getTime(); // Older first (earlier DOB)
                case "patrol_asc":
                    return String(a.patrolid || "").localeCompare(String(b.patrolid || ""));
                case "patrol_desc":
                    return String(b.patrolid || "").localeCompare(String(a.patrolid || ""));
                case "status_asc":
                    return (a.attending || "").localeCompare(b.attending || "");
                case "status_desc":
                    return (b.attending || "").localeCompare(a.attending || "");
                case "payment_asc":
                    return (a.payment || "").localeCompare(b.payment || "");
                case "payment_desc":
                    return (b.payment || "").localeCompare(a.payment || "");
                default:
                    return 0;
            }
        });
    }, [attendance, sortBy, filterName, filterAttending]);

    const toggleSort = (column: "name" | "age" | "patrol" | "status" | "payment") => {
        if (column === "name") {
            setSortBy(sortBy === "name_asc" ? "name_desc" : "name_asc");
        } else if (column === "age") {
            setSortBy(sortBy === "age_asc" ? "age_desc" : "age_asc");
        } else if (column === "patrol") {
            setSortBy(sortBy === "patrol_asc" ? "patrol_desc" : "patrol_asc");
        } else if (column === "status") {
            setSortBy(sortBy === "status_asc" ? "status_desc" : "status_asc");
        } else if (column === "payment") {
            setSortBy(sortBy === "payment_asc" ? "payment_desc" : "payment_asc");
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading event details...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center min-h-screen text-destructive">{error}</div>;
    }

    if (!event) {
        return <div className="flex justify-center items-center min-h-screen text-muted-foreground">Event not found.</div>;
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-primary/50 bg-gradient-to-r from-primary to-primary/80 px-6 py-4 shadow-lg">
                <div className="flex min-h-[40px] items-center gap-3 text-primary-foreground">
                    <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold leading-none truncate max-w-[60vw]">
                        {event.name}
                    </h1>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle>Event Details</CardTitle>
                            {/* Summary Stats Badge Group */}
                            <div className="flex gap-2 text-sm">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex gap-1 items-center">
                                    <User className="h-3 w-3" /> Invited: {event.invited}
                                </Badge>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
                                    <Check className="h-3 w-3" /> Yes: {event.yes}
                                </Badge>
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex gap-1 items-center">
                                    <X className="h-3 w-3" /> No: {event.no}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="grid grid-cols-[100px_1fr] gap-1">
                            <span className="font-semibold text-muted-foreground">Date:</span>
                            <span>{event.startdate}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-1">
                            <span className="font-semibold text-muted-foreground">Time:</span>
                            <span>{event.starttime} - {event.endtime}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-1">
                            <span className="font-semibold text-muted-foreground">Location:</span>
                            <span>{event.location || "TBD"}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-1">
                            <span className="font-semibold text-muted-foreground">Cost:</span>
                            <span>{event.cost}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-1">
                            <span className="font-semibold text-muted-foreground">ID:</span>
                            <span className="font-mono">{event.eventid}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-1">
                            <span className="font-semibold text-muted-foreground">Section ID:</span>
                            <span className="font-mono">{event.sectionid}</span>
                        </div>
                        {event.notes && (
                            <div className="col-span-full mt-2 pt-2 border-t">
                                <span className="font-semibold text-muted-foreground block mb-1">Notes:</span>
                                <p className="whitespace-pre-wrap">{event.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-semibold">Attendance ({processedAttendance.length})</h2>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Input 
                                placeholder="Filter by name..." 
                                className="w-[200px]" 
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                            />
                            <Select value={filterAttending} onValueChange={setFilterAttending}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                    <SelectItem value="Invited">Invited</SelectItem>
                                    <SelectItem value="Reserved">Reserved</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Sort by..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                                    <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                                    <SelectItem value="age_asc">Age (Youngest)</SelectItem>
                                    <SelectItem value="age_desc">Age (Oldest)</SelectItem>
                                    <SelectItem value="patrol_asc">Patrol (A-Z)</SelectItem>
                                    <SelectItem value="patrol_desc">Patrol (Z-A)</SelectItem>
                                    <SelectItem value="status_asc">Status (A-Z)</SelectItem>
                                    <SelectItem value="status_desc">Status (Z-A)</SelectItem>
                                    <SelectItem value="payment_asc">Payment (A-Z)</SelectItem>
                                    <SelectItem value="payment_desc">Payment (Z-A)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => toggleSort("name")}>
                                        <div className="flex items-center gap-1">
                                            Name
                                            {sortBy === "name_asc" && <ArrowUpDown className="h-3 w-3 rotate-180" />}
                                            {sortBy === "name_desc" && <ArrowUpDown className="h-3 w-3" />}
                                            {!sortBy.startsWith("name") && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => toggleSort("age")}>
                                        <div className="flex items-center gap-1">
                                            Age
                                            {sortBy === "age_asc" && <ArrowUpDown className="h-3 w-3 rotate-180" />}
                                            {sortBy === "age_desc" && <ArrowUpDown className="h-3 w-3" />}
                                            {!sortBy.startsWith("age") && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => toggleSort("patrol")}>
                                        <div className="flex items-center gap-1">
                                            Patrol
                                            {sortBy === "patrol_asc" && <ArrowUpDown className="h-3 w-3 rotate-180" />}
                                            {sortBy === "patrol_desc" && <ArrowUpDown className="h-3 w-3" />}
                                            {!sortBy.startsWith("patrol") && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => toggleSort("status")}>
                                        <div className="flex items-center gap-1">
                                            Status
                                            {sortBy === "status_asc" && <ArrowUpDown className="h-3 w-3 rotate-180" />}
                                            {sortBy === "status_desc" && <ArrowUpDown className="h-3 w-3" />}
                                            {!sortBy.startsWith("status") && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => toggleSort("payment")}>
                                        <div className="flex items-center gap-1">
                                            Payment
                                            {sortBy === "payment_asc" && <ArrowUpDown className="h-3 w-3 rotate-180" />}
                                            {sortBy === "payment_desc" && <ArrowUpDown className="h-3 w-3" />}
                                            {!sortBy.startsWith("payment") && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                        </div>
                                    </TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processedAttendance.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No attendees found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    processedAttendance.map((record) => (
                                        <TableRow key={record.scoutid}>
                                            <TableCell className="font-medium">
                                                {record.firstname} {record.lastname}
                                            </TableCell>
                                            <TableCell>{calculateAge(record.dob)}</TableCell>
                                            <TableCell>{record.patrolid || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    record.attending === "Yes" ? "default" :
                                                        record.attending === "No" ? "destructive" :
                                                            "secondary"
                                                }>
                                                    {record.attending}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const payment = record.payment?.toLowerCase();
                                                    if (payment === "paid" || payment === "automatic") {
                                                        return <span className="font-medium text-green-600">{record.payment}</span>;
                                                    }
                                                    if (payment === "manual") {
                                                        return <span className="font-medium text-amber-600">{record.payment}</span>;
                                                    }
                                                    return <span className="text-muted-foreground">{record.payment || "-"}</span>;
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground italic text-xs max-w-[200px] truncate" title={record.notes}>
                                                {record.notes}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </main>
        </div>
    );
}