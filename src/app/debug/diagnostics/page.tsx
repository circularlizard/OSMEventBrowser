"use client";

import { useEffect, useState, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // Assuming you have/need a Separator
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, RefreshCw, CheckCircle, XCircle, Clock, Server } from "lucide-react";
import { useRouter } from "next/navigation";
import { smartQueue } from "@/lib/smart-queue";
import { getAccessToken, getRefreshToken } from "@/lib/auth"; // For auth status
import { osmGet } from "@/lib/osm/api"; // Direct osmGet for testing proxy
import { getDefaultSection, getCurrentTerm, extractSections, extractTermsForSection } from "@/lib/osm/data-helpers"; // For initial context

interface TestResult {
    id: string;
    name: string;
    status: 'idle' | 'running' | 'passed' | 'failed';
    message?: string;
    details?: any;
    duration?: number;
}

type Action =
    | { type: 'START_TESTS' }
    | { type: 'TEST_RUNNING'; id: string }
    | { type: 'TEST_PASSED'; id: string; duration: number; message?: string; details?: any }
    | { type: 'TEST_FAILED'; id: string; duration: number; message: string; details?: any }
    | { type: 'RESET_TESTS' }
    | { type: 'SET_GLOBAL_MESSAGE'; message: string; type: 'info' | 'error' | 'success' };

const initialState: { tests: TestResult[]; globalMessage: { message: string; type: 'info' | 'error' | 'success' } | null } = {
    tests: [],
    globalMessage: null,
};

function testsReducer(state: typeof initialState, action: Action): typeof initialState {
    switch (action.type) {
        case 'RESET_TESTS':
            return {
                ...initialState,
                tests: state.tests.map(test => ({ ...test, status: 'idle', message: undefined, details: undefined, duration: undefined })),
            };
        case 'START_TESTS':
            return {
                ...state,
                globalMessage: { message: "Running API diagnostics...", type: 'info' },
                tests: state.tests.map(test => ({ ...test, status: 'idle', message: undefined, details: undefined, duration: undefined })),
            };
        case 'TEST_RUNNING':
            return {
                ...state,
                tests: state.tests.map(test =>
                    test.id === action.id ? { ...test, status: 'running' } : test
                ),
            };
        case 'TEST_PASSED':
            return {
                ...state,
                tests: state.tests.map(test =>
                    test.id === action.id ? { ...test, status: 'passed', duration: action.duration, message: action.message, details: action.details } : test
                ),
                globalMessage: null,
            };
        case 'TEST_FAILED':
            return {
                ...state,
                tests: state.tests.map(test =>
                    test.id === action.id ? { ...test, status: 'failed', duration: action.duration, message: action.message, details: action.details } : test
                ),
                globalMessage: { message: "Some tests failed. Check individual results.", type: 'error' },
            };
        case 'SET_GLOBAL_MESSAGE':
            return { ...state, globalMessage: { message: action.message, type: action.type } };
        default:
            return state;
    }
}


