-- Separate rollout gate: do not upload photos until transfer/restore is verified.
begin;
create table public.prism_account_photos (
 user_id uuid not null references auth.users(id),
 id text not null,
 legacy_database text not null check (legacy_database in ('workoutTrackerPhotosV1','prismProgressPhotosDB')),
 legacy_id text not null,
 metadata jsonb not null,
 object_path text not null,
 sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
 byte_size bigint not null check (byte_size > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 unique(user_id,legacy_database,legacy_id),
 check (split_part(object_path,'/',1)=user_id::text)
);
alter table public.prism_account_photos enable row level security;
alter table public.prism_account_photos force row level security;
revoke all on public.prism_account_photos from public,anon,authenticated;
grant select,insert,update on public.prism_account_photos to authenticated;
create policy owner_only on public.prism_account_photos for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- New private bucket; fail rather than silently reuse a potentially public bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('prism-account-photos','prism-account-photos',false,10485760,array['image/jpeg','image/png','image/webp']);
create policy prism_account_photo_read on storage.objects for select to authenticated
 using (bucket_id='prism-account-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy prism_account_photo_create on storage.objects for insert to authenticated
 with check (bucket_id='prism-account-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
-- Immutable content-addressed objects; replacements use a new hash/path.
-- No public URLs, overwrite or delete grants are introduced.
commit;
