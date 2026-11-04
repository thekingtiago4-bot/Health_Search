-- Health Search 6.9.0 · Segurança no banco + atualização ao vivo
-- Rode UMA vez no Supabase → SQL Editor → New query → Run (depois do supabase-v6.7.0-sincronizar.sql).

-- quem é administrador ativo
create or replace function public.hs_eh_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = 'admin')
$$;
create or replace function public.hs_eh_ativo() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo)
$$;

-- regiões, bases, Correção e dicionários: só o administrador grava
create or replace function public.hs_chave_admin(c text) returns boolean language sql immutable as $$
  select c in ('s:geo','s:aprendidos','s:cidAlias','s:cidAtend','s:geoRuas','s:txtFix','ls:xlNomes')
$$;

drop policy if exists hs_sync_inserir on public.hs_sync;
create policy hs_sync_inserir on public.hs_sync for insert to authenticated
  with check (public.hs_eh_ativo() and (not public.hs_chave_admin(chave) or public.hs_eh_admin()));

drop policy if exists hs_sync_atualizar on public.hs_sync;
create policy hs_sync_atualizar on public.hs_sync for update to authenticated
  using (public.hs_eh_ativo() and (not public.hs_chave_admin(chave) or public.hs_eh_admin()))
  with check (public.hs_eh_ativo() and (not public.hs_chave_admin(chave) or public.hs_eh_admin()));

-- atualização ao vivo (realtime)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hs_sync') then
    execute 'alter publication supabase_realtime add table public.hs_sync';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hs_bipagens') then
    execute 'alter publication supabase_realtime add table public.hs_bipagens';
  end if;
end $$;
