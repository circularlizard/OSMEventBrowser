import { osmGet } from "./api";

export interface OSMPatrol {
    patrolid: string;
    name: string;
    sectionid: string;
    active: boolean;
}

/**
 * Fetch patrols for a specific section
 */
export async function getPatrols(sectionId: string): Promise<OSMPatrol[]> {
    const response = await osmGet("ext/members/patrols/", {
        action: "getPatrols",
        sectionid: sectionId
    });

    if (response.error) {
        throw new Error(response.error);
    }

    if (!response.data || !response.data.patrols) {
        return [];
    }

    return response.data.patrols.map((p: any) => ({
        patrolid: p.patrolid,
        name: p.name,
        sectionid: p.sectionid,
        active: p.active === "1" || p.active === true
    }));
}
