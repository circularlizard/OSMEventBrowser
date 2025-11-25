/**
 * In-memory cache for startup data
 * In production, replace with Redis or a database
 */

interface CacheEntry {
    data: any;
    timestamp: number;
}

// Use globalThis to survive Next.js hot reloads in development
const getCache = (): Map<string, CacheEntry> => {
    if (!(globalThis as any).__startupDataCache) {
        console.log("[Cache] Initializing new cache");
        (globalThis as any).__startupDataCache = new Map<string, CacheEntry>();
    }
    return (globalThis as any).__startupDataCache;
};

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Store startup data in cache
 */
export function setStartupDataCache(userId: string, data: any): void {
    const cache = getCache();
    cache.set(userId, {
        data,
        timestamp: Date.now(),
    });

    console.log("[Cache] Stored data for user:", userId, "Cache size:", cache.size);

    // Clean up old entries
    cleanupCache();
}

/**
 * Get startup data from cache
 */
export function getStartupDataCache(userId: string): any | null {
    const cache = getCache();
    console.log("[Cache] Looking up user:", userId, "Cache size:", cache.size);

    const entry = cache.get(userId);

    if (!entry) {
        console.log("[Cache] No entry found for user:", userId);
        return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        console.log("[Cache] Entry expired for user:", userId);
        cache.delete(userId);
        return null;
    }

    console.log("[Cache] Returning data for user:", userId);
    return entry.data;
}

/**
 * Clear startup data from cache
 */
export function clearStartupDataCache(userId: string): void {
    const cache = getCache();
    cache.delete(userId);
    console.log("[Cache] Cleared data for user:", userId);
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
    const cache = getCache();
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, entry] of cache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
            cache.delete(userId);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log("[Cache] Cleaned up", cleaned, "expired entries");
    }
}
