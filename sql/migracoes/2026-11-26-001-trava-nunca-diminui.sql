-- v10.6.50 · TRAVA NO BANCO: cadastro nunca diminui sozinho (autorizado pelo Tiago em 25/11/2026).
-- Vale para QUALQUER aparelho e QUALQUER versão do app, porque roda dentro do Supabase, antes de gravar em hs_sync.
--  · Clientes fixos (s:clientesReq), agendamentos (s:agendamentos), motoristas (s:cadMot): se a gravação nova não
--    tem um item que estava lá, o item é mantido — a não ser que tenha sido EXCLUÍDO no botão (s:listaTirados).
--  · Painel de Gestão (s:gsSnap): nenhum dia sai; o dia que vem na gravação substitui o mesmo dia.
--  · Registros de exclusão (s:listaTirados, s:reTirados): só somam.
--  · Nenhuma dessas chaves pode ser "apagada" inteira.
create or replace function public.hs_chave_item(campo text, e jsonb) returns text language sql immutable as $$
  select case when campo = 'cadMot' and coalesce(e->>'id','') = ''
              then 'n:' || upper(trim(translate(coalesce(e->>'nome',''),
                   'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')))
              else coalesce(e->>'id', e::text) end
$$;

create or replace function public.hs_sync_nunca_diminui() returns trigger language plpgsql security definer set search_path = public as $$
declare campo text; tir jsonb; faltam jsonb; novos_k text[];
begin
  if new.chave not in ('s:clientesReq','s:agendamentos','s:cadMot','s:gsSnap','s:listaTirados','s:reTirados') then return new; end if;
  if old.valor is null or old.apagado then return new; end if;
  -- ninguém apaga a chave inteira
  if new.apagado or new.valor is null then
    new.apagado := false; new.valor := old.valor; return new;
  end if;
  -- mapas: soma (o novo vale para a mesma chave/dia)
  if new.chave in ('s:gsSnap','s:listaTirados','s:reTirados') then
    if jsonb_typeof(old.valor) = 'object' and jsonb_typeof(new.valor) = 'object' then
      if new.chave = 's:listaTirados' then
        -- um nível a mais: {campo:{id:quando}}
        select coalesce(jsonb_object_agg(k, coalesce(old.valor->k,'{}'::jsonb) || coalesce(new.valor->k,'{}'::jsonb)), '{}'::jsonb)
          into new.valor from (select jsonb_object_keys(old.valor) k union select jsonb_object_keys(new.valor)) x;
      else
        new.valor := old.valor || new.valor;
      end if;
    end if;
    return new;
  end if;
  -- listas: item que sumiu volta, menos o excluído no botão
  if jsonb_typeof(old.valor) <> 'array' or jsonb_typeof(new.valor) <> 'array' then return new; end if;
  campo := substr(new.chave, 3);
  select coalesce(valor->campo, '{}'::jsonb) into tir from public.hs_sync where chave = 's:listaTirados' and not apagado;
  tir := coalesce(tir, '{}'::jsonb);
  select array_agg(public.hs_chave_item(campo, e)) into novos_k from jsonb_array_elements(new.valor) e where jsonb_typeof(e) = 'object';
  novos_k := coalesce(novos_k, '{}');
  select jsonb_agg(e) into faltam from jsonb_array_elements(old.valor) e
   where jsonb_typeof(e) = 'object'
     and not (public.hs_chave_item(campo, e) = any(novos_k))
     and not (tir ? public.hs_chave_item(campo, e) and coalesce(e->>'em','') <= (tir->>public.hs_chave_item(campo, e)));
  if faltam is not null then new.valor := new.valor || faltam; end if;
  return new;
end $$;

drop trigger if exists hs_sync_nunca_diminui on public.hs_sync;
create trigger hs_sync_nunca_diminui before update on public.hs_sync for each row execute function public.hs_sync_nunca_diminui();
-- DELETE da linha inteira dessas chaves também é recusado
create or replace function public.hs_sync_nao_apaga() returns trigger language plpgsql as $$
begin
  if old.chave in ('s:clientesReq','s:agendamentos','s:cadMot','s:gsSnap','s:listaTirados','s:reTirados') then
    raise exception 'Cadastro protegido: % não pode ser apagado.', old.chave;
  end if;
  return old;
end $$;
drop trigger if exists hs_sync_nao_apaga on public.hs_sync;
create trigger hs_sync_nao_apaga before delete on public.hs_sync for each row execute function public.hs_sync_nao_apaga();
