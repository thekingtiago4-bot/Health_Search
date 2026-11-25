-- v10.6.46 · Recupera os dias do Painel de Gestão que sumiram (furo 13/11 a 23/11), 25/11/2026.
-- Causa: um aparelho subiu uma cópia pequena de s:gsSnap (só 23 e 24/11) e ela substituiu a da nuvem inteira.
-- Fonte: a tabela permanente hs_fotos (uma linha por dia, nunca apagada) — tem 30/10 a 19/11, 23 e 24/11.
-- Só ACRESCENTA: dia que já está na nuvem continua como está; dia que falta volta de hs_fotos. Nada é apagado.
with fot as (select coalesce(jsonb_object_agg(to_char(dia,'YYYY-MM-DD'), dados), '{}'::jsonb) as v from public.hs_fotos),
cur as (select coalesce((select case when apagado or jsonb_typeof(valor)<>'object' then '{}'::jsonb else valor end
                         from public.hs_sync where chave='s:gsSnap'),'{}'::jsonb) as v)
insert into public.hs_sync (chave, tipo, valor, apagado, atualizado_em, atualizado_por)
select 's:gsSnap', 's', (select fot.v || cur.v from fot, cur), false, now(), 'Restauração do Painel de Gestão (hs_fotos)'
on conflict (chave) do update set valor=excluded.valor, apagado=false, atualizado_em=now(), atualizado_por=excluded.atualizado_por;
-- confere: todo dia de hs_fotos tem que estar no painel
do $$ begin
  if exists (select 1 from public.hs_fotos f where not ((select valor from public.hs_sync where chave='s:gsSnap') ? to_char(f.dia,'YYYY-MM-DD'))) then
    raise exception 'Restauração do Painel de Gestão incompleta';
  end if;
end $$;
