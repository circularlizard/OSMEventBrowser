import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OSMApiResponse } from './osm/api';

// Mock the osm/api module
vi.mock('./osm/api'); 

// Get references to the mocked functions for setting up mock behavior
import { osmGet, osmPost, osmPut, osmDelete } from './osm/api';

// --- IMPORTANT: Load the actual SmartQueue module using vi.importActual ---
const SmartQueueModule = vi.importActual<typeof import('./smart-queue')>('./smart-queue');
const SmartQueue = SmartQueueModule.SmartQueue;

// Mock localStorage for debug mode check
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


describe('SmartQueue', () => {
    let smartQueue: InstanceType<typeof SmartQueue>;

    beforeEach(async () => {
        // Clear localStorage
        localStorage.clear();
        
        // Reset mocks
        vi.resetAllMocks();

        // Re-instantiate SmartQueue
        const Module = await SmartQueueModule;
        smartQueue = new Module.SmartQueue();

        vi.spyOn(smartQueue as any, 'waitForNextRequest').mockImplementation(async () => {
            // We still need to use fake timers, but this spy allows us to verify it's called if needed
            // Or simply removing it and relying on FakeTimers is better if we want to test the logic inside.
            // The previous issue was potentially double-spying or misconfiguration.
            
            // If we want to test the logic INSIDE waitForNextRequest (rate limiting), we must NOT mock it.
            // So let's NOT mock it, but use FakeTimers.
        });
        
        // Actually, removing the spy entirely is safer if we want to test the real logic.
        vi.restoreAllMocks(); 
        
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should enqueue and process GET requests in order', async () => {
        (osmGet as vi.Mock).mockResolvedValueOnce({ status: 200, data: 'data1', headers: new Headers() });
        (osmGet as vi.Mock).mockResolvedValueOnce({ status: 200, data: 'data2', headers: new Headers() });

        const promise1 = smartQueue.get('/path1');
        const promise2 = smartQueue.get('/path2');

        // Advance time to bypass MIN_TIME_BETWEEN_REQUESTS
        await vi.advanceTimersByTimeAsync(200); 

        await expect(promise1).resolves.toEqual({ status: 200, data: 'data1', headers: expect.any(Headers) });
        
        await vi.advanceTimersByTimeAsync(200);
        
        await expect(promise2).resolves.toEqual({ status: 200, data: 'data2', headers: expect.any(Headers) });
        
        expect(osmGet).toHaveBeenCalledTimes(2);
    });

    it('should pause and retry on 429 Too Many Requests', async () => {
        const headers429 = new Headers();
        headers429.set('Retry-After', '2'); // Retry after 2 seconds

        (osmGet as vi.Mock).mockResolvedValueOnce({ status: 429, error: 'Too Many Requests', headers: headers429 });
        (osmGet as vi.Mock).mockResolvedValueOnce({ status: 200, data: 'data', headers: new Headers() });

        const promise = smartQueue.get('/path');

        // Process first request
        await vi.advanceTimersByTimeAsync(200);
        
        expect(osmGet).toHaveBeenCalledTimes(1); 

        // Advance by Retry-After time (2000ms) + buffer
        await vi.advanceTimersByTimeAsync(3000);

        await expect(promise).resolves.toEqual({ status: 200, data: 'data', headers: expect.any(Headers) });
        expect(osmGet).toHaveBeenCalledTimes(2);
    });

    it('should pause when X-RateLimit-Remaining is below threshold', async () => {
        const headersLowRemaining = new Headers();
        headersLowRemaining.set('X-RateLimit-Limit', '1000');
        headersLowRemaining.set('X-RateLimit-Remaining', '4'); // Below threshold (5)
        // Reset in 10s. Use a fixed timestamp to avoid Date.now() variance in tests if possible, 
        // but the class uses Date.now(). FakeTimers mocks Date.now() too!
        // So:
        const now = Date.now(); // This is the mocked time
        headersLowRemaining.set('X-RateLimit-Reset', String(Math.floor(now / 1000) + 10)); 

        (osmGet as vi.Mock).mockResolvedValueOnce({ status: 200, data: 'data1', headers: headersLowRemaining });
        (osmGet as vi.Mock).mockResolvedValueOnce({ status: 200, data: 'data2', headers: new Headers() });

        const promise1 = smartQueue.get('/path1');
        const promise2 = smartQueue.get('/path2');

        // Process first request
        await vi.advanceTimersByTimeAsync(200);

        await expect(promise1).resolves.toEqual({ status: 200, data: 'data1', headers: headersLowRemaining });
        expect(osmGet).toHaveBeenCalledTimes(1); 
        
        // At this point, logic should see Remaining=4 and pause for ~10s.
        
        // Try to advance a little bit - second request should NOT happen yet
        await vi.advanceTimersByTimeAsync(2000);
        expect(osmGet).toHaveBeenCalledTimes(1); 

        // Advance past reset time (10s + 1s buffer)
        await vi.advanceTimersByTimeAsync(12000);

        await expect(promise2).resolves.toEqual({ status: 200, data: 'data2', headers: expect.any(Headers) });
        expect(osmGet).toHaveBeenCalledTimes(2);
    });

    it('should retry a failed request up to 3 times', async () => {
        // Setup fails 4 times (Original + 3 retries)
        (osmGet as vi.Mock).mockRejectedValueOnce(new Error('Network Error'));
        (osmGet as vi.Mock).mockRejectedValueOnce(new Error('Network Error'));
        (osmGet as vi.Mock).mockRejectedValueOnce(new Error('Network Error'));
        (osmGet as vi.Mock).mockRejectedValueOnce(new Error('Network Error'));

        const promise = smartQueue.get('/fail');
        // Attach error handler immediately to avoid "Unhandled Rejection"
        const validationPromise = expect(promise).rejects.toThrow('Network Error');

        // Attempt 1
        await vi.advanceTimersByTimeAsync(200);
        
        // Attempt 2 (1s backoff)
        await vi.advanceTimersByTimeAsync(1200);
        
        // Attempt 3 (2s backoff)
        await vi.advanceTimersByTimeAsync(2200);
        
        // Attempt 4 (3s backoff) -> This attempt fails and should trigger the final rejection
        await vi.advanceTimersByTimeAsync(3200);

        await validationPromise;
        expect(osmGet).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should reject immediately if authentication fails after refresh', async () => {
        (osmGet as vi.Mock).mockResolvedValueOnce({ status: 401, error: 'Authentication failed after refresh.', headers: new Headers() });

        const promise = smartQueue.get('/authfail');
        // Attach error handler immediately
        const validationPromise = expect(promise).rejects.toThrow('Authentication failed after refresh.');

        await vi.advanceTimersByTimeAsync(200);

        await validationPromise;
        expect(osmGet).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple request types (get, post, put, delete)', async () => {
        (osmGet as vi.Mock).mockResolvedValue({ status: 200, data: 'get', headers: new Headers() });
        (osmPost as vi.Mock).mockResolvedValue({ status: 200, data: 'post', headers: new Headers() });
        (osmPut as vi.Mock).mockResolvedValue({ status: 200, data: 'put', headers: new Headers() });
        (osmDelete as vi.Mock).mockResolvedValue({ status: 200, data: 'delete', headers: new Headers() });

        const pGet = smartQueue.get('/get');
        const pPost = smartQueue.post('/post', { key: 'value' });
        const pPut = smartQueue.put('/put', { key: 'value' });
        const pDelete = smartQueue.delete('/delete');

        await vi.advanceTimersByTimeAsync(200);
        await vi.advanceTimersByTimeAsync(200);
        await vi.advanceTimersByTimeAsync(200);
        await vi.advanceTimersByTimeAsync(200);

        await expect(pGet).resolves.toEqual({ status: 200, data: 'get', headers: expect.any(Headers) });
        await expect(pPost).resolves.toEqual({ status: 200, data: 'post', headers: expect.any(Headers) });
        await expect(pPut).resolves.toEqual({ status: 200, data: 'put', headers: expect.any(Headers) });
        await expect(pDelete).resolves.toEqual({ status: 200, data: 'delete', headers: expect.any(Headers) });
    });
});
