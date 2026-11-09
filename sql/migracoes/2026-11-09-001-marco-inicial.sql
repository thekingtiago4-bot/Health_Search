-- Marco inicial do SQL automático: registra os SQLs que o Tiago já rodou à mão (não executa nada deles).
insert into public.hs_migracoes(nome) values
 ('manual: supabase-v6.3.1-operacao.sql'),('manual: supabase-v6.3.8-banco-romaneios.sql'),('manual: supabase-TUDO-6.7-a-7.4.sql'),
 ('manual: supabase-v8.3.0.sql'),('manual: supabase-v8.4.0-versoes.sql'),('manual: supabase-v8.5.0.sql'),('manual: supabase-v8.6.0.sql'),
 ('manual: supabase-v8.9.7-corrigir-dia-bipes.sql'),('manual: supabase-v9.1.1-auditoria-leve.sql'),('manual: restaurar-regioes-09-11.sql')
on conflict do nothing;
