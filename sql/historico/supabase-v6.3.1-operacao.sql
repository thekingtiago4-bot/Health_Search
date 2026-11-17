-- Health Search 6.3.1 · aba Operação (conferência por câmera / leitor)
-- Rode UMA vez no Supabase → SQL Editor → New query → Run.

create table if not exists public.hs_bipagens (
  id          uuid primary key default gen_random_uuid(),
  local_id    text not null unique,           -- id gerado no aparelho (evita duplicar quando reenvia sem internet)
  dia         date not null,                  -- a operação do dia
  codigo      text not null,                  -- o que foi lido
  tipo        text,                           -- volume / danfe / numero + camera / leitor
  ped         text,
  nf          text,
  vol         int,
  tot         int,
  pallet      text,
  romaneio    text,
  dest        text,
  cid         text,
  conteudo    text,                           -- G=gelado S=seco | M=medicamento T=material (do XML)
  valor       numeric,                        -- valor da nota (XML ou romaneio)
  status      text not null check (status in ('ok','semnota','fora','dup')),
  usuario     text,
  usuario_id  uuid not null default auth.uid() references auth.users(id),
  criado_em   timestamptz not null default now()
);
alter table public.hs_bipagens add column if not exists conteudo text;
alter table public.hs_bipagens add column if not exists valor numeric;
create index if not exists hs_bipagens_dia on public.hs_bipagens (dia, criado_em desc);

alter table public.hs_bipagens enable row level security;

-- só quem está logado E liberado (perfis.ativo) lê e registra; ninguém registra em nome de outro
drop policy if exists hs_bip_ler on public.hs_bipagens;
create policy hs_bip_ler on public.hs_bipagens for select to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

drop policy if exists hs_bip_inserir on public.hs_bipagens;
create policy hs_bip_inserir on public.hs_bipagens for insert to authenticated
  with check (usuario_id = auth.uid() and exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

-- só o administrador apaga; ninguém edita bipe depois de feito
drop policy if exists hs_bip_apagar on public.hs_bipagens;
create policy hs_bip_apagar on public.hs_bipagens for delete to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = 'admin'));

-- painel ao vivo
do $$ begin
  alter publication supabase_realtime add table public.hs_bipagens;
exception when duplicate_object then null; end $$;
