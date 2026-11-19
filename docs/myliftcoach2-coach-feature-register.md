# MYLIFTCOACH 2.0 — Coach feature completion register

Development branch: `feature/myliftcoach2-strict-custom-draft-recovery`. Draft PR #373.

## Implemented in development

- Account/guest-isolated completed 2.0 workout history for Coach evidence.
- Actual seven-day activity, working-set volume, recorded readiness, and last-trained muscle recency.
- Previous set comparisons and exercise-by-exercise local progress.
- Original Coach 8–10-rep progression thresholds and equipment-dependent increments using qualifying completed sessions; 2.0 local sessions take precedence over *verified* original history for the same exercise.
- Original exercise metadata ranking for same-muscle alternatives, optional 40/60/80% warm-ups, explicit `Use suggested weight` in the active session.
- Coach dashboard lists all previously trained compatible exercises, source labels, insufficient-evidence states, and an action opening today's resolved custom workout; no automatic weekly plan edits, no invented readiness or recovery score.
- Authenticated original history, recovery recency, and account settings displayed separately with read-only protections.
- Charcoal/gold visual styling aligned with approved redesign.

## Acceptance boundary

Feature integration is implemented and subject to automated verification; this **does not** mean the original production Coach engine was migrated byte-for-byte, trained on new data, independently clinically validated, or deployed. Unported provider-only behaviors and dynamic program generation require separate investigation if desired.

Before any production merge or release:
1. Verify real Supabase account data and identity-scoped recovery on an isolated staging target.
2. Verify server-side conflict protection and cross-device cloud writes when explicitly approved.
3. Complete physical iPhone and desktop acceptance on a deployment preview, including account switching, custom plan priority, exercise edits, and working-weight opt-in.
4. Confirm any Pro entitlement behavior matches the original application and does not unintentionally unlock gated functionality.

No new Coach or workout data was written to production Supabase by this branch.

## November 18 Coach evidence-integrity batch (draft)

- Corrected local progressive-overload calculation: explicitly incomplete working sets and non-finite loads/reps are excluded, rather than being silently converted into completed sets.
- Coach dashboard now excludes future-dated sessions and movements without valid completed working sets; unverified legacy account history remains excluded.
- Added targeted Node regression tests in `tests/test_myliftcoach2_session_coach.cjs` and `tests/test_myliftcoach2_coach_dashboard.cjs`.
- Direct connector-side JavaScript smoke check passed: incomplete sessions do not yield a weight prescription, and future/incomplete history does not generate a movement recommendation.
- **Full GitHub Actions execution, full app integration, physical-device acceptance remain unverified for these new commits.**

This is a correctness repair within the draft. No change to scheduling, custom workout precedence, user data, production site, or live Supabase.

## November 18 — scheduled workout Coach preview

- Added `myliftcoach2/today-coach.js`, a read-only pre-session guide that takes the exact `resolvedWorkout()` plan that Home and Start Workout already use. It does **not** choose an alternate preset when today's schedule is empty, and preserves exercise order.
- Every planned exercise shows its own evidence-based increase/hold/reduce suggestion only if qualifying workout history exists; missing and unknown exercise IDs show a safe unavailable/insufficient state.
- Local 2.0 completed sessions take precedence. Original history is evaluated only when it is already verified for the current account.
- Exposed the guide on the draft Coaching page using `coachTodayStatus` and `coachTodayList`, without mutating the weekly board, the session, workout records, or weight values.
- Added `tests/test_myliftcoach2_today_coach.cjs` for custom-plan ordering, verified/unverified legacy history, missing catalog IDs, and rest days.
- Direct JavaScript smoke check passed; `app.js` syntax, script order, DOM anchors, and a sample custom-plan suggestion were checked. Full CI and physical browser/device acceptance remain pending.

**Release hold:** do not merge, deploy, or enable production cloud writes without separate acceptance.

## November 18 — factual exercise consistency guide

