-- v10.6.60 · BLINDAGEM (pedido do Tiago, 26/11/2026: "não pode perder dados de maneira nenhuma").
-- 1) Reentregas (re:<dia>): nenhuma linha some da nuvem, a não ser que tenha sido TIRADA de propósito (✕, "Não é
--    reentrega", "era divergência", apagar o dia — todas gravam em s:reTirados). Dia de reentregas não pode ser apagado.
--    A linha é a NF (só números, sem zeros à esquerda — mesma regra do app). Linha sem NF não entra na trava.
-- 2) Banco de romaneios (hs_rom_banco): antes de apagar qualquer romaneio, guarda a cópia em hs_versoes (permanente).
create or replace function public.hs_nf(t text) returns text language sql immutable as $$
  select nullif(regexp_replace(regexp_replace(coalesce(t,''), '\D', '', 'g'), '^0+(?=\d)', ''), '')
$$;
create or replace function public.hs_re_nunca_some() returns trigger language plpgsql security definer set search_path = public as $$
declare dia text; tir jsonb; novos text[]; faltam jsonb;
begin
  if new.chave not like 're:%' then return new; end if;
  if old.valor is null or old.apagado or jsonb_typeof(old.valor) <> 'array' then return new; end if;
  if new.apagado or new.valor is null then new.apagado := false; new.valor := old.valor; return new; end if;
  if jsonb_typeof(new.valor) <> 'array' then return new; end if;
  dia := substr(new.chave, 4);
  select coalesce(valor, '{}'::jsonb) into tir from public.hs_sync where chave = 's:reTirados' and not apagado;
  tir := coalesce(tir, '{}'::jsonb);
  select array_agg(public.hs_nf(e->>'nf')) into novos from jsonb_array_elements(new.valor) e where jsonb_typeof(e) = 'object';
  novos := coalesce(novos, '{}');
  select jsonb_agg(e) into faltam from jsonb_array_elements(old.valor) e
   where jsonb_typeof(e) = 'object' and public.hs_nf(e->>'nf') is not null
     and not (public.hs_nf(e->>'nf') = any(novos))
     and not exists (select 1 from jsonb_object_keys(tir) k
                      where k like dia || '#' || public.hs_nf(e->>'nf') || '|%' or k like public.hs_nf(e->>'nf') || '|%');
  if faltam is not null then new.valor := new.valor || faltam; end if;
  return new;
end $$;
drop trigger if exists hs_re_nunca_some on public.hs_sync;
create trigger hs_re_nunca_some before update on public.hs_sync for each row execute function public.hs_re_nunca_some();

create or replace function public.hs_rom_banco_guardar() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.hs_versoes (chave, tipo, valor, por, resumo) values ('rombanco:' || old.id, 'apagado', to_jsonb(old), null, 'romaneio apagado do banco');
  return old;
end $$;
drop trigger if exists hs_rom_banco_guardar on public.hs_rom_banco;
create trigger hs_rom_banco_guardar before delete on public.hs_rom_banco for each row execute function public.hs_rom_banco_guardar();
