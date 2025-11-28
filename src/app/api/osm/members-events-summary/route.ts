import { NextRequest, NextResponse } from "next/server";
import { callExternalOsmApi } from "@/lib/osm/server-api";

// Simple in-memory cache
// Key: `${sectionId}:${termId}`
// Value: { timestamp: number, data: any }
const CACHE: Record<string, { timestamp: number; data: any }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sectionId = searchParams.get("sectionId");
    const termId = searchParams.get("termId");

    if (!sectionId || !termId) {
        return NextResponse.json({ error: "Missing sectionId or termId" }, { status: 400 });
    }

    const cacheKey = `${sectionId}:${termId}`;
    const now = Date.now();

    if (CACHE[cacheKey] && (now - CACHE[cacheKey].timestamp < CACHE_TTL)) {
        console.log(`[Aggregation] Serving from cache for ${cacheKey}`);
        return NextResponse.json(CACHE[cacheKey].data);
    }

    console.log(`[Aggregation] Fetching fresh data for ${cacheKey}`);

    try {
        // 1. Fetch Events, Patrols, and Members concurrently
        const [eventsRes, patrolsRes, membersRes] = await Promise.all([
            callExternalOsmApi(`ext/events/summary/?action=get&sectionid=${sectionId}&termid=${termId}`),
            callExternalOsmApi(`ext/members/patrols/?action=getPatrols&sectionid=${sectionId}`),
            callExternalOsmApi(
                `ext/members/contact/grid/?action=getMembers`, 
                "POST", 
                `section_id=${encodeURIComponent(sectionId)}&term_id=${encodeURIComponent(termId)}`,
                { "Content-Type": "application/x-www-form-urlencoded" }
            )
        ]);

        if (eventsRes.error || patrolsRes.error || membersRes.error) {
            console.error("Error fetching base data:", {
                events: eventsRes.error,
                patrols: patrolsRes.error,
                members: membersRes.error
            });
            return NextResponse.json({ 
                error: "Failed to fetch base data from OSM", 
                details: { 
                    events: eventsRes.error, 
                    patrols: patrolsRes.error, 
                    members: membersRes.error,
                    eventsStatus: eventsRes.status,
                    patrolsStatus: patrolsRes.status,
                    membersStatus: membersRes.status
                } 
            }, { status: 502 });
        }

        const events = eventsRes.data.items || [];
        const patrols = patrolsRes.data.patrols || [];
        const members = membersRes.data.data?.members || [];

        // 2. Fetch Attendance for ALL events
        // Use concurrency limit to avoid rate limits (e.g., 5 concurrent requests)
        const CONCURRENCY_LIMIT = 5;
        const attendanceResults: Record<string, any[]> = {};
        
        // Helper to process a chunk of events
        const processChunk = async (chunk: any[]) => {
            const promises = chunk.map(async (event) => {
                const res = await callExternalOsmApi(`ext/events/event/?action=getAttendance&sectionid=${sectionId}&termid=${termId}&eventid=${event.eventid}`);
                if (res.data && res.data.items) {
                    attendanceResults[event.eventid] = res.data.items;
                } else {
                    attendanceResults[event.eventid] = [];
                }
            });
            await Promise.all(promises);
        };

        // Split events into chunks
        for (let i = 0; i < events.length; i += CONCURRENCY_LIMIT) {
            const chunk = events.slice(i, i + CONCURRENCY_LIMIT);
            await processChunk(chunk);
        }

        // 3. Aggregate Data
        
        // Enriched Members: Add attendance stats
        const enrichedMembers = members.map((member: any) => {
            const memberAttendance = events.map((event: any) => {
                const attRecord = attendanceResults[event.eventid]?.find((r: any) => r.scoutid === member.member_id);
                return {
                    eventId: event.eventid,
                    eventName: event.name,
                    eventDate: event.startdate,
                    attending: attRecord ? attRecord.attending : "Unknown",
                    payment: attRecord ? attRecord.payment : "N/A"
                };
            });

            return {
                ...member,
                attendance: memberAttendance
            };
        });

        // Enriched Patrols: Add members
        const enrichedPatrols = patrols.map((patrol: any) => {
            const patrolMembers = enrichedMembers.filter((m: any) => m.patrol_id == patrol.patrolid);
            return {
                ...patrol,
                members: patrolMembers.map((m: any) => ({
                    member_id: m.member_id,
                    first_name: m.first_name,
                    last_name: m.last_name,
                    age: m.age
                }))
            };
        });

        const result = {
            events,
            patrols: enrichedPatrols,
            members: enrichedMembers,
            meta: {
                generatedAt: new Date().toISOString(),
                eventCount: events.length,
                memberCount: members.length,
                patrolCount: patrols.length
            }
        };

        // Update Cache
        CACHE[cacheKey] = {
            timestamp: now,
            data: result
        };

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("[Aggregation] Critical error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
