# Proposed guarded workout append — NOT DEPLOYED

This document records an implementation requirement, **not** authorization to modify the live PRISM database.

## Why the existing RPC is insufficient for a history-wide save

The existing `prism_apply_account_batch(changes jsonb)` checks `auth.uid()`, validates individual `expected_revision` values and updates per-row revisions. The original `workoutHistoryV52` is normalized into a collection of session/exercise/set rows. Two clients can independently append different session IDs and both pass per-row revision checks. The full session history is then not protected by one global compare-and-swap operation.

## Required guarded append contract

1. Read existing owner-specific `workoutHistoryV52` history using the legacy persistence schema.
2. Build the completed session and its child exercise and set rows using the existing `PRISMStorageModel.normalize` format; enforce unique parent/child IDs and reject any malformed or duplicate sessions.
3. Submit a **single account-scoped transactional request** with authenticated user, expected history version/checkpoint, and only the new session with its children.
4. In the database, validate ownership via `auth.uid()`, serialize edits for this user's session collection, compare the expected checkpoint against the *actual* latest data, insert the complete session subtree atomically, and return a new checkpoint.
5. On mismatch, return a conflict without writing anything; refresh and reconcile instead of silently replacing records.
6. After success, independently reread and check original plus new sessions, including every set, before confirming a save.
7. No production RPC invocation should occur until tests with separate test accounts verify RLS, old app compatibility, concurrent writes, atomic rollback, retry after network interruption and real iPhone session continuity.

**Compatibility risk:** The existing original-app RPC does not participate in a new advisory lock. A new RPC's own lock is therefore insufficient to serialize legacy writers. A production-ready design must coordinate through a shared serialization mechanism or provide a validated database isolation strategy that prevents a legacy writer from changing the relevant session collection between comparison and commit. Do not claim the isolated mock tests prove cross-version safety.

## Current gate

All new UI remains read-only. The in-memory `atomic-append-contract.js` module simulates the proposed contract but performs **no** Supabase writes. Do not merge this into production or activate live saving until the database design is independently validated.
