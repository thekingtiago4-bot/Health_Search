-- Health Search 7.0.0 · Blindagem de segurança do banco
-- Rode UMA vez no Supabase → SQL Editor → New query → Run (depois do 6.7.0 e do 6.9.0).
-- Pode rodar de novo sem problema: ele refaz as regras do zero.

-- ---------- funções de apoio (ignoram RLS para não dar loop) ----------
create or replace function public.hs_eh_ativo() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo)
$$;
create or replace function public.hs_eh_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = 'admin')
$$;
revoke all on function public.hs_eh_ativo() from anon;
revoke all on function public.hs_eh_admin() from anon;

-- apaga TODAS as regras antigas de uma tabela (regras antigas e permissivas somariam com as novas)
create or replace function public.hs_limpar_regras(t text) returns void language plpgsql as $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
    execute format('drop policy if exists %I on public.%I', r.policyname, t);
  end loop;
end $$;

-- ---------- perfis: ninguém se promove a admin ----------
alter table public.perfis enable row level security;
select public.hs_limpar_regras('perfis');
create policy perfis_ler on public.perfis for select to authenticated
  using (id = auth.uid() or public.hs_eh_admin());
create policy perfis_admin_atualiza on public.perfis for update to authenticated
  using (public.hs_eh_admin()) with check (public.hs_eh_admin());
create policy perfis_admin_apaga on public.perfis for delete to authenticated
  using (public.hs_eh_admin() and id <> auth.uid());
-- (criar usuário continua só pelas funções do administrador)

-- trava extra: só admin muda papel/ativo, e o último admin não pode se rebaixar
create or replace function public.hs_perfis_trava() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.papel is distinct from old.papel or new.ativo is distinct from old.ativo) and not public.hs_eh_admin()
     and current_user not in ('postgres','service_role','supabase_admin') then
    raise exception 'Somente o administrador altera papel ou acesso.';
  end if;
  if old.papel = 'admin' and (new.papel <> 'admin' or not new.ativo)
     and (select count(*) from public.perfis where papel = 'admin' and ativo and id <> old.id) = 0 then
    raise exception 'Precisa existir pelo menos um administrador ativo.';
  end if;
  return new;
end $$;
drop trigger if exists hs_perfis_trava on public.perfis;
create trigger hs_perfis_trava before update on public.perfis for each row execute function public.hs_perfis_trava();

-- ---------- hs_estado (cópia geral antiga) ----------
do $$ begin
  if to_regclass('public.hs_estado') is not null then
    execute 'alter table public.hs_estado enable row level security';
    perform public.hs_limpar_regras('hs_estado');
    execute 'create policy hs_estado_ler on public.hs_estado for select to authenticated using (public.hs_eh_ativo())';
    execute 'create policy hs_estado_inserir on public.hs_estado for insert to authenticated with check (public.hs_eh_ativo())';
    execute 'create policy hs_estado_atualizar on public.hs_estado for update to authenticated using (public.hs_eh_ativo()) with check (public.hs_eh_ativo())';
    execute 'create policy hs_estado_apagar on public.hs_estado for delete to authenticated using (public.hs_eh_admin())';
  end if;
end $$;

-- ---------- nex_operacoes ----------
do $$ begin
  if to_regclass('public.nex_operacoes') is not null then
    execute 'alter table public.nex_operacoes enable row level security';
    perform public.hs_limpar_regras('nex_operacoes');
    execute 'create policy nexop_ler on public.nex_operacoes for select to authenticated using (public.hs_eh_ativo())';
    execute 'create policy nexop_inserir on public.nex_operacoes for insert to authenticated with check (public.hs_eh_ativo())';
    execute 'create policy nexop_atualizar on public.nex_operacoes for update to authenticated using (public.hs_eh_ativo()) with check (public.hs_eh_ativo())';
    execute 'create policy nexop_apagar on public.nex_operacoes for delete to authenticated using (public.hs_eh_admin())';
  end if;
end $$;

-- ---------- hs_bipagens: aceita "Pitágoras", só o próprio usuário bipa em seu nome (admin restaura) ----------
alter table public.hs_bipagens drop constraint if exists hs_bipagens_status_check;
alter table public.hs_bipagens add constraint hs_bipagens_status_check check (status in ('ok','semnota','fora','dup','pit'));
alter table public.hs_bipagens enable row level security;
select public.hs_limpar_regras('hs_bipagens');
create policy hs_bip_ler on public.hs_bipagens for select to authenticated using (public.hs_eh_ativo());
create policy hs_bip_inserir on public.hs_bipagens for insert to authenticated
  with check (public.hs_eh_ativo() and (usuario_id = auth.uid() or public.hs_eh_admin()));
create policy hs_bip_apagar on public.hs_bipagens for delete to authenticated using (public.hs_eh_admin());

-- ---------- hs_rom_banco ----------
alter table public.hs_rom_banco enable row level security;
select public.hs_limpar_regras('hs_rom_banco');
create policy hs_rb_ler on public.hs_rom_banco for select to authenticated using (public.hs_eh_ativo());
create policy hs_rb_inserir on public.hs_rom_banco for insert to authenticated with check (public.hs_eh_ativo());
create policy hs_rb_atualizar on public.hs_rom_banco for update to authenticated using (public.hs_eh_ativo()) with check (public.hs_eh_ativo());
create policy hs_rb_apagar on public.hs_rom_banco for delete to authenticated using (public.hs_eh_admin());

-- ---------- hs_sync ----------
alter table public.hs_sync enable row level security;
select public.hs_limpar_regras('hs_sync');
create policy hs_sync_ler on public.hs_sync for select to authenticated using (public.hs_eh_ativo());
create policy hs_sync_inserir on public.hs_sync for insert to authenticated
  with check (public.hs_eh_ativo() and (not public.hs_chave_admin(chave) or public.hs_eh_admin()));
create policy hs_sync_atualizar on public.hs_sync for update to authenticated
  using (public.hs_eh_ativo() and (not public.hs_chave_admin(chave) or public.hs_eh_admin()))
  with check (public.hs_eh_ativo() and (not public.hs_chave_admin(chave) or public.hs_eh_admin()));
create policy hs_sync_apagar on public.hs_sync for delete to authenticated using (public.hs_eh_admin());

-- ---------- quem não fez login não vê nada ----------
revoke all on public.perfis, public.hs_bipagens, public.hs_rom_banco, public.hs_sync from anon;
do $$ begin
  if to_regclass('public.hs_estado') is not null then execute 'revoke all on public.hs_estado from anon'; end if;
  if to_regclass('public.nex_operacoes') is not null then execute 'revoke all on public.nex_operacoes from anon'; end if;
end $$;

-- ---------- conferência: lista as tabelas públicas SEM RLS (deve voltar vazio) ----------
select c.relname as tabela_sem_protecao from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
