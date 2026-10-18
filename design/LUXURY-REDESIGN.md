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
