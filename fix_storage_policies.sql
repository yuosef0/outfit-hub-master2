-- Create the 'avatars' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 1. Allow Public Read Access (VIEW)
-- Drop existing policy if it exists to avoid conflicts
drop policy if exists "Public Access Avatars" on storage.objects;

create policy "Public Access Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- 2. Allow Authenticated Uploads (INSERT)
drop policy if exists "Authenticated users can upload avatars" on storage.objects;

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- 3. Allow Users to Update their own files (UPDATE)
drop policy if exists "Users can update their own avatars" on storage.objects;

create policy "Users can update their own avatars"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );

-- 4. Allow Users to Delete their own files (DELETE)
drop policy if exists "Users can delete their own avatars" on storage.objects;

create policy "Users can delete their own avatars"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid() = owner );
