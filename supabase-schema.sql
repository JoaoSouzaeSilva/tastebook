-- ============================================================
-- TASTEBOOK — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Categories ───────────────────────────────────────────────
create table if not exists categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  color      text not null default '#C85C38',
  icon       text,
  user_id    uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ── Restaurants ──────────────────────────────────────────────
create table if not exists restaurants (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  google_maps_link text,
  address          text,
  status           text not null default 'want_to_try'
                     check (status in ('want_to_try', 'tried')),
  rating           numeric(2,1) check (rating between 1 and 5),
  notes            text,
  avg_price        text check (avg_price in ('€','€€','€€€','€€€€')),
  party_size       int check (party_size >= 1),
  total_paid       numeric(10,2) check (total_paid >= 0),
  photo_url        text,
  date_visited     date,
  user_id          uuid references auth.users(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table restaurants add column if not exists party_size int check (party_size >= 1);
alter table restaurants add column if not exists total_paid numeric(10,2) check (total_paid >= 0);
alter table restaurants alter column rating type numeric(2,1) using rating::numeric(2,1);

-- ── Restaurant Visits ────────────────────────────────────────
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

-- ── Restaurant ↔ Categories (many-to-many) ───────────────────
create table if not exists restaurant_categories (
  restaurant_id uuid references restaurants(id) on delete cascade,
  category_id   uuid references categories(id)  on delete cascade,
  primary key (restaurant_id, category_id)
);

-- ── Review Photos ────────────────────────────────────────────
create table if not exists restaurant_review_photos (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  visit_id      uuid references restaurant_visits(id) on delete set null,
  image_url     text not null,
  storage_path  text,
  caption       text,
  user_id       uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now()
);

-- ── Row Level Security ───────────────────────────────────────
-- All authenticated users share the full dataset (couple use case)

alter table categories            enable row level security;
alter table restaurants           enable row level security;
alter table restaurant_visits     enable row level security;
alter table restaurant_categories enable row level security;
alter table restaurant_review_photos enable row level security;

-- Categories
create policy "auth users can read categories"   on categories for select using (auth.role() = 'authenticated');
create policy "auth users can insert categories" on categories for insert with check (auth.role() = 'authenticated');
create policy "auth users can update categories" on categories for update using (auth.role() = 'authenticated');
create policy "auth users can delete categories" on categories for delete using (auth.role() = 'authenticated');

-- Restaurants
create policy "auth users can read restaurants"   on restaurants for select using (auth.role() = 'authenticated');
create policy "auth users can insert restaurants" on restaurants for insert with check (auth.role() = 'authenticated');
create policy "auth users can update restaurants" on restaurants for update using (auth.role() = 'authenticated');
create policy "auth users can delete restaurants" on restaurants for delete using (auth.role() = 'authenticated');

-- Junction table
create policy "auth users can read rc"   on restaurant_categories for select using (auth.role() = 'authenticated');
create policy "auth users can insert rc" on restaurant_categories for insert with check (auth.role() = 'authenticated');
create policy "auth users can delete rc" on restaurant_categories for delete using (auth.role() = 'authenticated');

-- Restaurant visits
create policy "auth users can read visits"   on restaurant_visits for select using (auth.role() = 'authenticated');
create policy "auth users can insert visits" on restaurant_visits for insert with check (auth.role() = 'authenticated');
create policy "auth users can update visits" on restaurant_visits for update using (auth.role() = 'authenticated');
create policy "auth users can delete visits" on restaurant_visits for delete using (auth.role() = 'authenticated');

-- Review photos
create policy "auth users can read review photos"   on restaurant_review_photos for select using (auth.role() = 'authenticated');
create policy "auth users can insert review photos" on restaurant_review_photos for insert with check (auth.role() = 'authenticated');
create policy "auth users can delete review photos" on restaurant_review_photos for delete using (auth.role() = 'authenticated');

alter table restaurant_review_photos add column if not exists visit_id uuid references restaurant_visits(id) on delete set null;

insert into restaurant_visits (restaurant_id, rating, notes, party_size, total_paid, date_visited, user_id)
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

-- ── Storage bucket for review photos ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-review-photos',
  'restaurant-review-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "auth users can upload review photo objects"
on storage.objects for insert
to authenticated
with check (bucket_id = 'restaurant-review-photos');

create policy "auth users can read review photo objects"
on storage.objects for select
to authenticated
using (bucket_id = 'restaurant-review-photos');

create policy "auth users can delete review photo objects"
on storage.objects for delete
to authenticated
using (bucket_id = 'restaurant-review-photos');

-- ── Default Categories (seed) ────────────────────────────────
insert into categories (name, color, icon, user_id) values
  ('Japanese',   '#E07050', '🍣', null),
  ('Italian',    '#B8860B', '🍝', null),
  ('Brunch',     '#52B788', '🥞', null),
  ('Date Night', '#C85C38', '🕯️', null),
  ('Cheap Eats', '#2D6A4F', '💸', null),
  ('Burgers',    '#D4A520', '🍔', null),
  ('Pizza',      '#E24B4A', '🍕', null),
  ('Asian',      '#7F77DD', '🥢', null),
  ('Portuguese', '#9E3F22', '🐟', null),
  ('Seafood',    '#185FA5', '🦞', null)
on conflict do nothing;
