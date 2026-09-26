# PRISM account persistence audit — 2026-09-26

Audited baseline: `25306e2c987b8a154562a02d069cc5d239631d8f`.
Refreshed against `07a53125627ac5ec86ce3395c2e27ec7021fba6e` after concurrent main updates.
Working branch: `codex/account-persistence-staged`. This work is not a production rollout.

## Existing integration

`supabase-config.js` contains the existing public project URL and publishable key.
`cloud-backup.js` implements email auth endpoints, current-user lookup and one
`prism_backups` row per `user_id` containing a localStorage snapshot. It excludes
only `prismSupabaseSessionV1`. Restore overwrites matching local keys without
conflict detection. It does not back up IndexedDB photos, refresh expired tokens,
partition local state by account, or synchronize normal saves.

**No current HTML/module loader references either Supabase script.** Auth methods
exist in the repository but are not wired into the audited application entrypoint.
This differs from the reported setup and must be resolved before rollout.
No database DDL or existing RLS policies are checked into this repository. Existing
live table definitions/policies have not been inspected; a user_id query filter
alone is not proof of isolation. Do not recreate or drop `prism_backups`.

## Complete observed persistence inventory

All following keys are localStorage unless specified. MUST means account data;
SHOULD means useful preferences/feedback; LOCAL means never upload automatically.

| Key/store | Contents | Classification |
|---|---|---|
| prismLocalProfileV1 | Name, avatar choice, timestamps, onboarding completion; userId currently null | MUST |
| prismJourneyV1 | Onboarding step/draft/status, review snooze, local profile migration marker | MUST |
| prismGoalPhasesV1 | Body goal phases, dates/duration, weight/calorie targets and phase status | MUST |
| workoutGoalsV1 | Selected goal, plan days, focus, basic plan selection | MUST |
| dailyTrackingV1 | See decomposition below | MUST |
| prismAthleteProfileV1 | Coach training preferences, experience, equipment, priority, days, duration | MUST |
| customWorkoutsV5 | IDs, names, ordered exercise IDs | MUST |
| workoutHistoryV52 | Completed sessions, exercise IDs/names, sets/weight/reps, dates, duration, readiness, recordIds | MUST |
| setHistoryV5 | Current working sets keyed by workout/exercise/set; entered values and completion | MUST |
| previousHistoryV51 | Previous set performance, keyed by workout/exercise/set | MUST |
| completedExercisesV5 | Completed workout/exercise identifiers | MUST |
| overloadTargetsV1 | User progression target weights | MUST |
| prismActiveWorkoutV1 | Active workout key/title/exercise IDs/index/context/start time | MUST; resume only after reconciliation |
| prismCoachActionsV1 | Applied/dismissed Coach action decisions and target changes | MUST |
| prismCoachCheckinsV1 | Weekly recovery/energy/difficulty/days/limitations; capped at 26 | MUST |
| prismAdaptiveProgrammingV1 | Accepted/dismissed proposal maps, proposal content and timestamps | MUST |
| prismSessionFatigueV1 | Per-exercise fatigue and next-target signals; capped at 50 | MUST |
| prismCoachFeedbackV1 | Followed/modified/rejected responses, latest/target performance; capped at 120 | MUST |
| prismCoachInterventionsV1 | Recommendation, policy, response and outcome; capped at 180 | MUST |
| prismPostWorkoutCoachV1 | Session totals, improvements/declines, actions, interventions; capped at 30 | MUST |
| prismCoachSessionReflectionsV1 | Session difficulty responses; capped at 60 | MUST |
| prismSessionReadinessV1 | Latest daily energy/soreness/motivation and timestamp | MUST |
| prismAskHistoryV1 | Coach Q&A history; capped at 20 | MUST |
| prismMeasurementsV1 | Dated weight/body measurements and phase links | MUST |
| prismProBetaFeedbackV1 | Product/pricing feedback, separate from workouts | SHOULD |
| prismTimerAlertModeV1 | Raw string haptic/sound/off preference (added by concurrent main update) | SHOULD |
| prismDrawerSectionsV1 | Drawer expansion preferences | SHOULD |
| prismEntitlementV1 | Existing tier/betaView/source | LOCAL for this rollout; retain unchanged. Not a trusted paid entitlement. Future server-owned grants and separately synced beta preference require explicit design |
| prismSupabaseSessionV1 | Access/refresh tokens and auth session | LOCAL ONLY; never snapshot or sync |
| prismRestEndsAtV1 | Device timer deadline | LOCAL ONLY |
| sessionStorage workoutRestEndsAt | Legacy timer deadline | LOCAL ONLY |
| sessionStorage prismCoachPlanV1 | Temporary current-workout Coach target plan | LOCAL ONLY; source recommendations/targets persist elsewhere |
| sessionStorage prismDeveloperTestModeV1 | Synthetic scenario mode toggle | LOCAL ONLY |
| sessionStorage prismDeveloperScenarioV1 | Synthetic scenario selection | LOCAL ONLY |
| IndexedDB workoutTrackerPhotosV1 / photos | Legacy photo records and image blobs | MUST; private Storage plus metadata |
| IndexedDB prismProgressPhotosDB / photos | id, date, view, phaseId, createdAt, blob | MUST; private Storage plus metadata |
| Service Worker CacheStorage prism-v10.3-beta39 | App shell/images/scripts | LOCAL ONLY |

