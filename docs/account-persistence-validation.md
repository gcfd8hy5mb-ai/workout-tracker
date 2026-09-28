# Staged validation and rollout gates

## Continuation checkpoint (2026-09-27)

- Release validation continuation (evening): in a newly initialized browser
  storage context, Account A signed in through the secure PRISM form and
  restored `Test account 1`, Maintain and its 1,850-calorie target without
  claiming the disposable guest profile. Its photo UI showed the empty state
  after the earlier synthetic photo tombstone. This verifies fresh-browser
  account restore and non-resurrection; a second device that already cached
  the image before deletion has not been exercised.
- A private preview-only diagnostic made live requests with Account A's actual
  access JWT (without displaying or exporting the token). `/auth/v1/user`
  verified A. A's profile read returned six rows; filtering B's profile
  returned zero. A's private Storage list returned one object in A's folder;
  listing B's folder returned zero. Downloading A's known existing exact
  object path returned HTTP 200; B's exact path returned HTTP 400. An insert
  forged with B's user ID returned HTTP 403, PostgreSQL code `42501`. These
  are actual user-session API checks for A. No cross-account row or object
  was created by these denied requests.
- The first B sign-in attempt returned `Invalid login credentials`, but the
  owner subsequently signed in to the existing `Test account 2` successfully.
  `/auth/v1/user` verified B's real access JWT. B's own profile read returned
  six rows and A's returned zero; B listed one own private object and zero
  A objects. B's own exact-path photo download returned HTTP 200 and A's
  known exact path returned HTTP 400. B's forged A-owner profile insert
  returned HTTP 403 / PostgreSQL `42501`, and B's attempt to overwrite A's
  exact existing object path returned HTTP 400. The requested fresh disposable
  third test user was not created; the valid existing B session provides the
  reciprocal ordinary authenticated isolation evidence. Direct B deletion of
  A's retained synthetic object remains unverified.
- B's real expired-token refresh rotated its access token and `/auth/v1/user`
  still verified the same account; app reload retained B's Recomp goal,
  1,950-calorie target and partially logged Day 4 workout. This tests refresh,
  session persistence and workout restore, not server-side immediate JWT
  invalidation after logout. In the newly initialized browser storage
  context, a disposable local cache entry corresponding to B's existing
  tombstoned photo was removed by live `photos.restore()`. A fresh synthetic
  B photo was saved privately, locally removed without a cloud tombstone,
  and restored from private Storage with matching size and SHA-256. Its
  active test row/photo must be deleted after validation. This validates
  empty-cache active restore and cached-photo tombstone application in an
  isolated browser storage context; an actual second physical device and
  conflicting account-data deletions have not been exercised.
- Separate live SQL tests with `SET LOCAL ROLE authenticated` and each test
  subject also saw six own profile rows, zero other profile/photo/Storage rows,
  and rejected a forged owner insert with `42501`. This supports the policies
  but does not substitute for the B-token HTTP checks.
- The owner completed Apple authentication and the owner-private PR #55
  preview became accessible. A disposable guest profile was created there;
  its data was never claimed into either account.
- Live preview Account A sign-in restored `Test account 1`, its Maintain goal
  and 1,850-calorie target. A page reload retained the signed-in account and
  restored the same data. Signing out returned to the separate guest profile.
- Completed A -> B -> A in the same browser. B restored `Test account 2`, a
  Recomp goal, 1,900-calorie target and its partially logged Day 4 workout
  (70 lb x 4 reps, one of eight sets). Returning to A restored A's profile,
  goal and target without B's active-workout resume card. This validates the
  app's account switching and account-scoped restore in this browser; it does
  not prove direct cross-account API denial or a separate device/PWA restore.
- Two live tabs displayed A. Saving a test name in one caused the other to
  show its account-changed refresh warning. A stale save in that tab was
  refused with `Refresh PRISM before saving here`. A's original test name was
  restored. This verifies the stale local writer guard, not simultaneous
  remote conflicting writes from independent devices.