- Added `coach-consistency.js` to compare up to four qualifying completed local sessions for each exercise in today's **resolved** plan.
- Distinguishes repeated loads, increasing or decreasing working weights, increasing or decreasing average repetitions, mixed patterns, and insufficient evidence.
- Requires at least two valid working sets per observed session and three distinct qualifying sessions before showing a trend. Excludes incomplete, non-finite, future-dated and duplicate session records.
- Integrated factual observations into existing Coaching > Today's scheduled workout section; the custom workout order, scheduled rest days, manual weight selection, and record storage remain unchanged.
- Added `tests/test_myliftcoach2_coach_consistency.cjs`. A direct JavaScript check passed for steady load, increasing repetitions, insufficient evidence, app syntax, script ordering, and UI reference.
- **Not a clinical recovery score or definitive plateau diagnosis.** Does not automatically increase loads, deload, change scheduling, or alter account data.
- Full CI, browser flow, and physical iPhone testing still pending for these commits. No deploy or merge.

## November 18 — active-session weight/reps continuity

- Fixed an active workout issue where the complete `renderWorkoutLog()` redraw after logging or undoing a set reset all exercise weight/reps inputs to default 40 lb / 10 reps.
- Added isolated `session-input-continuity.js` with a strict snapshot/restore of only current plan IDs and valid entered values. Each exercise retains its own manual values after log/undo, including an explicitly selected Coach weight. Newly opened sessions, plan changes, and substitutions do not inherit stale inputs from a prior session.
- Kept all changes ephemeral to form fields; workout drafts, account data, history and program definitions are not modified by the helper.
- Added `tests/test_myliftcoach2_session_input_continuity.cjs`; direct runtime smoke check passed for 165 lb / 9 reps surviving an exercise-card rebuild, plus `app.js` syntax and script order. Full automated suite and physical iPhone exercise-flow QA remain pending.

## November 19 — original Coach restoration batch (draft)

Compared the source app's original `index.html`, `coach-engine.js`, `coach-checkin.js`, `coach-decision-engine-v2.js`, `coach-weekly-planning.js`, `coach-cycle.js`, `in-workout-coach.js`, `post-workout-coach.js`, `next-session-coach.js`, `adaptive-programming.js`, `ask-prism.js`, `pro-experience.js` and `myliftcoach-intelligence-core.js` against the 2.0 draft.

### Restored in this draft batch

- **Manual overload targets:** account/guest-scoped, validated local working weights, per-exercise save/use/clear buttons in active workouts; separate from calculated progression; no plan edits or automatic set logging.
- **Weekly check-ins:** explicit recovery, energy, difficulty, available days and training notes, with owner-scoped local retention and conservative signal. The optional calculated-increase button is suppressed when a current conservative check-in is present.
- **Post-workout Coach debrief:** recorded volume, exercises, time, local training markers, and opt-in next-exposure progression appear on the Progress history, sourced from logged sets.
- **Weekly Coach planning:** counted qualifying sessions/training days against this week's self-reported availability, no invented goals and no automatic schedule changes.
- **Coach Actions:** highest-priority explained recommendation based on today's resolved custom workout, check-in and completed training evidence. Rest and missing exercises remain explicit.
- **Ask MYLIFTCOACH (offline subset):** rules-based Q&A for actual schedule, weekly training, previous workout, readiness check-in, optional progression and saved personal targets. No paid AI, no open-ended model or promises of AI autonomy.
- These changes retain the pre-existing Coach progression, warmups, alternatives, scheduled workout guidance, weekly comparisons, exercise consistency and session input continuity.

### Not fully ported — release BLOCK

The original app contains a **larger interconnected adaptive and learning stack**. The following original capabilities do not yet have verified 2.0 parity:

