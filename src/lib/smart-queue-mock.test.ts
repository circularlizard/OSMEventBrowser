import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OSMApiResponse } from './osm/api';
import { mockEventsSummary } from './osm/mock-data';

// Mock the osm/api module to verify it is NOT called
vi.mock('./osm/api'); 
import { osmGet } from './osm/api';

// Import SmartQueue
const SmartQueueModule = vi.importActual<typeof import('./smart-queue')>('./smart-queue');
const SmartQueue = SmartQueueModule.SmartQueue;

// Mock localStorage
const localStorageMock = (function() {
    let store: Record<string, string> = {};
    return {
        getItem: function(key: string) {
            return store[key] || null;
        },
        setItem: function(key: string, value: string) {
            store[key] = value.toString();
        },
        removeItem: function(key: string) {
            delete store[key];
        },
        clear: function() {
            store = {};
        }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SmartQueue Mock Mode', () => {
    let smartQueue: InstanceType<typeof SmartQueue>;

    beforeEach(async () => {
        localStorage.clear();
        vi.resetAllMocks();

        // Re-instantiate SmartQueue
        const Module = await SmartQueueModule;
        smartQueue = new Module.SmartQueue();
        
        // Enable Mock Mode
        smartQueue.setMockMode(true);

        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return mock data for events summary without calling API', async () => {
        const promise = smartQueue.get('ext/events/summary/');
        
        // Advance timer to bypass simulated network delay
        await vi.advanceTimersByTimeAsync(1000);

        const response = await promise;

        expect(response.status).toBe(200);
        expect(response.data).toEqual({ items: mockEventsSummary });
        
        // Verify real API was NOT called
        expect(osmGet).not.toHaveBeenCalled();
    });

    it('should return 404 for unknown mock paths', async () => {
        const promise = smartQueue.get('unknown/path');
        
        await vi.advanceTimersByTimeAsync(1000);

        const response = await promise;
        
        expect(response.status).toBe(404);
        expect(response.error).toContain("Mock data not found");
        expect(osmGet).not.toHaveBeenCalled();
    });

    it('should disable mock mode and resume real API calls', async () => {
        smartQueue.setMockMode(false);
        
        (osmGet as vi.Mock).mockResolvedValueOnce({ status: 200, data: 'real data', headers: new Headers() });

        const promise = smartQueue.get('ext/events/summary/');
        
        // Advance timer for rate limit (min time between requests)
        await vi.advanceTimersByTimeAsync(200);

        const response = await promise;

        expect(response.data).toBe('real data');
        expect(osmGet).toHaveBeenCalled();
    });
});
