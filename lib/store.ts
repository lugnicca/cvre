/**
 * Zustand store for UI state management
 */

import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  currentView: 'onboarding' | 'dashboard' | 'optimize' | 'editor' | 'settings';
  optimizationStatus: 'idle' | 'analyzing' | 'optimizing' | 'saving';
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: UIState['currentView']) => void;
  setOptimizationStatus: (status: UIState['optimizationStatus']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentView: 'dashboard',
  optimizationStatus: 'idle',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
  setOptimizationStatus: (status) => set({ optimizationStatus: status }),
}));
