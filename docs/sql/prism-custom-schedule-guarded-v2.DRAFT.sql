-- DESIGN ONLY. NOT DEPLOYED OR APPROVED.
-- Original app uses prism_apply_account_batch without this lock.
-- This draft is NOT safe for production until legacy writers coordinate.
-- Targets customWorkoutsV5 and dailyTrackingV1; does not touch workoutHistoryV52.
create or replace function public.prism_custom_schedule_checkpoint_v2()
returns text language plpgsql security invoker set search_path = ''
as $$
declare
 owner_id uuid := auth.uid();
 content text;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select coalesce(pg_catalog.string_agg(
   row_data.table_name || ':' || row_data.id || ':' || row_data.revision::text || ':' ||
   row_data.source_key || ':' || coalesce(row_data.parent_id,'') || ':' ||
   coalesce(row_data.slot,'') || ':' || coalesce(row_data.position::text,'') || ':' ||
   row_data.payload::text, E'\\n' order by row_data.table_name, row_data.id
 ),'') into content
 from (
  select 'sources'::text table_name,id,revision,source_key,parent_id,slot,position,payload
    from public.prism_account_sources where user_id=owner_id
      and source_key in ('customWorkoutsV5','dailyTrackingV1')
  union all
  select 'workouts',id,revision,source_key,parent_id,slot,position,payload
    from public.prism_account_workouts where user_id=owner_id and source_key='customWorkoutsV5'
  union all
  select 'workout_exercises',id,revision,source_key,parent_id,slot,position,payload
    from public.prism_account_workout_exercises where user_id=owner_id and source_key='customWorkoutsV5'
  union all
  select 'tracking',id,revision,source_key,parent_id,slot,position,payload
    from public.prism_account_tracking where user_id=owner_id and source_key='dailyTrackingV1'
  union all
  select 'tracking_entries',id,revision,source_key,parent_id,slot,position,payload
    from public.prism_account_tracking_entries where user_id=owner_id and source_key='dailyTrackingV1'
  union all
  select 'tracking_maps',id,revision,source_key,parent_id,slot,position,payload
    from public.prism_account_tracking_maps where user_id=owner_id and source_key='dailyTrackingV1'
 ) row_data;
 return pg_catalog.md5(content);
end;
$$;

create or replace function public.prism_apply_custom_schedule_guarded_v2(
 expected_checkpoint text,
 changes jsonb
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
 owner_id uuid := auth.uid();
 change jsonb;
 current_checkpoint text;
 saved jsonb;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if expected_checkpoint is null or expected_checkpoint !~ '^[a-f0-9]{32}$' then
  raise exception 'Expected checkpoint required';
 end if;
 if jsonb_typeof(changes) <> 'array' or pg_catalog.jsonb_array_length(changes) < 1
   or pg_catalog.jsonb_array_length(changes) > 500 then
  raise exception 'One bounded atomic batch (1–500 changes) required';
 end if;
 for change in select value from pg_catalog.jsonb_array_elements(changes) loop
  if change->>'source_key' is null or
   (change->>'source_key' = 'customWorkoutsV5' and not (change->>'table' = any(array['sources','workouts','workout_exercises']))) or
   (change->>'source_key' = 'dailyTrackingV1' and not (change->>'table' = any(array['sources','tracking','tracking_entries','tracking_maps']))) or
   change->>'source_key' not in ('customWorkoutsV5','dailyTrackingV1') then
    raise exception 'Unsupported custom schedule source/table';
  end if;
 end loop;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text || ':customScheduleV2',0));
 current_checkpoint:=public.prism_custom_schedule_checkpoint_v2();
 if current_checkpoint <> expected_checkpoint then
  raise exception 'Schedule or tracking changed; reload before saving' using errcode='40001';
 end if;
 saved:=public.prism_apply_account_batch(changes);
 return pg_catalog.jsonb_build_object('saved',saved,'checkpoint',public.prism_custom_schedule_checkpoint_v2());
end;
$$;
-- DO NOT GRANT EXECUTE OR DEPLOY.
-- PRODUCTION BLOCKERS:
-- 1. Legacy prism_apply_account_batch does not honor above advisory lock/checkpoint.
-- 2. A client reading rows and then checkpoint separately can race.
-- 3. Requires an atomic checkpoint + rows read mechanism, auth/RLS audit and grants review.
-- 4. Existing app can split its changes across multiple 500-row batches.
-- 5. Verify schema compatibility, SQL parser, concurrency in a separate test project.
