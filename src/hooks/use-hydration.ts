import { useEffect, useCallback } from 'react';
import { useOsmStore } from '@/lib/store';
import { smartQueue } from '@/lib/smart-queue';
import { extractTermsForSection, getCurrentTerm } from '@/lib/osm/data-helpers';
import { getEvents, getPatrols, OSMEvent, AggregatedPatrol, AggregatedMember } from '@/lib/osm/services';

/**
 * Hook to manage data hydration for selected sections.
 * It orchestrates the fetching of data via SmartQueue and updates the OsmStore.
 */
export function useHydration() {
    const {
        selectedSectionIds,
        hydrationStatus,
        setHydrationStatus,
        setHydrationProgress,
        addEvents,
        addPatrols,
        addMembers,
        availableSections, // We need to know about sections to find terms? 
        // Actually, we might need to fetch startup data first if not present.
        // But SectionPicker ensures we have startup data before setting selectedSectionIds?
        // Wait, SectionPicker fetches startup data locally. It doesn't save it to 'availableSections' in store explicitly yet.
        // We should probably fix that in SectionPicker or re-fetch here if needed.
    } = useOsmStore();

    const hydrate = useCallback(async () => {
        if (selectedSectionIds.length === 0) return;
        if (hydrationStatus === 'hydrating' || hydrationStatus === 'complete') return;

        setHydrationStatus('hydrating');
        setHydrationProgress(0);

        try {
            // 1. Ensure we have context (Terms) for selected sections
            // In a real app, we might store 'availableTerms' in the store.
            // For now, let's re-fetch startup data to get terms if we don't have them easier way?
            // Or assume SectionPicker pushed them? SectionPicker didn't push terms.
            // Let's fetch startup data using SmartQueue (it's fast/cached/mocked).
            
            const startupRes = await smartQueue.get("ext/generic/startup", { action: "getData" });
            if (startupRes.error || !startupRes.data) throw new Error("Failed to load startup context");
            
            const startupData = typeof startupRes.data === 'string' ? JSON.parse(startupRes.data.replace("var data_holder = ", "").replace(";", "")) : startupRes.data;

            const tasks: Promise<void>[] = [];
            let completedTasks = 0;
            const totalTasks = selectedSectionIds.length * 2; // Events + Patrols per section

            const updateProgress = () => {
                completedTasks++;
                setHydrationProgress(Math.round((completedTasks / totalTasks) * 100));
            };

            // 2. Fetch Data for each selected section
            for (const sectionId of selectedSectionIds) {
                const term = getCurrentTerm(startupData, sectionId);
                if (!term) {
                    console.warn(`No current term found for section ${sectionId}`);
                    continue; 
                }

                // Fetch Patrols
                tasks.push(
                    smartQueue.get(`ext/members/patrols?action=getPatrols&sectionid=${sectionId}`)
                        .then(res => {
                            if (res.data && res.data.patrols) {
                                // Map to AggregatedPatrol structure (initially empty members)
                                const patrols: AggregatedPatrol[] = res.data.patrols.map((p: any) => ({
                                    patrolid: p.patrolid,
                                    name: p.name,
                                    members: [] // Will be populated by event details later
                                }));
                                addPatrols(patrols);
                            }
                        })
                        .finally(updateProgress)
                );

                // Fetch Events Summary
                tasks.push(
                    smartQueue.get(`ext/events/summary/?action=get&sectionid=${sectionId}&termid=${term.termId}`)
                        .then(res => {
                            if (res.data && res.data.items) {
                                // These are basic OSMEvents. We add them to store.
                                // They will be "DetailedEvent" but with missing optional fields initially.
                                addEvents(res.data.items);
                            }
                        })
                        .finally(updateProgress)
                );
            }

            await Promise.all(tasks);
            setHydrationStatus('skeleton'); // Skeleton loaded. Detail hydration would happen next (Phase 9.2)

        } catch (error) {
            console.error("Hydration failed:", error);
            setHydrationStatus('error');
        }
    }, [selectedSectionIds, hydrationStatus, setHydrationStatus, setHydrationProgress, addEvents, addPatrols]);

    useEffect(() => {
        if (selectedSectionIds.length > 0 && hydrationStatus === 'idle') {
            hydrate();
        }
    }, [selectedSectionIds, hydrationStatus, hydrate]);

    return {
        isLoading: hydrationStatus === 'hydrating',
        progress: useOsmStore(state => state.hydrationProgress),
        status: hydrationStatus
    };
}
