# MYLIFTCOACH 2.0 — Coach feature completion register

Development branch: `feature/myliftcoach2-strict-custom-draft-recovery`. Draft PR #373.

## Implemented in development

- Account/guest-isolated completed 2.0 workout history for Coach evidence.
- Actual seven-day activity, working-set volume, recorded readiness, and last-trained muscle recency.
- Previous set comparisons and exercise-by-exercise local progress.
- Original Coach 8–10-rep progression thresholds and equipment-dependent increments using qualifying completed sessions; 2.0 local sessions take precedence over *verified* original history for the same exercise.
- Original exercise metadata ranking for same-muscle alternatives, optional 40/60/80% warm-ups, explicit `Use suggested weight` in the active session.
- Coach dashboard lists all previously trained compatible exercises, source labels, insufficient-evidence states, and an action opening today's resolved custom workout; no automatic weekly plan edits, no invented readiness or recovery score.
- Authenticated original history, recovery recency, and account settings displayed separately with read-only protections.
- Charcoal/gold visual styling aligned with approved redesign.

## Acceptance boundary

Feature integration is implemented and subject to automated verification; this **does not** mean the original production Coach engine was migrated byte-for-byte, trained on new data, independently clinically validated, or deployed. Unported provider-only behaviors and dynamic program generation require separate investigation if desired.

Before any production merge or release:
1. Verify real Supabase account data and identity-scoped recovery on an isolated staging target.
2. Verify server-side conflict protection and cross-device cloud writes when explicitly approved.
3. Complete physical iPhone and desktop acceptance on a deployment preview, including account switching, custom plan priority, exercise edits, and working-weight opt-in.
4. Confirm any Pro entitlement behavior matches the original application and does not unintentionally unlock gated functionality.

No new Coach or workout data was written to production Supabase by this branch.
