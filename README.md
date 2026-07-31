# Revive — Recovery Companion 🌿

A private, judgment-free mobile app that supports people through addiction recovery. Built with [Expo](https://expo.dev) and React Native, backed by [Supabase](https://supabase.com).

> **Important disclaimer**
> Recovery Companion is a **self-help support tool, not medical care**. It is not a substitute for treatment from a doctor, therapist, or addiction specialist. If you are in danger or thinking about harming yourself, call your local emergency number (911 in the US), the 988 Suicide & Crisis Lifeline, or use the in-app crisis resources.

---

## Features

### 🚪 Onboarding
A guided 4-step flow shown after first sign-in:

1. **Age gate** — year-of-birth check; users under 18 are shown a supportive stop screen instead of the app.
2. **Goals** — pick what recovery means to you (abstinence, cutting back, rebuilding relationships, health, savings…).
3. **Triggers & severity** — select personal triggers (stress, loneliness, social events…) and rate how much they affect daily life (1–5).
4. **Disclaimer** — explicit "companion, not a replacement for professional help" agreement before entering the app.

### 📱 Main tabs
| Tab | What it does |
|---|---|
| **Dashboard** | Current sobriety streak, quick access to the daily check-in and crisis resources, plus practical coping tips. |
| **Journal** | A private journal — entries are visible only to the user. |
| **Coach** | Chat-style AI recovery coach offering encouragement and coping ideas (support, never clinical advice). |
| **Community** | A feed of peer posts — milestones, encouragement, and tips from other members. |
| **Settings** | Profile/preferences, plus sign-out and developer utilities (reset onboarding, toggle auth). |

### 🆘 Safety features (always available)
- **Panic Mode (SOS)** — a persistent red SOS button floats above every tab. It opens instantly (full-screen, no dismiss gesture) with an animated breathing circle, a 5-4-3-2-1 grounding exercise, and a direct path to crisis support.
- **Crisis resources** — one-tap call/text links to the 988 Suicide & Crisis Lifeline, Crisis Text Line (text HOME to 741741), and the SAMHSA National Helpline.
- **Daily check-in** — quick mood (emoji scale), urge intensity (1–5), and an optional note.

> ⚠️ **Project status:** the full UI and navigation flows are implemented, but data is currently placeholder — auth accepts any credentials, and streaks, journal entries, coach replies, and community posts are hard-coded pending backend wiring (see [Roadmap](#roadmap)).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) (managed workflow) / React Native 0.81 / React 19 |
| Navigation | [Expo Router 6](https://docs.expo.dev/router/introduction/) (file-based, typed routes enabled) |
| Language | TypeScript (strict via `tsconfig.json`) |
| Client state | [Zustand](https://zustand.docs.pmnd.rs/) (`stores/appStore.ts`) |
| Backend | [Supabase](https://supabase.com) via `@supabase/supabase-js` (`utils/supabase.ts`) |
| Session storage | `@react-native-async-storage/async-storage` (persists Supabase auth sessions) |
| Animation | Reanimated 4 + React Native `Animated` |

## Project structure

```
recovery-companion/
├── app/                        # Expo Router routes (file-based navigation)
│   ├── _layout.tsx             # Root stack: route groups + global modals
│   ├── index.tsx               # "Switchboard" — redirects based on auth/onboarding state
│   ├── (auth)/                 # Login & signup screens
│   ├── (onboarding)/           # Age gate → goals → triggers → disclaimer
│   ├── (tabs)/                 # Dashboard, Journal, Coach, Community, Settings
│   └── (modals)/               # Panic mode, crisis resources, daily check-in
├── components/                 # Shared UI (OnboardingScaffold, themed primitives)
├── constants/Colors.ts         # Palette + light/dark theme colors
├── stores/appStore.ts          # Global auth/onboarding state (Zustand)
├── utils/supabase.ts           # Configured Supabase client
├── metro.config.js             # Metro tweaks (see note below)
├── .mcp.json                   # Supabase MCP server for AI coding agents
└── .env.local                  # Supabase credentials (gitignored — create your own)
```

### Navigation architecture

`app/index.tsx` is a **switchboard**: it renders no UI and only redirects — unauthenticated users to `(auth)/login`, authenticated-but-new users to `(onboarding)`, and everyone else to `(tabs)/dashboard`. Any screen that changes global state simply calls `router.replace('/')` to re-run this logic. Panic Mode and the other modals are registered on the **root** stack so they can be opened from anywhere in the app.

## Getting started

### Prerequisites
- Node.js 20+ and npm
- [Expo Go](https://expo.dev/go) on a physical device, or an Android emulator / iOS simulator
- A [Supabase](https://supabase.com) project

### Setup

1. **Install dependencies**

   ```sh
   npm install
   ```

2. **Configure environment variables** — create `.env.local` in the project root (it is gitignored):

   ```sh
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=<your-publishable-key>
   ```

   Both values come from your Supabase dashboard under **Project Settings → API**. `EXPO_PUBLIC_` variables are inlined into the client bundle at build time — only use publishable/anon keys here, never the secret/service-role key.

3. **Run the app**

   ```sh
   npm start          # Expo dev server (scan QR with Expo Go)
   npm run android    # open on Android
   npm run ios        # open on iOS
   npm run web        # run in the browser
   ```

   No native modules are used, so the app runs in **Expo Go** — no development build or prebuild required. If you change `.env.local` while the dev server is running, restart it with `npx expo start -c`.

## Supabase

`utils/supabase.ts` exports a single shared client:

```ts
import { supabase } from '@/utils/supabase';

const { data, error } = await supabase.from('todos').select();
```

- Auth sessions are persisted to AsyncStorage with automatic token refresh.
- `detectSessionInUrl` is disabled (no browser URL to inspect in React Native).

### Supabase MCP server (AI-assisted development)

`.mcp.json` configures the [Supabase MCP server](https://supabase.com/docs/guides/getting-started/mcp) for AI coding tools like Claude Code, with the docs, account, database, debugging, development, functions, and branching feature groups enabled. Each developer authenticates once via OAuth (in Claude Code: run `/mcp`, select **supabase**, choose **Authenticate**).

## Development notes

- **exFAT / external drive quirk:** `metro.config.js` blocklists macOS AppleDouble files (`._*`). This repo lives on an exFAT drive where macOS constantly creates these metadata files, and without the blocklist Metro/expo-router would treat them as routes.
- **Placeholder auth:** the login and signup screens accept any credentials and just flip the Zustand flag. Wire them to `supabase.auth` before any release.
- **Age assurance:** the age gate is a year-only check, explicitly marked as a placeholder for a proper DOB picker + age-assurance provider before launch.
- Type-check with `npx tsc --noEmit`.

## Roadmap

- [ ] Real authentication with Supabase Auth (email/password, session restore in the switchboard)
- [ ] Persist onboarding answers (goals, triggers, severity) to Supabase
- [ ] Real streak tracking driven by daily check-ins
- [ ] Save journal entries and check-ins to the database (with row-level security)
- [ ] Connect the AI Coach to a real model backend
- [ ] Community backend: posts, hearts, moderation
- [ ] Push notifications / check-in reminders
- [ ] Profile, notification, and privacy settings
- [ ] Localized crisis resources (currently US-only numbers)

## App identity

- **Name:** Revive (working title: Recovery Companion)
- **Android package:** `com.stake12sorganisation.revive`
- **Deep-link scheme:** `recoverycompanion://`

## License

Private — all rights reserved.
