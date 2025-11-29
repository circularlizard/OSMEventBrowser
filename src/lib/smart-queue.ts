// src/lib/smart-queue.ts

import { osmGet, osmPost, osmPut, osmDelete, OSMApiResponse } from "./osm/api";

// Assuming we'll have a centralized debug logger
const debugLog = (...args: any[]) => {
    // For now, log if in development environment. The store will control a more granular debugMode.
    if (process.env.NODE_ENV === 'development') {
        console.log("[SmartQueue]", ...args);
    }
};

interface QueuedRequest<T> {
    id: string; // Unique ID for the request
    resolve: (value: OSMApiResponse<T>) => void;
    reject: (reason?: any) => void;
    execute: () => Promise<OSMApiResponse<T>>;
    retries: number;
    path: string;
    method: string;
}

interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number; // Unix timestamp in seconds
    retryAfter?: number; // In seconds
}

export class SmartQueue {
    private queue: QueuedRequest<any>[] = [];
    private isProcessing = false;
    private rateLimitInfo: RateLimitInfo = { limit: 1000, remaining: 1000, reset: 0 }; // Default max values
    private lastRequestTime = 0;
    private readonly MIN_TIME_BETWEEN_REQUESTS = 1000; // ms, prevent burst for safety
    private readonly RATE_LIMIT_THRESHOLD = 5; // Start pausing if remaining hits this

    constructor() {
        // Debug mode will be controlled via OsmStore and passed to SmartQueue calls if needed, not directly here.
    }

    private updateRateLimitInfo(headers: Headers): void {
        const limit = headers.get('X-RateLimit-Limit');
        const remaining = headers.get('X-RateLimit-Remaining');
        const reset = headers.get('X-RateLimit-Reset');
        const retryAfter = headers.get('Retry-After');

        if (limit && remaining && reset) {
            this.rateLimitInfo = {
                limit: parseInt(limit, 10),
                remaining: parseInt(remaining, 10),
                reset: parseInt(reset, 10) * 1000, // Convert to ms Unix timestamp
            };
            debugLog("Rate Limit Info Updated:", this.rateLimitInfo);
        }
        if (retryAfter) {
            this.rateLimitInfo.retryAfter = parseInt(retryAfter, 10);
            debugLog("Retry-After header received:", this.rateLimitInfo.retryAfter);
        }
    }

