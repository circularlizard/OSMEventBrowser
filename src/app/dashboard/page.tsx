"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { osmGet } from "@/lib/osm/api";
import { getEvents, getEventAttendance, type OSMEvent, type OSMAttendance } from "@/lib/osm/services";
import {
  extractSections,
  getCurrentTerm,
  getDefaultSection,
  type OSMSection,
  type OSMTerm,
} from "@/lib/osm/data-helpers";
import { SectionSelector } from "@/components/osm/section-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { User, Check, X, ArrowUpDown } from "lucide-react";

type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc" | "attendance_desc";

export default function DashboardPage() {
    const [startupData, setStartupData] = useState<any>(null);
    const [sections, setSections] = useState<OSMSection[]>([]);
    const [selectedSection, setSelectedSection] = useState<OSMSection | null>(null);
    // Terms state removed as we don't need to display them
    const [selectedTerm, setSelectedTerm] = useState<OSMTerm | null>(null);

    // Events State
    const [events, setEvents] = useState<OSMEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsError, setEventsError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>("date_desc");

    // Fetch startup data on mount
    useEffect(() => {
        async function fetchStartupData() {
            try {
                // Debug imports
                console.log("Imports loaded:", { extractSections, getDefaultSection });
                
                const response = await fetch("/api/debug-startup");
                const result = await response.json();

                if (result.data) {
                    setStartupData(result.data);

                    // Extract sections
                    const extractedSections = extractSections(result.data);
                    setSections(extractedSections);

                    // Set default section
                    const defaultSection = getDefaultSection(result.data);
                    if (defaultSection) {
                        setSelectedSection(defaultSection);

                        // Set current term directly
                        const currentTerm = getCurrentTerm(result.data, defaultSection.sectionId);
                        setSelectedTerm(currentTerm);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch startup data:", error);
            }
        }

        fetchStartupData();
    }, []);

    // Fetch events when section or term changes
    useEffect(() => {
        async function fetchEvents() {
            if (!selectedSection || !selectedTerm) return;

            setEventsLoading(true);
            setEventsError(null);
            setEvents([]);

            try {
                const data = await getEvents(selectedSection.sectionId, selectedTerm.termId);
                setEvents(data);
            } catch (err: any) {
                console.error("Failed to fetch events:", err);
                setEventsError(err.message || "Failed to fetch events");
            } finally {
                setEventsLoading(false);
            }
        }

        fetchEvents();
    }, [selectedSection, selectedTerm]);



    const handleSectionChange = (sectionId: string) => {
        console.log("[Dashboard] Section changing to:", sectionId);
        const section = sections.find((s) => s.sectionId === sectionId);

        if (section && startupData) {
            console.log("[Dashboard] Found section:", section);
            setSelectedSection(section);

            // Set current term for new section directly
            const currentTerm = getCurrentTerm(startupData, sectionId);
            console.log("[Dashboard] Found current term:", currentTerm);
            setSelectedTerm(currentTerm);
        } else {
            console.warn("[Dashboard] Could not find section or startupData missing", { section, hasStartupData: !!startupData });
        }
    };

        const handleLogout = async () => {

            await fetch("/api/logout", { method: "POST" });

            window.location.href = "/";

        };

    

                        const sortedEvents = useMemo(() => {

    

                

    

                            return [...events].sort((a, b) => {

    

                

    

                                // Use ISO date if available for reliable sorting

    

                                const dateA = new Date(a.startdate_iso || a.startdate).getTime();

    

                                const dateB = new Date(b.startdate_iso || b.startdate).getTime();

    

                

    

                                switch (sortBy) {

    

                        case "date_desc":

    

                            return dateB - dateA;

    

                        case "date_asc":

    

                            return dateA - dateB;

    

                        case "name_asc":

    

                            return a.name.localeCompare(b.name);

    

                        case "name_desc":

    

                            return b.name.localeCompare(a.name);

    

                        case "attendance_desc":

    

                            return b.yes - a.yes;

    

                        default:

    

                            return 0;

    

                    }

    

                });

    

            }, [events, sortBy]);

    

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

    

                {/* Section Selection */}

                <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">

                    <div className="flex flex-1 items-center gap-4">

                        <label className="text-sm font-medium whitespace-nowrap">Select Section:</label>

                        <div className="w-full max-w-xs">

                            <SectionSelector

                                sections={sections}

                                selectedSectionId={selectedSection?.sectionId || null}

                                onSectionChange={handleSectionChange}

                            />

                        </div>

                        {selectedSection && (

                            <div className="text-xs text-muted-foreground hidden md:block">

                                ID: <code className="bg-muted px-1 py-0.5 rounded">{selectedSection.sectionId}</code>

                            </div>

                        )}

                    </div>

                    {selectedTerm && (

                        <div className="text-sm text-muted-foreground">

                            Current Term: <span className="font-medium text-foreground">{selectedTerm.name}</span>

                        </div>

                    )}

                </div>

    

                {/* Events Browser */}

                <div className="space-y-4">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                        <div className="flex items-baseline gap-2">

                            <h2 className="text-xl font-semibold text-primary">Events</h2>

                            <div className="text-sm text-muted-foreground">

                                {sortedEvents.length} events found

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

    

                    {eventsLoading ? (

                        <div className="text-sm text-muted-foreground">Loading events...</div>

                    ) : eventsError ? (

                        <div className="text-sm text-destructive">{eventsError}</div>

                    ) : sortedEvents.length === 0 ? (

                        <div className="text-sm text-muted-foreground">No events found for this term.</div>

                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {sortedEvents.map((event) => (

                                <Link 

                                    key={event.eventid} 

                                    href={`/dashboard/events/${event.eventid}?sectionId=${selectedSection?.sectionId}&termId=${selectedTerm?.termId}`} 

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
                                            {/* Invited */}
                                            <div className="flex flex-col items-center justify-center rounded-md bg-blue-50 p-2 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <User className="h-4 w-4" />
                                                    <span className="font-semibold text-xs uppercase opacity-70">Invited</span>
                                                </div>
                                                <span className="text-lg font-bold">{event.invited}</span>
                                            </div>

                                            {/* Attending (Yes) */}
                                            <div className="flex flex-col items-center justify-center rounded-md bg-green-50 p-2 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Check className="h-4 w-4" />
                                                    <span className="font-semibold text-xs uppercase opacity-70">Yes</span>
                                                </div>
                                                <span className="text-lg font-bold">{event.yes}</span>
                                                <div className="mt-1 flex gap-2 text-[10px] opacity-80">
                                                    <span title="Members">M:{event.yes_members}</span>
                                                    <span title="Leaders">L:{event.yes_leaders}</span>
                                                </div>
                                            </div>

                                            {/* Not Attending (No) */}
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
        </main>
    </div>
    );
}
