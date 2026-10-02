-- Store the stable Google Place ID so maps links can be rebuilt canonically
alter table restaurants add column if not exists google_place_id text;
