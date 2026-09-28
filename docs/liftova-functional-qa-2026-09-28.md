# LIFTOVA functional QA — 2026-09-28

Baseline: `main` at `f72673d`, deployed at `https://gcfd8hy5mb-ai.github.io/workout-tracker/`. Tests used the signed-in QA account through the validation browser. This document distinguishes deployed behavior from branch fixes. The branch is not deployed.

Status means an interaction was actually exercised in the deployed UI. **FAIL** means the live deployment reproduced a defect; the branch fix and regression evidence are recorded below. **BLOCKED** means no claim of success is made.

| Area and interaction | Live status | Observed result |
| --- | --- | --- |
| Account gate: Sign In, Sign Up tabs | PASS | Switched headings and form fields. Empty sign-in blocked by required email; mismatched signup passwords displayed an error. |
| Returning account sign-in | PASS | Secure handoff signed into existing QA account and displayed its profile/data. |
| New account → confirmation email → verified sign-in → onboarding | BLOCKED | No disposable inbox or new confirmation link in this session. Signup confirmation and full first-run flow require manual test. |
| Sign out | PASS | Returned to Welcome back account gate. |
| Sign back in after this sign-out | BLOCKED | Requires another secure authentication handoff; earlier returning sign-in succeeded. |
| Session reload/account restore | PASS | Reload restored signed-in account, workout history and saved Pounds preference after a Kilograms round trip. |
| Bottom Home, Workouts, History, Progress, Profile navigation | PASS | Each screen loaded; revisiting tabs retained saved workout/tracking state. |
| Home menu and profile icon | FAIL | Clicks did nothing on live Home. Branch uses existing menu/profile actions directly. |
| Home Library shortcut | PASS | Navigated to the Exercise Library. |
| Home My Plan and Progress shortcuts | BLOCKED | Visible, but not independently exercised in the live session. |
| Home weekly cards/day strip | BLOCKED | Displayed data; no click affordance was verified. |
| Workout list/detail, exercise row, Back, Start Workout | PASS | Eight exercise rows loaded; detail opened; Start entered live workout directly; Back returned. |
| Workout detail Overview/Exercises and more controls | BLOCKED | Visible controls lacked listeners in source; not independently clicked in the deployed UI. Branch wires section navigation and existing menu. |
| Live workout weight/reps picker, set completion, Finish | PASS | Logged Chest Press 50 lb × 8, finished workout, summary and History/Progress reflected one set and 400 lb volume. |
| Repeat last set | FAIL | Opened picker and failed to copy 50 lb × 8. Branch writes values through existing `saveSet` path. |
| Coach planned-set confirmation | BLOCKED | No eligible preloaded planned set in this account; same broken picker helper was replaced in branch, but live confirmation remains unverified. |
| Completion next-target suggestion | FAIL | One-set summary rendered `Next: undefined lb`. Branch displays suggestion only for ready numeric targets. |
| Live workout Manual timer, preset, Start/Pause, Reset, Exercises tab | PASS | Switched tabs, started 1:00 timer, Pause appeared, Reset and Exercises returned. |
| Live workout readiness/rest alerts/skip, +/- set controls, Delete This Workout | BLOCKED | Controls rendered; not all actions were exercised. Deletion would remove account data. |
| Exercise detail Overview/How To/Muscles/History, Back | PASS | Switched panels and returned to workout detail. |
| Exercise detail more control | BLOCKED | Visible control lacked a listener in source; not independently clicked in the deployed UI. Branch opens existing menu. |
| Exercise Library list, search, muscle/equipment filters, detail | PASS | 341 entries loaded; Leg Press search and filters narrowed results; View opened detail with anatomy. |
| Library detail Add to Workout | FAIL | Builder opened with “No exercises added yet.” Branch preselects the chosen exercise. |
| Custom workout builder Add, name, Save, reopen | PASS | Added Leg Press, saved QA Functional Test, found it in Manage, reopened its workout. |
| Library every individual exercise/media asset | BLOCKED | Representative list/detail and image observed; all 341 entries were not opened individually. Automated browser smoke checks anatomy across list rows. |
| History expand/collapse, Calendar month/day, Records | PASS | History showed saved set; Calendar September 28 showed workout and month navigation worked; Records showed Chest Press 50 lb. |
| Progress period data and exercise trend | PASS | One workout, one set, 400 lb and Chest Press trend appeared from saved data. |
| Progress Overview/Strength/Volume/Body Stats tabs and more | FAIL | Tabs and more did nothing. Branch targets existing sections and menu. |
| Progress Coach check-in, proposals, Ask, phase form, photo/measurement Pro controls | BLOCKED | Visible but not exercised end-to-end; changes could alter account coaching/goal state. |
| Settings My Profile, Units, Save details | PASS | Expanded profile; changed Pounds → Kilograms → reload → Pounds, verifying saved preference. |
| Settings Rest Timer, Theme, Notifications, three-dot menu | PASS | Timer start/pause/reset worked; Theme/Notifications showed their existing feedback; menu opened and closed. |
| Settings Pro previews and FREE/PRO Beta | PASS | Nine preview overlays opened/closed; access toggled and restored PRO. |
| Settings training preference selectors/save, avatar, display name | BLOCKED | Rendered; not all values were changed/saved. |
| Goals body-goal Back | FAIL | From Goals, Back walked to first-run Welcome. Branch returns to Goals when editing goal is canceled. |
| Goals calorie/water forms and plan change | BLOCKED | Forms and controls rendered; no saved target change tested. |
| Body Weight screen | PASS | Opened and showed existing history. |
| Water and Food logging | PASS | Logged 250 mL; logged Egg, one serving/72 kcal and saved a favorite. |
| Measurements form | PASS | Saved QA waist 32 in; chart and list showed entry. |
| Photos screen/add/compare | BLOCKED | Screen and file input loaded; no disposable photo was uploaded, so compare and private sync were not verified here. |
| Manage workouts Reset disclosure | PASS | Expanded and showed three reset choices. Destructive actions not selected. |
| Backup download/restore and data reset/deletion | BLOCKED | Requires disposable backup and destructive restore/reset; no success claim. |
| iPhone viewport, keyboard, fixed navigation, PWA install/offline | BLOCKED | Cloud validation browser lacked viewport/PWA installation controls. PR browser smoke runs a 390×844 fixture; physical iPhone and installed PWA still require manual verification. |
| Console/runtime errors during live flows | PASS | No app-origin JavaScript errors seen; only validation browser extension metadata errors. Network-failure coverage was limited by browser diagnostics. |