    private async waitForNextRequest(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        // Ensure minimum time between requests
        if (timeSinceLastRequest < this.MIN_TIME_BETWEEN_REQUESTS) {
            const delay = this.MIN_TIME_BETWEEN_REQUESTS - timeSinceLastRequest;
            debugLog(`Throttling: Waiting ${delay}ms before next request.`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Check rate limit threshold
        if (this.rateLimitInfo.remaining <= this.RATE_LIMIT_THRESHOLD) {
            const resetTime = this.rateLimitInfo.reset;
            const delay = Math.max(0, resetTime - Date.now() + 1000); // Add 1 sec buffer
            
            if (delay > 0) {
                debugLog(`Rate Limit: Pausing for ${delay}ms until reset at ${new Date(resetTime).toLocaleTimeString()}. Remaining: ${this.rateLimitInfo.remaining}`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // Check for Retry-After
        if (this.rateLimitInfo.retryAfter) {
            const delay = (this.rateLimitInfo.retryAfter * 1000) + 1000; // Convert to ms + 1 sec buffer
            debugLog(`Rate Limit: Received 429, pausing for ${delay}ms (Retry-After).`);
            this.rateLimitInfo.retryAfter = undefined; // Clear after handling
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const request = this.queue[0]; // Peek at the next request

            await this.waitForNextRequest();

            try {
                debugLog(`Executing request: ${request.method} ${request.path}`);
                this.lastRequestTime = Date.now();
                const response = await request.execute();
                
                this.updateRateLimitInfo(response.headers);

                // Check for Hard Block (403 with specific message)
                if (response.status === 403 && response.error && response.error.includes("Blocked")) {
                    debugLog("CRITICAL: Application is BLOCKED by OSM. Aborting all pending requests.");
                    this.queue = []; // Kill the queue
                    this.isProcessing = false;
                    request.reject(new Error("CRITICAL: Application is BLOCKED by OSM. Please stop testing and wait."));
                    return; // Stop the loop
                }

                if (response.status === 429) {
                    debugLog("Received 429 from proxy, retrying after pause.");
                    this.updateRateLimitInfo(response.headers); // Update with Retry-After
                    continue; // Re-evaluate wait and retry this request
                }
                
                // If the response is not a 401 from OSM, then it's a success
                // The proxy handles 401s internally, so if we get a 401 here, something went wrong with refresh
                if (response.status === 401) {
                    debugLog("Received 401 from proxy after refresh attempt, rejecting request.");
                    this.queue.shift(); // Remove from queue
                    request.reject(new Error(response.error || "Authentication failed after refresh."));
                    // Clear all rate limit info to force re-auth
                    this.rateLimitInfo = { limit: 1000, remaining: 0, reset: 0 };
                    // Optionally, trigger a global re-authentication flow here.
                    continue; 
                }

                // If successful or handled, remove from queue and resolve
                this.queue.shift();
                request.resolve(response);

            } catch (error) {
                debugLog(`Request failed for ${request.path}:`, error);
                if (request.retries < 3) { // Simple retry mechanism
                    request.retries++;
                    debugLog(`Retrying request for ${request.path}. Attempt ${request.retries}`);
                    // Re-add to front of queue or wait for a bit
                    await new Promise(resolve => setTimeout(resolve, 1000 * request.retries)); // Exponential backoff
                    // This will loop and process this request again, update rate limit info and then re-execute.
                } else {
                    this.queue.shift();
                    request.reject(error);
                }
            }
        }
        this.isProcessing = false;
        debugLog("SmartQueue finished processing.");
    }

    private enqueue<T>(execute: () => Promise<OSMApiResponse<T>>, path: string, method: string): Promise<OSMApiResponse<T>> {
        return new Promise<OSMApiResponse<T>>((resolve, reject) => {
            const request: QueuedRequest<T> = {
                id: Math.random().toString(36).substring(2, 15), // Simple unique ID
                resolve,
                reject,
                execute,
                retries: 0,
                path,
                method,
            };
            this.queue.push(request);
            debugLog(`Request enqueued: ${method} ${path}. Queue size: ${this.queue.length}`);
            // Start processing if not already, and catch any unhandled promise rejections from the background
            this.processQueue().catch(err => {
                debugLog("Unhandled rejection in background queue processing (should be handled by request.reject):", err);
            });
        });
    }

    public get<T>(path: string, params?: Record<string, string>): Promise<OSMApiResponse<T>> {
        const execute = () => osmGet<T>(path, params);
        const fullPath = `${path}${params ? `?${new URLSearchParams(params)}` : ""}`;
        return this.enqueue(execute, fullPath, "GET");
    }

    public post<T>(path: string, body?: any, customHeaders?: HeadersInit): Promise<OSMApiResponse<T>> {
        const execute = () => osmPost<T>(path, body, customHeaders);
        return this.enqueue(execute, path, "POST");
    }

    public put<T>(path: string, body?: any): Promise<OSMApiResponse<T>> {
        const execute = () => osmPut<T>(path, body);
        return this.enqueue(execute, path, "PUT");
    }

    public delete<T>(path: string): Promise<OSMApiResponse<T>> {
        const execute = () => osmDelete<T>(path);
        return this.enqueue(execute, path, "DELETE");
    }

    // Helper for testing to wait until queue is drained
    public async waitForIdle(): Promise<void> {
        while (this.isProcessing || this.queue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
}

export const smartQueue = new SmartQueue();
