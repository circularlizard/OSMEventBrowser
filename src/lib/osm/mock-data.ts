// src/lib/osm/mock-data.ts

import { OSMSection, OSMTerm } from "./data-helpers";
import { OSMEvent, AggregatedMember, AggregatedPatrol } from "./services";

// --- Mock Startup Data ---
export const mockStartupData = {
    globals: {
        roles: [
            {
                sectionid: "mock-s1",
                sectionname: "Mock Beavers",
                groupname: "Mock Group",
                section: "beavers",
                isDefault: "1",
                permissions: { event: 20, member: 20, programme: 20 },
            },
            {
                sectionid: "mock-s2",
                sectionname: "Mock Cubs",
                groupname: "Mock Group",
                section: "cubs",
                isDefault: "0",
                permissions: { event: 20, member: 20, programme: 20 },
            },
            {
                sectionid: "mock-s3",
                sectionname: "Mock Scouts",
                groupname: "Mock Group",
                section: "scouts",
                isDefault: "0",
                permissions: { event: 20, member: 20, programme: 20 },
            },
        ],
        terms: {
            "mock-s1": [
                { termid: "mock-t1-s1", sectionid: "mock-s1", name: "Spring 2025", startdate: "2025-01-01", enddate: "2025-03-31", isPast: false },
                { termid: "mock-t2-s1", sectionid: "mock-s1", name: "Summer 2025", startdate: "2025-04-01", enddate: "2025-08-31", isPast: false },
            ],
            "mock-s2": [
                { termid: "mock-t1-s2", sectionid: "mock-s2", name: "Spring 2025", startdate: "2025-01-01", enddate: "2025-03-31", isPast: false },
            ],
        },
    },
    // Add other top-level startup data properties if necessary for parsing
};

// --- Mock Patrols Data ---
export const mockPatrols: AggregatedPatrol[] = [
    { patrolid: "mock-p1", name: "Red Patrol", members: [] },
    { patrolid: "mock-p2", name: "Blue Patrol", members: [] },
    { patrolid: "mock-p3", name: "Green Patrol", members: [] },
];

// --- Mock Events Summary Data ---
export const mockEventsSummary: OSMEvent[] = [
    {
        eventid: "mock-e1",
        name: "Mock Camp",
        startdate: "2025-06-15",
        enddate: "2025-06-17",
        starttime: "18:00",
        endtime: "14:00",
        location: "Mock Campsite",
        notes: "Fun in the sun!",
        sectionid: "mock-s1",
        cost: "25.00",
        confidential: "false",
        meeting_type: "Camp",
        invited: 30, yes: 25, no: 5, shown: 0, x: 0,
        yes_members: 20, yes_yls: 2, yes_leaders: 3,
    },
    {
        eventid: "mock-e2",
        name: "Mock Hike",
        startdate: "2025-05-01",
        enddate: "2025-05-01",
        starttime: "09:00",
        endtime: "16:00",
        location: "Mock Hills",
        notes: "Bring waterproofs.",
        sectionid: "mock-s1",
        cost: "0.00",
        confidential: "false",
        meeting_type: "Hike",
        invited: 20, yes: 18, no: 2, shown: 0, x: 0,
        yes_members: 15, yes_yls: 1, yes_leaders: 2,
    },
    {
        eventid: "mock-e3",
        name: "Mock Meeting",
        startdate: "2025-04-05",
        enddate: "2025-04-05",
        starttime: "19:00",
        endtime: "20:30",
        location: "Mock Hut",
        notes: "Regular meeting.",
        sectionid: "mock-s2",
        cost: "0.00",
        confidential: "false",
        meeting_type: "Meeting",
        invited: 15, yes: 12, no: 3, shown: 0, x: 0,
        yes_members: 10, yes_yls: 1, yes_leaders: 1,
    },
];

// --- Mock Event Details (v3) Data ---
export const mockEventDetailsV3: DetailedEvent = {
    eventid: "mock-e1",
    name: "Mock Camp (Detailed)",
    startdate: "2025-06-15",
    enddate: "2025-06-17",
    starttime: "18:00",
    endtime: "14:00",
    location: "Mock Campsite, Grid Ref: XXX",
    notes: "Fun in the sun! This is a detailed note.",
    sectionid: "mock-s1",
    cost: "25.00",
    confidential: "false",
    meeting_type: "Camp",
    invited: 30, yes: 25, no: 5, shown: 0, x: 0,
    yes_members: 20, yes_yls: 2, yes_leaders: 3,
    customFields: {
        "dietary": "Vegetarian options available",
        "medical": "Emergency contact info needed",
    },
    attendanceRecords: {
        "mock-m1": { scoutid: "mock-m1", attending: "Yes", payment: "Paid" },
        "mock-m2": { scoutid: "mock-m2", attending: "Yes", payment: "Automatic" },
        "mock-m3": { scoutid: "mock-m3", attending: "No", payment: "Automatic" },
    },
};

// --- Mock Aggregated Data (Members/Events Summary) ---
export const mockAggregatedSummary = {
    events: mockEventsSummary,
    patrols: mockPatrols,
    members: [
        {
            member_id: "mock-m1",
            first_name: "Alice",
            last_name: "Smith",
            age: "12y 3m",
            patrol_id: "mock-p1",
            patrol: "Red Patrol",
            active: true,
            attendance: [
                { eventId: "mock-e1", eventName: "Mock Camp", eventDate: "2025-06-15", attending: "Yes", payment: "Paid" },
                { eventId: "mock-e2", eventName: "Mock Hike", eventDate: "2025-05-01", attending: "Yes", payment: "Automatic" },
            ],
        },
        {
            member_id: "mock-m2",
            first_name: "Bob",
            last_name: "Johnson",
            age: "11y 8m",
            patrol_id: "mock-p2",
            patrol: "Blue Patrol",
            active: true,
            attendance: [
                { eventId: "mock-e1", eventName: "Mock Camp", eventDate: "2025-06-15", attending: "Yes", payment: "Automatic" },
                { eventId: "mock-e3", eventName: "Mock Meeting", eventDate: "2025-04-05", attending: "Yes", payment: "Automatic" },
            ],
        },
    ],
    meta: {
        generatedAt: new Date().toISOString(),
        eventCount: mockEventsSummary.length,
        memberCount: 2,
        patrolCount: mockPatrols.length,
    },
};
