-- ONLY disposable GitHub Actions PostgreSQL service; never production.
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable set search_path = ''
as $auth$ select nullif(coalesce(nullif(pg_catalog.current_setting('request.jwt.claim.sub', true), ''), pg_catalog.current_setting('request.jwt.claims', true)::jsonb->>'sub'),'')::uuid $auth$;
grant usage on schema auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
insert into auth.users(id) values
('11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222');

-- Ephemeral unprivileged login for testing client role escalation (not a superuser).
create role v2_test_client login password 'temporary-ci-only';
grant authenticated to v2_test_client;
