-- Health Search v8.9.7 · Bipes que ficaram gravados no dia anterior (app aberto desde antes da meia-noite)
-- Volta cada bipe para o dia em que realmente foi feito (horário de Brasília). Mexe só nos últimos 3 dias. Pode rodar mais de uma vez.
update public.hs_bipagens
   set dia = (criado_em at time zone 'America/Sao_Paulo')::date
 where criado_em >= now() - interval '3 days'
   and dia < (criado_em at time zone 'America/Sao_Paulo')::date;
select dia, count(*) as bipes from public.hs_bipagens where dia >= current_date - 3 group by dia order by dia;
