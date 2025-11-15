import { create } from "zustand";

export interface LocalTrackPoint {
  timestamp: string; // ISO string in UTC
  lat: number;
  lon: number;
  speed_kn?: number;
  course_deg?: number;
}

interface TrackState {
  currentTrackId: string | null;
  isTracking: boolean;
  points: LocalTrackPoint[];
  startTrack: (trackId: string) => void;
  stopTrack: () => void;
  addPoint: (point: LocalTrackPoint) => void;
  reset: () => void;
}

export const useTrackStore = create<TrackState>((set) => ({
  currentTrackId: null,
  isTracking: false,
  points: [],
  startTrack: (trackId: string) =>
    set({ currentTrackId: trackId, isTracking: true, points: [] }),
  stopTrack: () => set({ isTracking: false }),
  addPoint: (point: LocalTrackPoint) =>
    set((state) => ({ points: [...state.points, point] })),
  reset: () => set({ currentTrackId: null, isTracking: false, points: [] }),
}));
