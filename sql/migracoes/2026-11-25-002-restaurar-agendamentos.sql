-- v10.6.48 · Recupera clientes fixos (aba Agendamentos), agendamentos e motoristas, 25/11/2026.
-- O aparelho do Tiago mostrou só 1 cliente fixo; o backup de 24/11 tinha 12. Um motorista também sumiu sem exclusão.
-- Fonte: o próprio banco — hs_versoes (versões permanentes, ninguém apaga). Nenhum dado é copiado para o repositório.
-- Soma: o que está na nuvem agora + todo item que existiu em alguma versão desde 18/11; de cada item vale a versão mais
-- nova. Fica de fora só o que foi EXCLUÍDO pelo botão (s:listaTirados). Nada é apagado.
create or replace function pg_temp.hs_somar_lista(ch text, campo text) returns int language plpgsql as $$
declare n int;
begin
  with fontes as (
      select valor, now() as quando, 0 as pri from public.hs_sync where chave = ch and not apagado and jsonb_typeof(valor) = 'array'
      union all
      select valor, em, 1 from public.hs_versoes where chave = ch and em >= '2026-11-18' and jsonb_typeof(valor) = 'array'),
  itens as (
      select e, quando, pri,
             case when campo = 'cadMot' then 'n:' || upper(trim(e->>'nome')) else coalesce(e->>'id', e::text) end as k
      from fontes, jsonb_array_elements(fontes.valor) e where jsonb_typeof(e) = 'object'),
  tir as (select coalesce((select valor->campo from public.hs_sync where chave = 's:listaTirados' and not apagado), '{}'::jsonb) as t),
  uniq as (
      select distinct on (k) k, e from itens
      order by k, pri, coalesce(e->>'em', e->>'criado', '') desc, quando desc),
  vivos as (
      select u.e from uniq u, tir
      where not (tir.t ? u.k and coalesce(u.e->>'em', '') <= (tir.t->>u.k)))
  insert into public.hs_sync (chave, tipo, valor, apagado, atualizado_em, atualizado_por)
  select ch, 's', (select jsonb_agg(e order by e->>'nome') from vivos), false, now(), 'Restauração pelas versões (hs_versoes)'
  where exists (select 1 from vivos)
  on conflict (chave) do update set valor = excluded.valor, apagado = false, atualizado_em = now(), atualizado_por = excluded.atualizado_por;
  select coalesce(jsonb_array_length(valor),0) into n from public.hs_sync where chave = ch;
  return coalesce(n,0);
end $$;
do $$ declare a int; b int; c int; begin
  a := pg_temp.hs_somar_lista('s:clientesReq', 'clientesReq');
  b := pg_temp.hs_somar_lista('s:agendamentos', 'agendamentos');
  c := pg_temp.hs_somar_lista('s:cadMot', 'cadMot');
  raise notice 'clientes fixos: %, agendamentos: %, motoristas: %', a, b, c;
  if a < 12 then raise exception 'clientes fixos ficaram com % (esperado pelo menos 12)', a; end if;
end $$;
