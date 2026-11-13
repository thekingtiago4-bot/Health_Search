-- v9.20.2 · Conferência do bipe: guarda quem respondeu ✓ / ✗ na câmera, quando e quantos volumes contou.
-- Só acrescenta colunas; nada é apagado nem alterado. Bipes antigos ficam com os campos vazios.
alter table public.hs_bipagens add column if not exists conferido_por text;
alter table public.hs_bipagens add column if not exists conferido_em  timestamptz;
alter table public.hs_bipagens add column if not exists conferido_qt  integer;
comment on column public.hs_bipagens.conferido_por is 'Quem respondeu a conferência de volumes na câmera (NexBip)';
comment on column public.hs_bipagens.conferido_em  is 'Quando respondeu';
comment on column public.hs_bipagens.conferido_qt  is 'Quantos volumes a pessoa contou fisicamente';
