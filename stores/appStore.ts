import { create } from 'zustand';

interface AppState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isUnderAge: boolean;
  setAuthenticated: (value: boolean) => void;
  setOnboardingComplete: (value: boolean) => void;
  setIsUnderAge: (value: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isUnderAge: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setOnboardingComplete: (value) => set({ hasCompletedOnboarding: value }),
  setIsUnderAge: (value) => set({ isUnderAge: value }),
  logout: () =>
    set({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      isUnderAge: false,
    }),
}));