export default function DiagnosticsPage() {
    const router = useRouter();
    const [state, dispatch] = useReducer(testsReducer, initialState);
    const [sectionContext, setSectionContext] = useState<{ sectionId: string; termId: string } | null>(null);
    const [allSections, setAllSections] = useState<OSMSection[]>([]);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0); // For multi-section testing

    // Initialize tests definitions
    useEffect(() => {
        const initialTests: TestResult[] = [
            { id: 'auth_check', name: 'Authentication Check', status: 'idle' },
            { id: 'startup_data', name: 'Startup Data Fetch', status: 'idle' },
            { id: 'get_patrols', name: 'Get Patrols', status: 'idle' },
            { id: 'get_members', name: 'Get Members Grid (POST)', status: 'idle' },
            { id: 'get_events_summary', name: 'Get Events Summary', status: 'idle' },
            { id: 'get_event_details_v3', name: 'Get Event Details (v3)', status: 'idle' },
            { id: 'members_events_summary', name: 'Aggregated Data (Members/Events)', status: 'idle' },
        ];
        dispatch({ type: 'RESET_TESTS', tests: initialTests as any }); // Cast because reducer expects state.tests, not an array
    }, []);

    // Effect to set up section context
    useEffect(() => {
        async function loadContext() {
            try {
                // Fetch startup data to get sections
                const response = await fetch("/api/debug-startup");
                const result = await response.json();
                if (result.data) {
                    const sections = extractSections(result.data);
                    setAllSections(sections);
                    if (sections.length > 0) {
                        const defaultSection = getDefaultSection(result.data) || sections[0];
                        const currentTerm = getCurrentTerm(result.data, defaultSection.sectionId);
                        if (currentTerm) {
                            setSectionContext({ sectionId: defaultSection.sectionId, termId: currentTerm.termId });
                        } else {
                            dispatch({ type: 'SET_GLOBAL_MESSAGE', message: "Could not find current term for default section.", type: 'error' });
                        }
                    } else {
                        dispatch({ type: 'SET_GLOBAL_MESSAGE', message: "No sections found. Ensure user is logged in with active sections.", type: 'error' });
                    }
                } else {
                    dispatch({ type: 'SET_GLOBAL_MESSAGE', message: "Failed to fetch startup data.", type: 'error' });
                }
            } catch (err: any) {
                dispatch({ type: 'SET_GLOBAL_MESSAGE', message: `Failed to load context: ${err.message}`, type: 'error' });
                console.error("Failed to load diagnostic context:", err);
            }
        }
        loadContext();
    }, []);

    const runAllTests = async () => {
        dispatch({ type: 'START_TESTS' });

        if (!sectionContext) {
            dispatch({ type: 'SET_GLOBAL_MESSAGE', message: "Section context not loaded. Cannot run tests.", type: 'error' });
            return;
        }

        const { sectionId, termId } = sectionContext;
        let allPassed = true;

        // Helper to run a single test
        const runTest = async (testId: string, testFn: () => Promise<any>) => {
            dispatch({ type: 'TEST_RUNNING', id: testId });
            const start = performance.now();
            try {
                const result = await testFn();
                const duration = performance.now() - start;
                if (result.status && result.status >= 400 && result.status !== 401) { // 401 for auth check is handled
                    throw new Error(`API returned status ${result.status}`);
                }
                dispatch({ type: 'TEST_PASSED', id: testId, duration, details: result });
                return true;
            } catch (error: any) {
                const duration = performance.now() - start;
                allPassed = false;
                dispatch({ type: 'TEST_FAILED', id: testId, duration, message: error.message || "Unknown error", details: error });
                return false;
            }
        };

        // --- Run Tests ---

        // 1. Authentication Check
        await runTest('auth_check', async () => {
            const token = await getAccessToken();
            if (!token) throw new Error("No access token found. Not authenticated.");
            return { status: 200, message: "Access token found." };
        });
        if (!allPassed) return; // Stop if auth fails

        // 2. Startup Data - already fetched to get context, but verifies it
        await runTest('startup_data', async () => {
            const response = await osmGet("ext/generic/startup", { action: "getData" });
            if (response.error || !response.data) throw new Error(response.error || "No data returned.");
            if (!extractSections(response.data).length) throw new Error("No sections in startup data.");
            return response;
        });

        // 3. Get Patrols
        await runTest('get_patrols', async () => {
            const response = await smartQueue.get(`ext/members/patrols?action=getPatrols&sectionid=${sectionId}`);
            if (response.error || !response.data) throw new Error(response.error || "No data returned.");
            if (!response.data.patrols || !response.data.patrols.length) throw new Error("No patrols found in data.");
            return response;
        });

        // 4. Get Members Grid (POST)
        await runTest('get_members', async () => {
            // Need to directly use callExternalOsmApi with proper headers and body
            const response = await smartQueue.post(
                `ext/members/contact/grid/?action=getMembers`,
                `section_id=${encodeURIComponent(sectionId)}&term_id=${encodeURIComponent(termId)}`,
            );
            // The smartQueue.post might need to accept customHeaders for this to work correctly
            // smartQueue.post currently defaults to application/json
            // Let's call osmPost directly for now, or adapt smartQueue.post
            // OK, smartQueue.post calls osmPost, which defaults to application/json
            // We need a way to send x-www-form-urlencoded
            // This is a design flaw in smartQueue/osmApi.post if it cannot handle this.
            
            // For now, let's make a direct call for this specific test
            // This bypasses smartQueue rate limiting for one test, but validates endpoint
            
            const rawResponse = await fetch(`/api/osm/ext/members/contact/grid/?action=getMembers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `section_id=${encodeURIComponent(sectionId)}&term_id=${encodeURIComponent(termId)}`,
            });
            const data = await rawResponse.json();
            if (!rawResponse.ok || data.error || !data.data?.members?.length) throw new Error(data.error || "No members data returned.");
            return { status: rawResponse.status, data };

        });
        
        // 5. Get Events Summary
        let sampleEventId: string | undefined;
        await runTest('get_events_summary', async () => {
            const response = await smartQueue.get(`ext/events/summary/?action=get&sectionid=${sectionId}&termid=${termId}`);
            if (response.error || !response.data?.items?.length) throw new Error(response.error || "No events returned.");
            sampleEventId = response.data.items[0].eventid;
            return response;
        });

        // 6. Get Event Details (v3) - requires sampleEventId
        if (sampleEventId) {
            await runTest('get_event_details_v3', async () => {
                const response = await smartQueue.get(`v3/events/event/${sampleEventId}/summary?sectionid=${sectionId}&termid=${termId}`);
                if (response.error || !response.data?.eventid) throw new Error(response.error || "No v3 event details returned.");
                return response;
            });
        } else {
            allPassed = false;
            dispatch({ type: 'TEST_FAILED', id: 'get_event_details_v3', duration: 0, message: "Skipped: No sample event ID from summary fetch.", details: null });
        }
        
        // 7. Aggregated Data (Members/Events)
        await runTest('members_events_summary', async () => {
            const response = await smartQueue.get(`members-events-summary?sectionId=${sectionId}&termId=${termId}`);
            if (response.error || !response.data) throw new Error(response.error || "No aggregated data returned.");
            if (!response.data.members?.length || !response.data.events?.length) throw new Error("Aggregated data missing members or events.");
            return response;
        });


        if (allPassed) {
            dispatch({ type: 'SET_GLOBAL_MESSAGE', message: "All API diagnostics passed!", type: 'success' });
        }
    };

    const getTestStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'passed': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'running': return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
            default: return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    const StatusBadge = ({ status }: { status: TestResult['status'] }) => {
        switch (status) {
            case 'passed': return <Badge variant="secondary" className="bg-green-100 text-green-700">Passed</Badge>;
            case 'failed': return <Badge variant="destructive">Failed</Badge>;
            case 'running': return <Badge className="bg-blue-100 text-blue-700">Running</Badge>;
            default: return <Badge variant="outline">Idle</Badge>;
        }
    };

    const allTestsPassed = state.tests.every(t => t.status === 'passed' || t.status === 'idle'); // If idle, assume not failed yet

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background px-6 py-4 shadow-sm">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <h1 className="text-xl font-bold">API Diagnostics</h1>
            </header>

            <main className="flex-1 p-8 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Diagnostic Test Runner</span>
                            <div className="flex gap-2">
                                <Button onClick={runAllTests} disabled={state.globalMessage?.type === 'info'} className="flex gap-2">
                                    <Play className="h-4 w-4" /> Run All Tests
                                </Button>
                                <Button variant="outline" onClick={() => dispatch({ type: 'RESET_TESTS' })}>
                                    <RefreshCw className="h-4 w-4" /> Reset
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {state.globalMessage && (
                            <div className={`p-3 rounded-md text-sm ${state.globalMessage.type === 'error' ? 'bg-red-100 text-red-800' : state.globalMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {state.globalMessage.message}
                            </div>
                        )}
                        {!sectionContext && !state.globalMessage && (
                             <div className="p-3 rounded-md bg-yellow-100 text-yellow-800 text-sm">
                                Initializing test context...
                             </div>
                        )}
                        {sectionContext && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Server className="h-4 w-4" />
                                <span>Testing with Section: <Badge>{sectionContext.sectionId}</Badge>, Term: <Badge>{sectionContext.termId}</Badge></span>
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-3">
                            {state.tests.map((test) => (
                                <div key={test.id} className="flex items-center gap-3">
                                    <div className="w-6 flex-shrink-0">
                                        {getTestStatusIcon(test.status)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{test.name}</p>
                                        {test.message && (
                                            <p className={`text-xs ${test.status === 'failed' ? 'text-red-600' : 'text-gray-500'}`}>
                                                {test.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        {test.duration !== undefined && (
                                            <p className="text-xs text-muted-foreground">{test.duration.toFixed(2)} ms</p>
                                        )}
                                        <StatusBadge status={test.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {state.tests.some(t => t.details) && (
                    <Card>
                        <CardHeader><CardTitle>Test Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {state.tests.filter(t => t.details).map(test => (
                                <div key={`details-${test.id}`}>
                                    <h3 className="font-semibold text-lg mb-2">{test.name} Details</h3>
                                    <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto">
                                        <code>{JSON.stringify(test.details, null, 2)}</code>
                                    </pre>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
