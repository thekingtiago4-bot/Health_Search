# MAPA — Health Search

> **Leia este arquivo antes de mexer no app. Ele existe para eu não precisar reler o `index.html` inteiro (9,4 MB) a cada conversa.**
> Companheiro: `MAPA-FUNCOES.md` (índice de 937 funções → linha), gerado por `sh ferramentas/mapa.sh`.

## 1. O que é

App operacional da **Health Log (Grupo VIVEO)**, base **Araraquara (AQA)**; matriz **Cajamar (CAJ)**.
Dono e único cliente: **Tiago**. Quem usa: conferentes do galpão, no celular, em pé, com pressa.
Serve para: conferir romaneios bipando caixas (NexBip), registrar divergências, avarias e reentregas,
roteirizar, e gerar relatório para a diretoria.

**Regras invioláveis**
- Português do Brasil em **tudo** que o usuário lê. Linguagem de galpão, não de TI.
- Nada quebra o que já funciona. O galpão usa isso de manhã.
- Botão que eu crio, eu clico antes de publicar. ("quando criar algo, certifique-se de que tudo que criou funciona")
- Toda alteração entra na lista de tarefas (painel da direita), somando — nunca apagando o histórico.
- Nunca apagar dado do usuário sem backup e sem o "pode" dele.

## 2. Arquivos

| arquivo | o que é |
|---|---|
| `index.html` | **o app inteiro** (~9,4 MB): HTML + CSS + JS + fontes/malha em base64. Um arquivo só. |
| `sw.js` | service worker; o nome do cache (`hs-app-vNNN`) **precisa mudar** a cada versão |
| `version.json` | versão + texto de novidades que o app mostra |
| `manifest.webmanifest`, `icon-*.png` | PWA |
| `sql/` | esquema e `sql/migracoes/` (aplicadas sozinhas no push) |
| `testes/regressao.js` | suíte Playwright — **rodar antes de todo publish** |
| `ferramentas/mapa.sh` | regenera `MAPA-FUNCOES.md` |
| `emails/`, `robo-backup/` | **não usados pelo app** — Tiago pediu para ignorar, não apagar |

## 3. Como publicar (ritual, nessa ordem)

1. `HS_VERSAO='x.y.z'` no `index.html`
2. `hs-app-vNNN` no `sw.js` (+1)
3. `version.json` (versão, data, novidades em português simples, **sem acento** nesse arquivo)
4. `node testes/regressao.js` → tem que sair `OK: todos os testes passaram`
5. commit (mensagem em português, com as linhas de atribuição) e push
6. conferir no ar: `curl -s https://thekingtiago4-bot.github.io/Health_Search/version.json` (leva 1–5 min)
7. avisar o Tiago: o que mudou, o que testei, **o que não consegui testar daqui**

Remote: `thekingtiago4-bot/Health_Search` (GitHub Pages).

## 4. Arquitetura mental

**Convenção que abre o código inteiro:** cada módulo tem um prefixo de 2–3 letras em *todas* as suas
funções. Saber o prefixo = achar o módulo sem procurar.

| prefixo | módulo |
|---|---|
| `op` | **NexBip** / conferência: câmera, leitura, bipes, pendentes, romaneio do dia |
| `etq` / `OCR` / `fot` | leitura de etiqueta (OCR), modelos de etiqueta, treino por foto |
| `cer` / `eva` | **BIT**: cérebro (o que aprendeu), chat, dúvidas, ensinar |
| `chv` | chave da DANFE pela câmera (44 dígitos → Meu Danfe → nota no romaneio) |
| `dv` / `av` / `du` | divergências, avarias, e a visão de duas colunas + banco por dia |
| `re` / `rp` / `rx` | reentregas: lançamento, painel, janela "Ver todos" |
| `rom` / `rb` / `red` | romaneios: import de PDF, banco de romaneios, editor |
| `ct` / `gs` | conferência total e painel do gestor |
| `cad` / `ck` | cadastros (motoristas, bases) e checklist de agregados |
| `geo` | mapa de cidades × base (2.748 cidades) |
| `rot` / `rota` | rotas do dia (folha de rotas em PDF) |
| `nv` / `nuv` | login/usuários (Supabase Auth) e sincronização |
| `sim` / `nex` | simulação e "entra/não entra na operação" |

