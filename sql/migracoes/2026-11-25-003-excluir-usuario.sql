-- v10.6.49 · Excluir usuário = tirar o ACESSO de vez, sem apagar nada do que ele fez (pedido do Tiago, 25/11/2026).
-- O cadastro (perfis) fica, marcado como excluído: o nome continua aparecendo em bipes, baixas, divergências,
-- porcentagens e auditoria. O login é desligado no Supabase (banido para sempre + sessões derrubadas) e o
-- usuário/e-mail ficam livres para cadastrar outra pessoa. Nada em hs_bipagens, hs_sync, hs_auditoria é tocado.
alter table public.perfis add column if not exists excluido_em timestamptz;
alter table public.perfis add column if not exists excluido_por text;
alter table public.perfis add column if not exists usuario_antes text;
alter table public.perfis add column if not exists email_antes text;

create or replace function public.hs_excluir_usuario(alvo uuid) returns void
language plpgsql security definer set search_path to 'public','auth' as $function$
declare p public.perfis; quem text; novo_email text := 'excluido.' || replace(alvo::text,'-','') || '@usuarios.healthsearch.app';
begin
  if not public.hs_eh_admin() then raise exception 'Só o administrador pode excluir usuário.'; end if;
  if alvo = auth.uid() then raise exception 'Você não pode excluir o seu próprio acesso.'; end if;
  select * into p from public.perfis where id = alvo; if not found then raise exception 'Usuário não encontrado.'; end if;
  if p.excluido_em is not null then return; end if;
  select coalesce(nome, usuario, email) into quem from public.perfis where id = auth.uid();
  -- registro permanente de como o cadastro estava (hs_versoes ninguém apaga)
  insert into public.hs_versoes (chave, tipo, valor, por, resumo) values ('perfil:' || alvo, 'apagado', to_jsonb(p), quem, 'acesso excluído');
  update public.perfis set ativo = false, excluido_em = now(), excluido_por = quem,
         usuario_antes = usuario, email_antes = email,
         usuario = left(coalesce(usuario,'x'), 20) || '.excluido.' || left(replace(alvo::text,'-',''), 8),
         email = novo_email, trocar_senha = false
   where id = alvo;
  update auth.users set email = novo_email, banned_until = 'infinity'::timestamptz, updated_at = now() where id = alvo;
  update auth.identities set identity_data = identity_data || jsonb_build_object('email', novo_email) where user_id = alvo;
  delete from auth.sessions where user_id = alvo;
end $function$;
revoke all on function public.hs_excluir_usuario(uuid) from anon, public;
grant execute on function public.hs_excluir_usuario(uuid) to authenticated;
-- confere
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='perfis' and column_name='excluido_em') then
    raise exception 'perfis.excluido_em não foi criada'; end if;
end $$;
