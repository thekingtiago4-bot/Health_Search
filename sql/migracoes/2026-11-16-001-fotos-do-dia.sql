-- v10.1.7 · Fotos do dia (prova de conferência) em tabela própria.
-- Antes a foto de cada dia vivia só dentro da linha do app (hs_sync / cópia do aparelho).
-- Aqui ela ganha lugar próprio: uma linha por dia, que pode ser corrigida durante o dia,
-- mas NUNCA apagada. É o que prova para a diretoria que a operação conferiu tudo.
create table if not exists public.hs_fotos (
  dia date primary key,
  dados jsonb not null,              -- porcentagem, por origem, divergências e o que não entrou
  por text,
  aparelho text,
  atualizado_em timestamptz not null default now()
);
create index if not exists hs_fotos_dia on public.hs_fotos (dia desc);

alter table public.hs_fotos enable row level security;
drop policy if exists hs_fotos_ler on public.hs_fotos;
create policy hs_fotos_ler on public.hs_fotos for select to authenticated using (public.hs_eh_ativo());
drop policy if exists hs_fotos_inserir on public.hs_fotos;
create policy hs_fotos_inserir on public.hs_fotos for insert to authenticated with check (public.hs_eh_ativo());
drop policy if exists hs_fotos_atualizar on public.hs_fotos;
create policy hs_fotos_atualizar on public.hs_fotos for update to authenticated using (public.hs_eh_ativo()) with check (public.hs_eh_ativo());
-- de propósito NÃO existe regra de delete

-- trava: foto do dia não se apaga
create or replace function public.hs_fotos_trava() returns trigger language plpgsql as $$
begin raise exception 'A foto do dia do Health Search não pode ser apagada.'; end $$;
drop trigger if exists hs_fotos_trava on public.hs_fotos;
create trigger hs_fotos_trava before delete on public.hs_fotos for each row execute function public.hs_fotos_trava();

-- carimbo de atualização
create or replace function public.hs_fotos_carimbo() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;
drop trigger if exists hs_fotos_carimbo on public.hs_fotos;
create trigger hs_fotos_carimbo before update on public.hs_fotos for each row execute function public.hs_fotos_carimbo();

revoke all on public.hs_fotos from anon;
grant select, insert, update on public.hs_fotos to authenticated;
