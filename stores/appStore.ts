import { create } from 'zustand';

/**
 * Answers collected during onboarding. Kept flat and serializable so it can
 * be written straight to Supabase later. Nulls/empties mean "not answered yet".
 */
export interface OnboardingProfile {
  ageRange: string | null;
  /** "What brings you here" — multi-select focus areas. */
  focusAreas: string[];
  /** The single outcome that defines success for this user. */
  primaryGoal: string | null;
  triggers: string[];
  lifeImpact: string[];
  supportPreference: string | null;
  dailyCommitment: string | null;
  completedAt: string | null;
}

const emptyProfile: OnboardingProfile = {
  ageRange: null,
  focusAreas: [],
  primaryGoal: null,
  triggers: [],
  lifeImpact: [],
  supportPreference: null,
  dailyCommitment: null,
  completedAt: null,
};

interface AppState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isUnderAge: boolean;
  profile: OnboardingProfile;
  setAuthenticated: (value: boolean) => void;
  setOnboardingComplete: (value: boolean) => void;
  setIsUnderAge: (value: boolean) => void;
  /** Merge a partial answer into the profile as the user moves through onboarding. */
  updateProfile: (patch: Partial<OnboardingProfile>) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isUnderAge: false,
  profile: emptyProfile,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setOnboardingComplete: (value) => set({ hasCompletedOnboarding: value }),
  setIsUnderAge: (value) => set({ isUnderAge: value }),
  updateProfile: (patch) =>
    set((state) => ({ profile: { ...state.profile, ...patch } })),
  logout: () =>
    set({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      isUnderAge: false,
      profile: emptyProfile,
    }),
}));
