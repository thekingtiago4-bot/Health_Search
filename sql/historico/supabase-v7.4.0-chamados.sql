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
