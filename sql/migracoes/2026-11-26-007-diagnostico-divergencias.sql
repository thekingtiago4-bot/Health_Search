-- SÓ LEITURA (26/11/2026): onde estão as divergências? Não muda nada.
do $$ declare r record; begin
  for r in select apagado, count(*) n, max(atualizado_em) ult from public.hs_sync where chave like 'dv:%' group by apagado loop
    raise notice 'DV | apagado=% | qtd=% | ultima_mudanca=%', r.apagado, r.n, r.ult; end loop;
  for r in select atualizado_por, apagado, count(*) n, min(atualizado_em) de, max(atualizado_em) ate from public.hs_sync
            where chave like 'dv:%' and atualizado_em >= now() - interval '2 days' group by 1,2 order by 5 desc loop
    raise notice 'DV_RECENTE | por=% | apagado=% | qtd=% | de=% | ate=%', r.atualizado_por, r.apagado, r.n, r.de, r.ate; end loop;
  for r in select date_trunc('hour', em) h, tipo, count(*) n from public.hs_versoes where chave like 'dv:%' and em >= now() - interval '2 days' group by 1,2 order by 1 desc limit 20 loop
    raise notice 'DV_VERSOES | hora=% | tipo=% | qtd=%', r.h, r.tipo, r.n; end loop;
  for r in select coalesce(valor->>'st','?') st, count(*) n from public.hs_sync where chave like 'dv:%' and not apagado group by 1 loop
    raise notice 'DV_STATUS | st=% | qtd=%', r.st, r.n; end loop;
end $$;
