-- Health Search 8.3.0 · Rode UMA vez no Supabase → SQL Editor → New query → Run.
-- 1) Usuário pode desfazer o PRÓPRIO bipe dos últimos 5 minutos
drop policy if exists hs_bip_apagar_proprio on public.hs_bipagens;
create policy hs_bip_apagar_proprio on public.hs_bipagens for delete to authenticated
  using (public.hs_eh_ativo() and usuario_id = auth.uid() and criado_em > now() - interval '5 minutes');
-- 2) Lista de roteirizadores e perfis de acesso só o administrador altera
create or replace function public.hs_chave_admin(c text) returns boolean language sql immutable as $$
  select c in ('s:geo','s:aprendidos','s:cidAlias','s:cidAtend','s:geoRuas','s:txtFix','ls:xlNomes','s:roteirizadores','s:perfisAcesso')
$$;
