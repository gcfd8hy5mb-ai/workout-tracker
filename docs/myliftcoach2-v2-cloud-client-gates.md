# V2 client cloud connection — release gate OFF

The transport module is checked in for review but intentionally cannot run. It refuses construction even when the caller requests `enabled:true`: the compiled constant `ENABLED=false` is a second, independent release gate.

Proposed contract: an authenticated, owner-bound request to `public.prism_v2_schedule_read()` returns the account's revision+document, and `public.prism_v2_schedule_save(expected_revision,new_document)` returns its new revision+document. The caller must only adopt a server state after checking owner continuity and validating response. Failed saves never modify local drafts.

**Still blocking:** Real Supabase auth integration, function privilege audit, secure exercise validation, complete repeating-rule migration, release approval, and physical-device tests. The database RPCs do not exist in PRISM production; never call them there or switch this gate during a normal development batch.

No production database writes or deployment took place.
