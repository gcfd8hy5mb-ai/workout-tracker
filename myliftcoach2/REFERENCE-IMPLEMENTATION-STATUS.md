# MYLIFTCOACH 2.0 — Reference-image implementation checkpoint (2026-11-15)

## Approved reference
Eight-screen iPhone design: emerald-teal marble with bright champagne-gold veins, metallic MYLIFTCOACH mark, compact Home workout CTA, exercise list with anatomical illustration, rest timer, filtered exercise library, progress chart, coaching, and My Account. The latest supplied reference image is a visual specification; it is not a functioning page or separable set of photos.

## Implemented in source (not yet browser accepted)
- Added original custom `assets/emerald-marble.svg`, `assets/myliftcoach-mark.svg`, `assets/hero-dumbbell.svg`, and `assets/chest-press.svg`.
- New `premium-reference.css` applies responsive marble backgrounds, metallic-button styling, richer cards, premium mobile tabs, rest timer and welcome styles.
- Home dashboard matches the reference's basic content hierarchy: smaller Today's Workout banner, six compact actions, 5-tab bottom navigation.
- Added branded optional Welcome view with existing-account login or safe Explore Demo; does not force login or change the established authentication logic.
- Exercise library now supports working Chest/Back/Shoulders/Legs/Arms/Core filters and search; starter vector exercise illustration is reused as a **placeholder**, not a full illustrated catalog.
- Progress trend chart computes weight × reps from actual local **demo** entries, never invented sample metrics.
- Added accessible 1:30 rest overlay with pause, resume, and skip controls, linked from an open practice session; no production writes.
- Coaching and Nutrition views remain placeholders. Account links route to existing V2 screens; some original features are not yet ported.

## Safety
Production GitHub Pages `main` unchanged; PRISM Supabase database/schema/RLS unchanged. New V2 app only uses Supabase Auth, with independent sessionStorage key and browser-local demo session key.

## Verification
- Static JavaScript syntax and element ID checks passed.
- CSS opening/closing braces match.
- Vercel free-tier manual deployment blocked by `api-deployments-free-per-day` on 2026-11-15; latest V2 deployment still points to commit `a29eb634...`, **not** the new reference implementation. Do not claim newer changes are live.
- Physical-device rendering, workout timer behavior, and authentication remain unverified.

## Next gates
1. Make a new Vercel deployment once deployment quota permits; confirm exact Git commit SHA.
2. Test iPhone Safari first paint, Welcome, Home navigation, exercise search, start/log/undo/finish practice session, rest pause/skip, and progress chart.
3. Replace placeholder illustrations with consistently produced original or properly licensed assets.
4. Compare all original workout features using the existing `FUNCTIONAL-PARITY.md` register; port features in batches with backup and test-data safeguards before activating cloud record writes.

