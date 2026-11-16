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

## 1b. Começando uma conversa nova (leia isto primeiro)

1. `cat CLAUDE.md` e este `MAPA.md` → terreno, regras e autonomia.
2. `grep -n '^- \`nome\`' MAPA-FUNCOES.md` → linha da função; `sed -n 'A,Bp' index.html | cut -c1-400` → só o trecho.
3. Nunca ler o `index.html` inteiro.
4. Antes de publicar: `node testes/regressao.js`.
5. Publicar = `HS_VERSAO` no index + cache no `sw.js` + `version.json` + commit + push. O app avisa sozinho a nova versão em todos os aparelhos.
6. Precisa mexer no banco? Criar arquivo em `sql/migracoes/` — o robô do GitHub aplica. Nunca SQL à mão.
7. Terminar dizendo o que foi testado e o que não deu para testar, e com sugestões de melhoria.

**Autonomia (dada por ele em 16/11/2026):** pode editar, testar e publicar sozinho; pode criar migração.
Continua pedindo o "pode" para apagar dado, para qualquer coisa irreversível e para ideia minha que ele não pediu.

**Onde as coisas vivem:** GitHub `thekingtiago4-bot/Health_Search` (app) e `Health_Search_Backups` (cópias do robô,
privado); Supabase Pro com `hs_sync`, `hs_bipagens`, `hs_rom_banco`, `hs_versoes`, `hs_fotos`, `hs_auditoria`, `perfis`.
Nenhuma senha ou chave fica guardada aqui — o banco só é acessado pelo app, no navegador dele.

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
2. **Divergências e Avarias — feito (10.2.4)**: duas colunas (Pendentes/Solucionadas), banco por dia,
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

## v10.1.0 (publicado 15/11/2026)
- **Máscara de carregamento**: o splash só sai quando o Mural do Dia está na frente (rede de segurança de 12s; em modo restrito sai sozinho). Não existe mais o `hsSplash()` no primeiro `irPara`.
- **Mural do Dia**: passe pós-render `murArrumar()` (prefixo `mur`), tira cards pelo `<h3>`, põe Operação primeiro com `grid-column:1/-1`, Backup só Admin/Supervisor, `#eva-bt` oculto, editar layout só do Admin e salvo em `S.muralLay` (sincronizado) em vez do `muChave()` por aparelho.
- **Cargos (Anexo I)**: `CARGOS`, `cargoDe`, `cargoMeu`, `cargoPodeVer`, `cargoTelaInicial`, `cargoAplicar`, `cargoLogado`. Guardados em `S.cargos[userId]` (sincronizado); o papel `admin` continua no `perfis.papel` do Supabase. Sem login nada é escondido.
- **Aba do BIT (`eva`)**: só Admin — está em `CARGO_SO_ADM` e bloqueada no `irPara`.
- **Painel de Gestão** (era "Painel do gestor"): `gsFotoMontar/gsFotoGravar/gsFotoAgendar/gsFotoLer`, foto diária em `S.gsSnap[dia]` (máx. 120 dias, 300 notas faltantes), `gsCartao` no topo do painel, `gsPdfProjetor(dia)` em A4 paisagem com fontes de projetor. A foto é gravada sozinha 8s depois de cada bipe (wrapper de `opLer`).
- **Armadilha nova**: `N()` devolve MAIÚSCULAS sem acento — normalizar título com `.toLowerCase()` depois, nunca com `[^a-z0-9]`.
- **Armadilha nova**: wrapper tem que ser inserido DEPOIS da definição da função. O bloco `gs*` precisou ser movido para depois do IIFE que cria `#t-gestor`.
- **Armadilha nova**: `muAplicar` escreve `grid-column` inline — classe CSS não vence; setar no `style`.
- **Teste**: o cálculo de "ontem" no `regressao.js` passou a usar `diaLocal()`; em UTC ele quebrava sozinho depois das 21h.

