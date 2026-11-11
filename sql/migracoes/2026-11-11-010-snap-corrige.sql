-- v9.19.2 · Corrige hs_snap (tira o returning que dava erro de tipo)
create or replace function public.hs_snap(p_tipo text, p_resumo text default null, p_por text default null, p_aparelho text default null)
returns json language plpgsql security definer set search_path = public as $$
declare ult_snap timestamptz; ult_mud timestamptz; ult_tipo timestamptz;
begin
  if not public.hs_eh_ativo() then raise exception 'Usuário sem acesso.'; end if;
  select max(em) into ult_snap from public.hs_versoes where chave = 'snap';
  select max(em) into ult_tipo from public.hs_versoes where chave = 'snap' and tipo = p_tipo;
  select max(atualizado_em) into ult_mud from public.hs_sync
   where chave like 's:%' or chave like 're:%' or chave like 'dv:%' or chave like 'ls:%' or chave like 'rom:%' or chave like 'nh:%';
  if ult_snap is not null and ult_mud is not null and ult_snap >= ult_mud then
    return json_build_object('ok', true, 'igual', true, 'msg', 'nada mudou desde a última cópia');
  end if;
  if p_tipo = 'manual' and ult_tipo is not null and ult_tipo > now() - interval '15 minutes' then
    return json_build_object('ok', true, 'igual', true, 'msg', 'já existe uma cópia de menos de 15 minutos');
  end if;
  insert into public.hs_versoes (chave, tipo, valor, resumo, por, aparelho)
  select 'snap', p_tipo, jsonb_build_object('itens', coalesce(jsonb_agg(jsonb_build_object('chave', chave, 'valor', valor)), '[]'::jsonb)),
         coalesce(p_resumo, count(*) || ' itens'), p_por, p_aparelho
    from public.hs_sync
   where (chave like 's:%' or chave like 're:%' or chave like 'dv:%' or chave like 'ls:%' or chave like 'rom:%' or chave like 'nh:%')
     and not apagado and valor is not null;
  return json_build_object('ok', true, 'igual', false);
end $$;
revoke all on function public.hs_snap(text, text, text, text) from anon;
grant execute on function public.hs_snap(text, text, text, text) to authenticated;
