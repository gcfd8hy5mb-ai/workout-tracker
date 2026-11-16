# Production guarded-append design — outstanding requirements

**Status:** draft technical design only. Not an executable or approved Supabase migration; nothing has been deployed.

## Observed existing schema

The original `workoutHistoryV52` is represented by `prism_account_sources`, `prism_account_sessions`, `prism_account_session_exercises`, and `prism_account_sets`. Each table is RLS-enabled with `(user_id,id)` primary keys, and identifiers must be 64-character SHA-256 hex strings. Session and child positions must be nonnegative. Source and parent relationships use deferrable foreign keys.

The original `PRISMStorageModel.restoreSnapshot` sorts sessions by `position` and expects newest at index zero. A new session requires updating the position and revision of **every preexisting session**, not merely inserting a new session. Prior preflight/mock coverage overlooked this.

## Production change outline, requiring separate approval

1. Implement a common per-owner transaction lock for *both* the legacy `prism_apply_account_batch` transaction and new guarded append operations. A new RPC using its own advisory lock is **not sufficient** to protect legacy writers that do not participate. Analyze deadlock risk from ordering existing row locks versus advisory locks.
2. Create a server-side snapshot/checkpoint mechanism over all relevant rows and revisions, not only session IDs; include source, session, exercise, and set tables. Obtain a matching restored snapshot and checkpoint atomically.
3. Under that same lock, verify `auth.uid()` ownership and the expected checkpoint, atomically validate the entire proposed write set, create the new session and its children, and shift preexisting session positions without losing old exercises or sets. Preserve legacy session IDs and revisions.
4. Enforce deduplication, owner isolation, rollback on any child failure, and post-commit read-back verification. Ensure RPC permissions are restricted to the authenticated role with RLS preserved.
5. Validate concurrent writes from original and redesigned apps, including retry after network loss and huge-history batching. The legacy batch RPC limit is 500 rows; a large history may exceed it, so **do not** use multiple uncoordinated transactions to implement one append.
6. Before production deployment, create a separately isolated testing environment/project and run authenticated DB integration tests. Only then produce a reviewed migration, rollback plan, and explicit approval step.

## What is implemented now

A pure `ordered-append-planner.js` verifies an in-memory candidate against a cloud snapshot and constructs expected-revision changes using the original `PRISMStorageModel` and `PRISMReconcile`. It never sends writes. Tests verify position shifts, lossless ordering and refusal of stale snapshots. It is not an atomic server operation and is not production-save ready.
