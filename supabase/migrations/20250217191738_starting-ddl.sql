-- Table definitions

-- Bucket definitions
insert into storage.buckets
  (id, name, public)
values
  ('patterns', 'patterns', false);

insert into storage.buckets
  (id, name, public)
values
  ('lanes', 'lanes', false);

insert into storage.buckets
  (id, name, public)
values
  ('sessions', 'sessions', false);

-- RLS 
-- Patterns bucket rules 
create policy "Allow authenticated uploads for patterns bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'patterns' and
  (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Allow authenticated uploads for lanes bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lanes' and
  (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Allow authenticated uploads for sessions bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sessions' and
  (storage.foldername(name))[1] = (select auth.uid()::text)
);


create policy "Individual user Access"
on storage.objects for select
to authenticated
using ( (select auth.uid()) = owner_id::uuid );

create policy "Individual user Deletion"
on storage.objects for delete
to authenticated
using ( (select auth.uid()) = owner_id::uuid );

create policy "Individual user Update"
on storage.objects for update
to authenticated
using ( (select auth.uid()) = owner_id::uuid );
