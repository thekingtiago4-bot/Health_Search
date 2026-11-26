-- SÓ LEITURA (26/11/2026): o que está sendo regravado sem parar ("salvando" a cada 10 s). Não muda nada.
do $$ declare r record; begin
  for r in select chave, usuario, count(*) n, min(em) de, max(em) ate from public.hs_auditoria
            where tabela = 'hs_sync' and em >= now() - interval '40 minutes' group by 1,2 order by 3 desc limit 25 loop
    raise notice 'AUD | % | por=% | vezes=% | de=% | ate=%', r.chave, r.usuario, r.n, r.de, r.ate; end loop;
  for r in select chave, atualizado_por, atualizado_em, coalesce(ap,'') ap from public.hs_sync where atualizado_em >= now() - interval '10 minutes' order by atualizado_em desc limit 25 loop
    raise notice 'SYNC | % | por=% | em=% | ap=%', r.chave, r.atualizado_por, r.atualizado_em, r.ap; end loop;
end $$;
