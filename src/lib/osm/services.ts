import { osmGet } from "./api";
import { smartQueue } from '../smart-queue';

export interface OSMEvent {
    eventid: string;
    name: string;
    startdate: string;
    startdate_iso?: string;
    enddate: string;
    starttime: string;
    endtime: string;
    location: string;
    notes: string;
    sectionid: string;
    cost: string;
    confidential: string;
    meeting_type: string;
    // Event Statistics
    invited: number;
    yes: number;
    yes_members: number;
    yes_yls: number; // Young Leaders
    yes_leaders: number;
    no: number;
    shown: number; // Number of people whose attendance is shown
    x: number; // Unknown field, possibly excused
    // Add other fields as discovered
}

export interface OSMAttendance {
    scoutid: string;
    firstname: string;
    lastname: string;
    attending: string; // "Yes", "No", "Invited", "Reserved"
    payment: string;
    notes: string;
    patrolid: string;
    sectionid: string;
    dob: string; // Date of Birth
    photo_guid?: string;
}

/**
 * Fetch events for a specific section and term
 */
export async function getEvents(sectionId: string, termId: string): Promise<OSMEvent[]> {
    console.log(`[Services] Fetching events for Section: ${sectionId}, Term: ${termId}`);
    const response = await smartQueue.get("ext/events/summary/", {
        action: "get",
        sectionid: sectionId,
        termid: termId
    });

    if (response.error) {
        console.error("[Services] getEvents error:", response.error);
        throw new Error(response.error);
    }

    console.log(`[Services] getEvents raw data items count:`, response.data?.items?.length);
    return response.data?.items || [];
}

/**
 * Fetch attendance for a specific event
 */
export async function getEventAttendance(sectionId: string, termId: string, eventId: string): Promise<OSMAttendance[]> {
    const response = await smartQueue.get("ext/events/event/", {
        action: "getAttendance",
        sectionid: sectionId,
        termid: termId,
        eventid: eventId
    });

    if (response.error) {
        throw new Error(response.error);
    }

    return response.data?.items || [];
}

/**
 * Fetch detailed information for a single event
 */
export async function getEventDetails(sectionId: string, termId: string, eventId: string): Promise<OSMEvent> {
    const response = await smartQueue.get(`v3/events/event/${eventId}/summary`, {
        sectionid: sectionId,
        termid: termId
    });

    if (response.error) {
        throw new Error(response.error);
    }

    // The v3 endpoint might return the event object directly or wrapped
    // Based on standard OSM patterns, it's likely the root object or under 'data'
    // Let's assume it matches OSMEvent for now, but we might need to map fields
    return response.data;
}

export interface AggregatedMember {
    member_id: string;
    first_name: string;
    last_name: string;
    age: string;
    patrol_id: number;
    patrol: string;
    active: boolean;
    attendance: {
        eventId: string;
        eventName: string;
        eventDate: string;
        attending: string;
        payment: string;
    }[];
    [key: string]: any; // Allow other member fields
}

export interface AggregatedPatrol {
    patrolid: string;
    name: string;
    members: {
        member_id: string;
        first_name: string;
        last_name: string;
        age: string;
    }[];
    [key: string]: any;
}

export interface AggregationResult {
    events: OSMEvent[];
    patrols: AggregatedPatrol[];
    members: AggregatedMember[];
    meta: any;
}

/**
 * Fetch aggregated summary of members, patrols, and event attendance
 */
export async function getMembersEventsSummary(sectionId: string, termId: string): Promise<AggregationResult> {
    const response = await smartQueue.get("members-events-summary", {
        sectionId,
        termId
    });

    if (response.error) {
        const details = response.data?.details ? JSON.stringify(response.data.details) : "";
        throw new Error(`${response.error} ${details}`);
    }

    return response.data;
}
