# Coordinated V2 workout-save RPC: draft, not deployed

The original PRISM production RPC `prism_apply_account_batch(changes jsonb)` validates `auth.uid()`, performs per-row revision checking, accepts at most 500 changes, and writes normalized account rows. The original session hierarchy lives across source, session, exercise, and set tables.

The adjacent SQL file `docs/sql/prism-guarded-workout-v2.DRAFT.sql` is **a reviewable proposal, not an approved executable migration**.

## What is implemented in the SQL proposal

- Owner-authenticated history checkpoint covering every persisted history row, including position, payload and revision.
- A guarded writer accepting only `workoutHistoryV52` and its four table types.
- Account-scoped transaction advisory lock, checkpoint compare, a single call to the existing account batch writer, and the resulting checkpoint.
- Explicit refusal of oversize transaction batches, missing auth and invalid checkpoints.

## Release blocker

**Existing original-app writers do not acquire the advisory lock**. Even though each new guarded request is serialized against other guarded requests, the original app can still write concurrently. The original app must be updated to participate in the same synchronization protocol **and** validate stale-history semantics before this guarded endpoint is allowed to write to the production account. A lock by itself does not make a stale legacy write safe.

The original UI may also already have a pending write scheduled after reading old state. Coordinated rollout requires version negotiation / writer gating, old-client refresh behavior and complete test-account proofs. This design must never silently overwrite old workouts. During the transition, keep redesign saves disabled.

Other design limits: 500-row batch cap can prevent a single atomic ordered append on very large histories. This must be addressed using an independently verified database-native insertion/position update protocol, not split into uncoordinated requests. A checkpoint must be obtained consistently with the history snapshot; independently fetched values can race. A cryptographic representation of record content should be reviewed before deploy (the draft `md5` is a change fingerprint, not an auth credential). Existing RLS and all RPC grants must be audited.

## Verification plan

1. Run SQL parser checks and static tests off production.
2. Create isolated authenticated test users in a separate project with schema parity.
3. Test two guarded writers, one legacy writer, revoked access, stale checkpoints, duplicate sessions, partial child errors, limits and exact read-back.
4. Upgrade and verify the original writer before any new writer is enabled.
5. Review and approve migration/rollback explicitly; then stage, verify and deploy.

No SQL was executed by this PR on the PRISM project.
