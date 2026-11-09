-- Health Search · VERIFICAÇÃO GERAL (só lê, não altera nada)
-- Rode e me mande o print do resultado. Cada linha deve sair "OK".
with t(nome) as (values ('hs_sync'),('hs_rom_banco'),('hs_bipagens'),('hs_chamados'),('hs_auditoria'),('hs_versoes'),('perfis')),
f(nome) as (values ('hs_auditar'),('hs_aud_nome'),('hs_eh_admin'),('hs_eh_ativo'),('hs_uso'),('hs_sync_versionar'),('hs_limpar_antigos'),('hs_meu_status'),('hs_chave_admin'))
select 'Tabela '||nome as item, case when to_regclass('public.'||nome) is not null then 'OK' else 'FALTA' end as situacao from t
union all
select 'Função '||nome, case when exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=f.nome) then 'OK' else 'FALTA' end from f
union all
select 'Proteção (RLS) '||c.relname, case when c.relrowsecurity then 'OK' else 'SEM PROTEÇÃO' end
  from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relname like 'hs_%'
union all
select 'Auditoria leve (9.1.1)', case when pg_get_functiondef('public.hs_auditar()'::regprocedure) like '%leve :=%' then 'OK' else 'FALTA rodar 9.1.1' end
union all
select 'Ao vivo (realtime) hs_sync', case when exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='hs_sync') then 'OK' else 'FALTA' end
union all
select 'Regiões (s:geo)', coalesce((select jsonb_array_length(valor->'listas')::text||' regiões/bases · '||to_char(atualizado_em at time zone 'America/Sao_Paulo','DD/MM HH24:MI')||' · '||coalesce(atualizado_por,'') from public.hs_sync where chave='s:geo'),'FALTA')
union all
select 'Tamanho do banco', pg_size_pretty(pg_database_size(current_database()))
union all
select 'Tamanho da auditoria', pg_size_pretty(pg_total_relation_size('public.hs_auditoria'))
union all
select 'Tamanho hs_sync', pg_size_pretty(pg_total_relation_size('public.hs_sync'));
