# MYLIFTCOACH 2.0 — One-iPhone beta release preparation (NOT DEPLOYED)

Status: **PREPARED FOR USER APPROVAL — no beta grants or deployment applied.**

## Verified in the existing project

- Supabase project: PRISM (`kirlpjflaoriiusfamsk`).
- On 2026-11-20, an aggregate read-only check of `auth.users` found 8 accounts and **0** accounts with `raw_app_meta_data.myliftcoach_beta = true`.
- 2.0 `myliftcoach2/coach-entitlement-boundary.js` requires a freshly verified signed-in user with `user.app_metadata.myliftcoach_beta === true` before showing the Free/Pro beta switch.
- Per-user Free/Pro preference is stored on the phone only **after** server-side beta authorization; it is not an authority for paid access.
- The app can use the user's existing Supabase Auth account; a second device or second account is unnecessary.
- Latest beta code was reported at development commit `e99dd6b`; this preview snapshot should be prepared from the latest reviewed development branch, not from old commit `6038c60`.

## Beta authorization — requires explicit user approval

**Do not query or publish account email addresses or tokens as part of setup. Do not change any user until the owner approves the intended account.**

1. In the Supabase PRISM dashboard, open **Authentication → Users**.
2. Locate the owner's **existing MYLIFTCOACH account** and verify the intended user ID privately. Do not invent an ID or create a second account.
3. Upon approval, use a privileged, authenticated Supabase Auth administration operation to **merge** the single attribute `myliftcoach_beta: true` into that account's existing `app_metadata`, retaining all other keys. Do not use `raw_user_meta_data` or untrusted browser flags.
4. Independently verify that only the selected account received the grant. Avoid changing existing `myliftcoach_entitlement`, subscription, paid access, training history, or other user attributes.
5. Test the Free/Pro switch against a freshly verified session. Both beta modes keep basic Coach; Pro unlocks advanced Coach.
6. Before public release, disable the beta preview flag in the entitlement boundary and revoke beta grants as appropriate, without affecting paid subscriptions.

**Never directly update `auth.users` using ad hoc SQL as a substitute for the Supabase Auth Admin API.**

## GitHub Pages — production site must not be replaced

GitHub Pages normally publishes **one site per repository**, so deploying this branch to the existing `workout-tracker` Pages environment could replace the original app. **Do not do that.**

Recommended approved deployment path:
1. Preserve original production `workout-tracker` GitHub Pages site.
2. On explicit user approval, create a **separate GitHub repository**, e.g. `myliftcoach2-beta-preview`, dedicated to the static beta preview; no Vercel or paid APIs.
3. Publish only the reviewed `myliftcoach2` static app and required relative assets from the approved snapshot. Audit relative `../` imports, PWA manifest scope, service worker registration, and links before publishing. Include dependencies rather than silently breaking URLs.
4. Require a unique preview URL, confirmation it loads on iPhone Safari, and no production page changes.
5. Never hardcode service-role tokens or protected secrets into a GitHub Pages build.
6. The preview can authenticate to the existing PRISM Supabase backend using the already configured *publishable* key. Authenticated 2.0 writes must remain isolated from original workout records.
7. Do not create the preview repository or deploy until the user approves the exact target and scope.

## Single-iPhone acceptance

After the preview and the account-specific grant are approved and ready:

- Open isolated preview in iPhone Safari, sign in with the existing account.
- Settings → Beta Access Mode: Free, then Pro; verify Coach remains available in both and advanced features are restricted in Free.
- Verify the same custom workout appears in Home, Coach, and the workout editor and respects rest days.
- Finish a small test workout; Settings → Sync and recover history; confirm the original logged sets, reps, and weights.
- Open a Safari Private tab **on the same iPhone**, sign in with the same account, sync and verify exactly one copy of the test workout.
- Check Settings → Custom workout backup; test local recovery only when the target browser context has no locally saved custom workout.
- Confirm production workout history and existing users' data were not overwritten.
- Record actual device/Safari results; mock-browser tests do not substitute for physical-device acceptance.

## Release gates

- [x] Confirm server-controlled beta authorization mechanism in development code.
- [x] Check aggregate beta enrollment without modifying any account.
- [x] Document safe one-phone testing and distinct preview requirements.
- [ ] Owner approves which existing Supabase account receives the beta grant.
- [ ] Authorized beta grant applied and independently verified.
- [ ] Owner approves isolated GitHub preview repository/deployment.
- [ ] Preview is deployed and its real URL verified on iPhone Safari.
- [ ] One-iPhone acceptance passes.
- [ ] Separate production subscription entitlement source is confirmed before public release.
- [ ] No original app replacement or merge without explicit approval.
