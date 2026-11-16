# MYLIFTCOACH 2.0 — isolated cloud schedule permission review

This branch adds **draft SQL only**. It has not been run. PRISM is production, and the other existing Supabase project (CostRig) is unrelated; neither is suitable for unauthorized experiments.

## Proposed access design

The v2 schedule is a standalone user-owned document. Original `customWorkoutsV5`, `dailyTrackingV1`, nutrition, water/weight and training history are never written by this RPC.

- Authenticated app users receive **no direct INSERT/UPDATE/DELETE** on the v2 table; this closes the REST bypass that the previous schema draft had.
- A narrow `public` SECURITY INVOKER wrapper invokes a private-schema SECURITY DEFINER function. The latter checks `auth.uid()`, accepts no owner parameter, has a locked search path and writes only the v2 schedule row.
- Conditional insert (expected revision 0) and conditional update (revision N) are atomic under PostgreSQL row locking. The returned revision/document are read from the successful row.
- All function grants are explicit: revoke default PUBLIC/anon execute and grant authenticated only.

## Mandatory independent review

1. Confirm function owner has minimum required permissions, database role privilege paths and Supabase grants after creation. SECURITY DEFINER can bypass RLS and is therefore highly sensitive.
2. Validate Postgres SQL syntax and privilege behavior against an **isolated test project**, with separate JWT-authenticated users and two concurrent transactions.
3. Exercise IDs require a trusted server-side allowlist. The current SQL validates shape/length, **not that an exercise is supported**.
4. Check oversized JSON, concurrent first insert, stale update, anonymous direct REST access, revoked tokens and explicit user switches.
5. Align existing custom workout imports and their repeating date rules to the v2 schedule document before making this the authoritative state. No automatic migration or auto-write from the legacy app.
6. Confirm the original app stays operational and no stored user workouts, nutrition, tracking or history change.

This proposal is **not deployment-ready**. The app's production cloud-save control remains disabled. Physical-device verification is also outstanding.
