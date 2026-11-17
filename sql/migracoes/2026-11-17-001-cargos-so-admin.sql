-- v10.6.04 · Cargos (s:cargos) só o administrador grava — antes qualquer usuário ativo podia trocar o próprio cargo.
-- Também entram na lista as chaves que o app já tratava como "só admin" (zapGrupo, evaEnsino, evaVisual)
-- mas o banco ainda deixava qualquer um gravar. A regra do hs_sync (blindagem v7.0.0) já usa esta função:
--   insert/update só se  hs_eh_ativo()  e  (não é chave de admin  ou  hs_eh_admin()).
-- Ler continua liberado para todo usuário ativo (cada aparelho precisa saber o próprio cargo).
create or replace function public.hs_chave_admin(c text) returns boolean language sql immutable as $$
  select c in ('s:geo','s:aprendidos','s:cidAlias','s:cidAtend','s:geoRuas','s:txtFix','ls:xlNomes',
               's:roteirizadores','s:perfisAcesso','s:rotMarcas',
               's:cargos','s:zapGrupo','s:evaEnsino','s:evaVisual')
$$;
-- confere: a regra de escrita do hs_sync tem que usar a função (se alguém tirou, a migração falha e avisa)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hs_sync' and (coalesce(with_check,'') like '%hs_chave_admin%')) then
    raise exception 'A regra de escrita do hs_sync não usa hs_chave_admin — cargo NÃO ficou protegido. Rever a blindagem v7.0.0.';
  end if;
end $$;
