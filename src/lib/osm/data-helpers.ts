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
    // Terms are nested under globals.terms, not at the root level
    const termsData = startupData?.globals?.terms?.[sectionId] || startupData?.terms?.[sectionId];

    if (!termsData) {
        return [];
    }

    return termsData.map((term: any) => ({
        termId: term.termid,
        sectionId: term.sectionid,
        name: term.name,
        startDate: term.startdate,
        endDate: term.enddate,
        isPast: term.past === true,
    }));
}

/**
 * Get current term for a section (first non-past term, or the last term if all are past)
 */
export function getCurrentTerm(
    startupData: any,
    sectionId: string
): OSMTerm | null {
    const terms = extractTermsForSection(startupData, sectionId);
    
    // First try to find a current/future term
    const currentTerm = terms.find((term) => !term.isPast);
    if (currentTerm) return currentTerm;

    // Fallback: return the last term (usually the most recent past term)
    // Terms are typically returned in chronological order, so the last one is the newest
    return terms.length > 0 ? terms[terms.length - 1] : null;
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
