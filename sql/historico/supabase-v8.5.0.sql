-- Health Search v8.5.0 · Uso do banco (aviso 70%), limpeza dos dados com mais de 90 dias e bloqueio total de usuário
-- Rode UMA vez no Supabase: SQL Editor → New query → cole tudo → Run. (Depois do supabase-v8.4.0-versoes.sql)

-- 1) mapa NÃO tem mais versão separada: entra no backup geral. Só guarda o valor de antes quando algo é apagado.
create or replace function public.hs_sync_versionar() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('hs.limpeza', true) = 'on' then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then
    if old.valor is not null and old.chave not like 'bkp:%' and old.chave not like 'ap:%' then
      insert into public.hs_versoes (chave, tipo, valor, por, resumo) values (old.chave, 'apagado', old.valor, old.atualizado_por, 'apagado do banco');
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.valor is not null and (new.apagado or new.valor is null)
     and old.chave not like 'bkp:%' and old.chave not like 'ap:%' then
    insert into public.hs_versoes (chave, tipo, valor, por, resumo) values (old.chave, 'apagado', old.valor, new.atualizado_por, 'valor antes de apagar');
  end if;
  return new;
end $$;

-- a trava das versões só abre durante a limpeza feita pelo administrador
create or replace function public.hs_versoes_trava() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' and current_setting('hs.limpeza', true) = 'on' then return old; end if;
  raise exception 'Versões salvas do Health Search não podem ser alteradas nem apagadas.';
end $$;

-- 2) quanto do banco está em uso (plano gratuito = 500 MB)
create or replace function public.hs_uso() returns json language sql stable security definer set search_path = public as $$
  select json_build_object('bytes', pg_database_size(current_database()), 'limite', 524288000,
         'pct', round(100.0 * pg_database_size(current_database()) / 524288000, 1))
$$;
revoke all on function public.hs_uso() from anon;
grant execute on function public.hs_uso() to authenticated;

-- 3) limpeza: apaga só o que é mais velho que N dias (padrão 90). Só o administrador. O app só chama depois do backup físico conferido.
create or replace function public.hs_limpar_antigos(dias int default 90) returns json language plpgsql security definer set search_path = public as $$
declare corte timestamptz := now() - make_interval(days => greatest(dias, 30)); d date := (now() - make_interval(days => greatest(dias, 30)))::date;
        n1 int := 0; n2 int := 0; n3 int := 0; n4 int := 0; n5 int := 0;
begin
  if not public.hs_eh_admin() then raise exception 'Só o administrador pode limpar o banco.'; end if;
  perform set_config('hs.limpeza', 'on', true);
  delete from public.hs_versoes where em < corte; get diagnostics n1 = row_count;
  delete from public.hs_sync where (chave like 'bkp:%' or chave like 'ap:%') and atualizado_em < corte; get diagnostics n2 = row_count;
  delete from public.hs_sync where chave ~ '^re:\d{4}-\d{2}-\d{2}$' and substring(chave from 4)::date < d; get diagnostics n5 = row_count;
  delete from public.hs_bipagens where dia < d; get diagnostics n3 = row_count;
  delete from public.hs_rom_banco where dia < d; get diagnostics n4 = row_count;
  begin delete from public.hs_auditoria where em < corte; exception when others then null; end;
  perform set_config('hs.limpeza', 'off', true);
  return json_build_object('versoes', n1, 'backups', n2, 'bipes', n3, 'romaneios', n4, 'reentregas_dias', n5, 'antes_de', d);
end $$;
revoke all on function public.hs_limpar_antigos(int) from anon;
grant execute on function public.hs_limpar_antigos(int) to authenticated;

-- 4) bloqueio total: usuário desativado é banido do login e tem todas as sessões derrubadas na hora
create or replace function public.hs_perfil_bloqueio() returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if new.ativo is distinct from old.ativo then
    if not new.ativo then
      update auth.users set banned_until = 'infinity' where id = new.id;
      delete from auth.sessions where user_id = new.id;
      delete from auth.refresh_tokens where user_id = new.id::text;
    else
      update auth.users set banned_until = null where id = new.id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists hs_perfil_bloqueio on public.perfis;
create trigger hs_perfil_bloqueio after update of ativo on public.perfis for each row execute function public.hs_perfil_bloqueio();
-- aplica agora em quem já está desativado
update auth.users u set banned_until = 'infinity' from public.perfis p where p.id = u.id and not p.ativo;

select 'ok — v8.5.0 instalada' as resultado;
