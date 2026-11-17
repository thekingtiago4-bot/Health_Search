-- Health Search 6.3.8 · Banco de romaneios (histórico por dia)
-- Rode UMA vez no Supabase → SQL Editor → New query → Run.

create table if not exists public.hs_rom_banco (
  id          text primary key,                -- dia|id do romaneio
  dia         date not null,
  numero      text,
  base        text,
  motorista   text,
  notas       int,
  vol         int,
  rows        jsonb not null default '[]',     -- nf, ped, rem, dest, cid, uf, vol
  hash        text,
  criado_por  text,
  atualizado_em timestamptz not null default now()
);
create index if not exists hs_rom_banco_dia on public.hs_rom_banco (dia);

alter table public.hs_rom_banco enable row level security;

drop policy if exists hs_rb_ler on public.hs_rom_banco;
create policy hs_rb_ler on public.hs_rom_banco for select to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

drop policy if exists hs_rb_inserir on public.hs_rom_banco;
create policy hs_rb_inserir on public.hs_rom_banco for insert to authenticated
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

drop policy if exists hs_rb_atualizar on public.hs_rom_banco;
create policy hs_rb_atualizar on public.hs_rom_banco for update to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

drop policy if exists hs_rb_apagar on public.hs_rom_banco;
create policy hs_rb_apagar on public.hs_rom_banco for delete to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = 'admin'));