- Uploaded one deliberately synthetic PNG in A's Progress photos UI. The UI
  reported private account save; live catalog counts changed from zero to one
  active photo metadata row and from one to two bucket objects. B's photo UI
  showed no photos; returning to A showed the synthetic photo again. This is
  app-level isolation and same-browser persistence, not an explicit B-token
  download/list/overwrite denial or an independent-device blob restore.
  After the owner's action-time confirmation, deleted the synthetic A photo
  through the UI and accepted its native confirmation dialog. Live catalog
  counts then showed zero active photo metadata rows, two tombstoned rows
  and two retained Storage objects. Reloading A's Progress photos showed the
  empty state without resurrecting the image. This verifies the same-browser
  deletion and metadata tombstone, not second-device disappearance; the
  retained objects were not purged from Storage.
- On B's later sign-in, the account panel showed `Account check is taking
  longer` even after B's data was visible. The account timeout could overwrite
  the completed account status while the separate photo sync continued. The
  draft now clears that timer immediately after `controller.connect()`; this
  small status fix passed the JS, Python, PostgreSQL and PRISM regression
  suites locally. The owner-private preview is a snapshot and does **not**
  contain this newer draft change yet.
- Browser console inspection found `Identifier 'PRISM_GOAL_NAMES' has already
  been declared` in `phase-insights.js`, which shares the classic-script scope
  with `onboarding.js`. It predates this account change and the module has
  additional global function overlap; the mobile/console gate remains open.
- Still open: direct B-token deletion of A's exact Storage object; live email
  confirmation and post-logout revocation semantics; a physical second-device
  test and account-data deletion under divergent local state; installed-PWA
  restore, offline recovery, legacy import, conflicting remote edits and
  iPhone/Android checks. Classify lower-risk beta follow-ups separately before
  deciding whether the remaining items block this beta merge.

- Resumed from PR #55 head `236c46c` and main `5a515c6`. Both PR workflows
  completed successfully on this exact head; no previously passing suite was
  rerun. The draft remains unmerged and Pages deployment remains main-only.
- Checked the remaining Data API grant question against the live project:
  `authenticated` has SELECT privilege on all 40 account tables, while `anon`
  has SELECT privilege on none. This checks grants only; it does not test a
  real user's JWT, the Data API exposure setting, cross-account denial, or
  private photo download. Keep the authenticated RLS/Storage gate open.
- The validation browser was still at an Apple ID login page. Automatic
  approval review rejected inspection of that unrelated authentication page,
  so no sign-in or preview browser test occurred in this continuation.
  Browser, PWA, email lifecycle and second-device gates remain open.
- Audited the existing completion, custom workout deletion, tracking removal,
  measurement removal and photo deletion call sites. Their explicit deletion
  ledger or photo tombstone hooks are present; real conflicting two-device
  behavior and UI completion still need validation.
- Supabase documents that a signed-out access JWT can remain usable until its
  expiry even when its refresh token is revoked. The local sign-out and
  `/auth/v1/user` failure fixtures do not establish immediate server-side JWT
  invalidation. Test the live sign-out/revocation semantics and describe the
  observed window accurately before marking that gate complete.

- Inspected current `main` (`5a515c6`) and draft PR #55 (`de7776a`); the
  branch already contains the newer active-workout restore regression and all
  prior Supabase work. Earlier successful tests were accepted as completed.
- A read-only query on the actual PRISM Supabase project found two confirmed
  Auth users with prior sign-ins, account profile rows owned by both users,
  and one private photo object. It did **not** establish that either user's
  JWT can read/write only their own records, or that the object is inaccessible
  to the other user. No user records or photos were inspected or modified.
- The owner-private nonproduction preview still shows its ChatGPT sign-in gate
  in the validation browser. Authentication completed on another browser or
  device does not transfer to this isolated browser. Real A/B API, email
  lifecycle, photo Storage, account switching, second-browser/PWA and mobile
  gates therefore remain open. Do not infer a pass from the aggregate query.
- Fixed an offline outbox gap: after a transient authenticated save failure,
  the account controller now retries automatically at 5, 10, 20, 40 and
  60-second intervals (capped). A successful verified write resets the delay;
  sign-out/stopping cancels it and 401/403 authorization failures wait for a
  new sign-in. The local fallback is untouched. Targeted tests cover a failed
  save followed by automatic recovery and no retry after revocation.
- After that fix, all `tests/test_*.js`, 21 Python unit tests and the embedded
  PostgreSQL account/RLS suite pass locally. This is **not** a real two-user
  browser or Storage policy test. Both GitHub PR workflows on commit `e4655245`
  succeeded: `PRISM Tests` and `Test and Deploy to GitHub Pages` (test job;
  Pages publication remains main-only). The owner-private isolated preview was
  refreshed with the retry fix and deployed successfully at the same preview
  URL. PR #55 remains draft; no production deploy.

## Isolated preview (2026-09-27)

- PR #55's staged app assets were copied into a separate, owner-private
  nonproduction Site: `https://prism-pr55-validation.mdhrv77zhr.chatgpt.site`.
  Its deployment succeeded; the GitHub Pages production site, `main` and the
  draft PR's merge state were not changed. The preview is a snapshot; updates
  to PR #55 require republishing its assets separately.
