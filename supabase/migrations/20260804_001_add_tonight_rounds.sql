-- "where tonight?" — a live round both phones swipe at the same time.
--
-- The five places are pinned on the round itself rather than recomputed per device,
-- because each phone sorts by its own GPS position and would otherwise deal a
-- different hand. Whoever taps first deals; the other joins the same five.

create table if not exists tonight_rounds (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid references auth.users(id) on delete set null,
  restaurant_ids uuid[] not null,
  closed_at      timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists tonight_votes (
  id            uuid primary key default gen_random_uuid(),
  round_id      uuid not null references tonight_rounds(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  keep          boolean not null,
  created_at    timestamptz not null default now(),
  -- Re-swiping the same card overwrites rather than double-counting
  unique (round_id, restaurant_id, user_id)
);

create index if not exists tonight_rounds_created_at_idx on tonight_rounds (created_at desc);
create index if not exists tonight_votes_round_idx on tonight_votes (round_id);

alter table tonight_rounds enable row level security;
alter table tonight_votes  enable row level security;

-- Same posture as every other table here: the two of you share one book.
-- Dropped first so this migration can be re-run without erroring.
drop policy if exists "auth users can read tonight rounds"   on tonight_rounds;
drop policy if exists "auth users can insert tonight rounds" on tonight_rounds;
drop policy if exists "auth users can update tonight rounds" on tonight_rounds;
drop policy if exists "auth users can delete tonight rounds" on tonight_rounds;

create policy "auth users can read tonight rounds"   on tonight_rounds for select using (auth.role() = 'authenticated');
create policy "auth users can insert tonight rounds" on tonight_rounds for insert with check (auth.role() = 'authenticated');
create policy "auth users can update tonight rounds" on tonight_rounds for update using (auth.role() = 'authenticated');
create policy "auth users can delete tonight rounds" on tonight_rounds for delete using (auth.role() = 'authenticated');

drop policy if exists "auth users can read tonight votes"   on tonight_votes;
drop policy if exists "auth users can insert tonight votes" on tonight_votes;
drop policy if exists "auth users can update tonight votes" on tonight_votes;
drop policy if exists "auth users can delete tonight votes" on tonight_votes;

create policy "auth users can read tonight votes"   on tonight_votes for select using (auth.role() = 'authenticated');
create policy "auth users can insert tonight votes" on tonight_votes for insert with check (auth.role() = 'authenticated');
create policy "auth users can update tonight votes" on tonight_votes for update using (auth.role() = 'authenticated');
create policy "auth users can delete tonight votes" on tonight_votes for delete using (auth.role() = 'authenticated');

-- Realtime: without this the client subscribes successfully but never receives a
-- payload, which is indistinguishable from a broken feature. Both tables must be
-- published, and `alter publication ... add table` errors if already a member.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tonight_rounds'
  ) then
    alter publication supabase_realtime add table tonight_rounds;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tonight_votes'
  ) then
    alter publication supabase_realtime add table tonight_votes;
  end if;
end $$;

-- REPLICA IDENTITY FULL so DELETE/UPDATE payloads carry the old row, letting the
-- client reconcile without an extra fetch.
alter table tonight_rounds replica identity full;
alter table tonight_votes  replica identity full;
