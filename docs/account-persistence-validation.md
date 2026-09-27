# Staged validation and rollout gates

## Completed locally

- Authenticated live Supabase review on 2026-09-27: PRISM project is healthy;
  the only public table is `prism_backups` (zero estimated rows), RLS enabled,
  authenticated SELECT/INSERT grants present, and four owner-only policies
  restrict backup reads and writes to `auth.uid() = user_id`. There are no
  tracked database migrations or new account tables in production yet.
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
  a new shell cache version. Its offline test passes. No browser auth session
  or production data was modified.

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
- Tier values never gate or delete these source records. Existing entitlement tests
  pass; the new adapter deliberately does not import client-written paid grants.
- No production data was read, uploaded, restored, reset or deleted during tests.

## Not yet implemented / verified (must block production activation)

1. Revalidate the signed-in Supabase project and apply the two additive
   migrations; browser session was found signed out on 2026-09-27 and secure
   user authentication is required before any live database change. SQL has
   passed embedded PostgreSQL tests but has NOT been applied to production.
2. Verify real email auth, token refresh/revocation and existing auth UI/entrypoint.
   The current audited index does not load the Supabase scripts.
3. Finish explicit ownership-claim and account-switch UI plus multi-tab
   coordination. The staged core has account-specific local fallback and
   rejects an unknown owner; it does not silently claim data on login.
4. Connect the staged on-write callback and startup hydration to real verified
   auth in the app UI, then test offline/reload and in-flight edit conflicts.
5. Implement explicit tombstones for deletion/reset and mutable collection ordering.
   Absence currently preserves cloud rows; this prevents accidental loss but is not
   sufficient for a finished two-way synchronization product. Adaptive accepted ↔
   dismissed transitions and active-session completion need lifecycle handling.
6. Reconcile old prism_backups rows through the allowlisted adapter with review of
   divergent data; never call the old blind restore as an automatic migration.
7. Transfer and verify blobs/data URLs from BOTH photo databases to private Storage,
   restore offline copies and update local-only privacy wording before uploading.
8. Preserve beta preferences across devices without treating a locally editable
   lifetime/pro value as a real server entitlement; finalized feature rules unchanged.
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
  and Storage policy foundation; no uploads or changes to existing photo stores.
- `tests/test_account_persistence.js`, `tests/test_account_transport.js`: fixtures.
- `tests/database/`: pinned PostgreSQL test dependency and executable RLS tests.
- `tests/test_advanced_analytics.js`: pins UTC for UTC date-only test fixtures.
- `.github/workflows/pages.yml`: PR tests and main-only deployment guard.
- `.gitignore`: excludes dependency/generated Python files.

The draft now changes the startup HTML/photo database selector, cloud session
helper and service worker. No workout logic or Free/Pro feature rule was edited.
Main remains the stable deployed version. Do not describe this draft as
completed account synchronization or a live deployment.
