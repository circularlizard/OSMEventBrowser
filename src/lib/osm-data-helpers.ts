/**
 * Helper functions to extract and process OSM data from startup data
 */

export interface OSMSection {
    sectionId: string;
    sectionName: string;
    groupName: string;
    sectionType: string;
    isDefault: boolean;
    permissions: Record<string, number>;
}

export interface OSMTerm {
    termId: string;
    sectionId: string;
    name: string;
    startDate: string;
    endDate: string;
    isPast: boolean;
}

/**
 * Extract sections from startup data
 */
export function extractSections(startupData: any): OSMSection[] {
    if (!startupData?.globals?.roles) {
        return [];
    }

    return startupData.globals.roles.map((role: any) => ({
        sectionId: role.sectionid,
        sectionName: role.sectionname,
        groupName: role.groupname,
        sectionType: role.section,
        isDefault: role.isDefault === "1",
        permissions: role.permissions || {},
    }));
}

/**
 * Extract all terms for a section
 */
export function extractTermsForSection(
    startupData: any,
    sectionId: string
): OSMTerm[] {
    if (!startupData?.terms?.[sectionId]) {
        return [];
    }

    return startupData.terms[sectionId].map((term: any) => ({
        termId: term.termid,
        sectionId: term.sectionid,
        name: term.name,
        startDate: term.startdate,
        endDate: term.enddate,
        isPast: term.past === true,
    }));
}

/**
 * Get current term for a section (first non-past term)
 */
export function getCurrentTerm(
    startupData: any,
    sectionId: string
): OSMTerm | null {
    const terms = extractTermsForSection(startupData, sectionId);
    const currentTerm = terms.find((term) => !term.isPast);
    return currentTerm || null;
}

/**
 * Get default section
 */
export function getDefaultSection(startupData: any): OSMSection | null {
    const sections = extractSections(startupData);
    const defaultSection = sections.find((section) => section.isDefault);
    return defaultSection || sections[0] || null;
}

/**
 * Get all current terms (one per section)
 */
export function getAllCurrentTerms(startupData: any): Map<string, OSMTerm> {
    const sections = extractSections(startupData);
    const currentTerms = new Map<string, OSMTerm>();

    for (const section of sections) {
        const currentTerm = getCurrentTerm(startupData, section.sectionId);
        if (currentTerm) {
            currentTerms.set(section.sectionId, currentTerm);
        }
    }

    return currentTerms;
}