- Opening the private preview currently requires the owner's ChatGPT sign-in.
  Secure Apple sign-in did not submit through browser-assisted entry, so the
  owner must finish that authentication via browser handoff before live app
  behavior can be inspected. No PRISM test account has been signed in and no
  production PRISM user data was copied into this preview.
- Real User A/User B Supabase RLS, private Storage, email session, account
  switching, browser/PWA and second-device restore remain **not verified**.

## Completed locally

- Authenticated live Supabase review on 2026-09-27: PRISM project is healthy;
  before these migrations the only public PRISM table was `prism_backups`
  (zero estimated rows), with RLS and four owner-only policies. The two
  additive SQL files were then run successfully against the actual project
  in the dashboard SQL Editor. No existing table or user row was deleted.
- Live catalog verification after execution: 40 `prism_account_*` tables all
  have RLS enabled and forced, 40 owner-only table policies, 86 foreign keys,
  one `prism_apply_account_batch` RPC, one private `prism-account-photos`
  bucket (10 MiB object limit), and both owner-folder Storage policies.
  These manual SQL Editor runs do not create tracked entries in the dashboard's
  migration history. Real authenticated User A/User B RLS tests remain pending;
  catalog inspection plus embedded PostgreSQL tests are not that test.
- Applied additive `202609270003_photo_tombstones.sql` in the live SQL Editor;
  the query reported success. It adds a nullable photo deletion timestamp and
  neither clears photos nor changes owner policies. These manual SQL Editor
  runs are not recorded as CLI migration-history entries.
- Refreshed against main `5a515c6`; PR #55's branch now contains a merge commit
  with that main tip and all previous draft work. The adapter and staged schema include
  Coach goal, training phase, phase transition, program proposal and recovery
  plan records. Coach Memory v2/Athlete Intelligence reconstruct from persisted
  source feedback, interventions and workout history.
- Staged an account-local storage adapter, session refresh, opt-in sync
  coordinator, early account namespace selection, and isolation of BOTH
  IndexedDB photo databases. Legacy guest keys/photos remain untouched.
  The coordinator's tests cover explicit guest claim, verified save/retry,
  A/B isolation and restore into an empty second browser state. A startup
  snapshot distinguishes default onboarding writes from preexisting account data.
  These files are present only on draft PR #55, not on deployed main.
- The service worker now bypasses other origins (including Supabase) and has
  a new shell cache version. Its offline test passes. The only live project
  changes in this session were the two additive database migrations; no
  production PRISM user data was read, overwritten or deleted.