## v10.1.1 (publicado 16/11/2026)
- **Conferência de integridade** (`integFalta`, `integConferir`): a sincronização só reaplica a chave que MUDOU na nuvem (hash em `NUV.h`), então o que se perde na cópia local nunca volta sozinho. Ao entrar (6s depois do `nvCarregar`) o app compara `NUV.h` com o que existe em `S` e re-baixa as chaves faltantes (`dv:`, `re:`, `s:*`). Botão manual no modal do banco online.
- **Conferência por origem de qualquer dia** (`gsRomsDia`, `gsBipesDia`, `gsFotoDeDiaPassado`, `gsGarantirFoto`, `gsRemontarTudo`, `gsOrigemBox`, `gsTrocarOrigem`): remonta a conta de um dia passado do banco de romaneios (`rbLocalLer` / `hs_rom_banco`) + bipes do dia (`OP_LOCAL+dia` / `hs_bipagens`) e grava como foto em `S.gsSnap`. Botão "📊 Remontar o histórico" faz todos os dias do banco de uma vez.
- **Bug corrigido**: o quadro "Conferência por origem (dd/mm)" mostrava o título do dia escolhido com os números de HOJE — por isso aparecia 0% num dia que foi 100%.
- **Fato apurado em 16/11**: as 13 divergências de 13/11 estavam intactas na nuvem (conferido no backup do robô de 15/11: 27 chaves `dv:`, 13 do dia 13, 14 tombstones antigos). Era a cópia do aparelho que estava vazia.

## v10.1.2 / v10.1.3 (16/11/2026)
- **Relatório sob medida** (`gsPdfEscolher`, `GSR`, `gsPorPessoa`, `gsPorHora`, `gsTab`): janela antes do PDF com porcentagem, origem, o que não entrou, divergências do dia, bipes por pessoa, bipes por hora e observação para a diretoria. `gsPdfProjetor(dia,op)` respeita as marcações.
- **Bipe de madrugada** (até as 6h do dia seguinte) conta no romaneio do dia anterior — turno que vira a noite não derruba mais a porcentagem.
- **Por origem mostra a conta** ("CAJ · Reginaldo (12 de 13)").
- **Divergência que chegou ≠ reentrega** (`nexAbrirSuspeitas`): linha com `data-dvid` quando `dvAcha(ped,nf)` encontra divergência aberta; sem motivo/motorista, com checkbox "Dar baixa"; ao confirmar, `st='resolvida'` + `res.obs` com o romaneio que trouxe o volume. O handler antigo `tr[data-dvav-id]` (linha ~10289) pulava direto para "Voltou como reentrega" e quebrava com null — agora ignora `data-dvid` e tem guarda de null.

## v10.1.4 (16/11/2026)
- **Conta fiel do dia** (`gsContar`, `gsDvDoDia`, `gsPctOk/gsPctDv/gsPctConf`, `gsBarras2`): regra do Tiago — nota marcada à mão conta (gera bipe) e **nota com divergência daquele dia conta como conferida**, saindo em **laranja** (`#F59F00`) na barra do romaneio. `gsFotoMontar` (hoje) e `gsFotoDeDiaPassado` usam o mesmo contador, então painel e histórico não divergem. Campos novos da foto: `dn`, `dvv`, `pctOk`, `pctDv`.
- **Espaço** (`gsBipesAntigos`, `gsEnxugarBipes`): dia com foto perde os bipes crus do aparelho (ficam em `hs_bipagens`). Botão no painel 💾 e faxina automática 20s depois de entrar. O aparelho dele estava com 85% de 9,5 MB, metade só de bipes — é a causa provável do sumiço das divergências.
- **Baixa no bipe** (`dvBotaoBaixa`, `dvBaixaPeloBipe`, `#op-dvacao`) e **aviso para quem abriu** (`dvAvisarDono`, `dvMeusAvisos`, campo sincronizado `dvAvisos`, entra no sino por `nexAvisos`).
- **Limpeza do histórico** (`corEraDv`, `corEraDvCsv`, `corTirarEraDv`, bloco na Correção): tira as reentregas com motivo "ERA DIVERGENCIA…"/"DIVERGENCIA #…", baixando a planilha antes. Atenção: `N()` remove o `#`, então o regex casa com o número direto.

