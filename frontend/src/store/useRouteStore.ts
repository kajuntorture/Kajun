import { create } from "zustand";

export interface ActiveRoute {
  id: string;
  name: string;
}

interface RouteState {
  activeRoute: ActiveRoute | null;
  setActiveRoute: (route: ActiveRoute | null) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  activeRoute: null,
  setActiveRoute: (route) => set({ activeRoute: route }),
}));
