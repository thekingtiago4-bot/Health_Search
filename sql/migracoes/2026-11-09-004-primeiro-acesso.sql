-- Usuários: senha provisória livre (mín. 6) e troca obrigatória no primeiro acesso
alter table public.perfis add column if not exists trocar_senha boolean not null default false;

create or replace function public.hs_criar_usuario(p_nome text, p_usuario text, p_email text, p_senha text, p_papel text)
returns uuid language plpgsql security definer set search_path to 'public','extensions','auth' as $function$
declare uid uuid := gen_random_uuid(); em text := lower(trim(p_email)); us text := lower(trim(p_usuario));
begin
  if not public.hs_admin() then raise exception 'Só o administrador pode criar usuários.'; end if;
  if length(p_senha) < 6 then raise exception 'A senha precisa ter pelo menos 6 caracteres.'; end if;
  if us !~ '^[a-z0-9._-]{3,40}$' then raise exception 'Usuário inválido.'; end if;
  if em is null or em = '' then em := us || '@usuarios.healthsearch.app'; end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if exists (select 1 from public.perfis where lower(usuario) = us) then raise exception 'Usuário já está em uso.'; end if;
  if exists (select 1 from auth.users where lower(email) = em) then raise exception 'E-mail já está em uso.'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, extensions.crypt(p_senha, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
  insert into public.perfis (id, email, usuario, nome, papel, ativo, trocar_senha) values (uid, em, us, trim(p_nome), case when p_papel = 'admin' then 'admin' else 'usuario' end, true, true);
  return uid;
end $function$;

create or replace function public.hs_definir_senha(alvo uuid, nova text)
returns void language plpgsql security definer set search_path to 'public','extensions','auth' as $function$
begin
  if not public.hs_admin() then raise exception 'Só o administrador pode redefinir senha.'; end if;
  if length(nova) < 6 then raise exception 'A senha precisa ter pelo menos 6 caracteres.'; end if;
  update auth.users set encrypted_password = extensions.crypt(nova, extensions.gen_salt('bf')), updated_at = now() where id = alvo;
  update public.perfis set trocar_senha = (alvo <> auth.uid()) where id = alvo;
end $function$;

create or replace function public.hs_senha_trocada() returns void language sql security definer set search_path to 'public' as $$
  update public.perfis set trocar_senha = false where id = auth.uid();
$$;
revoke all on function public.hs_senha_trocada() from anon;
grant execute on function public.hs_senha_trocada() to authenticated;
