-- Leitura (não altera nada): mostra no registro como estão as funções de criar usuário e senha
do $$ declare r record; begin
  for r in select p.proname, pg_get_functiondef(p.oid) d from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('hs_criar_usuario','hs_definir_senha','hs_editar_usuario') loop
    raise notice E'===== %\n%', r.proname, r.d; end loop;
  raise notice 'colunas perfis: %', (select string_agg(column_name,',') from information_schema.columns where table_schema='public' and table_name='perfis');
end $$;
