"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SectionPicker } from "@/components/osm/section-picker";
import { useOsmStore } from "@/lib/store";
import { useHydration } from "@/hooks/use-hydration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { User, Check, X, ArrowUpDown, Users, Tent, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc" | "attendance_desc";
type Tab = "events" | "members" | "patrols";

export default function DashboardPage() {
    const { selectedSectionIds, events: storeEvents, members: storeMembers, patrols: storePatrols, hydrationStatus } = useOsmStore();
    const { isLoading, progress } = useHydration();
    
    const [activeTab, setActiveTab] = useState<Tab>("events");
    const [sortBy, setSortBy] = useState<SortOption>("date_desc");

    // Derived Data Arrays
    const events = useMemo(() => Object.values(storeEvents), [storeEvents]);
    const members = useMemo(() => Object.values(storeMembers), [storeMembers]);
    const patrols = useMemo(() => Object.values(storePatrols), [storePatrols]);

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/";
    };

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            const dateA = new Date(a.startdate_iso || a.startdate).getTime();
            const dateB = new Date(b.startdate_iso || b.startdate).getTime();

            switch (sortBy) {
                case "date_desc": return dateB - dateA;
                case "date_asc": return dateA - dateB;
                case "name_asc": return a.name.localeCompare(b.name);
                case "name_desc": return b.name.localeCompare(a.name);
                case "attendance_desc": return b.yes - a.yes;
                default: return 0;
            }
        });
    }, [events, sortBy]);

    // Conditional Render: Show Picker if no sections selected
    if (selectedSectionIds.length === 0) {
        return <SectionPicker />;
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-primary/50 bg-gradient-to-r from-primary to-primary/80 px-6 py-4 shadow-lg">
                <div className="flex min-h-[40px] items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-primary-foreground">
                        OSM Event Browser
                    </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                        <a href="/startup-data">Startup Data</a>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                        <a href="/debug">Debug</a>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                        <a href="/debug/api-browser">API Browser</a>
                    </Button>
                    <Button onClick={handleLogout} variant="secondary" className="text-secondary-foreground">
                        Logout
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-8">
                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">Hydrating data... {progress}%</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 border-b pb-2">
                    <Button 
                        variant={activeTab === "events" ? "default" : "ghost"} 
                        onClick={() => setActiveTab("events")}
                        className="gap-2"
                    >
                        <Users className="h-4 w-4" /> Events
                        <Badge variant="secondary" className="ml-1 text-xs">{events.length}</Badge>
                    </Button>
                    <Button 
                        variant={activeTab === "members" ? "default" : "ghost"} 
                        onClick={() => setActiveTab("members")}
                        className="gap-2"
                    >
                        <User className="h-4 w-4" /> Members
                        <Badge variant="secondary" className="ml-1 text-xs">{members.length}</Badge>
                    </Button>
                    <Button 
                        variant={activeTab === "patrols" ? "default" : "ghost"} 
                        onClick={() => setActiveTab("patrols")}
                        className="gap-2"
                    >
                        <Tent className="h-4 w-4" /> Patrols
                        <Badge variant="secondary" className="ml-1 text-xs">{patrols.length}</Badge>
                    </Button>
                </div>

                {/* Content */}
                <>
                    {/* Events View */}
                    {activeTab === "events" && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-xl font-semibold text-primary">Events</h2>
                                    <div className="text-sm text-muted-foreground">
                                        Showing events from {selectedSectionIds.length} section(s)
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
                                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Sort by..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                                            <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                                            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                                            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                                            <SelectItem value="attendance_desc">Most Attendees</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {sortedEvents.length === 0 && !isLoading ? (
                                <div className="text-sm text-muted-foreground">No events found.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {sortedEvents.map((event) => (
                                        <Link 
                                            key={event.eventid} 
                                            href={`/dashboard/events/${event.eventid}?sectionId=${event.sectionid}`} 
                                            passHref
                                        >
                                            <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
                                                <CardHeader className="pb-3">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <CardTitle className="text-lg font-bold leading-tight text-primary">
                                                            {event.name}
                                                        </CardTitle>
                                                        <Badge variant="outline" className="shrink-0 bg-primary/5 border-primary/20 text-primary">
                                                            {event.startdate}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {event.location || "No location specified"}
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                                        <div className="flex flex-col items-center justify-center rounded-md bg-blue-50 p-2 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <User className="h-4 w-4" />
                                                                <span className="font-semibold text-xs uppercase opacity-70">Invited</span>
                                                            </div>
                                                            <span className="text-lg font-bold">{event.invited}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center rounded-md bg-green-50 p-2 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <Check className="h-4 w-4" />
                                                                <span className="font-semibold text-xs uppercase opacity-70">Yes</span>
                                                            </div>
                                                            <span className="text-lg font-bold">{event.yes}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center rounded-md bg-red-50 p-2 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <X className="h-4 w-4" />
                                                                <span className="font-semibold text-xs uppercase opacity-70">No</span>
                                                            </div>
                                                            <span className="text-lg font-bold">{event.no}</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Members View */}
                    {activeTab === "members" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-primary">Members ({members.length})</h2>
                            <div className="rounded-md border bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Age</TableHead>
                                            <TableHead>Patrol</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableHeader>
                                    </TableHeader>
                                    <TableBody>
                                        {members.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No members loaded yet (Wait for Hydration Phase 2).</TableCell></TableRow>
                                        ) : (
                                            members.map((member) => (
                                                <TableRow key={member.member_id}>
                                                    <TableCell>
                                                        <Link 
                                                            href={`/dashboard/members/${member.member_id}`}
                                                            className="hover:underline text-primary font-medium"
                                                        >
                                                            {member.first_name} {member.last_name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>{member.age}</TableCell>
                                                    <TableCell>{member.patrol}</TableCell>
                                                    <TableCell>{member.active ? <Badge variant="outline">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Patrols View */}
                    {activeTab === "patrols" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-primary">Patrols ({patrols.length})</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {patrols.map((patrol) => (
                                    <Link 
                                        key={patrol.patrolid}
                                        href={`/dashboard/patrols/${patrol.patrolid}`}
                                    >
                                        <Card className="hover:shadow-md transition-all cursor-pointer">
                                            <CardHeader>
                                                <CardTitle>{patrol.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-sm text-muted-foreground">
                                                    <Users className="inline h-4 w-4 mr-1" />
                                                    {patrol.members.length} Members
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            </main>
        </div>
    );
}
