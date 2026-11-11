-- v9.19.2 · Plano Pro: medidor do banco passa a considerar 8 GB de disco (era 500 MB do plano gratuito)
create or replace function public.hs_uso() returns json language sql stable security definer set search_path = public as $$
  select json_build_object('bytes', pg_database_size(current_database()), 'limite', 8589934592::bigint,
         'pct', round(100.0 * pg_database_size(current_database()) / 8589934592, 1))
$$;
revoke all on function public.hs_uso() from anon;
grant execute on function public.hs_uso() to authenticated;
select pg_size_pretty(pg_database_size(current_database())) as banco_hoje, public.hs_uso() as medidor;
