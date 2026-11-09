-- Health Search 7.1.0 · Auditoria (quem alterou o quê e quando) + administrador só com verificação em 2 etapas
-- Rode UMA vez no Supabase → SQL Editor → New query → Run (depois do 7.0.0).
-- ANTES de rodar: no Supabase, Authentication → Sign In / Providers → Multi-Factor (MFA) → deixe "TOTP" habilitado.

-- ---------- 1) Auditoria ----------
create table if not exists public.hs_auditoria (
  id           bigserial primary key,
  em           timestamptz not null default now(),
  usuario_id   uuid,
  usuario      text,
  tabela       text not null,
  chave        text,
  acao         text not null,          -- criou | alterou | apagou | marcou apagado
  resumo       text,
  antes        jsonb,
  depois       jsonb
);
create index if not exists hs_aud_em on public.hs_auditoria (em desc);
create index if not exists hs_aud_chave on public.hs_auditoria (tabela, chave);
alter table public.hs_auditoria enable row level security;
select public.hs_limpar_regras('hs_auditoria');
create policy hs_aud_ler on public.hs_auditoria for select to authenticated using (public.hs_eh_admin());
-- ninguém grava, altera ou apaga pelo app: só os gatilhos abaixo escrevem (registro à prova de adulteração)
revoke insert, update, delete on public.hs_auditoria from authenticated, anon;

create or replace function public.hs_aud_nome() returns text language sql stable security definer set search_path = public as $$
  select coalesce((select coalesce(to_jsonb(p)->>'nome', to_jsonb(p)->>'usuario', to_jsonb(p)->>'email') from public.perfis p where p.id = auth.uid()), auth.jwt()->>'email', 'sistema')
$$;

create or replace function public.hs_auditar() returns trigger language plpgsql security definer set search_path = public as $$
declare
  k text; ac text; a jsonb; d jsonb; grande boolean;
begin
  if tg_op = 'DELETE' then a := to_jsonb(old); d := null; ac := 'apagou';
  elsif tg_op = 'INSERT' then a := null; d := to_jsonb(new); ac := 'criou';
  else a := to_jsonb(old); d := to_jsonb(new); ac := 'alterou';
    if a = d then return new; end if;
  end if;
  k := coalesce(d->>'chave', a->>'chave', d->>'id', a->>'id', d->>'local_id', a->>'local_id');
  if tg_table_name = 'hs_sync' and coalesce((d->>'apagado')::boolean,false) and not coalesce((a->>'apagado')::boolean,false) then ac := 'marcou apagado'; end if;
  -- dados muito grandes (mapa, histórico geral) guardam só o tamanho, para não encher o banco
  grande := coalesce(length(a::text),0) + coalesce(length(d::text),0) > 60000;
  if grande then
    a := case when a is null then null else jsonb_build_object('tamanho', length(a::text)) end;
    d := case when d is null then null else jsonb_build_object('tamanho', length(d::text)) end;
  end if;
  if tg_table_name = 'perfis' then
    a := a - 'senha'; d := d - 'senha';
  end if;
  insert into public.hs_auditoria(usuario_id, usuario, tabela, chave, acao, resumo, antes, depois)
  values (auth.uid(), public.hs_aud_nome(), tg_table_name, k, ac,
          case when tg_table_name='perfis' and a is not null and d is not null then
                 concat_ws(' · ', case when a->>'papel' is distinct from d->>'papel' then 'papel '||coalesce(a->>'papel','')||' → '||coalesce(d->>'papel','') end,
                                  case when a->>'ativo' is distinct from d->>'ativo' then 'acesso '||coalesce(a->>'ativo','')||' → '||coalesce(d->>'ativo','') end)
               else null end,
          a, d);
  if tg_op = 'DELETE' then return old; end if; return new;
end $$;

drop trigger if exists hs_aud on public.hs_sync;
create trigger hs_aud after insert or update or delete on public.hs_sync for each row execute function public.hs_auditar();
drop trigger if exists hs_aud on public.hs_rom_banco;
create trigger hs_aud after update or delete on public.hs_rom_banco for each row execute function public.hs_auditar();
drop trigger if exists hs_aud on public.hs_bipagens;
create trigger hs_aud after delete on public.hs_bipagens for each row execute function public.hs_auditar();
drop trigger if exists hs_aud on public.perfis;
create trigger hs_aud after insert or update or delete on public.perfis for each row execute function public.hs_auditar();

-- guarda 2 anos de auditoria
create or replace function public.hs_aud_limpar() returns trigger language plpgsql security definer set search_path = public as $$
begin if random() < 0.002 then delete from public.hs_auditoria where em < now() - interval '2 years'; end if; return null; end $$;
drop trigger if exists hs_aud_limpar on public.hs_auditoria;
create trigger hs_aud_limpar after insert on public.hs_auditoria for each statement execute function public.hs_aud_limpar();

-- ---------- 2) Poderes de administrador só com verificação em 2 etapas ----------
create or replace function public.hs_eh_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = 'admin')
     and coalesce(auth.jwt()->>'aal','') = 'aal2'
$$;
