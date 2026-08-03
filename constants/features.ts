/**
 * Feature flags. The app currently focuses on the core recovery journey
 * (check-in, calendar, coach, mind training, progress) — Community is built
 * and preserved, just gated off until the user base grows enough to sustain
 * it. Flip `communityEnabled` to `true` to bring the real feed back with no
 * other changes: app/(tabs)/community.tsx already branches on this flag.
 */
export const FEATURES = {
  communityEnabled: false,
} as const;
