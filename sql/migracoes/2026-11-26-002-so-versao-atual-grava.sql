-- v10.6.56 · Aparelho DESATUALIZADO não grava em hs_sync até o usuário atualizar (pedido do Tiago, 26/11/2026).
-- Motivo: aparelho em versão antiga recolocava reentregas tiradas e brigava com os atualizados ("salvando" sem fim).
-- Como: o app (≥ 10.6.56) manda "hs/<versão>" no cabeçalho x-client-info. Gravação vinda do app sem isso ou com versão
-- menor que a mínima é recusada com a mensagem APP_DESATUALIZADO. O que o aparelho velho tem fica guardado NELE e sobe
-- depois de atualizar. Não vale para: bipes (hs_bipagens), robô/SQL direto (sem cabeçalho de requisição).
create or replace function public.hs_versao_cliente() returns text language sql stable as $$
  select coalesce(substring(coalesce(nullif(current_setting('request.headers', true), '')::json->>'x-client-info', '') from 'hs/([0-9]+(\.[0-9]+)*)'), '')
$$;
create or replace function public.hs_versao_minima() returns text language sql immutable as $$ select '10.6.56'::text $$;
create or replace function public.hs_versao_ok() returns boolean language plpgsql stable as $$
declare v text := public.hs_versao_cliente();
begin
  if v = '' then return false; end if;
  return string_to_array(v, '.')::int[] >= string_to_array(public.hs_versao_minima(), '.')::int[];
end $$;
create or replace function public.hs_sync_so_versao_atual() returns trigger language plpgsql as $$
begin
  -- sem requisição do app (robô, SQL do painel) → passa
  if nullif(current_setting('request.headers', true), '') is null then return new; end if;
  if auth.uid() is null then return new; end if;
  if not public.hs_versao_ok() then
    raise exception 'APP_DESATUALIZADO: este aparelho está com o Health Search antigo (%). Toque em "Buscar atualização" para voltar a salvar na nuvem — nada do que está aqui se perde.', coalesce(nullif(public.hs_versao_cliente(),''),'versão sem identificação');
  end if;
  return new;
end $$;
drop trigger if exists hs_sync_so_versao_atual on public.hs_sync;
create trigger hs_sync_so_versao_atual before insert or update on public.hs_sync for each row execute function public.hs_sync_so_versao_atual();