`dailyTrackingV1` arrays: water, food, weight, foodFavorites, measurements.
Maps: readiness, manualTargets, substitutions, calendarNotes.
Preferences: waterUnit/waterGoal, calorieGoal/calorieMode/calorieWorkout,
restSeconds, calorieAge/calorieFeet/calorieInches/calorieEquation/calorieActivity,
preferredWeightUnit and trainingLevel. Preserve unrecognized future fields too.

Exercise definitions, muscle/equipment metadata and preset programs are bundled
code, not user-owned localStorage records. Selected plans/custom exercise ordering
are persistent. Volume, PR analyses, weekly summaries, plateaus and learned Coach
policies are computed from history and feedback, not separate saved keys. Preserve
session recordIds and all learning source records. Never interpret capped arrays
as requests to delete older cloud history.

## Proposed schema and incremental implementation

Separate user-scoped tables for profile fields, preferences, onboarding, goals,
custom workouts and their ordered exercises, sessions, session exercises, sets,
tracking entries, current/previous sets, targets, completion markers, Coach events,
interventions with separate responses/outcomes, Adaptive decisions, measurements,
and photo metadata. Every table has (user_id,id), revision and server timestamps.
Composite foreign keys include user_id, preventing cross-account parent links.
Existing legacy properties remain per-record JSON for lossless round trips; entire
history/whole application snapshots are not the permanent storage model.

The checked-in staged adapter decomposes records and provides optimistic revision
checks. Existing local fields/IDs are kept. Ambiguous legacy ID collisions stop
migration instead of silently combining records. Missing IDs use deterministic
content identities, never array positions. Parent/child IDs are deterministic.

## Safe migration contract

1. Resolve a real authenticated user. Bind local data to an explicit account owner;
   do not infer ownership merely from sign-in. Existing unowned device data needs
   a one-time claim. Account switching must not upload the previous owner's data.
2. Read cloud records and (separately) any old prism_backups recovery snapshot.
3. Normalize local data without changing it. New records are insert-only. Existing
   equal records are no-ops. Divergent records without a known common base are
   conflicts, not last-write-wins based on unreliable client clocks.
4. After reconciliation, use expected server revisions for updates. Write a batch
   transactionally and verify returned records before advancing checkpoints.
5. Preserve source local data, an account-scoped recovery checkpoint and pending
   work on errors. Hydrate before legacy globals initialize, or explicitly reload
   after safe restore; do not swap underlying localStorage during an active workout.
6. Explicit deletions need tombstones and confirmation semantics. Array truncation
   and omitted keys never mean deletion. The initial stage intentionally does not
   issue deletes. Do not enable full sync until deletion/restore lifecycle tests pass.
7. Sync ownership is independent of feature access. Never remove Pro source data
   when tier changes. Do not import paid grants from client-editable data.

## Files and SQL

New: this audit, persistence/storage-model.js, persistence/reconcile.js,
supabase/migrations/202609260001_account_records.sql and regression tests.
Later activation requires cloud-backup.js token/session integration, bootstrap
loading in index.html, explicit save hooks across modules, private photo transfer,
and an account-switch/reconciliation UI. These are release blockers, not completed
features. Existing index.html and entitlement logic remain unchanged in this stage.

## Risks / deployment gates

- Live schema/RLS administration access is not available in the current toolset.
  SQL can be prepared, but applying it and live authenticated A/B tests are required.
- Both photo stores must migrate; neither is covered by old snapshots.
- Current SW caches arbitrary GET responses including cross-origin traffic. Before
  activating cloud calls, exclude auth/REST/Storage from caching and remove only
  obsolete app caches, never localStorage/IndexedDB.
- Some legacy records have no timestamps or collision-resistant IDs; stop on
  ambiguous conflicts. Never assume later upload means newer user information.
- Deletion/reset, account switching, multi-tab writes and in-flight workout resume
  require dedicated tests before production enablement.
- Baseline JS suite: 14 pass, test_advanced_analytics.js fails (2 != 3). Its UTC date-only
  fixtures are compared against local-day boundaries. Pin the test timezone to UTC
  without changing production analytics logic.
- Real browser/PWA and live Supabase restore/RLS have not been verified.

References: https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/database/functions
https://supabase.com/docs/guides/storage/security/access-control
