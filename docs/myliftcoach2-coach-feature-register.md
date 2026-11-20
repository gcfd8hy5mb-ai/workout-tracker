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

## November 19 — bounded adaptive restoration acceptance batch

- Added `coach-adaptive.js`: pure read-only, custom-plan-respecting per-exercise decision arbitration. Combines qualifying completed-set suggestions, weekly check-in, self-rated outcome memory, and repeated-performance decline evidence. Outputs only optional, manual-use suggestions, never calendar edits, preset substitutions or auto-recorded weights.
- Added `coach-fatigue.js`: detects a *recorded* decline in repetitions across at least three comparable-load sessions with at least two qualifying sets each, without presenting it as a medical recovery diagnosis. That signal holds a proposed **increase** for review without altering other exercises.
- Connected adaptive review counts to the Coach page and the decision guards to the individual set suggestion and top Coach Action. Unreadable outcome memory now fails closed: calculated increases are not offered until data is recovered.
- Fixed `session-coach.js` so future-dated local workout records cannot be used in progression calculations.
- Added regression coverage for custom exercise order, rest days, partial evidence, conservative check-in, repeated weak outcomes, declining reps and malformed memory; the desktop/iPhone-sized Chromium Coach acceptance test checks the adaptive summary.
- Original autonomous adaptive programming/phase adjustments/predictive models, production entitlement verification, account-based cloud writes, and real iPhone hardware acceptance are **still not implemented/verified**. Full original Coach feature parity therefore cannot truthfully be certified.
- The latest completely verified pre-change migration run was #44577553693 (success). CI must pass on the **exact final commit** of this batch before branch verification is marked green. Production and source account records remain unchanged.

## November 19 — Coach lifecycle and entitlement boundary

- Previous exact-head verification run `44579423883` completed successfully before this new batch.
- Added `coach-cycle-preview.js`, a draft-only source-adapted four-phase workflow: weekly check-in, before workout, during active workout, and shortly after completed workout. It reads the exact scheduled custom workout, account-owned active session and recorded completion. It neither chooses a preset nor mutates any history or weekly board.
- Added `coach-entitlement-boundary.js` and a visible Coach explanation of **draft-only** advanced features. A local tier, imported profile, beta flag or other client value can never establish production Pro authorization. Production entitlement remains denied until a trusted server-side entitlement adapter is completed.
- Integrated phase and access status into the Coaching page. Added browser assertions and focused tests; a direct JavaScript execution run passed eight cases plus application syntax and script-order checks.
- This is an incremental safe preview restoration, **not full original adaptive or entitlement parity**. Full original learning orchestration, trustworthy Pro enforcement, cloud write/sync, and on-device iPhone acceptance remain outstanding. Do not merge or deploy until independently verified.

## November 19 — explicit adaptive proposal decisions

- The previous exact-head run `44589247476` passed migration, disposable Postgres and browser consistency checks before this batch.
- Added owner-scoped `coach-proposal-decisions.js`: eligible **increase/hold/reduce** proposals can be individually marked for review or dismissed. The stored decision is tied to exercise ID, action, weight and source. A changed weight does not inherit an earlier acceptance/dismissal.
- These are **review-only** decisions, not automatic acceptance into a workout. No plan, session, working set, original storage key, or server record is changed. Rest, missing-exercise, conservative and review-only proposals cannot receive a weight decision.
- Integrated per-exercise controls on Coaching, with a current-plan re-evaluation at click time. Malformed owner-specific decision storage blocks writes and surfaces a recovery message rather than silently resetting records.
- Fixed the today's workout preview to display when an increase is paused by current check-in, repeated worse user-rated outcomes, declining working-set repetitions, or unreadable outcome history.
- Added focused regression and desktop/iPhone-sized browser assertions; direct JavaScript verification of five new module tests and script syntax passed. Full CI and physical-device acceptance must be checked on the exact latest commit. This feature does **not** resolve production Pro authorization, autonomous adaptive parity, cloud sync or live-device verification.

## November 19 — next-session Coach prescription preview

- Added `coach-next-session.js`, a strictly read-only, source-bound next-exposure card using the exact resolved custom workout and adaptive Coach decision sequence.
- Displays the original 8–10 repetition target, equipment-adjusted optional working weights, three proportional warm-up sets where a qualifying working weight exists, current personal target as a separate value, and an exact saved review/dismiss decision.
- Prevents substitutions and automatically generated sessions on rest days. The module fails closed if the schedule and adaptive decision arrays differ, have changed exercise order, contain duplicate IDs, or have insufficient weight evidence. Paused progression never generates an actionable working weight or warm-ups.
- Added desktop/iPhone-sized browser assertions and four directly executed targeted tests. Direct validation passed all four plus preview app and browser test syntax and script ordering.
- All values remain **suggestions** and cannot alter the plan, live workout, actual logged sets, or account server records. Real hardware and exact-head GitHub Actions acceptance remain separate release gates; autonomous programming parity and server entitlement enforcement remain incomplete.

