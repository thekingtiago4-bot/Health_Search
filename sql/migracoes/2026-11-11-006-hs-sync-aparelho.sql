-- v9.19.1 · Egress: cada linha do hs_sync guarda qual aparelho gravou por último (coluna ap).
-- O app usa isso para não baixar de volta o que ele mesmo acabou de enviar.
alter table public.hs_sync add column if not exists ap text;
