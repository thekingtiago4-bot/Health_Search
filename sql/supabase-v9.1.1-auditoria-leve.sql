-- Health Search 9.1.1 · auditoria leve (economiza disco do Supabase)
-- Pode rodar quantas vezes quiser. NÃO apaga dados do app.
-- Guarda cópia completa só do que precisa para restaurar: apagados, divergências/avarias (dv:),
-- reentregas (re:), regiões/Correção e usuários. Romaneios, XMLs e demais alterações guardam só o resumo.
create or replace function public.hs_auditar() returns trigger language plpgsql security definer set search_path = public as $$
declare
  k text; ac text; a jsonb; d jsonb; grande boolean; leve boolean;
begin
  if tg_op = 'DELETE' then a := to_jsonb(old); d := null; ac := 'apagou';
  elsif tg_op = 'INSERT' then a := null; d := to_jsonb(new); ac := 'criou';
  else a := to_jsonb(old); d := to_jsonb(new); ac := 'alterou';
    if a - 'atualizado_em' - 'atualizado_por' = d - 'atualizado_em' - 'atualizado_por' then return new; end if;
  end if;
  k := coalesce(d->>'chave', a->>'chave', d->>'id', a->>'id', d->>'local_id', a->>'local_id');
  if tg_table_name = 'hs_sync' and coalesce((d->>'apagado')::boolean,false) and not coalesce((a->>'apagado')::boolean,false) then ac := 'marcou apagado'; end if;
  grande := coalesce(length(a::text),0) + coalesce(length(d::text),0) > 60000;
  leve := ac in ('alterou','criou') and (
            tg_table_name = 'hs_rom_banco'
            or (tg_table_name = 'hs_sync' and k is not null and k not like 'dv:%' and k not like 're:%'
                and k not in ('s:geo','s:aprendidos','s:cidAlias','s:cidAtend','s:geoRuas','s:txtFix','ls:xlNomes')));
  if grande or leve then
    a := case when a is null then null else jsonb_build_object('tamanho', length(a::text)) end;
    d := case when d is null then null else jsonb_build_object('tamanho', length(d::text)) end;
  end if;
  if tg_table_name = 'perfis' then a := a - 'senha'; d := d - 'senha'; end if;
  insert into public.hs_auditoria(usuario_id, usuario, tabela, chave, acao, resumo, antes, depois)
  values (auth.uid(), public.hs_aud_nome(), tg_table_name, k, ac,
          case when tg_table_name='perfis' and a is not null and d is not null then
                 concat_ws(' · ', case when a->>'papel' is distinct from d->>'papel' then 'papel '||coalesce(a->>'papel','')||' → '||coalesce(d->>'papel','') end,
                                  case when a->>'ativo' is distinct from d->>'ativo' then 'acesso '||coalesce(a->>'ativo','')||' → '||coalesce(d->>'ativo','') end)
               else null end,
          a, d);
  if tg_op = 'DELETE' then return old; end if; return new;
end $$;

-- índice para a sincronização buscar só o que mudou (se já existir, não faz nada)
create index if not exists hs_sync_atualizado_em_idx on public.hs_sync (atualizado_em);
