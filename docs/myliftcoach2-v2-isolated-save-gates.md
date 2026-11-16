# Isolated custom workout schedule — design-gate decision

## Why a separate table
The earlier proposed guarded RPC (#359) checkpoints original `customWorkoutsV5` and `dailyTrackingV1`. It cannot make concurrent writes safe while the old app continues writing the original `prism_apply_account_batch` without the same transaction lock. Both sources also contain original tracking data, so changing them to store schedule edits risks overwriting food/water/weight.

This alternative stores *only* the v2 weekly workout document in its own account-scoped record, leaving original Supabase records and original app behavior untouched. A versioned `revision` check enables compare-and-swap. The source of truth for custom workouts is that document after a user explicitly opts into migration. Historical date-based recurrence rules must be migrated separately; copying one week is not a complete migration.

## Remaining security blockers

- **DO NOT DEPLOY** the SQL: current DRAFT includes RLS but is not permission-complete. A `SECURITY INVOKER` RPC with direct table DML grants would let a user bypass revision checking via direct REST updates. Design a secure enforcement scheme: an audited RPC with safe privileges or a DB trigger applying CAS for every write. Do not use a public `SECURITY DEFINER` function casually.
- Demonstrate row-revision CAS and first-insert conflict using two distinct authenticated PostgreSQL transactions in an isolated Supabase test project.
- Validate full document contents at server boundary: exercise allowlist, plan count/size, date semantics, account isolation and request size.
- Cross-version migration must preserve existing custom workouts, original recurring dates, nutrition/water/weight and all prior progress. No writes to old storage.
- Only after permission review, database tests, and physical-device tests should cloud write code be enabled.

No live Supabase SQL executed in this batch; only read-only schema inspection on PRISM.
