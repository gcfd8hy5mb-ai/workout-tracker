-- Preserve deletion intent across devices without deleting the private object prematurely.
begin;
alter table public.prism_account_photos
 add column if not exists deleted_at timestamptz;
commit;
