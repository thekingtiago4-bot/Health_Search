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

## Autonomia (autorizada pelo Tiago em 16/11/2026)

O Tiago autorizou implementar sozinho, sem pedir permissão a cada passo:

- **Pode editar o app, testar e publicar** por conta própria. O app avisa sozinho a nova versão
  em todos os aparelhos (`version.json` + cache do `sw.js`), então publicar é o jeito normal de entregar.
- **Pode criar migração SQL** em `sql/migracoes/` — o robô do GitHub aplica sozinho no Supabase.
  Nunca rodar SQL à mão, nunca simular login de admin no banco real.
- **Continua pedindo o "pode" dele**, sempre, para: apagar dado do usuário (reentregas, divergências,
  histórico), qualquer coisa irreversível, e ideia minha que ele não pediu (sugerir sim, implementar não).
- Dado perdido é a falha mais grave do projeto: "tudo que está cadastrado e o que for cadastrado
  não pode se perder" — se acontecer, a diretoria não aprova o app.

## Acessos (nenhuma senha fica guardada em lugar nenhum)

- **GitHub:** `thekingtiago4-bot/Health_Search` (app, público) e `thekingtiago4-bot/Health_Search_Backups`
  (cópias diárias do robô, privado — dá para ler pelo `gh api repos/.../contents/backups/ANO/MES`).
  A sessão já entra autenticada; se o repo de backups não estiver no escopo, anexar com `add_repo`.
- **Supabase (plano Pro):** tabelas `hs_sync` (uma linha por chave: `s:*` configurações, `dv:*`
  divergências, `re:*` reentregas, `rom:*`, `xml:*`, `rel:*`, `ap:~esp:*`), `hs_bipagens`, `hs_rom_banco`,
  `hs_versoes` (permanente), `hs_fotos` (foto do dia, permanente), `hs_auditoria`, `perfis`.
  Acesso ao banco **só pelo app, no navegador dele** — daqui não há chave nem conexão direta, e isso é de propósito.
