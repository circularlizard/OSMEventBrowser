"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { osmGet } from "@/lib/osm/api";
import { getEvents, getEventAttendance, type OSMEvent, type OSMAttendance } from "@/lib/osm/services";
import {
  extractSections,
  getCurrentTerm,
  getAllCurrentTerms,
  getDefaultSection,
  extractTermsForSection,
  type OSMSection,
  type OSMTerm,
} from "@/lib/osm/data-helpers";
import { SectionSelector } from "@/components/osm/section-selector";
import { TermSelector } from "@/components/osm/term-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
    const [startupData, setStartupData] = useState<any>(null);
    const [sections, setSections] = useState<OSMSection[]>([]);
    const [selectedSection, setSelectedSection] = useState<OSMSection | null>(null);
    const [terms, setTerms] = useState<OSMTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<OSMTerm | null>(null);

    // Events State
    const [events, setEvents] = useState<OSMEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsError, setEventsError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<OSMEvent | null>(null);

    // Attendance State
    const [attendance, setAttendance] = useState<OSMAttendance[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);

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

                        // Extract terms for default section
                        const sectionTerms = extractTermsForSection(result.data, defaultSection.sectionId);
                        setTerms(sectionTerms);

                        // Set current term
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
            setSelectedEvent(null);

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

    // Fetch attendance when event is selected
    useEffect(() => {
        async function fetchAttendance() {
            if (!selectedSection || !selectedTerm || !selectedEvent) return;

            setAttendanceLoading(true);
            setAttendanceError(null);
            setAttendance([]);

            try {
                const data = await getEventAttendance(
                    selectedSection.sectionId,
                    selectedTerm.termId,
                    selectedEvent.eventid
                );
                setAttendance(data);
            } catch (err: any) {
                console.error("Failed to fetch attendance:", err);
                setAttendanceError(err.message || "Failed to fetch attendance");
            } finally {
                setAttendanceLoading(false);
            }
        }

        fetchAttendance();
    }, [selectedEvent, selectedSection, selectedTerm]);

    const handleSectionChange = (sectionId: string) => {
        const section = sections.find((s) => s.sectionId === sectionId);

        if (section && startupData) {
            setSelectedSection(section);

            // Update terms for new section
            const sectionTerms = extractTermsForSection(startupData, sectionId);
            setTerms(sectionTerms);

            // Set current term for new section
            const currentTerm = getCurrentTerm(startupData, sectionId);
            setSelectedTerm(currentTerm);
        }
    };

    const handleTermChange = (termId: string) => {
        const term = terms.find((t) => t.termId === termId);
        if (term) {
            setSelectedTerm(term);
        }
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
                    <Button asChild variant="ghost" size="sm">
                        <a href="/debug/api-browser">API Browser</a>
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
                                ID: <code className="bg-muted px-1 py-0.5 rounded">{selectedSection.sectionId}</code>
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
                                ID: <code className="bg-muted px-1 py-0.5 rounded">{selectedTerm.termId}</code>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Events Browser */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Events List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {eventsLoading ? (
                            <div className="text-sm text-muted-foreground">Loading events...</div>
                        ) : eventsError ? (
                            <div className="text-sm text-destructive">{eventsError}</div>
                        ) : events.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No events found for this term.</div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                                {events.map((event) => (
                                    <div
                                        key={event.eventid}
                                        className={`cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted ${selectedEvent?.eventid === event.eventid ? "bg-muted border-primary" : ""
                                            }`}
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="font-medium">{event.name}</div>
                                            <Badge variant="outline">{event.startdate}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {event.location}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Event Details & Attendance */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {selectedEvent ? selectedEvent.name : "Select an Event"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedEvent ? (
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="font-semibold">Date:</span> {selectedEvent.startdate}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Time:</span> {selectedEvent.starttime} - {selectedEvent.endtime}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Location:</span> {selectedEvent.location}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Cost:</span> {selectedEvent.cost}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-2">Attendance</h3>
                                    {attendanceLoading ? (
                                        <div className="text-sm text-muted-foreground">Loading attendance...</div>
                                    ) : attendanceError ? (
                                        <div className="text-sm text-destructive">{attendanceError}</div>
                                    ) : attendance.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No attendance records found.</div>
                                    ) : (
                                        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                                            {attendance.map((record) => (
                                                <div key={record.scoutid} className="flex justify-between items-center text-sm p-2 border-b last:border-0">
                                                    <span>{record.firstname} {record.lastname}</span>
                                                    <Badge variant={
                                                        record.attending === "Yes" ? "default" :
                                                            record.attending === "No" ? "destructive" :
                                                                "secondary"
                                                    }>
                                                        {record.attending}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                Select an event from the list to view details and attendance.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
