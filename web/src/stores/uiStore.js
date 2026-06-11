import { create } from "zustand";

// Pure client-side UI state (no server data lives here).
export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  facility: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setFacility: (facility) => set({ facility }),
}));
