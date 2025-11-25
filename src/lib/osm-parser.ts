/**
 * Parse OSM startup data response
 * OSM returns JavaScript code like: var data_holder = {...}
 * We need to extract the JSON object from it
 */
export function parseOSMStartupData(responseText: string): any {
    try {
        // Match: var data_holder = {...};
        const match = responseText.match(/var\s+data_holder\s*=\s*({[\s\S]*?});?\s*$/);

        if (!match || !match[1]) {
            throw new Error("Could not find data_holder in response");
        }

        // Parse the JSON object
        return JSON.parse(match[1]);
    } catch (error) {
        console.error("Failed to parse OSM startup data:", error);
        throw error;
    }
}
