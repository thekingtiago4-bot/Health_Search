#!/bin/sh
# Gera o índice de funções do app (MAPA-FUNCOES.md) a partir do index.html.
# Rode sempre que mexer muito no código:  sh ferramentas/mapa.sh
cd "$(dirname "$0")/.." || exit 1
{
  echo "# Índice de funções — gerado automaticamente"
  echo
  echo "Não edite à mão. Rode \`sh ferramentas/mapa.sh\` depois de mexer no código."
  echo "Gerado em $(date '+%d/%m/%Y %H:%M') · versão $(grep -o "HS_VERSAO='[0-9.]*'" index.html | head -1 | cut -d"'" -f2)"
  echo
  awk 'length($0)<500 && match($0,/(^|[ \t;{])(async )?function [a-zA-Z_$][a-zA-Z0-9_$]*\(/){
        s=substr($0,RSTART); sub(/^[ \t;{]/,"",s); sub(/^async /,"",s); sub(/^function /,"",s);
        sub(/\(.*/,"",s); if(s!="") print s"\t"NR }' index.html \
  | sort -u -k1,1 | awk -F'\t' '
      { p=substr($1,1,2); if(p!=ant){ printf "\n## %s\n", p; ant=p } printf "- `%s` — linha %s\n", $1, $2 }'
} > MAPA-FUNCOES.md
echo "MAPA-FUNCOES.md: $(grep -c '^- ' MAPA-FUNCOES.md) funções"