- Draft-only runtime now loads the existing publishable-key config and auth
  helper, refreshes expiring email sessions with a new expiry, clears a revoked
  session, calls Supabase logout on sign-out, and presents account sign-in/
  sign-up controls in Profile. Startup verifies the user before account sync;
  a fresh account requires an explicit guest-data claim, while guest originals
  remain available. A BroadcastChannel prompts other open tabs to reload on
  auth changes. A second tab's account-local storage change now invalidates
  stale writes and prompts refresh before further saves. Unit fixtures cover
  the stale writer; real simultaneous-tab behavior, installed-PWA behavior
  and email-confirmation flow are NOT yet verified.
- Draft explicit-deletion ledger records the pre-delete source for user actions
  (custom workout, history/progress reset, tracking/measurement entry and key
  removal). Normalization derives stable row tombstones, the write RPC applies
  them with revisions, and restoration omits them. Position is now included
  in three-way comparisons so workout reordering syncs. Unit tests cover a
  deleted workout staying deleted and a reorder surviving cloud restoration.
  Capped Coach logs remain append/retention safe and are NOT inferred as user
  deletions merely because old entries are absent locally.
- Draft legacy `prism_backups` import is now explicitly offered only when the
  verified account has no normalized records and no preexisting account-local
  data. It allowlists/validates data, archives startup defaults, queues a
  verified write and retains the older backup. No blind automatic restore.
- Draft private-photo transport copies both legacy IndexedDB stores into
  account-scoped databases after an explicit guest-photo claim, uploads image
  bytes to private Storage and metadata to `prism_account_photos`, verifies
  hash/size on restore, and keeps device copies for offline use. Account-photo
  deletions use a persistent local retry marker and a verified cloud tombstone;
  second-device restore removes the deleted local copy. Fixture tests cover
  A/B isolation, idempotence, deletion and restore. No production photos were
  moved. Live browser and real authenticated Storage policy checks remain.
  Both existing photo UIs now queue account backup after normal save/delete;
  local-first UI text distinguishes signed-in private sync from guest storage.
- Only the beta preview choice (`free` or `pro`) syncs as a UI preference.
  Paid/Lifetime tier values, session tokens and developer flags remain local
  and are not interpreted as server-authoritative grants.

- All `tests/test_*.js`, 21 Python tests and the current main PRISM regression
  test pass after the latest branch/main merge (2026-09-27).
- Latest main PRISM regression suite: 25 checks pass.
- 21 existing Python unit tests pass.
- Embedded PostgreSQL executes both SQL migrations successfully with test-only
  Auth/Storage schemas. Tests cover A/B read isolation, forged-owner insert denial,
  anonymous denial, ownership-preserving foreign keys, stale revisions, batch
  rollback and private photo folder policies.
- Conversion/restoration preserves the audited localStorage structures including
  Coach recommendations/responses/outcomes and Adaptive decisions.
- Deterministic identities, retry without duplicates, capped-log retention,
  divergent-edit conflicts, account-change race guards, and network failures pass.
- A >500-record interrupted migration retries without duplicate records.
- PR #55 head `2e6fd315` passed both GitHub workflows on 2026-09-27:
  `PRISM Tests` and `Test and Deploy to GitHub Pages` test job succeeded;
  the Pages deploy job was skipped for this draft branch.
- Tier values never gate or delete these source records. Existing entitlement tests
  pass; the new adapter deliberately does not import client-written paid grants.
- No production data was read, uploaded, restored, reset or deleted during tests.

## Not yet implemented / verified (must block production activation)

1. PARTIAL: both additive migrations applied to the live Supabase project;
   table/policy/FK/RPC/private-bucket catalog verification passed. Execute
   actual authenticated User A/User B read/write/deny tests before marking
   the live security gate complete. Avoid real user data in test fixtures.
