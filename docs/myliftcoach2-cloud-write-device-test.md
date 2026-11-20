# MYLIFTCOACH 2.0 — manual real-device test upload

This is a **single, manually confirmed test-only cloud write** to the existing isolated `mlc2_private.records` backend. It does **not** enable automatic workout synchronization, merge the redesign, migrate old records, replace a local history, or touch legacy PRISM tables.

## iPhone test

1. Open the separately published `/workout-tracker/myliftcoach2/` preview and sign in with the existing account.
2. Open **Workouts** and complete one practice workout with at least one set (weight and repetitions).
3. In **My Account**, tap **Upload one test workout** and accept the explanatory confirmation.
4. Keep the page open until you see `Verified cloud test record: mlc2-test-...` and revision 1.
5. If the response is uncertain or the page reloads, tap **Verify pending upload** on the same device; this performs **only a read** and never repeats the write automatically.

## Laptop test

1. Open the same GitHub Pages preview, sign into the **same** account.
2. In **My Account**, tap **Read 2.0 cloud sessions**. A newly created test record ID is filled into the verification field.
3. Tap **Verify cloud workout**. Confirm title, set count, exercise IDs, weights, and repetitions match the iPhone entry.
4. No workout should appear in laptop **local completed history** merely from this read: the test is deliberately read-only on laptop.

## Data boundaries and rollback

- Live user action calls only `public.mlc2_v1_read` and, once after confirmation, `public.mlc2_v1_commit` with `p_type='session'`, `p_base_revision=0`, and a newly created `mlc2-test-<UUID>` identifier.
- Authenticated owner and identity are verified; concurrent IDs cannot overwrite each other. The pending operation ID and payload are saved locally **before** the write so an uncertain response is not mistaken for permission to resend.
- On an uncertain response, the app **never automatically retries**. It only checks whether the exact record already exists and has identical content.
- There is no automatic upload of completed workouts, no cloud-to-device import, and no destructive `DELETE` operation.
- To roll back the frontend feature, remove the two Account-setting controls and their module from the preview; keep cloud test records for audit unless the user expressly requests deletion.
- The original PRISM site stays untouched; publication copies only the staged `myliftcoach2/` subdirectory into GitHub Pages's source branch.

## Verification

- Unit tests: `tests/test_myliftcoach2_manual_cloud_test.cjs`.
- Mocked two-device browser test: `tests/run_myliftcoach2_two_device_cloud_test.cjs`.
- A successful mocked test is **not** a successful real authenticated production write; only the iPhone/laptop acceptance test above establishes that.
