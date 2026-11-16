# Custom schedule atomic-save design — NOT READY FOR PRODUCTION

This draft is not a production migration. It does not change Supabase. Current custom workout cloud-save preflight (#357–358) only checks content before a save; it is vulnerable to concurrent writers between read and write. This batch adds a static SQL proposal for an owner-scoped checkpoint and transaction lock across **both** original sources: `customWorkoutsV5` and `dailyTrackingV1`. The checkpoint includes child tables, positions, revisions and all payloads, including nutrition, water and weight.

## Required additional work (release blocker)

1. The original app's `prism_apply_account_batch` does **not** join this lock. It can write concurrently and alter child records while the new RPC is checking. Updating just this new RPC is not enough.
2. Existing original app clients may already be open and might continue to write without new coordination. A fully coordinated rollout must handle old clients or isolate new sync into a separate owner-scoped versioned storage mechanism.
3. A client reading cloud rows then obtaining a checkpoint is **not** an atomic snapshot. Build a server-side read with the corresponding checkpoint in one consistent transaction and reject change after it.
4. The original cloud writer can break one logical edit into multiple batches. No promise of atomicity applies to more than 500 rows using the current helper; reject or design an independently audited DB-native procedure.
5. Live auth + RLS, permissions, foreign keys, source metadata and concurrent database transactions need **isolated testing**. Simulated tests in the PR are not production database integration tests.
6. Do not enable 2.0 cloud saves, merge or deploy until full end-to-end on-device and isolated DB checks are successful and explicitly approved.

The SQL file is a design draft and intentionally does not contain GRANT statements.