**Dados**
- `S` = estado global, salvo em localStorage por `salvar()`; `nuvSinc()` manda para a nuvem.
- `NUV_CAMPOS` lista **o que sincroniza**. `S.romaneios` **não** está nela: romaneio viaja pelo
  banco de romaneios (`hs_rom_banco`). Aparelho sem romaneio do dia → todo bipe cai como "fora".
- Bipes do dia: `OP.bipes`, espelhados em `localStorage[OP_LOCAL + dia]` (dias anteriores só aí).
- Supabase: `hs_sync` (chave/valor), `hs_bipagens`, `hs_rom_banco`, `hs_versoes`, `hs_perfis`.
  RLS por usuário ativo; canal realtime `hs-bipagens`.

## 5. Armadilhas que já me custaram horas

- **Nunca** `grep` cru no `index.html`: há base64 gigante. Use
  `awk 'length($0)<600 && /padrão/ {print NR": "substr($0,1,200)}' index.html`.
- **Funções são redefinidas mais adiante no arquivo** (wrappers: `{ const _x=f; f=function(){…} }`).
  Patch na primeira definição pode não ter efeito. Confira se existe `nomeDaFuncao=` depois.
  Foi o que aconteceu com `opPendentes` (9.26.1 → 9.27.1).
- Wrapper só funciona se a função já existir naquele ponto do arquivo: `evaBadge` precisou ir
  **para o fim**, porque um override posterior ignorava o anterior.
- `innerText` de elemento escondido volta vazio nos testes — use `innerHTML`.
- CSS: `font: 800 2.2rem inherit` é inválido e derruba a declaração inteira.
- `html,body{height:100%}` + caixas com rolagem = **PDF cortado na folha 1**. Regras de impressão
  globais já existem (v9.26.9) e a janela de relatório tem as dela (v9.27.2).
- Testes: o primeiro `opLer` de uma página às vezes é engolido pela inicialização; bipe repetido em
  sequência também. Dê um bipe de aquecimento ou use NF diferente.
- `RE.ler()` devolve o objeto vivo; `RE.gravar()` **não** recebe argumento.
- Antes de publicar algo que mexe em impressão, gere o PDF de verdade com Playwright e **olhe**
  (`pdftoppm -png`), não confie só no CSS.

## 6. Como achar as coisas sem gastar token

```sh
sh ferramentas/mapa.sh                   # regenera o índice de funções
grep -n '^- `opPendentes`' MAPA-FUNCOES.md   # em que linha está
sed -n '5148,5152p' index.html | cut -c1-400 # lê só o trecho
awk 'length($0)<600 && /texto/ {print NR": "substr($0,1,200)}' index.html
```

## 7. Onde estamos (15/11/2026 · v10.0.1)

Reforma v10 em **4 partes**, publicando uma por vez:
1. **BIT e leitor — feito** (10.0.0/10.0.1): BIT fora do NexBip; aviso que não escreve por cima;
   leitor 1D/2D/OCR + ZXing; melhor câmera; chave da DANFE; aba do BIT remodelada; treino com
   arrastar e soltar.
2. **Divergências e Avarias — em andamento**: duas colunas (Pendentes/Solucionadas), banco por dia,
   trocar o dia do registro, avaria com volumes, 3 status coloridos, foto → WhatsApp (mesmo esquema
   do Expedição e recebimento), autoria com hora. *Código das colunas já existe (`du*`), falta ligar.*
3. **Relatórios, Painel do gestor e Reentregas**: padrão com logo do Health Search, cores e
   `© 2026 Health Log · Grupo VIVEO — uso interno`; painel da operação por dia/mês/ano; motorista
   (cadastrado) e motivo obrigatórios; **apagar o histórico de reentregas** só depois do Excel de
   backup e do "pode" dele.
4. **Notificações (inclusive com o app fechado — ele faz o passo no Supabase), revisão geral de
   layout, manual com segurança e servidores, limpeza de código.**

**Regra de negócio dita por ele:** nota marcada como divergência que aparece no romaneio **não é
reentrega** — só avisa.
