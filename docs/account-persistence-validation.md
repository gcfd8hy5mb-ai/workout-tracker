# Staged validation and rollout gates

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
   Verify live account data, conflict UI, active workout and outbox retries.
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
