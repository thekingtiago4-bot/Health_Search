-- v9.19.2 · Só leitura: mede o espaço de cada tabela e o que mais ocupa nas versões (não altera nada)
select relname as tabela, pg_size_pretty(pg_total_relation_size(relid)) as total, n_live_tup as linhas
from pg_stat_user_tables order by pg_total_relation_size(relid) desc limit 12;
select chave, tipo, count(*) as versoes, pg_size_pretty(sum(pg_column_size(valor))::bigint) as tamanho
from public.hs_versoes group by chave, tipo order by sum(pg_column_size(valor)) desc limit 15;
select pg_size_pretty(sum(pg_column_size(valor))::bigint) as hs_sync_total, count(*) as linhas from public.hs_sync;
select date_trunc('day', em)::date as dia, count(*) as versoes, pg_size_pretty(sum(pg_column_size(valor))::bigint) as tamanho
from public.hs_versoes group by 1 order by 1 desc limit 10;
