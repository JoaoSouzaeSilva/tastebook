create table if not exists app_keepalive_heartbeats (
  id text primary key,
  source text not null,
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table app_keepalive_heartbeats enable row level security;
