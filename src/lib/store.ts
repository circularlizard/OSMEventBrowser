// src/lib/store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OSMEvent, AggregatedMember, AggregatedPatrol } from './osm/services';
import { OSMSection, OSMTerm } from './osm/data-helpers';

// --- Interfaces for Normalized Data ---
// DetailedEvent will be OSMEvent but enriched with v3 details
export interface DetailedEvent extends OSMEvent {
  // Add any specific fields from v3/events/event/{id}/summary not in OSMEvent
  customFields?: Record<string, any>;
  attendanceRecords?: Record<string, EventAttendanceRecord>; // Keyed by scoutid
}

export interface EventAttendanceRecord {
  scoutid: string;
  attending: string;
  payment: string;
  // Other fields relevant to attendance per event
}

// --- Store State ---
export interface OsmState {
  // Configurable/User Preferences
  selectedSectionIds: string[]; // Max 3
  debugMode: boolean;

  // Raw fetched sections/terms (from startup data)
  availableSections: OSMSection[];
  availableTerms: Record<string, OSMTerm[]>; // Keyed by sectionId

  // Normalized Data Tables (Main data storage)
  // Events will eventually be enriched DetailedEvent
  events: Record<string, DetailedEvent>; // Keyed by eventId
  members: Record<string, AggregatedMember>; // Keyed by memberId
  patrols: Record<string, AggregatedPatrol>; // Keyed by patrolId

  // Hydration Status (per section or globally)
  hydrationStatus: 'idle' | 'pending' | 'skeleton' | 'hydrating' | 'complete' | 'error';
  hydrationProgress: number; // 0-100

  // Actions
  setSelectedSectionIds: (ids: string[]) => void;
  setDebugMode: (enabled: boolean) => void;
  setAvailableSections: (sections: OSMSection[]) => void;
  setAvailableTerms: (terms: Record<string, OSMTerm[]>) => void;
  setHydrationStatus: (status: OsmState['hydrationStatus']) => void;
  setHydrationProgress: (progress: number) => void;
  addEvents: (events: DetailedEvent[]) => void;
  addMembers: (members: AggregatedMember[]) => void;
  addPatrols: (patrols: AggregatedPatrol[]) => void;
  updateEventAttendance: (eventId: string, attendance: Record<string, EventAttendanceRecord>) => void; // For detail hydration
  updateEventCustomFields: (eventId: string, customFields: Record<string, any>) => void; // For detail hydration
  resetStore: () => void;
}

// --- Store Creation ---
export const useOsmStore = create<OsmState>()(
  persist(
    (set, get) => ({
      selectedSectionIds: [],
      debugMode: false,
      availableSections: [],
      availableTerms: {},
      events: {},
      members: {},
      patrols: {},
      hydrationStatus: 'idle',
      hydrationProgress: 0,

      setSelectedSectionIds: (ids) => set({ selectedSectionIds: ids }),
      setDebugMode: (enabled) => set({ debugMode: enabled }),
      setAvailableSections: (sections) => set({ availableSections: sections }),
      setAvailableTerms: (terms) => set({ availableTerms: terms }),
      setHydrationStatus: (status) => set({ hydrationStatus: status }),
      setHydrationProgress: (progress) => set({ hydrationProgress: progress }),
      
      addEvents: (newEvents) => set((state) => ({
        events: { ...state.events, ...newEvents.reduce((acc, event) => ({ ...acc, [event.eventid]: event }), {}) },
      })),
      addMembers: (newMembers) => set((state) => ({
        members: { ...state.members, ...newMembers.reduce((acc, member) => ({ ...acc, [member.member_id]: member }), {}) },
      })),
      addPatrols: (newPatrols) => set((state) => ({
        patrols: { ...state.patrols, ...newPatrols.reduce((acc, patrol) => ({ ...acc, [patrol.patrolid]: patrol }), {}) },
      })),
      
      updateEventAttendance: (eventId, newAttendance) => set((state) => ({
        events: {
          ...state.events,
          [eventId]: state.events[eventId] ? { ...state.events[eventId], attendanceRecords: newAttendance } : state.events[eventId],
        },
      })),
      updateEventCustomFields: (eventId, customFields) => set((state) => ({
        events: {
          ...state.events,
          [eventId]: state.events[eventId] ? { ...state.events[eventId], customFields: customFields } : state.events[eventId],
        },
      })),

      resetStore: () => set((state) => ({
        selectedSectionIds: [],
        availableSections: [],
        availableTerms: {},
        events: {},
        members: {},
        patrols: {},
        hydrationStatus: 'idle',
        hydrationProgress: 0,
      })),
    }),
    {
      name: 'osm-storage', // unique name for localStorage
      partialize: (state) => ({ debugMode: state.debugMode, selectedSectionIds: state.selectedSectionIds }), // persist only debugMode and selectedSectionIds
    }
  )
);
