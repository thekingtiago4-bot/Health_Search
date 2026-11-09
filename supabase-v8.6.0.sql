-- Health Search v8.6.0 · o aparelho confere se o usuário ainda tem acesso (se foi bloqueado, apaga a cópia offline)
-- Rode UMA vez no Supabase: SQL Editor → New query → cole → Run. (Depois do 8.4.0 e do 8.5.0)
create or replace function public.hs_meu_status() returns json language sql stable security definer set search_path = public as $$
  select json_build_object('existe', exists(select 1 from public.perfis where id = auth.uid()),
                           'ativo', coalesce((select ativo from public.perfis where id = auth.uid()), false))
$$;
revoke all on function public.hs_meu_status() from anon;
grant execute on function public.hs_meu_status() to authenticated;
select 'ok — v8.6.0 instalada' as resultado;
