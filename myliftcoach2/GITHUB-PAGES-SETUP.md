# MYLIFTCOACH 2.0 GitHub Pages release

The original app is served at the root of the workout-tracker GitHub Pages site. Its published 2.0 preview lives at [`/workout-tracker/myliftcoach2/`](https://gcfd8hy5mb-ai.github.io/workout-tracker/myliftcoach2/). Development takes place on the 2.0 feature branch. The branch and the published preview can be at different revisions.

## Verify the release candidate

1. Run **MYLIFTCOACH 2.0 Migration Verification** on the exact candidate commit. It checks the staged JavaScript regressions, the disposable PostgreSQL and PostgREST integration, and Chromium workout, Coach, backup, recovery, and account-boundary flows.
2. Review the candidate against `main`. Verify that original app entry points, persistence behavior, and production data are preserved. Keep draft SQL out of any production migration.
3. Review signed-in backup and recovery separately from the read-only history, profile and tracking imports. Check account ownership, conflict behavior, and the supported scope of each write.
4. Verify the charcoal-and-gold preview on phone and desktop and reconcile the approved demonstration manifest and assets before release sign-off.

## Publish only after approval

Open or update the existing pull request for review. The GitHub Pages workflow publishes on a push to `main`, so a merge is the deployment trigger. Keep the 2.0 folder and the shared files referenced by its HTML in the same artifact. After an approved merge, verify the Pages run, the original root entry point, and the 2.0 preview URL. Roll back a faulty preview with an approved revert of its release commit.
