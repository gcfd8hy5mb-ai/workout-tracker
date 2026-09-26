-- Staged additive migration. Apply first to a disposable/staging Supabase project.
-- Does not modify prism_backups, existing policies, auth configuration or user data.
begin;

create table public.prism_account_sources (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 unique(user_id,source_key)
);
alter table public.prism_account_sources enable row level security;
alter table public.prism_account_sources force row level security;
revoke all on public.prism_account_sources from public, anon, authenticated;
grant select, insert, update on public.prism_account_sources to authenticated;
create policy owner_only on public.prism_account_sources for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_profile (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_profile enable row level security;
alter table public.prism_account_profile force row level security;
revoke all on public.prism_account_profile from public, anon, authenticated;
grant select, insert, update on public.prism_account_profile to authenticated;
create policy owner_only on public.prism_account_profile for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_onboarding (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_onboarding enable row level security;
alter table public.prism_account_onboarding force row level security;
revoke all on public.prism_account_onboarding from public, anon, authenticated;
grant select, insert, update on public.prism_account_onboarding to authenticated;
create policy owner_only on public.prism_account_onboarding for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_goals (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_goals enable row level security;
alter table public.prism_account_goals force row level security;
revoke all on public.prism_account_goals from public, anon, authenticated;
grant select, insert, update on public.prism_account_goals to authenticated;
create policy owner_only on public.prism_account_goals for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_goal_phases (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_goal_phases enable row level security;
alter table public.prism_account_goal_phases force row level security;
revoke all on public.prism_account_goal_phases from public, anon, authenticated;
grant select, insert, update on public.prism_account_goal_phases to authenticated;
create policy owner_only on public.prism_account_goal_phases for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_athlete_preferences (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_athlete_preferences enable row level security;
alter table public.prism_account_athlete_preferences force row level security;
revoke all on public.prism_account_athlete_preferences from public, anon, authenticated;
grant select, insert, update on public.prism_account_athlete_preferences to authenticated;
create policy owner_only on public.prism_account_athlete_preferences for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_tracking (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_tracking enable row level security;
alter table public.prism_account_tracking force row level security;
revoke all on public.prism_account_tracking from public, anon, authenticated;
grant select, insert, update on public.prism_account_tracking to authenticated;
create policy owner_only on public.prism_account_tracking for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_workouts (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_workouts enable row level security;
alter table public.prism_account_workouts force row level security;
revoke all on public.prism_account_workouts from public, anon, authenticated;
grant select, insert, update on public.prism_account_workouts to authenticated;
create policy owner_only on public.prism_account_workouts for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_sessions (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_sessions enable row level security;
alter table public.prism_account_sessions force row level security;
revoke all on public.prism_account_sessions from public, anon, authenticated;
grant select, insert, update on public.prism_account_sessions to authenticated;
create policy owner_only on public.prism_account_sessions for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_current_sets (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_current_sets enable row level security;
alter table public.prism_account_current_sets force row level security;
revoke all on public.prism_account_current_sets from public, anon, authenticated;
grant select, insert, update on public.prism_account_current_sets to authenticated;
create policy owner_only on public.prism_account_current_sets for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_previous_sets (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_previous_sets enable row level security;
alter table public.prism_account_previous_sets force row level security;
revoke all on public.prism_account_previous_sets from public, anon, authenticated;
grant select, insert, update on public.prism_account_previous_sets to authenticated;
create policy owner_only on public.prism_account_previous_sets for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_targets (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_targets enable row level security;
alter table public.prism_account_targets force row level security;
revoke all on public.prism_account_targets from public, anon, authenticated;
grant select, insert, update on public.prism_account_targets to authenticated;
create policy owner_only on public.prism_account_targets for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_completions (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_completions enable row level security;
alter table public.prism_account_completions force row level security;
revoke all on public.prism_account_completions from public, anon, authenticated;
grant select, insert, update on public.prism_account_completions to authenticated;
create policy owner_only on public.prism_account_completions for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_active_workout (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_active_workout enable row level security;
alter table public.prism_account_active_workout force row level security;
revoke all on public.prism_account_active_workout from public, anon, authenticated;
grant select, insert, update on public.prism_account_active_workout to authenticated;
create policy owner_only on public.prism_account_active_workout for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_coach_actions (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_coach_actions enable row level security;
alter table public.prism_account_coach_actions force row level security;
revoke all on public.prism_account_coach_actions from public, anon, authenticated;
grant select, insert, update on public.prism_account_coach_actions to authenticated;
create policy owner_only on public.prism_account_coach_actions for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_coach_checkins (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_coach_checkins enable row level security;
alter table public.prism_account_coach_checkins force row level security;
revoke all on public.prism_account_coach_checkins from public, anon, authenticated;
grant select, insert, update on public.prism_account_coach_checkins to authenticated;
create policy owner_only on public.prism_account_coach_checkins for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_adaptive (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred,
 foreign key(user_id,parent_id) references public.prism_account_adaptive(user_id,id) deferrable initially deferred
);
alter table public.prism_account_adaptive enable row level security;
alter table public.prism_account_adaptive force row level security;
revoke all on public.prism_account_adaptive from public, anon, authenticated;
grant select, insert, update on public.prism_account_adaptive to authenticated;
create policy owner_only on public.prism_account_adaptive for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create index prism_account_adaptive_parent on public.prism_account_adaptive(user_id,parent_id);

create table public.prism_account_fatigue (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_fatigue enable row level security;
alter table public.prism_account_fatigue force row level security;
revoke all on public.prism_account_fatigue from public, anon, authenticated;
grant select, insert, update on public.prism_account_fatigue to authenticated;
create policy owner_only on public.prism_account_fatigue for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_coach_feedback (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_coach_feedback enable row level security;
alter table public.prism_account_coach_feedback force row level security;
revoke all on public.prism_account_coach_feedback from public, anon, authenticated;
grant select, insert, update on public.prism_account_coach_feedback to authenticated;
create policy owner_only on public.prism_account_coach_feedback for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_interventions (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_interventions enable row level security;
alter table public.prism_account_interventions force row level security;
revoke all on public.prism_account_interventions from public, anon, authenticated;
grant select, insert, update on public.prism_account_interventions to authenticated;
create policy owner_only on public.prism_account_interventions for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_post_workout (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_post_workout enable row level security;
alter table public.prism_account_post_workout force row level security;
revoke all on public.prism_account_post_workout from public, anon, authenticated;
grant select, insert, update on public.prism_account_post_workout to authenticated;
create policy owner_only on public.prism_account_post_workout for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_reflections (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_reflections enable row level security;
alter table public.prism_account_reflections force row level security;
revoke all on public.prism_account_reflections from public, anon, authenticated;
grant select, insert, update on public.prism_account_reflections to authenticated;
create policy owner_only on public.prism_account_reflections for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_readiness (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_readiness enable row level security;
alter table public.prism_account_readiness force row level security;
revoke all on public.prism_account_readiness from public, anon, authenticated;
grant select, insert, update on public.prism_account_readiness to authenticated;
create policy owner_only on public.prism_account_readiness for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_coach_questions (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_coach_questions enable row level security;
alter table public.prism_account_coach_questions force row level security;
revoke all on public.prism_account_coach_questions from public, anon, authenticated;
grant select, insert, update on public.prism_account_coach_questions to authenticated;
create policy owner_only on public.prism_account_coach_questions for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_measurements (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_measurements enable row level security;
alter table public.prism_account_measurements force row level security;
revoke all on public.prism_account_measurements from public, anon, authenticated;
grant select, insert, update on public.prism_account_measurements to authenticated;
create policy owner_only on public.prism_account_measurements for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_beta_feedback (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_beta_feedback enable row level security;
alter table public.prism_account_beta_feedback force row level security;
revoke all on public.prism_account_beta_feedback from public, anon, authenticated;
grant select, insert, update on public.prism_account_beta_feedback to authenticated;
create policy owner_only on public.prism_account_beta_feedback for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_ui_preferences (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred
);
alter table public.prism_account_ui_preferences enable row level security;
alter table public.prism_account_ui_preferences force row level security;
revoke all on public.prism_account_ui_preferences from public, anon, authenticated;
grant select, insert, update on public.prism_account_ui_preferences to authenticated;
create policy owner_only on public.prism_account_ui_preferences for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);

create table public.prism_account_tracking_entries (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred,
 foreign key(user_id,parent_id) references public.prism_account_tracking(user_id,id) deferrable initially deferred
);
alter table public.prism_account_tracking_entries enable row level security;
alter table public.prism_account_tracking_entries force row level security;
revoke all on public.prism_account_tracking_entries from public, anon, authenticated;
grant select, insert, update on public.prism_account_tracking_entries to authenticated;
create policy owner_only on public.prism_account_tracking_entries for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create index prism_account_tracking_entries_parent on public.prism_account_tracking_entries(user_id,parent_id);

create table public.prism_account_tracking_maps (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred,
 foreign key(user_id,parent_id) references public.prism_account_tracking(user_id,id) deferrable initially deferred
);
alter table public.prism_account_tracking_maps enable row level security;
alter table public.prism_account_tracking_maps force row level security;
revoke all on public.prism_account_tracking_maps from public, anon, authenticated;
grant select, insert, update on public.prism_account_tracking_maps to authenticated;
create policy owner_only on public.prism_account_tracking_maps for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create index prism_account_tracking_maps_parent on public.prism_account_tracking_maps(user_id,parent_id);

create table public.prism_account_workout_exercises (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred,
 foreign key(user_id,parent_id) references public.prism_account_workouts(user_id,id) deferrable initially deferred
);
alter table public.prism_account_workout_exercises enable row level security;
alter table public.prism_account_workout_exercises force row level security;
revoke all on public.prism_account_workout_exercises from public, anon, authenticated;
grant select, insert, update on public.prism_account_workout_exercises to authenticated;
create policy owner_only on public.prism_account_workout_exercises for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create index prism_account_workout_exercises_parent on public.prism_account_workout_exercises(user_id,parent_id);

create table public.prism_account_session_exercises (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred,
 foreign key(user_id,parent_id) references public.prism_account_sessions(user_id,id) deferrable initially deferred
);
alter table public.prism_account_session_exercises enable row level security;
alter table public.prism_account_session_exercises force row level security;
revoke all on public.prism_account_session_exercises from public, anon, authenticated;
grant select, insert, update on public.prism_account_session_exercises to authenticated;
create policy owner_only on public.prism_account_session_exercises for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create index prism_account_session_exercises_parent on public.prism_account_session_exercises(user_id,parent_id);

create table public.prism_account_sets (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred,
 foreign key(user_id,parent_id) references public.prism_account_session_exercises(user_id,id) deferrable initially deferred
);
alter table public.prism_account_sets enable row level security;
alter table public.prism_account_sets force row level security;
revoke all on public.prism_account_sets from public, anon, authenticated;
grant select, insert, update on public.prism_account_sets to authenticated;
create policy owner_only on public.prism_account_sets for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create index prism_account_sets_parent on public.prism_account_sets(user_id,parent_id);

create table public.prism_account_responses (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred,
 foreign key(user_id,parent_id) references public.prism_account_interventions(user_id,id) deferrable initially deferred
);
alter table public.prism_account_responses enable row level security;
alter table public.prism_account_responses force row level security;
revoke all on public.prism_account_responses from public, anon, authenticated;
grant select, insert, update on public.prism_account_responses to authenticated;
create policy owner_only on public.prism_account_responses for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create index prism_account_responses_parent on public.prism_account_responses(user_id,parent_id);

create table public.prism_account_outcomes (
 user_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[0-9a-f]{64}$'),
 source_key text not null,
 payload jsonb not null,
 parent_id text,
 slot text,
 position integer check (position >= 0),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 foreign key(user_id,source_key) references public.prism_account_sources(user_id,source_key) deferrable initially deferred,
 foreign key(user_id,parent_id) references public.prism_account_interventions(user_id,id) deferrable initially deferred
);
alter table public.prism_account_outcomes enable row level security;
alter table public.prism_account_outcomes force row level security;
revoke all on public.prism_account_outcomes from public, anon, authenticated;
grant select, insert, update on public.prism_account_outcomes to authenticated;
create policy owner_only on public.prism_account_outcomes for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create index prism_account_outcomes_parent on public.prism_account_outcomes(user_id,parent_id);

-- Queryable legacy fields without coercing or changing saved numeric/string values.
alter table public.prism_account_sessions
 add column workout_key text generated always as (payload->>'workoutKey') stored,
 add column workout_title text generated always as (payload->>'workoutTitle') stored,
 add column performed_at text generated always as (payload->>'date') stored;
alter table public.prism_account_session_exercises
 add column exercise_id text generated always as (payload->>'id') stored;
alter table public.prism_account_sets
 add column weight_value text generated always as (payload->>'weight') stored,
 add column reps_value text generated always as (payload->>'reps') stored;
create index prism_account_sessions_date on public.prism_account_sessions(user_id,performed_at);

-- One atomic compare-and-swap batch. Caller cannot choose another owner.
-- Invoker security preserves table RLS; no service role or SECURITY DEFINER.
create function public.prism_apply_account_batch(changes jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 owner_id uuid := auth.uid();
 change jsonb;
 table_name text;
 previous_revision bigint;
 expected bigint;
 saved jsonb;
 result jsonb := '[]'::jsonb;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if jsonb_typeof(changes) <> 'array' or jsonb_array_length(changes) > 500 then
  raise exception 'Expected an array of at most 500 records';
 end if;
 for change in select value from jsonb_array_elements(changes) loop
  if not (change->>'table' = any(array['sources','profile','onboarding','goals','goal_phases','athlete_preferences','tracking','workouts','sessions','current_sets','previous_sets','targets','completions','active_workout','coach_actions','coach_checkins','adaptive','fatigue','coach_feedback','interventions','post_workout','reflections','readiness','coach_questions','measurements','beta_feedback','ui_preferences','tracking_entries','tracking_maps','workout_exercises','session_exercises','sets','responses','outcomes'])) then
   raise exception 'Unknown account table';
  end if;
  table_name := 'prism_account_' || (change->>'table');
  expected := (change->>'expected_revision')::bigint;
  if expected is null or expected < 0 then raise exception 'Expected revision required'; end if;
  previous_revision := null;
  execute format('select revision from public.%I where user_id=$1 and id=$2 for update',table_name)
   into previous_revision using owner_id,change->>'id';
  if coalesce(previous_revision,0) <> expected then
   raise exception 'Revision conflict' using errcode='40001';
  end if;
  if previous_revision is null then
   execute format('insert into public.%I (user_id,id,source_key,payload,parent_id,slot,position) values ($1,$2,$3,$4,$5,$6,$7) returning to_jsonb(%I.*)',table_name,table_name)
    into saved using owner_id,change->>'id',change->>'source_key',change->'payload',change->>'parent_id',change->>'slot',(change->>'position')::integer;
  else
   execute format('update public.%I set payload=$3, parent_id=$4, slot=$5, position=$6, revision=revision+1, updated_at=now() where user_id=$1 and id=$2 and source_key=$7 returning to_jsonb(%I.*)',table_name,table_name)
    into saved using owner_id,change->>'id',change->'payload',change->>'parent_id',change->>'slot',(change->>'position')::integer,change->>'source_key';
   if saved is null then raise exception 'Record source cannot change'; end if;
  end if;
  result := result || jsonb_build_array(saved || jsonb_build_object('table',change->>'table'));
 end loop;
 return result;
end;
$$;
revoke all on function public.prism_apply_account_batch(jsonb) from public,anon;
grant execute on function public.prism_apply_account_batch(jsonb) to authenticated;
commit;
