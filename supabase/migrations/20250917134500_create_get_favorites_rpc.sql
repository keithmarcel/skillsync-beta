-- supabase/migrations/20250917134500_create_get_favorites_rpc.sql

-- Function to get favorite jobs for the currently authenticated user
create or replace function get_favorite_jobs()
returns setof jobs
language sql
security definer
set search_path = public
as $$
  select j.*
  from jobs j
  join favorites f on j.id = f.entity_id
  where f.user_id = auth.uid() and f.entity_kind = 'job';
$$;

-- Function to get favorite programs for the currently authenticated user
create or replace function get_favorite_programs()
returns setof programs
language sql
security definer
set search_path = public
as $$
  select p.*
  from programs p
  join favorites f on p.id = f.entity_id
  where f.user_id = auth.uid() and f.entity_kind = 'program';
$$;
