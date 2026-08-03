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

/**
 * Local app state — onboarding, profile, and preferences.
 *
 * Authentication is now handled exclusively by Clerk (via `useAuth()`).
 * This store no longer tracks `isAuthenticated` / `setAuthenticated`.
 * The `logout` action only resets local app state — the actual sign-out
 * is performed via `useClerk().signOut()` in the UI layer.
 */
interface AppState {
  hasCompletedOnboarding: boolean;
  isUnderAge: boolean;
  profile: OnboardingProfile;
  setOnboardingComplete: (value: boolean) => void;
  setIsUnderAge: (value: boolean) => void;
  /** Merge a partial answer into the profile as the user moves through onboarding. */
  updateProfile: (patch: Partial<OnboardingProfile>) => void;
  /** Reset local state after Clerk sign-out. */
  logout: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  hasCompletedOnboarding: false,
  isUnderAge: false,
  profile: emptyProfile,
  setOnboardingComplete: (value) => set({ hasCompletedOnboarding: value }),
  setIsUnderAge: (value) => set({ isUnderAge: value }),
  updateProfile: (patch) =>
    set((state) => ({ profile: { ...state.profile, ...patch } })),
  logout: () =>
    set({
      hasCompletedOnboarding: false,
      isUnderAge: false,
      profile: emptyProfile,
    }),
}));
