-- Removes the "where tonight?" live-round feature. Safe to run whether or not the
-- (since deleted) 20260804_001_add_tonight_rounds migration was ever applied.

do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tonight_votes'
  ) then
    alter publication supabase_realtime drop table tonight_votes;
  end if;
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tonight_rounds'
  ) then
    alter publication supabase_realtime drop table tonight_rounds;
  end if;
end $$;

drop table if exists tonight_votes;
drop table if exists tonight_rounds;