## November 19 — existing cloud preservation / replacement integration started

- Revisited previously implemented 2.0 cloud components: mock cloud save, account-scoped legacy snapshot reconciliation, ordered workout append, custom cloud preflight, v2 schedule compare-and-swap transport and read-only sign-in/schedule compatibility check. These modules already exist and should be reused, not rewritten.
- Verified PRISM project `kirlpjflaoriiusfamsk` is accessible via the Supabase connector. Its `prism_account_*` tables are present with row-level security enabled. A metadata-only inspection of functions in `public` found **no** `prism_v2_*` schedule RPCs; the 2.0 transport has `ENABLED=false` and no live write path was activated. This is an outstanding release gate. Table statistics were not treated as proof of user-record counts.
- Added `v2-cloud-inventory.js` and an Account-settings check that counts owner-verified read-only original workout history, daily tracking, profile/goals, and custom workout plans, separately from device-local 2.0 workouts. No user data is uploaded or overwritten by this inventory.
- The inventory blocks replacement until four original sections are verified, the intended v2 schedule RPC / revisions are verified, authenticated write/read-back tests pass and local workouts are explicitly reconciled to avoid loss or duplicates.
- Direct tests passed five inventory isolation/readiness checks plus JavaScript syntax and script loading order. The full branch GitHub Actions run still requires exact-head verification.
- **Important:** Passing mock transport tests or completing a local phone save does not demonstrate that the newest isolated development branch writes to production. Do not claim cross-device recovery or enable the transport before independent RLS and transactional-RPC security tests.

## November 19 — authenticated cloud-vs-device schedule drift detection

- The previous exact-head GitHub Actions run `44609601037` passed migration, disposable PostgreSQL and desktop/iPhone-sized Chromium jobs.
- Added `v2-schedule-diff.js` as a **pure read-only comparison** of two validated v2 schedule documents. It distinguishes identical schedules, no cloud schedule, and differences in workout definitions, seven weekday assignments, one-time overrides including deliberate rest days, and repeating rules. The comparison does not choose a winning version or merge records.
- Integrated that comparison with the existing authenticated, owner-scoped `MLCV2ReadOnlyPreflight.check` response; a successful RPC read may report equality or drift, but it never enables a save. The Account screen now shows device/cloud comparison counts; it clears those results after logout, login or a token change.
- Added six comparison module regression cases, additional authenticated preflight cases and an unsigned-user browser assertion. None of the new features accesses Supabase outside the existing read-only endpoint.
- **Release blocker unchanged:** the live PRISM project was observed without dedicated `prism_v2_*` RPCs; do not activate live schedule/cloud writes without an independently reviewed migration and owner-isolated authenticated read/write/read-back acceptance. A verified read is not proof of write safety.

## November 19 — isolated multi-device save contract, strict validation and read-back

- Latest previously completed run `44620629406` passed migration, disposable PostgreSQL/JWT HTTP and desktop/phone-sized browser acceptance tests.
- Hardened the isolated v2 cloud transport's test adapter to validate **the complete repeating schedule** (including one-time overrides, intentional rest days and recurrence) before accepting cloud reads or sending requested writes. Malformed remote documents receive one consistent rejection and can never be treated as verified.
- Added `test_myliftcoach2_cloud_multidevice_contract.cjs`: two-device same-owner revision conflict, distinct account isolation, invalid documents rejected before network requests, invalid remote read rejection, and the hard-disabled production transport gate.
- Added `v2-cloud-save-verification.js` with five focused tests. It is an opt-in verification helper, **not imported or activated by the production browser**. It requires a save response plus an independent authenticated read-back with matching revision and document. On ambiguous read-back failure, it **never automatically retries**, since the first write might have succeeded.
- An isolated PostgREST HTTP job previously failed because the test altered only the final base64url character of a JWT signature, which can leave decoded bytes unchanged. The tampering test was corrected to modify the first encoded signature character, ensuring it changes actual signature bits.
- No live Supabase SQL, account record, or production setting was changed. Remaining gates: independently audit and deploy the isolated RPC migration with explicit approval, verify trusted Pro and account ownership in production context, real iPhone and cross-device data restoration, and controlled rollback readiness.

## November 19 — local completed workout to existing cloud-history compatibility preview

