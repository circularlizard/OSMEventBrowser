
export interface ApiEndpoint {
    method: "GET" | "POST";
    path: string;
    label: string;
    description?: string;
    params: string[];
    defaultParams?: Record<string, string>;
}

export const OSM_ENDPOINTS: ApiEndpoint[] = [
    {
        method: "GET",
        path: "api.php",
        label: "Get Terms",
        description: "Get list of terms",
        params: [],
        defaultParams: { action: "getTerms" },
    },
    {
        method: "GET",
        path: "api.php",
        label: "Get Section Config",
        description: "Get configuration for a section",
        params: ["sectionid"],
        defaultParams: { action: "getSectionConfig" },
    },
    {
        method: "GET",
        path: "api.php",
        label: "Get User Roles",
        description: "Get user roles and sections",
        params: [],
        defaultParams: { action: "getUserRoles" },
    },
    {
        method: "GET",
        path: "ext/events/summary/",
        label: "Get Events",
        description: "Get events for a section and term",
        params: ["sectionid", "termid"],
        defaultParams: { action: "get" },
    },
    {
        method: "GET",
        path: "ext/events/event/",
        label: "Get Event Attendance",
        description: "Get attendance for a specific event",
        params: ["sectionid", "termid", "eventid"],
        defaultParams: { action: "getAttendance" },
    },
    {
        method: "GET",
        path: "ext/events/event/sharing/",
        label: "Get Event Sharing Status",
        description: "Get sharing status for an event",
        params: ["eventid", "sectionid"],
        defaultParams: { action: "getStatus" },
    },
    {
        method: "GET",
        path: "ext/events/event/sharing/",
        label: "Get Shared Event Attendance",
        description: "Get attendance for shared events",
        params: ["eventid", "sectionid"],
        defaultParams: { action: "getAttendance" },
    },
    {
        method: "GET",
        path: "ext/members/contact/",
        label: "Get Contact Details",
        description: "Get contact details for a member",
        params: ["sectionid", "scoutid"],
        defaultParams: { action: "getIndividual" },
    },
    {
        method: "GET",
        path: "ext/members/contact/",
        label: "Get List of Members",
        description: "Get list of members in a section",
        params: ["sectionid", "termid", "section"],
        defaultParams: { action: "getListOfMembers" },
    },
    {
        method: "GET",
        path: "ext/members/flexirecords/",
        label: "Get Flexi Records",
        description: "Get available flexi records",
        params: ["sectionid", "archived"],
        defaultParams: { action: "getFlexiRecords" },
    },
    {
        method: "GET",
        path: "ext/members/flexirecords/",
        label: "Get Flexi Structure",
        description: "Get structure of a flexi record",
        params: ["sectionid", "extraid", "termid"],
        defaultParams: { action: "getStructure" },
    },
    {
        method: "GET",
        path: "ext/members/flexirecords/",
        label: "Get Single Flexi Record",
        description: "Get data for a flexi record",
        params: ["sectionid", "extraid", "termid"],
        defaultParams: { action: "getData", nototal: "true" },
    },
    {
        method: "GET",
        path: "ext/members/patrols/",
        label: "Get Patrols",
        description: "Get patrol structure and names",
        params: ["sectionid"],
        defaultParams: { action: "getPatrols" },
    },
    {
        method: "GET",
        path: "ext/generic/startup/",
        label: "Get Startup Data",
        description: "Get initial startup data (returns JS)",
        params: [],
        defaultParams: { action: "getData" },
    },
    {
        method: "GET",
        path: "",
        label: "Custom Request",
        description: "Manually specify path and parameters",
        params: [],
        defaultParams: {},
    },
];