## Targeted fixes and regression evidence

1. `workout-experience.js`: picker wheel options are `div[role=option]`, while Repeat and Coach confirmation searched for buttons. Store copied/confirmed values through `saveSet`, update labels and comparison. `tests/test_liftova_functional_qa.js` proves copy of 50 lb × 8.
2. `index.html`: `progressionSuggestion` can return `status: insufficient` without weight. Render Next only for a ready numeric suggestion; regression proves both insufficient and ready cases.
3. `liftova-reference-v3.js`: presentation controls had no handlers, and Add to Workout called `showBuilder` without selecting the source exercise. Wire the existing menu/sections and add the exercise to an open builder. Browser smoke exercises these paths.
4. `liftova-home.js`: Home action fallbacks did not open the menu/profile in the live UI; the profile fallback selected nonexistent `Settings` bottom tab. Bind visible icons to existing global actions.
5. `onboarding.js`: body-goal creation from an established profile entered the first-run journey, whose Back led to Welcome. Preserve Goals origin and return there on Back; focused regression covers this route.
6. `workout-coach-targets.js` and `sw.js`: advance the workout script URL and service worker cache so existing installed clients receive the fixed handlers after an update.

The live site remains on the baseline until the PR is merged. Targeted branch behavior is covered by local regression tests and the PR browser smoke workflow; live retesting of patched code requires a branch preview or post-merge deployment.

## Automated checks

- PRISM Tests: 66 passed, 0 failed locally.
- Test & Deploy JavaScript: all `tests/test_*.js` passed locally, including new focused regressions.
- Test & Deploy database: staged migrations/RLS/storage suite passed locally.
- LIFTOVA Browser Smoke: local execution blocked because the runner has no Chromium binary and CDN download was unavailable. GitHub Actions installs Chromium and must pass on the PR.

QA-created account data: one completed Chest Press workout, one custom workout named QA Functional Test, 250 mL water, Egg food/favorite, and one 32 in waist measurement. Existing account data was preserved. These entries were not deleted during a production audit.
