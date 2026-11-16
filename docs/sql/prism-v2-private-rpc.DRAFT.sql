-- MYLIFTCOACH 2.0 / DESIGN DRAFT ONLY — DO NOT DEPLOY.
-- Depends on docs/sql/prism-v2-isolated-schedule.DRAFT.sql.
-- Review first: PostgreSQL grants, owner privileges, RLS, auth.uid(), existing
-- original clients and isolated concurrent authenticated transactions.
-- No original PRISM account table, data, procedure or policy is modified.
--
-- Private privileged functions are not exposed as REST endpoints. Exposed
-- wrappers are SECURITY INVOKER; all authorizations are derived from auth.uid().
-- The privileged functions must be owned by a tightly controlled migration role.
-- They MUST NOT accept an owner_id input or dynamic SQL.
--
create schema if not exists prism_v2_private;
revoke all on schema prism_v2_private from public, anon, authenticated;
grant usage on schema prism_v2_private to authenticated;

-- Explicitly forbid bypassing CAS by REST table writes.
revoke all on table public.prism_v2_workout_schedules from public, anon, authenticated;

create or replace function prism_v2_private.schedule_read()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare owner_id uuid := auth.uid(); result jsonb;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select pg_catalog.jsonb_build_object(
   'revision',revision,
   'document',document
 ) into result
 from public.prism_v2_workout_schedules
 where user_id=owner_id;
 return result;
end;
$$;
revoke all on function prism_v2_private.schedule_read() from public, anon, authenticated;
grant execute on function prism_v2_private.schedule_read() to authenticated;

-- Canonical exercise IDs from original-exercise-catalog.js (60) and
-- approved preview exercises (12); 63 unique IDs. Review when catalog evolves.
create or replace function prism_v2_private.is_supported_exercise(exercise_id text)
returns boolean language sql stable security definer set search_path = ''
as $catalog$ select exercise_id = any(array[
 'ab-crunch',
 'assisted-dip',
 'assisted-pullup',
 'biceps-curl',
 'cable-crunch',
 'cable-curl',
 'cable-fly',
 'cable-lateral-raise',
 'cable-woodchop',
 'calf-raise',
 'chest-press',
 'chest-press-cable',
 'chest-supported-row',
 'close-grip-pulldown',
 'dead-bug',
 'dumbbell-curl',
 'dumbbell-lateral-raise',
 'dumbbell-row',
 'dumbbell-shoulder-press',
 'face-pull',
 'glute-bridge',
 'glute-kickback',
 'goblet-squat',
 'hack-squat',
 'hammer-curl',
 'hip-abduction',
 'hip-thrust',
 'incline-chest-press',
 'incline-dumbbell-curl',
 'incline-dumbbell-press',
 'lat-pulldown',
 'lateral-raise',
 'leg-curl',
 'leg-extension',
 'leg-press',
 'lying-leg-curl',
 'machine-chest-press',
 'overhead-triceps',
 'pallof-press',
 'pec-deck',
 'preacher-curl',
 'push-up',
 'rear-delt-cable-fly',
 'reverse-pec-deck',
 'romanian-deadlift',
 'rope-hammer-curl',
 'rope-pushdown',
 'seated-calf-raise',
 'seated-leg-curl',
 'seated-row',
 'shoulder-press',
 'single-arm-cable-row',
 'single-arm-triceps-pushdown',
 'smith-bench-press',
 'smith-squat',
 'split-squat',
 'standing-calf-raise',
 'standing-leg-curl',
 'step-up',
 'straight-arm-pulldown',
 'triceps-extension',
 'triceps-push',
 'triceps-pushdown'
]::text[]) $catalog$;
revoke all on function prism_v2_private.is_supported_exercise(text) from public, anon, authenticated;
-- No authenticated grant: callable only from the guarded private save routine.

-- ISO calendar dates must be real days.
create or replace function prism_v2_private.valid_day(value text)
returns boolean language plpgsql immutable security invoker set search_path = ''
as $calendar$
begin
 if value is null or value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return false; end if;
 return value::date::text=value;
exception when others then return false;
end;
$calendar$;
revoke all on function prism_v2_private.valid_day(text) from public, anon, authenticated;

