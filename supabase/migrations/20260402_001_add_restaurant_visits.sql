-- Add visit history support

create table if not exists restaurant_visits (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  rating        numeric(2,1) check (rating between 1 and 5),
  notes         text,
  party_size    int check (party_size >= 1),
  total_paid    numeric(10,2) check (total_paid >= 0),
  date_visited  date not null default current_date,
  user_id       uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now()
);

alter table restaurant_review_photos
  add column if not exists visit_id uuid references restaurant_visits(id) on delete set null;

alter table restaurant_visits enable row level security;

create policy "auth users can read visits"
on restaurant_visits for select
using (auth.role() = 'authenticated');

create policy "auth users can insert visits"
on restaurant_visits for insert
with check (auth.role() = 'authenticated');

create policy "auth users can update visits"
on restaurant_visits for update
using (auth.role() = 'authenticated');

create policy "auth users can delete visits"
on restaurant_visits for delete
using (auth.role() = 'authenticated');

-- Backfill one visit per existing tried restaurant, only if none exists yet
insert into restaurant_visits (
  restaurant_id,
  rating,
  notes,
  party_size,
  total_paid,
  date_visited,
  user_id
)
select
  r.id,
  r.rating,
  r.notes,
  r.party_size,
  r.total_paid,
  coalesce(r.date_visited, current_date),
  r.user_id
from restaurants r
where r.status = 'tried'
  and not exists (
    select 1
    from restaurant_visits rv
    where rv.restaurant_id = r.id
  );
