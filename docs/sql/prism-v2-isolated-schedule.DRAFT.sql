-- DRAFT ONLY / NEVER RUN AGAINST LIVE PRISM WITHOUT EXPLICIT APPROVAL.
-- Dedicated MYLIFTCOACH 2.0 schedule document is independent of legacy
-- customWorkoutsV5 and dailyTrackingV1. Original client never writes this table.
-- This prevents cross-version lost updates for the schedule *in this table*.
-- No changes to original data, functions or security policies.
create table if not exists public.prism_v2_workout_schedules (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  document jsonb not null,
  updated_at timestamptz not null default now(),
  constraint prism_v2_workout_schedules_shape check (
    pg_catalog.jsonb_typeof(document)='object'
    and document->>'version'='1'
    and pg_catalog.jsonb_typeof(document->'plans')='array'
    and pg_catalog.jsonb_typeof(document->'assigned')='array'
    and pg_catalog.jsonb_array_length(document->'assigned')=7
  )
);
alter table public.prism_v2_workout_schedules enable row level security;
create policy v2_schedule_owner_select on public.prism_v2_workout_schedules
  for select to authenticated using ((select auth.uid())=user_id);
create policy v2_schedule_owner_insert on public.prism_v2_workout_schedules
  for insert to authenticated with check ((select auth.uid())=user_id);
create policy v2_schedule_owner_update on public.prism_v2_workout_schedules
  for update to authenticated using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);
-- Deliberately no DELETE policy. Read/writes via RPC only after permissions audit.
-- REVOKE table modifications from authenticated when RPC grants are finalized:
-- SECURITY INVOKER needs equivalent table privileges, therefore direct table
-- writes could bypass revision checks unless permissions are redesigned.
-- This is a blocker: use a carefully audited SECURITY DEFINER function in an
-- unexposed schema or a stronger table-level policy/trigger CAS mechanism.
-- DO NOT GRANT SELECT/INSERT/UPDATE IN PRODUCTION UNTIL RESOLVED.

-- SQL CONTRACT SKETCH, NOT DEPLOYABLE YET:
-- Fetch user_id+revision+document in one SELECT (same MVCC row).
-- Compare expected revision and atomically update using:
-- UPDATE ... SET revision=revision+1, document=$new_document
-- WHERE user_id=auth.uid() AND revision=$expected_revision RETURNING ...
-- If no row was returned, report conflict rather than overwriting.
-- On first save, INSERT with unique user_id and ON CONFLICT DO NOTHING;
-- return conflict if the row already exists.
-- All request owners must come from auth.uid(), never a user-provided ID.
-- Reject plans with unknown exercise IDs and cross-account imports.
-- Run tests with multiple separate authenticated DB transactions in an
-- ISOLATED test project and audit grants/RLS BEFORE any deployment.
