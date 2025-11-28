import { describe, it, expect, beforeEach } from 'vitest';
import { useOsmStore, DetailedEvent } from './store';
import { AggregatedMember, AggregatedPatrol } from './osm/services';

describe('OsmStore', () => {
    // Reset store state before each test
    beforeEach(() => {
        useOsmStore.getState().resetStore();
    });

    it('should have initial state', () => {
        const state = useOsmStore.getState();
        expect(state.selectedSectionIds).toEqual([]);
        expect(state.debugMode).toBe(false); // Assuming default is false, persist might load from local storage but in test env it should be default or empty
        expect(state.events).toEqual({});
        expect(state.members).toEqual({});
        expect(state.patrols).toEqual({});
        expect(state.hydrationStatus).toBe('idle');
        expect(state.hydrationProgress).toBe(0);
    });

    it('should update selected section IDs', () => {
        const { setSelectedSectionIds } = useOsmStore.getState();
        setSelectedSectionIds(['123', '456']);
        expect(useOsmStore.getState().selectedSectionIds).toEqual(['123', '456']);
    });

    it('should toggle debug mode', () => {
        const { setDebugMode } = useOsmStore.getState();
        setDebugMode(true);
        expect(useOsmStore.getState().debugMode).toBe(true);
        setDebugMode(false);
        expect(useOsmStore.getState().debugMode).toBe(false);
    });

    it('should add events correctly', () => {
        const { addEvents } = useOsmStore.getState();
        const mockEvent: DetailedEvent = {
            eventid: 'e1',
            name: 'Test Event',
            startdate: '2023-01-01',
            enddate: '2023-01-01',
            starttime: '10:00',
            endtime: '12:00',
            location: 'HQ',
            notes: '',
            sectionid: '123',
            cost: '0',
            confidential: '',
            meeting_type: '',
            invited: 10,
            yes: 5,
            yes_members: 5,
            yes_yls: 0,
            yes_leaders: 0,
            no: 2,
            shown: 0,
            x: 0
        };

        addEvents([mockEvent]);
        expect(useOsmStore.getState().events['e1']).toEqual(mockEvent);
    });

    it('should add members correctly', () => {
        const { addMembers } = useOsmStore.getState();
        const mockMember: AggregatedMember = {
            member_id: 'm1',
            first_name: 'John',
            last_name: 'Doe',
            age: '10',
            patrol_id: 1,
            patrol: 'Tigers',
            active: true,
            attendance: []
        };

        addMembers([mockMember]);
        expect(useOsmStore.getState().members['m1']).toEqual(mockMember);
    });

    it('should add patrols correctly', () => {
        const { addPatrols } = useOsmStore.getState();
        const mockPatrol: AggregatedPatrol = {
            patrolid: 'p1',
            name: 'Tigers',
            members: []
        };

        addPatrols([mockPatrol]);
        expect(useOsmStore.getState().patrols['p1']).toEqual(mockPatrol);
    });

    it('should update hydration status and progress', () => {
        const { setHydrationStatus, setHydrationProgress } = useOsmStore.getState();
        setHydrationStatus('hydrating');
        setHydrationProgress(50);
        
        expect(useOsmStore.getState().hydrationStatus).toBe('hydrating');
        expect(useOsmStore.getState().hydrationProgress).toBe(50);
    });
});
