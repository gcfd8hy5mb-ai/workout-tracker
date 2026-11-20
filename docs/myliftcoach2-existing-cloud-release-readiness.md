# MYLIFTCOACH 2.0 — Existing Supabase sync release readiness (November 19, 2026)

**This document is a staged plan, not approval to enable writes.**

## Verified against active PRISM Supabase project

- Project: `kirlpjflaoriiusfamsk`, active and healthy at inspection.
- The existing production migrations already include `20261116024621_create_mlc2_isolated_sync_v1` and `20261116030205_mlc2_read_only_session_pagination_v1`.
- Deployed RPCs: `public.mlc2_v1_read(type,id)`, `public.mlc2_v1_commit(operation,type,id,revision,deleted,payload)`, `public.mlc2_v1_list_sessions(cursor,limit)`.
- The existing private schema has `mlc2_private.records` and `mlc2_private.receipts`, both with RLS enabled and owner-scoped policies.
- RPC functions are SECURITY INVOKER and use `auth.uid()`; execute privileges were observed for `authenticated`, not `anon`. The `authenticated` role has access to private tables only through the private schema; Data API exposure must be checked separately.
- **Do not apply the unrelated draft `prism_v2_*` schedule migration for session-history sync.** It would create an unnecessary second backend. The dedicated schedule document is still a separate unapproved feature.

## Implementation in this draft

1. `existing-cloud-sessions.js`: opt-in owner-verifying, paginated, **read-only** existing 2.0 cloud session inventory; loaded by the app's Account settings. It does not import/overwrite local workout history.
2. `existing-session-transport.js`: a testable compatibility adapter for the already-deployed `mlc2_v1_read` and `mlc2_v1_commit` contracts. **ENABLED=false**; not loaded by the production browser. The test adapter checks owner, session, revision, operation UUID and response integrity.
3. Existing local workout retention/duplicate protection and schedule read-only previews remain intact. No changes to production tables or data were performed.

## Required before enabling session writes

- Independent review of private schema exposure, RPC privileges, RLS policies, deletion semantics, malformed payloads, and realistic abuse/size limits. Existing Supabase security advisor warning for leaked-password protection is a separate account-security task.
- Sign into MYLIFTCOACH 2.0 on a physical iPhone and run the read-only inventory. Verify exact cloud ownership and the real RPC response shape.
- Design and test a *session-specific* read-compare-commit-readback coordinator with immutable operation UUIDs and expected revisions. Persist a pending operation ID safely across an ambiguous timeout; a retry must reuse the **exact** original operation ID/payload instead of creating a duplicate.
- Test two signed-in devices with one synthetic workout under an explicitly authorized account, concurrent saves, offline recovery, and read-back. Do not migrate/overwrite legacy `prism_account_*` records.
- Provide a rollback plan: disable only the 2.0 client write feature, retain original PRISM account tables and both 2.0 private tables; never destructively delete records as rollback.
- Require explicit release approval for any production save. No auth tokens, service-role secrets, or production credentials in source.

## Deployment gate

- Read-only inventory: implemented in draft; browser and authenticated device acceptance still required.
- Existing-v1 save adapter: test-only, **not connected** to browser.
- Dedicated schedule RPC migration: **not deployed** and **not required** for legacy completed-session sync.
- PR #373: draft, not merged; no production sync or cross-device recovery is claimed.

## November 20 development integration

Settings → Sync and recover history opts the signed-in session into completed-workout backup. It uses the same verified-user and paginated v1 inventory paths. The writer creates only new revision-zero `mlc2-history-*` records, with stable operation IDs and independent read-back. Recovery merges matching v1 2.0 entries into the signed-in device's history and preserves local entries and conflicting records. Manual test copies and original PRISM history are outside the new backup namespace. This is development-only until an approved release.

The 2.0 client recognizes Free, Pro and Lifetime Pro. It checks paid access against the authenticated Supabase user response using administrator-managed `app_metadata.myliftcoach_entitlement`. Pro requires `tier: "pro"` and a future ISO `expires_at`; Lifetime Pro uses `tier: "lifetime_pro"`. The original app's browser tier and beta preference cannot grant paid access. Existing subscriptions still need an authorized account-side source to supply the server claim. No subscription grants or production records were changed in this batch.

## Private beta access

Settings → Beta Access Mode appears after Supabase Auth verifies a user with the administrator-managed boolean `app_metadata.myliftcoach_beta=true`. Free and Pro are device preferences scoped to that account. A fresh sign-in verifies authorization before applying the saved preference. The Account tier field always shows the underlying subscription. Set `BETA_PREVIEWS_ENABLED=false` in the 2.0 entitlement module for public release to ignore beta preferences and honor the paid tier.

The original subscription adapter keeps `prismEntitlementV1` local-only. The inspected Supabase project had no billing/entitlement table or verification RPC, and its existing users had only provider keys in app metadata. A trusted issuer for paid grants and a beta grant for the intended tester are outstanding. Beta enrollment must preserve other app metadata.

The deployed v1 database RPCs passed an authenticated-role transaction with two synthetic subjects covering immutable session commit, exact payload read and paginated recovery, idempotent retry, rejection of a conflicting write, record-type separation and account isolation. Test subjects, records and receipts were rolled back and their absence verified.
