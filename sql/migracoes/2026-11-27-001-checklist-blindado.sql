-- v10.6.64 · Checklist Agregados blindado + recuperação (27/11/2026).
-- Caso real: o checklist voltou às datas de fábrica (lista inicial embutida no app) — um aparelho recriou a lista
-- antes de carregar e ela foi gravada por cima da nuvem. Regras no banco (vale para qualquer aparelho/versão):
--  · a data de realização de um motorista NUNCA volta para trás (checklist só anda para a frente);
--  · motorista não some da lista, a não ser que tenha sido apagado no botão (s:ckApagados);
--  · a lista não pode ser apagada inteira.
create or replace function public.hs_ck_k(m text) returns text language sql immutable as $$
  select upper(trim(translate(coalesce(m,''),'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')))
$$;
create or replace function public.hs_ck_apagado(e jsonb) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.hs_sync s, jsonb_array_elements(case when jsonb_typeof(s.valor)='array' then s.valor else '[]'::jsonb end) a
                  where s.chave = 's:ckApagados' and not s.apagado
                    and ((jsonb_typeof(a)='object' and ((a->>'id') = (e->>'id') or public.hs_ck_k(a->>'mot') = public.hs_ck_k(e->>'mot')))
                      or (jsonb_typeof(a)='string' and public.hs_ck_k(a#>>'{}') = public.hs_ck_k(e->>'mot'))))
$$;
create or replace function public.hs_ck_nunca_volta() returns trigger language plpgsql security definer set search_path = public as $$
declare out jsonb := '[]'::jsonb; e jsonb; o jsonb; k text;
begin
  if new.chave <> 's:checklist' then return new; end if;
  if old.valor is null or old.apagado or jsonb_typeof(old.valor) <> 'array' then return new; end if;
  if new.apagado or new.valor is null or jsonb_typeof(new.valor) <> 'array' then new.apagado := false; new.valor := old.valor; return new; end if;
  -- cada linha nova: se a mesma pessoa tinha data mais recente antes, mantém a mais recente
  for e in select * from jsonb_array_elements(new.valor) loop
    if jsonb_typeof(e) = 'object' then
      k := public.hs_ck_k(e->>'mot');
      select x into o from jsonb_array_elements(old.valor) x where jsonb_typeof(x)='object' and public.hs_ck_k(x->>'mot') = k and coalesce(x->>'data','') > coalesce(e->>'data','') order by x->>'data' desc limit 1;
      if o is not null and coalesce(o->>'data','') ~ '^\d{4}-\d{2}-\d{2}$' then e := e || jsonb_build_object('data', o->>'data'); end if;
      o := null;
    end if;
    out := out || jsonb_build_array(e);
  end loop;
  -- quem estava e sumiu (sem ter sido apagado no botão) volta
  for e in select * from jsonb_array_elements(old.valor) loop
    if jsonb_typeof(e) = 'object' and coalesce(public.hs_ck_k(e->>'mot'),'') <> ''
       and not exists (select 1 from jsonb_array_elements(out) y where jsonb_typeof(y)='object' and public.hs_ck_k(y->>'mot') = public.hs_ck_k(e->>'mot'))
       and not public.hs_ck_apagado(e) then
      out := out || jsonb_build_array(e);
    end if;
  end loop;
  new.valor := out; return new;
end $$;
drop trigger if exists hs_ck_nunca_volta on public.hs_sync;
create trigger hs_ck_nunca_volta before update on public.hs_sync for each row execute function public.hs_ck_nunca_volta();
-- recuperação: para cada motorista, a realização mais recente que já existiu nas versões guardadas (desde 01/10)
with atual as (select valor from public.hs_sync where chave = 's:checklist' and not apagado and jsonb_typeof(valor)='array'),
melhor as (
  select public.hs_ck_k(x->>'mot') k, max(x->>'data') d
    from public.hs_versoes v, jsonb_array_elements(case when jsonb_typeof(v.valor)='array' then v.valor else '[]'::jsonb end) x
   where v.chave = 's:checklist' and v.em >= '2026-10-01' and jsonb_typeof(x)='object' and coalesce(x->>'data','') ~ '^\d{4}-\d{2}-\d{2}$'
   group by 1),
novo as (
  select jsonb_agg(case when m.d is not null and m.d > coalesce(e->>'data','') and coalesce((e->>'ativo')::text,'true') <> 'false'
                        then e || jsonb_build_object('data', m.d) else e end order by ord) v
    from atual, jsonb_array_elements(atual.valor) with ordinality as t(e, ord)
    left join melhor m on m.k = public.hs_ck_k(e->>'mot'))
update public.hs_sync set valor = (select v from novo), atualizado_em = now(), atualizado_por = 'Restauração do Checklist (data mais recente de cada motorista)'
 where chave = 's:checklist' and (select v from novo) is not null;
do $$ declare r record; begin
  for r in select x->>'mot' mot, x->>'data' data from public.hs_sync, jsonb_array_elements(valor) x where chave='s:checklist' loop
    raise notice 'CK | % | %', r.mot, r.data; end loop; end $$;
