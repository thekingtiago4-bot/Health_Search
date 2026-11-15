# Health Search — instruções para o Claude

**Antes de qualquer coisa, leia `MAPA.md`.** Ele tem o que é o app, as regras invioláveis, a
arquitetura por prefixo de módulo, onde ficam os dados, o ritual de publicação e as armadilhas.

## Economia de contexto (regra principal)

O `index.html` tem ~9,4 MB (fontes e malha em base64). **Nunca leia o arquivo inteiro.**

1. `MAPA.md` → entender o terreno.
2. `MAPA-FUNCOES.md` → achar a função: `grep -n '^- \`nomeDaFuncao\`' MAPA-FUNCOES.md`
3. `sed -n 'INICIO,FIMp' index.html | cut -c1-400` → abrir só o trecho.
4. Procurar texto: `awk 'length($0)<600 && /padrão/ {print NR": "substr($0,1,200)}' index.html`
   (grep cru devolve linhas de base64 gigantes).
5. Depois de mexer muito no código: `sh ferramentas/mapa.sh` para regenerar o índice.

## Regras do projeto

- Tudo em português do Brasil, linguagem de galpão.
- Botão criado é botão clicado: testar antes de publicar.
- `node testes/regressao.js` tem que passar antes de todo publish.
- Publicar = versão no `index.html` + cache no `sw.js` + `version.json` + testes + push.
- Nada de apagar dado do usuário sem backup e sem autorização explícita.
- Toda alteração entra na lista de tarefas, somando ao histórico.
- Terminar sempre dizendo o que foi testado e o que não deu para testar daqui.
