-- CI ONLY: disposable PostgreSQL auth bridge for PostgREST JWT validation.
-- This role can SET ROLE anon/authenticated but not assume prism_v2_executor.
create role v2_http_authenticator login password 'ephemeral-ci-authenticator';
grant anon,authenticated to v2_http_authenticator;
grant usage on schema public to anon,authenticated;
-- PostgREST queries schema cache metadata via catalog as the login role.

-- Distinct disposable users, deliberately separate from direct-SQL fixtures.
insert into auth.users(id) values
 ('44444444-4444-4444-8444-444444444444'),
 ('55555555-5555-4555-8555-555555555555');