2. PARTIAL: draft has email auth UI, refresh, revocation check, sign-out and
   startup restore. Verify confirmation links, real login, reload and logout
   through the live project and browser/PWA before marking complete.
3. PARTIAL: draft has explicit guest claim, account-specific fallback, basic
   A/B isolation and cross-tab auth-change broadcast. It still needs real
   browser switching and simultaneous-tab tests; a stale tab now blocks writes
   and requires a refresh before saving new account data.
4. PARTIAL: draft calls the normalized sync controller from Profile startup,
   verifies auth before cloud work, hooks allowlisted saves, restores cloud
   sources after archive and reload, and keeps local data on network failure.
   Automatic retry after a failed save now passes the targeted fixture; verify
   live account data, conflict UI, active workout and browser offline recovery.
5. PARTIAL: explicit tombstones and list reordering implemented in draft with
   regression tests. Audit all deletion UI paths, active-session completion and
   Adaptive accepted ↔ dismissed transitions; test these with real two-device
   accounts and simulate conflicting deletion versus remote edit.
6. PARTIAL: guarded older `prism_backups` import is implemented and fixture
   tested. Verify first account import, divergent account refusal and retry in
   a real browser; old blind restore is disabled for signed-in accounts.
7. PARTIAL: both IndexedDB photo formats, private upload/restore, explicit
   guest claim, deletion markers, account scoping and copy verification are
   implemented and fixture tested. Verify real signed-in Storage policies,
   installed PWA/photo capture and second-device restore before release.
8. PARTIAL: beta Free/Pro preview preference is included in the normalized
   account data, while locally editable paid/lifetime flags remain excluded.
   Verify restore on a second real browser; finalized feature map is unchanged.
9. DONE IN DRAFT: Supabase is cross-origin and excluded from the service-worker
   fetch handler; no localStorage or IndexedDB clearing was introduced. Recheck
   with an installed PWA after live integration.
10. Test genuine second-device restore, signout/signin, active workout resume,
    iPhone/Android, installed PWA and browser console. Fixture roundtrips and
    embedded PostgreSQL are not substitutes for those checks.
11. Run the PR Test and Deploy workflow in test-only mode. Production deployment
    must wait until all above gates pass. The workflow now limits Pages deployment
    to main, and a draft branch cannot deploy even via workflow_dispatch.

## Reproduce

```
for f in tests/test_*.js; do node "$f" || exit 1; done
python -m unittest discover -s tests
npm ci --prefix tests/database --ignore-scripts
npm test --prefix tests/database
```

The SQL tests use PGlite (PostgreSQL), not the production Supabase service.
No service-role/secret key is needed or present. Do not run the SQL against
production until the existing schema review and staging checks are complete.

## Files

- `docs/account-persistence-audit.md`: observed storage inventory and design.
- `persistence/storage-model.js`: allowlisted lossless normalization and rehydration.
- `persistence/reconcile.js`: three-way merge planner and verification.
- `persistence/account-sync.js`: opt-in REST transport and resumable migration core.
- `supabase/migrations/202609260001_account_records.sql`: domain tables, foreign
  keys, RLS and atomic revision-checked write function.
- `supabase/migrations/202609260002_private_photos.sql`: private photo metadata
  and Storage policies.
- `supabase/migrations/202609270003_photo_tombstones.sql`: additive nullable
  deletion marker to prevent photo resurrection across devices.
- `tests/test_account_persistence.js`, `tests/test_account_transport.js`: fixtures.
- `tests/database/`: pinned PostgreSQL test dependency and executable RLS tests.
- `tests/test_advanced_analytics.js`: pins UTC for UTC date-only test fixtures.
- `.github/workflows/pages.yml`: PR tests and main-only deployment guard.
- `.gitignore`: excludes dependency/generated Python files.

The draft now changes the startup HTML/photo database selector, cloud session
helper and service worker. No workout logic or Free/Pro feature rule was edited.
Main remains the stable deployed version. Do not describe this draft as
completed account synchronization or a live deployment.
