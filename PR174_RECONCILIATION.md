# PR #174 current-main reconciliation

This branch is rebuilt from current `main` rather than merging the stale/conflicted PR #174 branch.

Carried forward only the still-missing root-cause fixes:

- Removed `liftova-reference-v3.js` from the runtime loader so the retired duplicate presentation renderer cannot rebuild Home/menu chrome.
- Removed the delayed canonical Home mount and kept presentation modules sequential.
- Increased Browser Smoke timeout from 15 to 30 minutes so the complete browser exercise is not killed at the former hard timeout.
- Added a regression guard that fails if the retired renderer or delayed Home mount returns.

Current `main` remains authoritative for newer MYLIFTCOACH Profile, Pro, branding, learning, and other post-#174 work. Internal PRISM/LIFTOVA compatibility identifiers are intentionally untouched unless user-visible.