## v10.1.5 / v10.1.6 (16/11/2026) — perda de dados, causa e trava
**Apuração (backup do robô de 15/11):** divergências de 13/11 estavam íntegras na nuvem (13 chaves `dv:`), era a cópia do aparelho que estava vazia. `s:agendamentos` tinha 4 itens com última gravação em 11/11 — o que foi cadastrado depois **nunca chegou à nuvem**. Aparelho dele estava com 85% de 9,5 MB.
**Causa raiz:** `Store.salvar` engolia o erro de cota com um toast de 3s e o app seguia como se tivesse gravado; a sincronização esperava 6s e podia nunca acontecer.
**Travas novas:**
- `Store.salvar` (reescrito): falhou → `gsEnxugarBipes` libera espaço → tenta de novo → se ainda falhar, `nuvSinc()` na hora e faixa fixa `#grav-falha` até gravar. Nunca chamar UI interativa nesse caminho (um `xmlArquivar` ali quebrou o teste da DANFE).
- `nuvSujo`/`pendFaixa`/`#pend-aviso`: o app sabe que há coisa para subir; tenta a cada 30s, sobe em `visibilitychange`/`pagehide` e trava o `beforeunload`.
- `nuvJa()` em `salvarAg`, `dvRegistrar` e `RE.gravar`: cadastro crítico sobe na hora. Debounce de `nuvAgendar` caiu de 6s para 2,5s.
**Armadilha de teste:** `reDupVarrer` abre a pergunta "NF com dois motivos" assim que não há outro `.fundo`; ela rouba o `.fundo .modal` de outros testes. Nos testes, limpar `.fundo` antes e escolher o modal pelo conteúdo.

## v10.1.7 (16/11/2026)
- **`hs_fotos`** (migração `sql/migracoes/2026-11-16-001-fotos-do-dia.sql`): uma linha por dia com a foto da conferência; update permitido, delete bloqueado por trigger, RLS por `hs_eh_ativo()`. App: `gsFotoNuvemGravar` (debounce de 60s por dia), `gsFotoNuvemLer`, `gsFotoNuvemDias`; `gsGarantirFoto` tenta aparelho → tabela → remontar do banco de romaneios.
- **Espaço da equipe**: `ESPE.alto` de 85 para 75 (85 já era tarde — nessa altura o aparelho perde gravação) e quadro no Mural, só admin, listando quem está acima.
- **Cópia da semana**: `semBkFalta()` cobra a partir de sexta até alguém baixar; `semSegunda()` define a semana; `bkBaixar` marca. Aparece no Mural e no sino.

## v10.1.8 (16/11/2026)
- **Volume não derruba mais a porcentagem**: em `gsContar`, volume lido a menos só conta como falta quando `opPorVol()` está ligado (conferência caixa a caixa). A regra do Tiago é "um bipe confere a nota inteira" — era por isso que um dia 100% aparecia como "350 de 1.801 volumes (19%)".
- `gsGarantirFoto(dia, refazer)`: com `refazer`, remonta e sobrescreve a foto (o "Remontar o histórico" passa `true`), e antes de tudo roda `integConferir(false)` para trazer as divergências que faltam no aparelho.
- Cartão do dia avisa quando o aparelho está **sem as divergências daquele dia** (`.gs-semdv`) e oferece `[data-gs-puxardv]` para baixar e refazer a conta na hora. Sem as divergências carregadas, nota apontada como falta aparece como "não entrou" e a conta cai.

## v10.1.9 (16/11/2026)
- **Abertura não se pula**: saíram o `click`/`keydown` que chamavam `sair()` e a dica `.hc-pular` (com o CSS dela). Só o `setTimeout(sair,5600)` continua. Junto com a máscara da v10.1.0, ninguém vê tela antes da hora.

## v10.2.0 (16/11/2026)
- **`gsDvDoDia` vale para qualquer divergência da nota**, não só a aberta naquele dia: a falta costuma ser registrada depois (ou no dia em que a caixa apareceu). Era por isso que as notas do 13/11 continuavam como "não entraram" mesmo com as divergências na tela.
- **Fechar a conta à mão** (`gsAjLer`, `gsAjK`, `gsAjMarcar`, campo sincronizado `gsAjuste`): na lista "o que não entrou", cada nota tem "✔ conferida" e "⚠ divergência". Só Admin/Líder/Supervisor. Grava `por` e `em`, `gsContar` respeita, e o PDF escreve "N nota(s) fechada(s) manualmente por Fulano".
- **Armadilha paga**: inserir CSS com `\n` dentro de uma string entre aspas simples quebra o script inteiro (o app não carrega e os testes somem com "hojeISO is not defined"). **Rodar sempre `node --check` no script extraído antes de publicar.**

