-- REVIEW-ONLY / NEVER APPLY TO LIVE PRISM WITHOUT EXPLICIT APPROVAL.
-- Install AFTER isolated schedule + private RPC DRAFT SQL in a throwaway database.
-- Reduce privilege of SECURITY DEFINER read/save functions by assigning their
-- ownership to a NOLOGIN role without BYPASSRLS, inheriting no client roles.
create role prism_v2_executor nologin noinherit;
grant usage on schema auth, public, prism_v2_private to prism_v2_executor;
grant execute on function auth.uid() to prism_v2_executor;
grant select,insert,update on table public.prism_v2_workout_schedules to prism_v2_executor;
-- The private routine invokes these helpers as the definer role.
grant execute on function prism_v2_private.is_supported_exercise(text) to prism_v2_executor;
grant execute on function prism_v2_private.valid_day(text) to prism_v2_executor;

-- Definer is intentionally NOT a table owner and cannot bypass the row policy.
create policy prism_v2_executor_read on public.prism_v2_workout_schedules
 for select to prism_v2_executor using ((select auth.uid())=user_id);
create policy prism_v2_executor_insert on public.prism_v2_workout_schedules
 for insert to prism_v2_executor with check ((select auth.uid())=user_id);
create policy prism_v2_executor_update on public.prism_v2_workout_schedules
 for update to prism_v2_executor using ((select auth.uid())=user_id)
 with check ((select auth.uid())=user_id);
-- Postgres ALTER OWNER requires CREATE on target function schema. Grant only
-- for the ownership transfer, then revoke. Never grant role membership to API.
grant create on schema prism_v2_private to prism_v2_executor;
alter function prism_v2_private.schedule_read() owner to prism_v2_executor;
alter function prism_v2_private.schedule_save(bigint,jsonb) owner to prism_v2_executor;
revoke create on schema prism_v2_private from prism_v2_executor;

-- Explicitly ensure the role never gains direct anonymous client access.
revoke all on table public.prism_v2_workout_schedules from public,anon,authenticated;
revoke all on function prism_v2_private.schedule_read() from public,anon;
revoke all on function prism_v2_private.schedule_save(bigint,jsonb) from public,anon;
-- The public invoker wrappers retain EXECUTE only for authenticated users.
-- The executor role has no LOGIN, BYPASSRLS, CREATEDB, CREATEROLE or SUPERUSER.
-- Still requires an independent Supabase permissions audit and JWT session test.
