-- Health Search 6.7.0 · Banco online: reentregas e divergências (sem pasta no PC)
-- Rode UMA vez no Supabase → SQL Editor → New query → Run.

create table if not exists public.hs_sync (
  chave          text primary key,               -- re:2026-11-04 (dia de reentregas) | dv:<id> (divergência)
  tipo           text not null,                  -- re | dv
  valor          jsonb,
  apagado        boolean not null default false,
  atualizado_em  timestamptz not null default now(),
  atualizado_por text
);
create index if not exists hs_sync_tempo on public.hs_sync (atualizado_em);

-- o servidor carimba a hora (relógio do celular não manda)
create or replace function public.hs_sync_carimbo() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;
drop trigger if exists hs_sync_carimbo on public.hs_sync;
create trigger hs_sync_carimbo before insert or update on public.hs_sync for each row execute function public.hs_sync_carimbo();

alter table public.hs_sync enable row level security;

drop policy if exists hs_sync_ler on public.hs_sync;
create policy hs_sync_ler on public.hs_sync for select to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

drop policy if exists hs_sync_inserir on public.hs_sync;
create policy hs_sync_inserir on public.hs_sync for insert to authenticated
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

drop policy if exists hs_sync_atualizar on public.hs_sync;
create policy hs_sync_atualizar on public.hs_sync for update to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

-- apagar de vez só o administrador (o app marca "apagado" em vez de excluir)
drop policy if exists hs_sync_apagar on public.hs_sync;
create policy hs_sync_apagar on public.hs_sync for delete to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = 'admin'));