## v10.2.1 (16/11/2026) — o denominador do dia
O print do dia 13/11 às 07:59 mostrava **288 de 288 (100%)** com a faixa "Simulação ligada por Tiago Souza: 12 nota(s) tirada(s) da conta". A remontagem dava 290 de 300 porque a simulação já estava desligada quando ela rodou — `opForaFiltro` só enxerga o estado de agora.
- `gsContar(roms,lidosDe,dvm,aj,foraAntes)`: nota fora da conta (Simulação, `nexS().fora`, ou marcada à mão com `m:'fora'`) **não entra em `tn`**, e as chaves saem em `c.fora`.
- A foto grava `fora:[...]`; a remontagem seguinte recebe essa lista, então **o número de um dia fechado não muda depois**, mesmo que a simulação mude.
- Terceiro botão na lista "o que não entrou": **✖ não conta** (além de ✔ conferida e ⚠ divergência). Cartão e PDF dizem quantas notas saíram da conta.

## v10.2.2 / v10.2.3 (16/11/2026)
- **`GS_REGRA`** carimba a regra de contagem dentro da foto (`v`). O painel detecta foto feita com regra antiga e **refaz sozinho** ao abrir o dia (`gsRefeitas` evita laço). Mudou a regra de contagem? Suba o `GS_REGRA`.
- **`gsFecharDia(dia,bt)`**: botão "✔ Fechar o dia em 100%" no cartão. Marca o que sobrou como `m:'fora'` (sai da conta), com `por`/`em`, e remonta. É o equivalente registrado do que a Simulação fazia na hora.
- **`nexLimparReent(romId)`** + chip virou botão `[data-nx-limpare]`: desmarca todas as reentregas detectadas daquele romaneio, tira do `RE` as linhas lançadas pelo app (`origem` nex/automatica — a lançada à mão fica) e **baixa a planilha antes** de apagar. Só Admin/Líder/Supervisor.

## v10.2.4 (16/11/2026) — Parte 2 no ar: Divergências e Avarias em duas colunas
O bloco `du*` existia desde a v10 mas **ninguém chamava**: as abas seguiam na tabela antiga, `AV_ST`
não estava definido (o cartão quebrava), não havia CSS `.du-*` e o cartão não tinha como resolver.
Tudo entrou num bloco único no fim do `index.html` (depois de todas as definições, pela armadilha do wrapper).
- **Ligação**: `dvRenderLista`/`avRenderLista` viraram wrappers que chamam `duColunas(false/true)`; se der
  erro caem na tabela antiga (`try/catch`) — por isso a tabela **não** foi apagada. `#dv-filtro`/`#av-filtro`
  tiveram o `oninput` **reamarrado** (guardavam a referência da função antiga, feita no init) e agora com
  espera de 180 ms: antes redesenhavam os dois lados inteiros, com `<img>` em base64, a cada tecla.
- **`duColunas` reescrito** para respeitar os quadrados de cima: `abertas` → só Pendentes, `resolvida` →
  só Solucionadas, `apareceu` → só as que voltaram, `todas` → as duas. Os filtros nascem em `todas`.