- The prior exact-head run `44621612654` completed successfully across migration, disposable PostgreSQL / PostgREST, and desktop/phone-sized browser checks.
- Reused existing `save-preflight.js` to map one completed, **account-owned and locally saved** v2 workout to original `workoutHistoryV52` representation; added `local-session-cloud-preview.js` and four focused tests for repeat exercise sets, correct exercise order, owner isolation, stable duplicate-safe IDs, lossless serialization and invalid input rejection.
- Improved the legacy save candidate to preserve verified duration (only a plausible up-to-24-hour elapsed session) and recognized original `Great`, `Normal`, `Tired` readiness values instead of always forcing null duration / Normal.
- Added an Account settings button to verify the most recent local practice session against a separately owner-verified original workout history snapshot and show preserved counts. This **never uploads, replaces, changes workouts, or mutates original cloud data**.
- Added desktop/phone-sized browser checks requiring signed-in, imported original history before enabling the local session cloud-format preview. Physical cross-device synchronization remains unverified.
- Note: this is only a serialization/compatibility gate. The source original account history must be reloaded/checked for drift before any later production append. The actual live workout sync transport and database release approval remain disabled.

## November 19 — read-only batch workout history reconciliation

- Previous exact-head GitHub Actions run `44623988946` passed all migration, disposable PostgreSQL, and desktop/phone-sized browser jobs.
- Added `local-history-batch-preview.js`, which checks up to 100 local 2.0 workouts against the verified original account workout history, preserving original newest-first order and all previously saved entries.
- Uses deterministic `mlc2-demo-*` identities. Exact existing content is flagged `already-saved`; missing sessions are flagged `new`; any same-ID content mismatch blocks the entire preview, preventing a silent overwrite. Duplicate local IDs, duplicate original IDs, wrong account, unsupported exercises, invalid sets, and legacy serialization errors all fail closed.
- Account settings now offer an explicit **Review all local workouts** action, requiring owner-verified imported original history. The preview reports counts only and performs no cloud writes, local mutations, automatic merges or retries.
- Added six targeted batch tests and desktop/iPhone-sized browser assertions. The test result is a *compatibility preview*, not proof of an up-to-date remote checkpoint: future production writes must re-read authenticated cloud rows immediately before the transaction, enforce atomic revisions, and independently read back the result.
- Live production synchronization remains disabled pending explicit approval and independent authorization review.

## November 19 — owner/revision-checked bulk legacy cloud history planning

- The previous exact-head workflow run `44628061096` passed all migration, disposable PostgreSQL/PostgREST and desktop/iPhone-sized browser jobs.
- Added `bulk-history-cloud-planner.js` and six regression cases as an **isolated read-only planning contract**, not loaded into the browser and never connected to live Supabase.
- It checks every supplied cloud row for matching account owner and positive server revision; rejects duplicate row identities, missing source records, stale original-history baselines and missing/corrupt normalized session/set children.
- Before producing any proposed write counts, it uses the existing local batch reconciliation to recognize identical saved sessions, reject same-ID content conflicts, and preserve newest-first local sessions plus the exact prior original history. It verifies the complete candidate by legacy normalize/restore round-trip and checks proposed changes with the existing three-way reconciliation engine.
- All-new local workouts are counted, identical already-uploaded sessions are a no-op, and incomplete/unknown/other-owner checkpoints fail closed. The output exposes **counts only**, never an executable write or implicit migration flag; `readyForProduction` remains false.
- The input checkpoint must still be obtained freshly through a trusted authenticated transport before any approved future production write; no production transport or database writes were enabled. Original production and PR #373 release gates remain unchanged.

## November 19 — fresh live-account history **read-only** checkpoint preflight

- Started from draft head `9e815e47948ca0d1d291853ab05ebf73c3a4992f`; previous exact-head GitHub Actions run `44647652211` completed successfully.
- The existing `bulk-history-cloud-planner.js` already supported raw original-account revisions, but the UI only previewed previously loaded **display-normalized** sessions. Those display records are not reliable revision checkpoints and cannot be substituted for raw cloud rows.
- Added `fresh-history-checkpoint.js` to read only owner-scoped `workoutHistoryV52` rows from `sources`, `sessions`, `session_exercises`, and `sets` via authenticated GET requests. It checks identity through the original Auth endpoint, validates the same token and owner before and after each page, uses bounded pagination, rejects duplicate/missing rows and invalid revisions, and never writes.
- Account settings now offer an opt-in **Check fresh cloud history** dry run. It compares original display session identities to the freshly restored raw history and passes exact raw cloud rows and revisions to the existing bulk planner. It reports number of possible appended sessions and normalized row changes as *hypothetical counts* only, never as a successful save.
- Added six focused reader tests and unsigned-user desktop/iPhone-sized browser gate assertions. The full exact-head CI result still needs confirmation.
- **No production writes:** the separate v2 schedule RPC is still not activated. This fresh raw read is only a checkpoint inspection and is not an approved backup, account migration, cloud synchronization, or guarantee that rows will remain unchanged after the read.
