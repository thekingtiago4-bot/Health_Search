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
