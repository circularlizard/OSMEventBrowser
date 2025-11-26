import { osmGet } from "./api";

export interface OSMEvent {
    eventid: string;
    name: string;
    startdate: string;
    enddate: string;
    starttime: string;
    endtime: string;
    location: string;
    notes: string;
    sectionid: string;
    cost: string;
    confidential: string;
    meeting_type: string;
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
}

/**
 * Fetch events for a specific section and term
 */
export async function getEvents(sectionId: string, termId: string): Promise<OSMEvent[]> {
    const response = await osmGet("ext/events/summary/", {
        action: "get",
        sectionid: sectionId,
        termid: termId
    });

    if (response.error) {
        throw new Error(response.error);
    }

    return response.data?.items || [];
}

/**
 * Fetch attendance for a specific event
 */
export async function getEventAttendance(sectionId: string, termId: string, eventId: string): Promise<OSMAttendance[]> {
    const response = await osmGet("ext/events/event/", {
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