1. `coach-engine.js` full prioritized decision engine and `coach-decision-engine-v2.js` with readiness/fatigue arbitration.
2. `adaptive-programming.js`, advanced autonomous progression, phase adaptation, next-session orchestration, accepted/dismissed interventions and adaptive learning outcomes.
3. `coach-memory-v2.js`, `coach-intervention-memory.js`, `coach-learning.js`, athlete feedback and persistent learning.
4. Original multi-turn `ask-prism.js` conversational behavior; 2.0 has only explicit local-data questions.
5. Original Pro entitlements and server-verified feature access. `account-settings-import.js` deliberately excludes local entitlement values; the preview is **not production-safe for Pro gating**.
6. Live account cloud write/sync migration, cross-device acceptance, and physical iPhone/desktop Coach flows.

**Do not claim full Coach restoration, production readiness, or feature parity.** All of these changes remain on draft PR #373, using local preview data. The source engine assumes original global state and storage keys; loading it into 2.0 without a verified account-isolated adapter risks reading or changing live data. Never bridge it by directly sharing old PRISM localStorage keys.

### Verification

Direct JavaScript regression harness passed the new targeted modules (33 cases before the later Ask Coach target-specific tests), and preview `app.js` syntax/script order passed. Full exact-head GitHub Actions and physical-device tests must still be confirmed independently. No production data writes, merges or deployments.

## November 19 — Coach responses and browser verification follow-up

- Previous migration workflow #44567124920 completed successfully: migration-tests, disposable-postgres and browser-workout-consistency passed. This verified the previous Coach feature integration on its exact commit; it did **not** validate later commits.
- Restored an owner-isolated Coach response register in `coach-feedback.js`: users can explicitly mark a priority suggestion used, adjusted, or skipped. The responses are factual user choices, **not validated performance outcomes** or automatic learning inputs.
- The responses appear next to the existing explainable Coach Action, with strictly validated local storage and no change to sets, account workouts, Coach weights, or scheduling. Added `tests/test_myliftcoach2_coach_feedback.cjs` and a desktop/iPhone-sized browser check.
- Full original Coach intervention memory, autonomous adaptive orchestration, outcome-based confidence, and original entitlement rules remain **unported/unverified**. These feedback records deliberately do not pretend to provide adaptive-learning parity.
- Draft-only development continues; release/merge/cloud write hold remains active.

## November 19 — Coach feedback-to-outcome memory (draft)

- Added `coach-outcomes.js`: only an explicitly recorded Coach response attached to a later completed session with at least **two qualifying working sets for the same exercise** can receive a user-reported `better`, `same`, or `worse` outcome. Prior sessions, future dates, rejected advice, single/incomplete sets, and mismatched exercise IDs cannot qualify.
- Added stable IDs on newly created `coach-feedback.js` records to pair outcomes with the exact response. Existing feedback records without IDs continue to load but cannot be retrospectively paired without a stable identifier.
- Added `coach-memory.js`: after at least four rated outcomes for the same exercise, summarizes the pattern without asserting causation. Three or more worse ratings (and more worse than better) trigger a **review-only hold** on calculated Coach increases in the session and prioritized Coach Actions. No automatic plan, target, or workout changes.
- Connected an outcome editor to Coaching and added an account-scoped browser test covering response → subsequent completed local workout → saved outcome. Changed no production Supabase data or original `PRISM` storage keys.
- Added focused tests for owner isolation, malformed record recovery, one rating per feedback, no fabricated outcomes, and conservative memory safeguards. Direct JavaScript check: 15/15 newly targeted tests passed; app and browser test source syntax passed. Full latest-head CI and device acceptance must be confirmed separately.
- Earlier run `44567721564`: migration and Chromium browser jobs passed, but the disposable PostgreSQL HTTP security test **failed the tampered-JWT assertion**. It is a genuine unresolved release gate and should not be dismissed as harmless without investigation.
- Full original adaptive Coach learning, performance outcome measurement, multi-turn intelligence and Pro entitlement parity remain incomplete; these source-faithful features are incremental.
