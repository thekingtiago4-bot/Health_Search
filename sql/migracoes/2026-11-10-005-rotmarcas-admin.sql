-- v9.9.0 · Roteirizador por usuário (S.rotMarcas) protegido como admin-only, igual ao campo antigo s:roteirizadores
create or replace function public.hs_chave_admin(c text) returns boolean language sql immutable as $$
  select c in ('s:geo','s:aprendidos','s:cidAlias','s:cidAtend','s:geoRuas','s:txtFix','ls:xlNomes','s:roteirizadores','s:perfisAcesso','s:rotMarcas')
$$;
