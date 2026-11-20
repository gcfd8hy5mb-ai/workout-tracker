# MYLIFTCOACH 2.0 — independent GitHub Pages site

This is the standalone frontend source for MYLIFTCOACH 2.0. The original workout app lives at `https://gcfd8hy5mb-ai.github.io/workout-tracker/` and must remain unchanged.

## Recommended separate repository
`gcfd8hy5mb-ai/MYLIFTCOACH-2.0`

Expected Pages URL (not active until the repository is created and publishing is enabled):
`https://gcfd8hy5mb-ai.github.io/MYLIFTCOACH-2.0/`

## Publishing
1. Create an empty **public** repository named `MYLIFTCOACH-2.0` under `gcfd8hy5mb-ai`.
2. Copy the **contents** of the existing `workout-tracker/myliftcoach2/` directory from branch `build/myliftcoach-2-v1` into the **root** of the new repository. Do not copy or merge the old `workout-tracker/index.html`.
3. In the new repository, go to Settings → Pages → Build and deployment → Deploy from a branch; select `main` / `/ (root)`; Save.
4. Check the Pages build and publication status. Do not announce the URL as live until it actually loads.
5. Test sign-in and demo features on iPhone Safari and desktop.

## Contents
- `index.html`: app screens, navigation and markup.
- `app.js`: local demo workout flow and **authentication-only** PRISM Supabase access.
- `styles.css`, `theme-option-one.css`, `reference-mobile.css`, `premium-reference.css`: premium visual design.
- `assets/`: custom original emerald-marble, logo, workout and equipment SVG images.
- `.nojekyll`: serve assets without Jekyll processing.
- `FUNCTIONAL-PARITY.md`, `REFERENCE-IMPLEMENTATION-STATUS.md`: audit and feature plan.

## Data protections
- Existing PRISM Supabase project is used **for existing account authentication only**. This version does not write to legacy workout tables.
- Demo logs use browser-local `mlc2-demo-workouts-v1`; 2.0's own auth token uses sessionStorage `mlc2-auth-session-v1`.
- Do not copy production localStorage into the new domain or import training history until reconciled and independently backed up.
- The Pages hostname might need to be added to Supabase's Auth redirect allowlist **if** future magic links, OAuth or password reset redirects are implemented. Simple email/password API login does not need an OAuth redirect.

## Known limitations
- This is still a feature-incomplete preview: not yet equivalent to the original app.
- Most exercise art is placeholder; photographic mockup cannot be duplicated exactly through CSS alone.
- The new preview build has not yet passed physical-device testing.
- No original app or production Supabase configuration should be overwritten.
