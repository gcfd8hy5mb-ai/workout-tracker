-- DESIGN DRAFT ONLY. Do NOT apply to live PRISM.
-- Requires coordination with legacy writer before use.
-- Requires separately reviewed RLS, grants and isolated authenticated integration tests.
-- Proposed RPC checkpoint over *all* original workoutHistoryV52 cloud rows.
create or replace function public.prism_workout_history_checkpoint_v2()
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
 owner_id uuid := auth.uid();
 digest_input text;
begin
 if owner_id is null then
  raise exception 'Authentication required' using errcode='42501';
 end if;
 select coalesce(string_agg(
  row_data.table_name || ':' || row_data.id || ':' || row_data.revision::text || ':' ||
  row_data.source_key || ':' || coalesce(row_data.parent_id,'') || ':' ||
  coalesce(row_data.slot,'') || ':' || coalesce(row_data.position::text,'') || ':' ||
  row_data.payload::text, E'\\n' order by row_data.table_name,row_data.id
 ), '')
 into digest_input
 from (
  select 'sources'::text as table_name,id,revision,source_key,parent_id,slot,position,payload
  from public.prism_account_sources
  where user_id=owner_id and source_key='workoutHistoryV52'
  union all
  select 'sessions',id,revision,source_key,parent_id,slot,position,payload
  from public.prism_account_sessions
  where user_id=owner_id and source_key='workoutHistoryV52'
  union all
  select 'session_exercises',id,revision,source_key,parent_id,slot,position,payload
  from public.prism_account_session_exercises
  where user_id=owner_id and source_key='workoutHistoryV52'
  union all
  select 'sets',id,revision,source_key,parent_id,slot,position,payload
  from public.prism_account_sets
  where user_id=owner_id and source_key='workoutHistoryV52'
 ) as row_data;
 return md5(digest_input);
end;
$$;

-- This guarded RPC protects a single planned batch from competing guarded RPC calls.
-- It is NOT safe against existing legacy writers until they participate in the same
-- account-scoped lock and reject stale full-history writes.
create or replace function public.prism_apply_workout_guarded_v2(
 expected_checkpoint text,
 changes jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
 owner_id uuid := auth.uid();
 current_checkpoint text;
 entry jsonb;
 output jsonb;
begin
 if owner_id is null then
  raise exception 'Authentication required' using errcode='42501';
 end if;
 if expected_checkpoint is null or expected_checkpoint !~ '^[a-f0-9]{32}$' then
  raise exception 'Expected checkpoint required';
 end if;
 if jsonb_typeof(changes) <> 'array'
    or jsonb_array_length(changes) < 1
    or jsonb_array_length(changes) > 500 then
  raise exception 'Expected between 1 and 500 changes';
 end if;
 for entry in select value from jsonb_array_elements(changes) loop
  if entry->>'source_key' is distinct from 'workoutHistoryV52'
     or not (entry->>'table'=any(array['sources','sessions','session_exercises','sets'])) then
   raise exception 'Only workout history records are allowed';
  end if;
 end loop;

 -- Lock before comparing checkpoint. Old writers must be modified to share this lock.
 perform pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended(owner_id::text || ':workoutHistoryV52',0)
 );
 current_checkpoint := public.prism_workout_history_checkpoint_v2();
 if current_checkpoint <> expected_checkpoint then
  raise exception 'Workout history changed; reload before saving' using errcode='40001';
 end if;

 -- Legacy RPC already checks authenticated owner and per-record revisions.
 -- One RPC invocation is one database transaction; no multi-batch append.
 output := public.prism_apply_account_batch(changes);
 return pg_catalog.jsonb_build_object(
  'saved',output,
  'checkpoint',public.prism_workout_history_checkpoint_v2()
 );
end;
$$;

-- Deployment requires an independent review of permissions. Do not grant
-- execute to PUBLIC or anon. Verify no role bypasses RLS. No execution here.
