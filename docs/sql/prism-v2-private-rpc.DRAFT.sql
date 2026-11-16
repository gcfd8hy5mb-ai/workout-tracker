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
   then raise exception 'Invalid exercise identifier'; end if;
  end loop;
 end loop;
 for selected in select value from pg_catalog.jsonb_array_elements(new_document->'assigned') loop
  if selected <> 'null'::jsonb
     and (pg_catalog.jsonb_typeof(selected)<>'string'
       or not (selected #>> '{}'=any(names)))
  then raise exception 'Unknown assigned workout'; end if;
 end loop;
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
   raise exception 'Schedule changed; reload before saving' using errcode='40001';
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
