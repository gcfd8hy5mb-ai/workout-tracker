# MYLIFTCOACH 2.0 — Functional parity register

**Baseline:** working production branch `main` from `gcfd8hy5mb-ai/workout-tracker` (November 15, 2026). **Replacement:** `build/myliftcoach-2-v1/myliftcoach2`. **Rule:** a pretty demo is not production parity. Never merge, replace the saved home app, migrate data, or enable writes against live PRISM tables until individual acceptance checks pass.

## Verified source-level findings

- Production's `index.html` has 27 primary `<section id=...>` screens and 222 named `function` declarations. This count does not include the many external JS modules, so the actual scope is larger.
- Version 2.0 currently has five primary screens (Overview, Workouts, Exercise Library, Progress, Settings) and 24 named functions in `myliftcoach2/app.js`.
- Production uses `persistence/storage-model.js`, `scoped-storage.js`, `account-sync.js`, `account-controller.js`, and several dozen tables named `prism_account_*`. These handle user-scoped storage, migration, synchronization, conflict prevention and recovery. Do not flatten them to a generic session log or bypass them without migration tests.
- V2 currently authenticates against the existing PRISM Supabase Auth endpoint, using a **different sessionStorage key** (`mlc2-auth-session-v1`) and a **separate demo log key** (`mlc2-demo-workouts-v1`). Its workout entries never POST to production tables. Account sign-in remains unverified on physical devices.
- Production distinguishes local scoped storage, remote normalized records, account recovery, and cloud backup. Some data may exist on only one device, so a matching login does not guarantee all history is automatically present.

## Feature parity checklist

| Workstream | Production baseline (confirmed code) | V2 phase-one state | Acceptance gate |
|---|---|---|---|
| Authentication | Existing Supabase sign-in, user-scoped session, verification, account UI | Existing credential sign-in; independently stored session | Same existing account signs in/out, reload persists safely, invalid session cannot expose another user's data |
| Profile/onboarding | Welcome, setup, goals and profile | No full onboarding; settings/auth only | Restore account profile, goals and progress across devices without overwriting |
| Preset plans and schedule | Four-day baseline, goal-derived suggested plans, custom workouts, weekly overrides | Four fixed demo sessions | Exact set/rep guidance, current plan, scheduling and saved custom routines match baseline |
| Library | Exercise browser, visuals, detail instructions, smart substitution | 12 starter movements; search only | All existing exercise metadata, diagrams, coaching cues and substitution behavior |
| Active workout | In-progress workout, exercise focus, workout options, recovery after refresh | One local modal, add practice sets | Resume after refresh, log sets, exercise ordering, modification, completion and history correctness |
| Rest/timers | Rest timer, countdown, alerts, global timer | Missing | Timers behave properly in background and Safari |
| Records/analytics | Overall progress, period filters, trends, muscle progress, PRs, calendar and notes | Local count cards and history only | Trends and record calculations reconcile to original verified history |
| Weight, water and food | Tracking entries, goal/energy estimates, macros, saved meals and favorites | Missing | Same units, targets, calories, macro computations and saved records |
| Measurements/photos | Measurement history and protected photo storage | Missing | Private storage, ownership, upload/view/delete and restoration tested |
| Intelligent coaching | Exercise recommendations, overload targets, adaptive programming, readiness, fatigue, check-ins, reflections and post-workout insights | Missing | Preserve existing rules and decision logic without assuming paid AI |
| Free/Pro | Entitlements, paywall/preview and feature gating | Missing | No unauthorized unlock; verified Free/Pro outcomes |
| Cloud preservation | Scoped data, reconciliation, recovery archives, backups and merge protections | Demo-only; no production writes | Test accounts, isolation, no-destructive migration, round-trip and conflict tests pass |
| UI | Established functional app, approved luxury visual redesign target | New responsive luxury skeleton | Matching mobile/desktop design without changing interactions |

## Work plan

1. **Inventory and freeze contract:** enumerate all screens/modules and map the production data keys and account tables. Add per-feature acceptance checks; do not touch production code.
2. **Preserve data model:** create read-only adapters for production account data, using verified account ownership. Never claim all historical records are in Supabase; support explicit import from legacy local storage after a backup.
3. **Core workouts:** port existing exercise library, plan logic, custom workouts, session logging, refresh recovery, rest timers and history. Test using separate preview account/data, not live records.
4. **Tracking and progress:** bring over water, nutrition, weight, goals, calendar, charts, PRs, measurements and photos.
5. **Coaching and entitlements:** preserve adaptive progression and Free/Pro logic with regression tests.
6. **Cross-device acceptance:** compare representative real sessions **read-only**, validate offline behavior, backup/restore, user isolation and conflict handling; only then design an opt-in migration.

## Safeguards

- Original production GitHub Pages app stays live and untouched.
- Original PRISM Supabase project is reused for **authentication only** during Phase 1.
- V2 demo entries are stored under an isolated browser key. Clearing the V2 demo must not touch original keys.
- No schema changes, RLS changes, backup restores, ownership changes or production writes without separate review.
- Automated syntax/static checks and a successful hosting build are **not** proof of mobile sign-in, successful cloud migration or feature parity.

**Assessment:** MYLIFTCOACH 2.0 is a working foundation to test, *not* feature-complete or ready to replace the production app.
