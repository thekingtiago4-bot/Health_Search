-- v10.6.23 · Admin SEM verificação em 2 etapas, por enquanto (pedido do Tiago em 18/11/2026: só ele e o
-- Christian usam o app, fase de testes). Antes (v7.1.0) o poder de administrador exigia a sessão em 2 etapas
-- (aal2). Agora basta ser admin ativo. O autenticador cadastrado no Supabase NÃO foi apagado.
-- PARA RELIGAR: nova migração com o "and coalesce(auth.jwt()->>'aal','') = 'aal2'" de volta
-- (texto original em sql/historico/supabase-v7.1.0-auditoria-2etapas.sql) e HS_2ETAPAS=true no index.html.
create or replace function public.hs_eh_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = 'admin')
$$;
revoke all on function public.hs_eh_admin() from anon;
-- confere: a função não pode mais citar aal
do $$ begin
  if exists (select 1 from pg_proc where proname='hs_eh_admin' and pronamespace='public'::regnamespace and prosrc like '%aal%') then
    raise exception 'hs_eh_admin ainda exige 2 etapas';
  end if;
end $$;
