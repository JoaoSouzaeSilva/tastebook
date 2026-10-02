-- Store coordinates so the app can sort by distance and pin restaurants on a map
alter table restaurants add column if not exists latitude double precision;
alter table restaurants add column if not exists longitude double precision;
