# MYLIFTCOACH 2.0 — exercise media reconciliation (draft only)

## Evidence boundary

The original 341-exercise library currently records 14 explicitly linked single exercise photos and 327 anatomy-only entries in `library-visual-register.js`. The separate status report says 268 approved demonstrations exist, but their complete ID-to-file inventory, frame files, and approvals have **not** been verified in this branch. **Do not mark 268 assets imported, lost, or approved on this evidence alone.**

## This development batch

- `exercise-demonstrations.js`: checks exact IDs, explicit approval, permitted license/attribution metadata, distinct safe local frames, and all duplicate IDs (fail closed).
- `exercise-media-reconciliation.js`: a read-only inventory of every catalog ID with one of three statuses: approved multi-frame, legacy original single photo, or anatomy-only fallback. Never overwrites the source image or workout records.
- Tests: `tests/test_myliftcoach2_exercise_demonstrations.cjs` and `tests/test_myliftcoach2_exercise_media_reconciliation.cjs`.

## Next evidence required

1. Identify the separate approved-media manifest/repository/branch used for the 268 count, then compare its actual exercise IDs to the 341 original + three additional starter IDs.
2. Resolve the authoritative 344-exercise catalog and record a unique asset for every approved exercise; check files actually exist and demonstrate correct movement.
3. Bring approved media into the draft without writing to account workout data; leave missing assets visibly identified.
4. Run Node tests, mobile browser tests, and physical iPhone verification. A successful code commit does not equal a passed test.

**Hold:** no merge, no production deployment, no modification of live Supabase or exercise media without verified sources/licenses. 
