-- v10.6.60 · Autorizado pelo Tiago (26/11/2026, "Sim"): tira de novo os 4 romaneios de ONTEM (25/11, recarregados hoje
-- com nome "26-11") que a devolução 2026-11-26-004 trouxe a mais. Ficam os 6 de hoje.
-- Cópia: o gatilho hs_sync_versionar guarda o valor em hs_versoes antes (dá para desfazer).
update public.hs_sync set apagado = true, valor = null, atualizado_em = now(), atualizado_por = 'Tiago: romaneio de 25/11 retirado (autorizado)'
 where chave in ('rom:001.001.0237679','rom:001.001.0237686','rom:001.001.0237680','rom:001.001.0237693') and not apagado;
do $$ declare n int; m int; begin
  select count(*) into n from public.hs_sync where chave like 'rom:%' and not apagado and (valor->>'importadoEm') >= '2026-11-26';
  select count(*) into m from public.hs_versoes where chave in ('rom:001.001.0237679','rom:001.001.0237686','rom:001.001.0237680','rom:001.001.0237693') and tipo='apagado';
  raise notice 'romaneios de hoje na nuvem: % · cópias guardadas dos 4: %', n, m;
end $$;
