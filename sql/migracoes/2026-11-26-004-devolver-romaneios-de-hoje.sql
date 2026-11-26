-- v10.6.60 · Devolve os romaneios apagados da nuvem HOJE (26/11/2026) sem ninguém clicar em Remover.
-- Causa: o app mandava "apagar" para a nuvem todo romaneio que saísse do aparelho (virada do dia, troca de PDF,
-- aparelho carregando incompleto) — e a nuvem apagava de todos. Corrigido no app (só o botão Remover apaga).
-- Fonte: hs_versoes — o próprio banco guarda o valor de antes de qualquer apagamento (gatilho hs_sync_versionar).
-- Só desfaz apagamentos de hoje (a partir de 00:00 de Brasília). Nada é apagado.
with v as (
  select distinct on (chave) chave, valor from public.hs_versoes
   where chave like 'rom:%' and tipo = 'apagado' and valor is not null and jsonb_typeof(valor) = 'object'
     and em >= '2026-11-26T03:00:00Z'
   order by chave, em desc)
update public.hs_sync s
   set valor = v.valor, apagado = false, atualizado_em = now(), atualizado_por = 'Restauração: romaneio apagado sem o botão Remover'
  from v
 where s.chave = v.chave and s.apagado and s.atualizado_em >= '2026-11-26T03:00:00Z';
do $$ declare n int; begin
  select count(*) into n from public.hs_sync where chave like 'rom:%' and atualizado_por = 'Restauração: romaneio apagado sem o botão Remover';
  raise notice 'romaneios devolvidos: %', n;
end $$;
