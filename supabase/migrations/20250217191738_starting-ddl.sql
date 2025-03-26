-- Table definitions
-- Table: friend_requests

create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now()
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only sender or receiver can access and modify"
ON friend_requests
FOR ALL
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
)
WITH CHECK (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Only allow owner or friends of owner to read files
CREATE POLICY "Only owner or their friends can read"
ON storage.objects
FOR SELECT
USING (
  auth.uid() = owner
  OR EXISTS (
    SELECT 1
    FROM friend_requests
    WHERE status = 'accepted'
      AND (
        (sender_id = owner AND receiver_id = auth.uid())
        OR
        (receiver_id = owner AND sender_id = auth.uid())
      )
  )
);

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
  ('public_sessions', 'public_sessions', false);

insert into storage.buckets
  (id, name, public)
values
  ('private_sessions', 'private_sessions', false);

insert into storage.buckets
  (id, name, public)
values
  ('friend_sessions', 'friend_sessions', false);

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

create policy "Allow authenticated uploads for public sessions bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'public_sessions' and
  (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Allow authenticated uploads for private sessions bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'private_sessions' and
  (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Allow authenticated uploads for friend sessions bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'friend_sessions' and
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