- **`AV_ST`**: `aguardando` (vermelho), `tratativa` (#F59F00), `resolvido` (verde). Gravados em
  `d.avst`/`d.avstPor`/`d.avstEm` pelo botão 🔁 Status, com linha no `hist`.
- **Cartão** (wrapper de `duCard`): ✅ Dar baixa / ↩️ Reabrir e 📲 WhatsApp; o ✏️ Editar passou a usar
  `data-dv="editar"`/`data-av="editar"`, que o handler do container já tratava. Voltaram o "quanto
  falta/sobrou" e o aviso de **falta maior que o total**. Na avaria o Tipo mostra o subtipo (`d.sub`).
- **Volumes avariados**: grade `volGradeHtml(tot,sel,'acx')`; grava `d.vols` e `d.tot`. A janela e o
  `avRegistrar` conversam por um objeto `grade` que o registrar **consome e limpa** no ato.
- **WhatsApp** (`textoDaOcorrencia`/`enviarNoZap`): o `window.open` acontece **antes de qualquer await** —
  depois de um `await` o navegador não reconhece mais o toque e o bloqueador de pop-up barra a janela.
- **Segurança — `fotoSegura()`** (definida antes do `const DV_COR`): `src="${d.foto}"` entrava cru em 4
  pontos. Como qualquer usuário ativo pode dar `update` no `hs_sync`, uma foto gravada como
  `x" onerror="..."` virava script rodando na tela de todo mundo (e a sessão mora no localStorage).
  Agora só passa `data:image/...;base64` ou `https://`. Tem teste que tenta injetar de verdade.
- **Armadilha nova**: `innerText` respeita `text-transform` — `.du-l small` é uppercase, então teste que
  procura rótulo de cartão precisa de `/i` ou procurar só o valor.
- **Armadilha nova**: testes antigos liam `#dv-lista .op-tab tbody tr`; com cartão isso é `null`.
- **Pendências apontadas na auditoria e não mexidas** (precisam do "pode" dele):
  1. foto de avaria em base64 dentro do `S` → `localStorage`; ~70–120 KB cada, mesma cota que estourou
     em 16/11. Mandar para `hs_fotos`/Storage e guardar só o ponteiro.
  2. `S.cargos` viaja pelo `hs_sync`, onde qualquer usuário ativo pode dar update → cargo é controle de
     tela, não de segurança. O que protege de verdade é `hs_eh_admin()` no banco.
  3. última gravação vence, sem aviso, em `duStatus`/`duMudarDia`/`dvRegistrar`.
  4. `dvCidade()` é função de leitura que grava (`dvCidade.mudou` → `salvar()`).

## v10.2.5 (16/11/2026) — publicada juntando duas conversas
Duas conversas publicaram no mesmo dia: uma com a Parte 2 (duas colunas) e outra com o relatório. O push foi recusado, o merge juntou as duas (só `version.json` conflitou), a sintaxe foi checada e a suíte passou. **A partir daqui ficou combinado: uma conversa só mexe no app.**
- **`gsTabDv(dia)`**: as divergências do dia saem detalhadas no PDF do Painel de Gestão, com as mesmas colunas do Excel da aba Divergências — Nº, situação, tipo, pedido, NF, cliente, cidade, volumes (`qtd` de `tot`), caixas que faltaram (`volLista(d.falt,d.tot)`), remetente, observação, quem registrou, onde apareceu (`d.apareceu.rom`) e a baixa (`d.res`). Tabela com `class="dvt"` e fonte 9,5pt para caber na folha deitada.

## v10.2.6 (16/11/2026, urgente) — a conta era de um só
Dois conferentes bipando: os bipes do Tiago entravam na porcentagem e os do Christian não.
**Causa:** os bipes dos outros só chegavam pelo canal ao vivo (`opAoVivo`). Se o canal caísse — tela bloqueada, internet oscilando, app aberto há horas — ninguém repuxava o dia, e a conta daquele aparelho ficava só com o que ele mesmo bipou. RLS não era o problema: `hs_bip_ler` libera para qualquer usuário ativo.
- **`opPuxarDia(aviso)`**: repuxa `hs_bipagens` do dia inteiro, junta com a fila local que ainda não subiu, regrava e redesenha (`opRender`, `ctMontar`, `gestorRender`, `gsFotoAgendar`). Roda a cada 45 s, no `visibilitychange`, no evento `online` e no botão **🔄 Atualizar a conta** (`[data-op-puxar]`, na Conferência total).
- **`opAoVivo` com status**: em `CLOSED`/`CHANNEL_ERROR`/`TIMED_OUT` remove o canal, zera `OP.canal`, religa e repuxa. O insert ao vivo agora também atualiza a Conferência total e agenda a foto do dia.
- A Conferência total mostra **quantos bipes daquele aparelho ainda não subiram** (fila local), em laranja.
