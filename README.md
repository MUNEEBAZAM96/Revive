# Revive — Recovery Companion 🌿

A private, judgment-free mobile app that supports people through addiction recovery. Built with [Expo](https://expo.dev) and React Native, with local-first data (SQLite) syncing to [Supabase](https://supabase.com) and [Clerk](https://clerk.com) handling auth.

> **Important disclaimer**
> Recovery Companion is a **self-help support tool, not medical care**. It is not a substitute for treatment from a doctor, therapist, or addiction specialist. If you are in danger or thinking about harming yourself, call your local emergency number (911 in the US), the 988 Suicide & Crisis Lifeline, or use the in-app crisis resources.

---

## Features

### 🚪 Onboarding
A guided multi-step flow shown after first sign-in (`app/(onboarding)/`):

1. **Age gate** (`age.tsx`) — year-of-birth check; users under 18 are shown a supportive stop screen instead of the app.
2. **Goal** (`goal.tsx`) — what recovery means to you.
3. **Focus** (`focus.tsx`) — the substance/behavior to focus on.
4. **Triggers** (`triggers.tsx`) — personal triggers (stress, loneliness, social events…).
5. **Impact** (`impact.tsx`) — how much recovery affects daily life.
6. **Support** (`support.tsx`) — support system check.
7. **Disclaimer** (`disclaimer.tsx`) — explicit "companion, not a replacement for professional help" agreement before entering the app.

### 📱 Main experience
Post-auth, the app is **one swipeable pager** (`components/navigation/MainNavigator.tsx`), not separate Expo Router tab routes — all five pages stay mounted so scroll position, chat drafts, and keyboard focus survive switching between them. A floating dock (`PremiumBottomBar`) and a draggable support bubble float above the pager on every page.

| Page | What it does |
|---|---|
| **Dashboard** (`DashboardScreen`) | Sobriety streak, daily missions, quick check-in access, and coping tips. |
| **Journey** (`JourneyScreen`) | Recovery timeline, achievements grid, statistics, and a growing tree that visualizes progress (`components/growth/`). |
| **Coach** (`CoachHome`) | Chat-style AI recovery coach (`app/coach-chat.tsx`) with voice input, quick actions, and a premium paywall for extended use. |
| **Community** | Peer feed of milestones/encouragement — currently feature-flagged off (see [`constants/features.ts`](constants/features.ts)) until the user base grows enough to sustain it; the screen is fully built and just gated. |
| **Settings** (`SettingsScreen`) | Profile/preferences, sign-out, and developer utilities. |

### 🧠 Mind-training games
`components/games/` holds a set of short recovery-focused mini-games (breathing rhythm, impulse control, memory garden, word builder, pattern match, and more), each driven by a shared `gameEngine.ts` and rewarded via `rewardService.ts` / `cosmeticsService.ts`.

### 🆘 Safety features (always available)
- **Panic Mode (SOS)** — a persistent red SOS button opens instantly (full-screen, no dismiss gesture) with an animated breathing circle, a 5-4-3-2-1 grounding exercise, and a direct path to crisis support (`app/(modals)/panic-mode.tsx`).
- **Crisis resources** — one-tap call/text links to the 988 Suicide & Crisis Lifeline, Crisis Text Line (text HOME to 741741), and the SAMHSA National Helpline (`app/(modals)/crisis-resources.tsx`).
- **Daily check-in** — quick mood, urge intensity (1–5), and an optional note (`app/(modals)/daily-check-in.tsx`).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) (managed workflow) / React Native 0.81 / React 19 |
| Navigation | [Expo Router 6](https://docs.expo.dev/router/introduction/) for top-level routes (auth, onboarding, modals); a custom swipeable pager (`components/navigation/`) for the main post-auth experience |
| Language | TypeScript (strict via `tsconfig.json`) |
| Styling | NativeWind (Tailwind for React Native) |
| Client state | [Zustand](https://zustand.docs.pmnd.rs/) (`stores/`) |
| Auth | [Clerk](https://clerk.com) (`@clerk/expo`) — owns sign-up/sign-in/session; see `services/auth.ts` |
| Local data | `expo-sqlite` (`database/`) via `repositories/`, local-first with a background sync queue |
| Sync backend | [Supabase](https://supabase.com) (`services/supabase.ts`, `sync/`) — Postgres + RLS, last-updated-wins conflict resolution |
| Animation | Reanimated 4 + React Native `Animated` |

## Project structure

```
recovery-companion/
├── app/                        # Expo Router routes (file-based navigation)
│   ├── _layout.tsx             # Root stack: ClerkProvider, fonts, global modals
│   ├── index.tsx               # "Switchboard" — redirects based on auth/onboarding state
│   ├── coach-chat.tsx          # Full-screen AI coach chat
│   ├── premium-paywall.tsx     # Subscription upsell
│   ├── (auth)/                 # Login, signup, verify-email (Clerk)
│   ├── (onboarding)/           # Age → goal → focus → triggers → impact → support → disclaimer
│   ├── (tabs)/index.tsx        # Single route that mounts MainNavigator (the swipeable pager)
│   └── (modals)/               # Panic mode, crisis resources, daily check-in, rewards shop
├── components/                 # UI, grouped by feature (dashboard, journey, coach, community,
│   │                           #   settings, games, growth, recovery, navigation, onboarding, auth)
│   └── navigation/              # MainNavigator, SwipePager, PremiumBottomBar, NavigationContext
├── database/                   # expo-sqlite setup, schema, migrations, seed data
├── repositories/                # UI-facing data access; the only layer that talks to database/ + sync/
├── sync/                        # Background sync queue + conflict resolution against Supabase
├── services/                    # Auth, Supabase/Clerk clients, coach, games, subscriptions, etc.
├── stores/                       # Zustand global state
├── constants/                    # Colors, navigation geometry, feature flags
├── supabase/migrations/          # Cloud schema + row-level security policies
├── metro.config.js               # Metro tweaks (see note below)
├── .mcp.json                     # Supabase MCP server for AI coding agents
└── .env.local                    # Clerk/Supabase credentials (gitignored — create your own)
```

### Architecture: local-first with background sync

UI → `stores/` (Zustand) → `repositories/` → `database/sqlite.ts` (SQLite, `revive.db`) — the app is fully usable offline. Every synced table has `id`/`created_at`/`updated_at`/`sync_status` (+ `deleted_at` for soft-delete), driven by `database/schema.ts`'s `SYNC_TABLES`. A queue in `sync/` pushes changes to Supabase (`services/supabase.ts`) whenever the device is online **and** a Clerk session exists, using last-updated-wins conflict resolution (`sync/conflictResolver.ts`). The Supabase client is created lazily so it's never instantiated during web static prerendering. UI code never imports SQLite or Supabase directly — only `repositories/`.

### Navigation architecture

`app/index.tsx` is a **switchboard**: it renders no UI and only redirects — unauthenticated users to `(auth)/login`, authenticated-but-new users to `(onboarding)`, and everyone else to `(tabs)`. Any screen that changes global state simply calls `router.replace('/')` to re-run this logic.

Once inside `(tabs)`, there are no further Expo Router routes — `MainNavigator` renders all five main screens (Dashboard, Journey, Coach, Community, Settings) as pages of a single `SwipePager`, so switching "tabs" is really just paging, and each screen's state survives the switch. Panic Mode and the other modals are registered on the **root** stack so they can be opened from anywhere in the app.

## Getting started

### Prerequisites
- Node.js 20+ and npm
- [Expo Go](https://expo.dev/go) on a physical device, or an Android emulator / iOS simulator
- A [Clerk](https://clerk.com) application (for auth)
- A [Supabase](https://supabase.com) project (for sync)

### Setup

1. **Install dependencies**

   ```sh
   npm install
   ```

2. **Configure environment variables** — create `.env.local` in the project root (it is gitignored):

   ```sh
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=<your-publishable-key>
   ```

   The Clerk key comes from your Clerk dashboard's **API Keys** page. The Supabase values come from your Supabase dashboard under **Project Settings → API**. `EXPO_PUBLIC_` variables are inlined into the client bundle at build time — only use publishable/anon keys here, never secret/service-role keys.

3. **Set up the Supabase schema** — run the SQL in `supabase/migrations/` against your Supabase project so the sync layer has tables + row-level security policies to write to.

4. **Run the app**

   ```sh
   npm start          # Expo dev server (scan QR with Expo Go)
   npm run android    # open on Android
   npm run ios        # open on iOS
   npm run web        # run in the browser
   ```

   No native modules require a custom dev client, so the app runs in **Expo Go**. If you change `.env.local` while the dev server is running, restart it with `npx expo start -c`.

## Development notes

- **exFAT / external drive quirk:** `metro.config.js` blocklists macOS AppleDouble files (`._*`). This repo lives on an exFAT drive where macOS constantly creates these metadata files, and without the blocklist Metro/expo-router would treat them as routes.
- **Community is built but flagged off:** flip `communityEnabled` in `constants/features.ts` to `true` to bring the real feed back — no other changes needed.
- **Type-check:** `npx tsc --noEmit`.
- **Verify a change end-to-end:** run `tsc --noEmit` plus a cold `expo export` for both web and native — the web export catches SSR/bootstrap bugs that a dev server won't.

## App identity

- **Name:** Revive (working title: Recovery Companion)
- **Android package:** `com.stake12sorganisation.revive`
- **Deep-link scheme:** `recoverycompanion://`

## License

Private — all rights reserved.
