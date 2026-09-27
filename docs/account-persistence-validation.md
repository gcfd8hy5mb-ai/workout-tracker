# Staged validation and rollout gates

## Completed locally

- Authenticated live Supabase review on 2026-09-27: PRISM project is healthy;
  the only public table is `prism_backups` (zero estimated rows), RLS enabled,
  authenticated SELECT/INSERT grants present, and four owner-only policies
  restrict backup reads and writes to `auth.uid() = user_id`. There are no
  tracked database migrations or new account tables in production yet.
- Refreshed against main `5a515c6`; adapter and staged schema now include
  Coach goal, training phase, phase transition, program proposal and recovery
  plan records. Coach Memory v2/Athlete Intelligence reconstruct from persisted
  source feedback, interventions and workout history.

- 17 JavaScript regression files pass (15 existing plus 2 account-persistence tests).
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

1. Apply additive migrations to staging, then validate the production plan.
2. Verify real email auth, token refresh/revocation and existing auth UI/entrypoint.
   The current audited index does not load the Supabase scripts.
3. Implement explicit local-account ownership claim, per-account local fallback,
   account-switch UI and multi-tab coordination. The staged core rejects an unknown
   owner; it does not silently claim data on login.
4. Wire normal save hooks/outbox and bootstrap hydration only after ownership is
   resolved. Current modules remain local-first and are not connected to this core.
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
9. Exclude Supabase endpoints from the existing service worker cache before loading
   cloud integration. Do not clear localStorage or IndexedDB to update app assets.
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

No runtime HTML, workout logic, Pro rules or existing persistence writers changed.
The existing main commit remains the stable version. Do not describe this draft
as completed account synchronization or a live deployment.
