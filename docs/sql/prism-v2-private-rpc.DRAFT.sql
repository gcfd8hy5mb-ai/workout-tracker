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

-- Verified source catalog: 341 original exercises from the consolidated
-- November 2026 2.0 library, plus 3 additional supported starter IDs.
-- Keep synced with the imported catalog; verify all IDs in disposable SQL tests.
create or replace function prism_v2_private.is_supported_exercise(exercise_id text)
returns boolean language sql stable security definer set search_path = ''
as $catalog$ select exercise_id = any(array[
 'ab-crunch',
 'ab-crunch-machine',
 'ab-wheel-kneeling',
 'ab-wheel-rollout',
 'adductor-machine',
 'air-bike',
 'air-bike-intervals',
 'arc-trainer',
 'arnold-press',
 'assault-runner-walk',
 'assisted-close-grip-dip',
 'assisted-dip',
 'assisted-pull-up',
 'assisted-pullup',
 'back-extension',
 'banded-lateral-walk',
 'barbell-back-squat',
 'barbell-bench-press',
 'barbell-curl',
 'barbell-hip-thrust',
 'barbell-overhead-press',
 'barbell-romanian-deadlift',
 'barbell-row',
 'barbell-spider-curl',
 'battle-ropes',
 'bayesian-cable-curl',
 'behind-back-cable-lateral-raise',
 'belt-squat',
 'bench-dip',
 'biceps-curl',
 'bicycle-crunch',
 'bike-intervals',
 'bird-dog',
 'body-saw',
 'box-squat',
 'bulgarian-split-squat',
 'cable-bench-press',
 'cable-biceps-curl',
 'cable-chest-fly',
 'cable-crunch',
 'cable-curl',
 'cable-diagonal-kickback',
 'cable-fly',
 'cable-front-raise',
 'cable-glute-kickback',
 'cable-glute-kickback-straight',
 'cable-hammer-curl',
 'cable-hip-abduction',
 'cable-kickback',
 'cable-lateral-raise',
 'cable-leg-extension',
 'cable-pallof-hold',
 'cable-pallof-press',
 'cable-preacher-curl',
 'cable-pull-through',
 'cable-pullover',
 'cable-rdl',
 'cable-rear-delt-cross',
 'cable-seated-wide-row',
 'cable-shrug',
 'cable-side-bend',
 'cable-skull-crusher',
 'cable-step-up',
 'cable-triceps-kickback',
 'cable-woodchop',
 'cable-y-raise',
 'calf-raise',
 'captains-chair-knee-raise',
 'captains-chair-leg-raise',
 'chest-press',
 'chest-press-cable',
 'chest-supported-db-row',
 'chest-supported-rear-delt-fly',
 'chest-supported-row',
 'close-grip-bench-press',
 'close-grip-lat-pulldown',
 'close-grip-pulldown',
 'close-grip-push-up',
 'close-seated-cable-row',
 'concentration-curl',
 'converging-chest-press',
 'cross-body-cable-triceps-extension',
 'cross-body-hammer-curl',
 'cuffed-cable-lateral-raise',
 'curved-treadmill',
 'db-arnold-press',
 'db-cyclist-squat',
 'db-pullover',
 'db-shrug-seated',
 'db-squeeze-press',
 'db-stiff-leg-deadlift',
 'db-suitcase-carry',
 'db-tate-press',
 'dead-bug',
 'deadmill-push',
 'decline-barbell-bench-press',
 'decline-cable-fly',
 'decline-sit-up',
 'diamond-push-up',
 'dip-machine',
 'donkey-calf-raise',
 'dual-rope-overhead-extension',
 'dumbbell-bench-press',
 'dumbbell-chest-fly',
 'dumbbell-curl',
 'dumbbell-front-raise',
 'dumbbell-lateral-raise',
 'dumbbell-overhead-triceps-extension',
 'dumbbell-romanian-deadlift',
 'dumbbell-row',
 'dumbbell-shoulder-press',
 'dumbbell-split-squat',
 'elliptical',
 'elliptical-intervals',
 'ez-bar-curl',
 'ez-bar-skull-crusher',
 'face-pull',
 'farmer-carry',
 'farmer-carry-db',
 'feet-up-bench-press',
 'floor-barbell-press',
 'floor-db-press',
 'floor-press',
 'frog-pump',
 'front-foot-elevated-split-squat',
 'front-squat',
 'glute-bridge',
 'glute-bridge-machine',
 'glute-kickback',
 'goblet-squat',
 'good-morning',
 'hack-squat',
 'hack-squat-narrow',
 'hack-squat-reverse',
 'half-kneeling-pallof-press',
 'half-kneeling-single-arm-pulldown',
 'hammer-curl',
 'hanging-knee-raise',
 'hanging-straight-leg-raise',
 'heels-elevated-goblet-squat',
 'high-cable-biceps-curl',
 'high-to-low-cable-fly',
 'hip-abduction',
 'hip-thrust',
 'hip-thrust-machine',
 'incline-barbell-bench-press',
 'incline-bench-barbell-row',
 'incline-cable-fly',
 'incline-chest-press',
 'incline-db-rear-delt-raise',
 'incline-dumbbell-curl',
 'incline-dumbbell-press',
 'incline-hammer-curl',
 'incline-machine-chest-press',
 'incline-push-up',
 'incline-skull-crusher',
 'incline-treadmill-walk',
 'inverted-row',
 'jacobs-ladder',
 'jm-press',
 'jump-rope',
 'kickstand-rdl',
 'kneeling-cable-crunch',
 'kneeling-cable-row',
 'kneeling-single-arm-pulldown',
 'landmine-lateral-raise',
 'landmine-reverse-lunge',
 'landmine-row',
 'landmine-squat',
 'lat-pulldown',
 'lateral-lunge-db',
 'lateral-raise',
 'lean-away-cable-lateral-raise',
 'leaning-cable-lateral-raise',
 'leg-curl',
 'leg-extension',
 'leg-extension-single-leg',
 'leg-press',
 'leg-press-calf-raise',
 'leg-press-narrow',
 'leg-press-single-leg',
 'leg-press-single-leg-calf',
 'low-to-high-cable-fly',
 'lying-leg-curl',
 'lying-leg-curl-single-leg',
 'machine-chest-press',
 'machine-decline-chest-press',
 'machine-dip-close',
 'machine-front-raise',
 'machine-glute-kickback',
 'machine-hammer-curl',
 'machine-high-row',
 'machine-hip-thrust-single-leg',
 'machine-lateral-raise',
 'machine-lateral-raise-single-arm',
 'machine-low-row',
 'machine-neutral-shoulder-press',
 'machine-preacher-curl',
 'machine-pullover',
 'machine-rear-delt-row',
 'machine-shrug',
 'machine-sissy-squat',
 'machine-tibialis-raise',
 'machine-triceps-extension',
 'meadows-row',
 'medicine-ball-slams',
 'narrow-stance-leg-press',
 'neutral-grip-db-press',
 'neutral-grip-lat-pulldown',
 'neutral-grip-pulldown',
 'nordic-hamstring-curl',
 'one-arm-dumbbell-row-bench',
 'outdoor-running',
 'overhead-cable-triceps-extension',
 'overhead-triceps',
 'pallof-press',
 'pec-deck',
 'pendlay-row',
 'pendulum-squat',
 'pendulum-squat-narrow',
 'pendulum-squat-wide',
 'plank',
 'plate-front-raise',
 'plate-loaded-decline-press',
 'plate-loaded-high-row',
 'plate-loaded-incline-press',
 'plate-loaded-low-row',
 'preacher-curl',
 'prone-y-raise',
 'push-up',
 'rear-delt-cable-fly',
 'rear-delt-machine',
 'recumbent-bike',
 'recumbent-bike-steady',
 'reverse-cable-curl',
 'reverse-cable-fly',
 'reverse-crunch',
 'reverse-curl',
 'reverse-grip-pushdown',
 'reverse-grip-triceps-pushdown',
 'reverse-lunge',
 'reverse-nordic',
 'reverse-pec-deck',
 'reverse-wrist-curl-cable',
 'romanian-deadlift',
 'rope-hammer-curl',
 'rope-pushdown',
 'rower-intervals',
 'rowing-machine',
 'ruck-walk',
 'russian-twist',
 'seal-row',
 'seated-calf-press-leg-press',
 'seated-calf-raise',
 'seated-ez-overhead-extension',
 'seated-hammer-curl',
 'seated-leg-curl',
 'seated-leg-curl-single-leg',
 'seated-row',
 'seated-tibialis-machine',
 'shoulder-press',
 'shuttle-run',
 'side-lying-hip-abduction',
 'side-plank',
 'single-arm-cable-chest-press',
 'single-arm-cable-chest-press-standing',
 'single-arm-cable-row',
 'single-arm-high-cable-curl',
 'single-arm-lat-pulldown',
 'single-arm-machine-chest-press',
 'single-arm-machine-row',
 'single-arm-machine-shoulder-press',
 'single-arm-overhead-cable-extension',
 'single-arm-overhead-db-extension',
 'single-arm-preacher-curl',
 'single-arm-rope-pushdown',
 'single-arm-triceps-pushdown',
 'single-leg-calf-raise',
 'single-leg-db-rdl',
 'single-leg-glute-bridge',
 'single-leg-hack-squat',
 'single-leg-hip-thrust',
 'single-leg-leg-press',
 'single-leg-lying-curl',
 'single-leg-romanian-deadlift',
 'single-leg-seated-curl',
 'single-leg-standing-calf-raise',
 'sissy-squat',
 'ski-erg',
 'ski-erg-intervals',
 'sled-pull',
 'sled-push',
 'slider-leg-curl',
 'smith-bench-press',
 'smith-calf-raise',
 'smith-front-squat',
 'smith-hip-thrust',
 'smith-rdl',
 'smith-romanian-deadlift',
 'smith-sissy-squat',
 'smith-squat',
 'smith-standing-calf-raise',
 'spider-curl',
 'spin-bike',
 'split-squat',
 'stability-ball-leg-curl',
 'stair-climber',
 'stair-climber-intervals',
 'standing-calf-machine',
 'standing-calf-raise',
 'standing-hip-abduction',
 'standing-leg-curl',
 'standing-machine-hip-abduction',
 'standing-single-leg-curl',
 'stationary-bike',
 'step-up',
 'step-up-db',
 'stepmill',
 'straight-arm-pulldown',
 'suitcase-carry',
 'sumo-deadlift',
 't-bar-row',
 'tibialis-raise',
 'treadmill',
 'treadmill-jog',
 'treadmill-sprint',
 'triceps-extension',
 'triceps-push',
 'triceps-pushdown',
 'underhand-lat-pulldown',
 'upright-row',
 'v-bar-pushdown',
 'versa-climber',
 'walking',
 'walking-lunge',
 'walking-lunges-db',
 'walking-outdoors',
 'wide-grip-lat-pulldown',
 'wide-grip-push-up',
 'wide-seated-cable-row',
 'wide-stance-leg-press',
 'wrist-curl-cable',
 'z-press',
 'zottman-curl'
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
