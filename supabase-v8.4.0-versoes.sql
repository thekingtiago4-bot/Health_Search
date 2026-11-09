-- Health Search v8.4.0 · Versões permanentes (ninguém apaga, nem o administrador)
-- Rode UMA vez no Supabase: SQL Editor → New query → cole tudo → Run.

create table if not exists public.hs_versoes (
  id bigserial primary key,
  chave text not null,               -- 'snap' = cópia completa · 's:geo' = mapa · 's:...' = configuração · outras = valor antes de apagar
  tipo text not null default 'auto', -- manual | diario | auto | apagado
  valor jsonb not null,
  resumo text,
  por text,
  aparelho text,
  em timestamptz not null default now()
);
create index if not exists hs_versoes_chave_em on public.hs_versoes (chave, em desc);
create index if not exists hs_versoes_em on public.hs_versoes (em desc);

alter table public.hs_versoes enable row level security;
drop policy if exists hs_versoes_ler on public.hs_versoes;
create policy hs_versoes_ler on public.hs_versoes for select to authenticated using (public.hs_eh_ativo());
drop policy if exists hs_versoes_inserir on public.hs_versoes;
create policy hs_versoes_inserir on public.hs_versoes for insert to authenticated with check (public.hs_eh_ativo());
-- de propósito NÃO existe regra de update/delete

-- trava: nenhuma versão pode ser alterada ou apagada
create or replace function public.hs_versoes_trava() returns trigger language plpgsql as $$
begin raise exception 'Versões salvas do Health Search não podem ser alteradas nem apagadas.'; end $$;
drop trigger if exists hs_versoes_trava on public.hs_versoes;
create trigger hs_versoes_trava before update or delete on public.hs_versoes for each row execute function public.hs_versoes_trava();

revoke all on public.hs_versoes from anon;
grant select, insert on public.hs_versoes to authenticated;
grant usage, select on sequence public.hs_versoes_id_seq to authenticated;

-- o próprio banco guarda versões sozinho (vale até para aparelho com app antigo):
--  · mapa/configurações (chaves s:): no máximo 1 versão a cada 10 min por chave
--  · qualquer registro que for apagado ou esvaziado: guarda o valor de antes
create or replace function public.hs_sync_versionar() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.valor is not null and old.chave not like 'bkp:%' and old.chave not like 'ap:%' then
      insert into public.hs_versoes (chave, tipo, valor, por, resumo) values (old.chave, 'apagado', old.valor, old.atualizado_por, 'apagado do banco');
    end if;
    return old;
  end if;
  if new.chave like 's:%' and new.valor is not null
     and (tg_op = 'INSERT' or new.valor is distinct from old.valor)
     and not exists (select 1 from public.hs_versoes v where v.chave = new.chave and v.tipo = 'auto' and v.em > now() - interval '10 minutes') then
    insert into public.hs_versoes (chave, tipo, valor, por) values (new.chave, 'auto', new.valor, new.atualizado_por);
  end if;
  if tg_op = 'UPDATE' and old.valor is not null and (new.apagado or new.valor is null)
     and old.chave not like 'bkp:%' and old.chave not like 'ap:%' then
    insert into public.hs_versoes (chave, tipo, valor, por, resumo) values (old.chave, 'apagado', old.valor, new.atualizado_por, 'valor antes de apagar');
  end if;
  return new;
end $$;
drop trigger if exists hs_sync_versionar on public.hs_sync;
create trigger hs_sync_versionar after insert or update on public.hs_sync for each row execute function public.hs_sync_versionar();
drop trigger if exists hs_sync_versionar_del on public.hs_sync;
create trigger hs_sync_versionar_del before delete on public.hs_sync for each row execute function public.hs_sync_versionar();

-- primeira versão do mapa atual, para já ter um ponto de volta
insert into public.hs_versoes (chave, tipo, valor, por, resumo)
select chave, 'auto', valor, 'instalação v8.4.0', 'mapa no momento da instalação' from public.hs_sync where chave = 's:geo' and valor is not null;

select 'ok — versões permanentes ligadas' as resultado;