create or replace function prism_v2_private.schedule_save(
 expected_revision bigint, new_document jsonb
)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
 owner_id uuid := auth.uid();
 result jsonb;
 plan jsonb;
 element jsonb;
 selected jsonb;
 rule jsonb;
 date_key text;
 names text[] := array[]::text[];
 id text;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if expected_revision is null or expected_revision < 0 then raise exception 'Expected revision required'; end if;
 if new_document is null or pg_catalog.jsonb_typeof(new_document)<>'object'
    or new_document->>'version'<>'1'
    or pg_catalog.jsonb_typeof(new_document->'plans')<>'array'
    or pg_catalog.jsonb_typeof(new_document->'assigned')<>'array'
    or pg_catalog.jsonb_array_length(new_document->'assigned')<>7
    or pg_catalog.jsonb_array_length(new_document->'plans') > 100
    or pg_catalog.octet_length(new_document::text) > 262144
 then raise exception 'Invalid schedule structure'; end if;
 for plan in select value from pg_catalog.jsonb_array_elements(new_document->'plans') loop
  if pg_catalog.jsonb_typeof(plan)<>'object'
     or pg_catalog.jsonb_typeof(plan->'id')<>'string'
     or pg_catalog.jsonb_typeof(plan->'title')<>'string'
     or pg_catalog.jsonb_typeof(plan->'ids')<>'array'
     or pg_catalog.jsonb_array_length(plan->'ids')<1
     or pg_catalog.jsonb_array_length(plan->'ids')>40
     or pg_catalog.length(pg_catalog.btrim(plan->>'title'))<1
     or pg_catalog.length(plan->>'title')>80
     or pg_catalog.length(plan->>'id')<1
     or pg_catalog.length(plan->>'id')>128
  then raise exception 'Invalid workout'; end if;
  id := plan->>'id';
  if id = any(names) then raise exception 'Duplicate workout identifier'; end if;
  names := pg_catalog.array_append(names,id);
  for element in select value from pg_catalog.jsonb_array_elements(plan->'ids') loop
   if pg_catalog.jsonb_typeof(element)<>'string'
      or pg_catalog.length(element #>> '{}')<1
      or pg_catalog.length(element #>> '{}')>128
      or not prism_v2_private.is_supported_exercise(element #>> '{}')
   then raise exception 'Invalid or unsupported exercise identifier'; end if;
  end loop;
 end loop;
 for selected in select value from pg_catalog.jsonb_array_elements(new_document->'assigned') loop
  if selected <> 'null'::jsonb
     and (pg_catalog.jsonb_typeof(selected)<>'string'
       or not (selected #>> '{}'=any(names)))
  then raise exception 'Unknown assigned workout'; end if;
 end loop;
 -- Preserve all dated overrides and recurring rules, with verified plan references.
 if new_document ? 'overrides' then
  if pg_catalog.jsonb_typeof(new_document->'overrides') <> 'object' then
   raise exception 'Invalid one-time workout overrides';
  end if;
  for date_key,selected in select key,value from pg_catalog.jsonb_each(new_document->'overrides') loop
   -- A JSON null is a deliberate one-date rest day, not a missing plan.
   -- Preserve the rule for later weeks and reject all other unknown values.
   if not prism_v2_private.valid_day(date_key)
      or (selected <> 'null'::jsonb and
         (pg_catalog.jsonb_typeof(selected)<>'string'
          or not ((selected #>> '{}')=any(names))))
   then raise exception 'Invalid dated workout override'; end if;
  end loop;
 end if;
 if new_document ? 'recurring' then
  if pg_catalog.jsonb_typeof(new_document->'recurring') <> 'array'
    or pg_catalog.jsonb_array_length(new_document->'recurring')>500
  then raise exception 'Invalid repeating workout rules'; end if;
  for rule in select value from pg_catalog.jsonb_array_elements(new_document->'recurring') loop
   if pg_catalog.jsonb_typeof(rule)<>'object'
      or pg_catalog.jsonb_typeof(rule->'workoutId')<>'string'
      or not ((rule->>'workoutId')=any(names))
      or not prism_v2_private.valid_day(rule->>'start')
   then raise exception 'Invalid repeating workout rule'; end if;
   if rule ? 'end' and rule->'end'<>'null'::jsonb then
    if not prism_v2_private.valid_day(rule->>'end')
    then raise exception 'Invalid repeating workout end date'; end if;
    if (rule->>'end')::date < (rule->>'start')::date
    then raise exception 'Repeating workout end precedes start'; end if;
   end if;
   if rule ? 'weeks' then
    if pg_catalog.jsonb_typeof(rule->'weeks')<>'number'
       or (rule->>'weeks') !~ '^[0-9]{1,3}$'
    then raise exception 'Invalid repeat duration'; end if;
    if (rule->>'weeks')::integer not between 1 and 520
    then raise exception 'Invalid repeat duration'; end if;
   end if;
  end loop;
 end if;
 -- Atomic conditional INSERT for an unsaved account. Unique user_id prevents
 -- two first saves from succeeding even if both read revision 0.
 if expected_revision = 0 then
  insert into public.prism_v2_workout_schedules(user_id,revision,document)
  values(owner_id,1,new_document)
  on conflict (user_id) do nothing
  returning pg_catalog.jsonb_build_object('revision',revision,'document',document) into result;
 else
  -- A single UPDATE owns the row lock and checks the expected revision.
  update public.prism_v2_workout_schedules
  set revision=revision+1,document=new_document,updated_at=pg_catalog.now()
  where user_id=owner_id and revision=expected_revision
  returning pg_catalog.jsonb_build_object('revision',revision,'document',document) into result;
 end if;
 if result is null then
   raise exception 'Schedule changed; reload before saving' using errcode='PT409';
 end if;
 return result;
end;
$$;
revoke all on function prism_v2_private.schedule_save(bigint,jsonb) from public, anon, authenticated;
grant execute on function prism_v2_private.schedule_save(bigint,jsonb) to authenticated;

-- REST-callable narrow wrappers: privilege remains with restricted functions.
create or replace function public.prism_v2_schedule_read()
returns jsonb language sql stable security invoker set search_path = ''
as $$select prism_v2_private.schedule_read()$$;
revoke all on function public.prism_v2_schedule_read() from public, anon;
grant execute on function public.prism_v2_schedule_read() to authenticated;

create or replace function public.prism_v2_schedule_save(
 expected_revision bigint, new_document jsonb
)
returns jsonb language sql volatile security invoker set search_path = ''
as $$select prism_v2_private.schedule_save(expected_revision,new_document)$$;
revoke all on function public.prism_v2_schedule_save(bigint,jsonb) from public, anon;
grant execute on function public.prism_v2_schedule_save(bigint,jsonb) to authenticated;

-- RELEASE BLOCKERS: isolated authenticated DB execution and concurrency tests,
-- independent SECURITY DEFINER/RLS/grant audit, exercise-id allowlist,
-- testing with old app left open and a migrated user, physical iPhone tests.
-- This is a reviewable design, not an approved production migration.
