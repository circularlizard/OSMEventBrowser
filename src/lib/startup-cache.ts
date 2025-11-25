/**
 * In-memory cache for startup data
 * In production, replace with Redis or a database
 */

interface CacheEntry {
    data: any;
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Store startup data in cache
 */
export function setStartupDataCache(userId: string, data: any): void {
    cache.set(userId, {
        data,
        timestamp: Date.now(),
    });

    // Clean up old entries
    cleanupCache();
}

/**
 * Get startup data from cache
 */
export function getStartupDataCache(userId: string): any | null {
    const entry = cache.get(userId);

    if (!entry) {
        return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(userId);
        return null;
    }

    return entry.data;
}

/**
 * Clear startup data from cache
 */
export function clearStartupDataCache(userId: string): void {
    cache.delete(userId);
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
    const now = Date.now();
    for (const [userId, entry] of cache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
            cache.delete(userId);
        }
    }
}
