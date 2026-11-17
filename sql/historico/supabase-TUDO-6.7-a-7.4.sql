-- Health Search · TODOS os ajustes do banco em um arquivo só (6.7.0 → 7.4.0)
-- Pode rodar mesmo que alguns já tenham sido rodados: cada parte refaz o que precisa.
-- ANTES: Authentication → Multi-Factor → deixe TOTP habilitado.

-- ================================ supabase-v6.7.0-sincronizar.sql ================================
-- Health Search 6.7.0 · Banco online: reentregas e divergências (sem pasta no PC)
-- Rode UMA vez no Supabase → SQL Editor → New query → Run.

create table if not exists public.hs_sync (
  chave          text primary key,               -- re:2026-11-04 (dia de reentregas) | dv:<id> (divergência)
  tipo           text not null,                  -- re | dv
  valor          jsonb,
  apagado        boolean not null default false,
  atualizado_em  timestamptz not null default now(),
  atualizado_por text
);
create index if not exists hs_sync_tempo on public.hs_sync (atualizado_em);

-- o servidor carimba a hora (relógio do celular não manda)
create or replace function public.hs_sync_carimbo() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;
drop trigger if exists hs_sync_carimbo on public.hs_sync;
create trigger hs_sync_carimbo before insert or update on public.hs_sync for each row execute function public.hs_sync_carimbo();

alter table public.hs_sync enable row level security;

drop policy if exists hs_sync_ler on public.hs_sync;
create policy hs_sync_ler on public.hs_sync for select to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

drop policy if exists hs_sync_inserir on public.hs_sync;
create policy hs_sync_inserir on public.hs_sync for insert to authenticated
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

drop policy if exists hs_sync_atualizar on public.hs_sync;
create policy hs_sync_atualizar on public.hs_sync for update to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo));

-- apagar de vez só o administrador (o app marca "apagado" em vez de excluir)
drop policy if exists hs_sync_apagar on public.hs_sync;
create policy hs_sync_apagar on public.hs_sync for delete to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = 'admin'));

-- ================================ supabase-v6.9.0-seguranca-realtime.sql ================================
-- Health Search 6.9.0 · Segurança no banco + atualização ao vivo
-- Rode UMA vez no Supabase → SQL Editor → New query → Run (depois do supabase-v6.7.0-sincronizar.sql).

-- quem é administrador ativo
create or replace function public.hs_eh_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = 'admin')
$$;
create or replace function public.hs_eh_ativo() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo)
$$;

-- regiões, bases, Correção e dicionários: só o administrador grava
create or replace function public.hs_chave_admin(c text) returns boolean language sql immutable as $$
  select c in ('s:geo','s:aprendidos','s:cidAlias','s:cidAtend','s:geoRuas','s:txtFix','ls:xlNomes')
$$;

drop policy if exists hs_sync_inserir on public.hs_sync;
create policy hs_sync_inserir on public.hs_sync for insert to authenticated
  with check (public.hs_eh_ativo() and (not public.hs_chave_admin(chave) or public.hs_eh_admin()));

drop policy if exists hs_sync_atualizar on public.hs_sync;
create policy hs_sync_atualizar on public.hs_sync for update to authenticated
  using (public.hs_eh_ativo() and (not public.hs_chave_admin(chave) or public.hs_eh_admin()))
  with check (public.hs_eh_ativo() and (not public.hs_chave_admin(chave) or public.hs_eh_admin()));

-- atualização ao vivo (realtime)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hs_sync') then
    execute 'alter publication supabase_realtime add table public.hs_sync';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hs_bipagens') then
    execute 'alter publication supabase_realtime add table public.hs_bipagens';
  end if;
end $$;

-- ================================ supabase-v7.0.0-blindagem.sql ================================
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

-- ================================ supabase-v7.1.0-auditoria-2etapas.sql ================================
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

-- ================================ supabase-v7.2.0-romaneio-editar.sql ================================
-- Health Search 7.2.0 · Editar romaneio: qualquer usuário acrescenta notas; retirar notas ou apagar romaneio só o administrador
-- Rode UMA vez no Supabase → SQL Editor → New query → Run (depois do 7.1.0).

create or replace function public.hs_rom_trava() returns trigger language plpgsql security definer set search_path = public as $$
declare faltou int;
begin
  if new.chave not like 'rom:%' or public.hs_eh_admin() then return new; end if;
  if tg_op = 'UPDATE' then
    if coalesce(new.apagado,false) and not coalesce(old.apagado,false) then
      raise exception 'Somente o administrador remove romaneio.';
    end if;
    select count(*) into faltou
      from jsonb_array_elements(coalesce(old.valor->'rows','[]'::jsonb)) o
     where not exists (select 1 from jsonb_array_elements(coalesce(new.valor->'rows','[]'::jsonb)) n
                        where ltrim(n->>'nf','0') = ltrim(o->>'nf','0'));
    if faltou > 0 then raise exception 'Somente o administrador retira notas do romaneio (% nota(s)).', faltou; end if;
  end if;
  return new;
