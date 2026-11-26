-- v10.6.60 · SÓ LEITURA: lista os romaneios devolvidos em 26/11 (para o Tiago dizer quais 6 são os certos). Não muda nada.
do $$ declare r record; begin
  for r in select chave, valor->>'numero' num, valor->>'arquivo' arq, valor->>'base' base, valor->>'importadoEm' imp,
                  jsonb_array_length(coalesce(valor->'rows','[]'::jsonb)) notas
             from public.hs_sync where chave like 'rom:%' and atualizado_por = 'Restauração: romaneio apagado sem o botão Remover'
             order by valor->>'importadoEm' loop
    raise notice 'DEVOLVIDO | % | num=% | base=% | notas=% | importado=% | arquivo=%', r.chave, r.num, r.base, r.notas, r.imp, r.arq;
  end loop;
  for r in select chave, valor->>'numero' num, valor->>'arquivo' arq, jsonb_array_length(coalesce(valor->'rows','[]'::jsonb)) notas, valor->>'importadoEm' imp
             from public.hs_sync where chave like 'rom:%' and not apagado and coalesce(atualizado_por,'') <> 'Restauração: romaneio apagado sem o botão Remover'
               and (valor->>'importadoEm') >= '2026-11-26' order by valor->>'importadoEm' loop
    raise notice 'JA_ESTAVA | % | num=% | notas=% | importado=% | arquivo=%', r.chave, r.num, r.notas, r.imp, r.arq;
  end loop;
end $$;
