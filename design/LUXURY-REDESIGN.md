# MYLIFTCOACH — Approved Luxury Redesign

Status: Design implementation branch; NOT approved for production deployment until iPhone QA.

## Approved visual reference
User-approved ten-screen mockup (October 18, 2026): rich deep teal marble, bright aqua/teal accents, warm ivory marble, very subtle champagne metallic detailing. Inspired by Bugatti Tourbillon precision and a grand luxury hotel interior. App name: myliftcoach.

## Non-negotiable constraints
- Preserve existing data, authentication, training logic, workout histories, smart coaching, nutrition, and all routes.
- No people, dumbbells, or gym equipment in the Home background; use marble instead.
- Prioritize readability and one-handed iPhone use; no tiny controls or horizontal overflow.
- Make the ten screens coherent: Home, Workouts, Active Workout / Exercise Detail, Exercise Library, Progress, Schedule, Nutrition, My Workouts, More, Measurements.
- Keep bright teal intentional, not every button; deep teal primary actions, white/ivory content, precise thin accents.
- No old purple/PRISM styling showing through during startup or navigation.
- Avoid excessive scrolling and visual density; use progressive disclosure.

## Phased implementation
1. Introduce scoped luxury design tokens and Home layout/styles, verify screenshot parity and iPhone behavior.
2. Extend to Workouts and active set logging (including all-exercise jump navigation and responsive set/date controls).
3. Apply to Library, Progress, Schedule, Nutrition, My Workouts, More, Measurements.
4. Regression test auth, persistence, data isolation, custom schedules, logging, offline and deployment. Merge only after tests and user visual approval.

This branch is isolated from main and intentionally does not modify the production app yet.

## Critical: zero legacy visual rendering (release blocker)
- No PRISM or LIFTOVA screen, color palette, wordmark, icons, background, or old layout may paint during initial load, refresh, auth restore, slow network, tab navigation, modal transitions, or PWA resume.
- Avoid CSS-only overlay patches that allow legacy markup to briefly appear. Mount the approved myliftcoach shell as the sole visible app shell; keep any necessary legacy business logic headless until migration is complete.
- Gate first paint behind an app-ready state and provide a matching luxury-themed loading shell; do not expose unstyled/legacy content during hydration or script loading.
- Remove or consolidate conflicting legacy CSS imports, inline styles, and runtime style injection in the migrated screens. Keep legacy logic only where required for behavior and data compatibility.
- Audit text, accessible labels, image assets, CSS variables, service worker cache, manifest, page title, and PWA launch path for PRISM/LIFTOVA leftovers.
- Test cold launch, warm launch, offline launch, stale service-worker cache, slow network, authenticated/guest sessions, and every screen transition on iPhone-sized viewports. Compare screenshots or recordings frame by frame for old-layout flashes.
- Do not merge or deploy until zero legacy-rendering checks and existing functionality tests pass. Do not claim this requirement is verified based on CSS changes alone.

## Rendering audit — first pass (2026-10-18)
- The new luxury CSS is linked from index.html; the latest five GitHub workflows passed.
- Legacy selectors and image URLs remain in earlier stylesheets (including a chest-press image in the entry stylesheet and leg-press image in onboarding CSS). The new scoped CSS overrides their backgrounds in target states, but that is **not** evidence that legacy visuals cannot flash.
- The current design CSS targets #liftovaAuthGate and body.liftova-auth-locked; verify that those selectors actually exist on the sign-in route at runtime before relying on them.
- Required follow-up: inspect actual auth gate mounting, stylesheet loading order, first paint, and service-worker cache behavior; capture iPhone cold-start and account-restore recordings. Do not merge on green CI alone.