end $$;
drop trigger if exists hs_rom_trava on public.hs_sync;
create trigger hs_rom_trava before update on public.hs_sync for each row execute function public.hs_rom_trava();

-- ================================ supabase-v7.4.0-chamados.sql ================================
-- Health Search 7.4.0 · "Falar com o ADM": chamados (sugestões, bugs, pedidos de relatório)
-- Rode UMA vez no Supabase → SQL Editor → New query → Run (depois do 7.1.0).

-- (este arquivo funciona sozinho: cria as funções de apoio que faltarem)
create or replace function public.hs_limpar_regras(t text) returns void language plpgsql as $f$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
    execute format('drop policy if exists %I on public.%I', r.policyname, t);
  end loop;
end $f$;
do $$ begin
  if to_regprocedure('public.hs_eh_ativo()') is null then
    execute $q$create function public.hs_eh_ativo() returns boolean language sql stable security definer set search_path = public as
      'select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo)'$q$;
  end if;
  if to_regprocedure('public.hs_eh_admin()') is null then
    execute $q$create function public.hs_eh_admin() returns boolean language sql stable security definer set search_path = public as
      'select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.papel = ''admin'')'$q$;
  end if;
  if to_regprocedure('public.hs_aud_nome()') is null then
    execute $q$create function public.hs_aud_nome() returns text language sql stable security definer set search_path = public as
      'select coalesce((select coalesce(to_jsonb(p)->>''nome'', to_jsonb(p)->>''usuario'') from public.perfis p where p.id = auth.uid()), auth.jwt()->>''email'', ''sistema'')'$q$;
  end if;
end $$;

create table if not exists public.hs_chamados (
  id           bigserial primary key,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  usuario_id   uuid not null default auth.uid(),
  usuario      text,
  titulo       text not null check (length(titulo) between 3 and 140),
  tipo         text not null default 'Sugestão',
  onde         text,
  texto        text not null check (length(texto) between 3 and 5000),
  status       text not null default 'Aberto' check (status in ('Aberto','Em análise','Feito','Recusado')),
  msgs         jsonb not null default '[]',      -- [{em, por, admin, texto}]
  lido_usuario boolean not null default true,     -- o usuário já viu a última resposta do ADM?
  lido_admin   boolean not null default false     -- o ADM já viu a última mensagem do usuário?
);
create index if not exists hs_ch_usuario on public.hs_chamados (usuario_id, atualizado_em desc);

-- nome do usuário e carimbos vêm do servidor (ninguém se passa por outro)
create or replace function public.hs_ch_carimbo() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.usuario_id := auth.uid(); new.usuario := public.hs_aud_nome(); new.status := 'Aberto';
    new.msgs := '[]'; new.lido_admin := false; new.lido_usuario := true; new.criado_em := now();
  else
    if not public.hs_eh_admin() then
      -- usuário comum só pode acrescentar mensagem e marcar como lida; não muda título, status nem dono
      new.usuario_id := old.usuario_id; new.usuario := old.usuario; new.titulo := old.titulo; new.tipo := old.tipo;
      new.onde := old.onde; new.texto := old.texto; new.status := old.status; new.criado_em := old.criado_em;
    end if;
  end if;
  new.atualizado_em := now(); return new;
end $$;
drop trigger if exists hs_ch_carimbo on public.hs_chamados;
create trigger hs_ch_carimbo before insert or update on public.hs_chamados for each row execute function public.hs_ch_carimbo();

alter table public.hs_chamados enable row level security;
select public.hs_limpar_regras('hs_chamados');
create policy hs_ch_ler on public.hs_chamados for select to authenticated
  using (public.hs_eh_ativo() and (usuario_id = auth.uid() or public.hs_eh_admin()));
create policy hs_ch_criar on public.hs_chamados for insert to authenticated with check (public.hs_eh_ativo());
create policy hs_ch_atualizar on public.hs_chamados for update to authenticated
  using (public.hs_eh_ativo() and (usuario_id = auth.uid() or public.hs_eh_admin()))
  with check (public.hs_eh_ativo() and (usuario_id = auth.uid() or public.hs_eh_admin()));
create policy hs_ch_apagar on public.hs_chamados for delete to authenticated using (public.hs_eh_admin());
revoke all on public.hs_chamados from anon;

do $$ begin
  if to_regprocedure('public.hs_auditar()') is not null then
    execute 'drop trigger if exists hs_aud on public.hs_chamados';
    execute 'create trigger hs_aud after update or delete on public.hs_chamados for each row execute function public.hs_auditar()';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hs_chamados') then
    execute 'alter publication supabase_realtime add table public.hs_chamados';
  end if;
end $$;
