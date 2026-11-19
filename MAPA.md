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
4. Antes de publicar: `node testes/regressao.js` **e** `node testes/idb.js` (os dois têm que passar).
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
| `index.html` | **o app** (~2,3 MB desde a v10.6.00): HTML + CSS + JS. |
| `a/` | partes pesadas carregadas sob demanda pelo `HSA` (v10.6.00): `pdf.js`+`pdf-worker.js` (leitor de PDF), `ocr.js` (Tesseract + dados), `manual.js` (fotos do manual), `malha.js` (desenho das cidades). Mudou algo aqui? suba `V` no `HSA` **e** `PARTES` no `sw.js`. |
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

## v10.2.10 (16/11/2026) — o histórico do NexBip para de subir inteiro a cada bipe
**Quem mexe no app:** a conversa `session_01Gof5gngXKVm7DYTZnqnNpL` assumiu às 09:19 de 16/11,
a pedido do Tiago ("é seu, pode fazer"), depois da v10.2.9.

Medido no backup do robô de 15/11 (não foi chute): `s:nex` pesava **542 KB numa chave só** —
484 KB de `hist`, com 3.368 notas e 6.261 entradas, **todas dos últimos 30 dias** (podar não
resolvia: a chave nasceu em outubro e cresce ~500 KB por mês). Como `nuvSinc` sobe a chave
inteira quando qualquer coisa dentro dela muda, **cada bipe mandava 542 KB e todo aparelho
baixava 542 KB**. Era a lentidão do galpão, e piorava todo dia.

- **64 baldes** `nxh:<00..63>` (hist) e `nxp:<00..63>` (histPed). `nuvLocal` tira `hist`/`histPed`
  do `s:nex` e publica os baldes; `s:nex` sozinho cai para 0,8 KB.
- **Medido nos dados reais: 542,4 KB → 8,3 KB por bipe (65× menos).** Maior balde: 9,7 KB.
  A primeira sincronização depois de atualizar sobe 542 KB uma vez só.
- **`nxIdx` é FNV-1a com embaralhada no fim.** O `h*31` que tentei primeiro agrupava chave
  parecida: 500 notas em sequência caíam em 19 dos 64 baldes. **Trocar este hash depois
  reembaralha tudo** — ele é para ficar.
- **Regra de ouro do bloco: ao juntar, UNIÃO, nunca substituição.** O pior caso é entrada
  repetida, nunca entrada perdida. Duas entradas são a mesma aparição se tiverem o mesmo
  dia + romaneio + nota; quando a mesma aparição chega duas vezes, fica o campo preenchido.
- **`nuvAplicar('s:nex')` agora funde em vez de trocar o `S.nex` inteiro.** Era por aí que o
  histórico novo se perderia quando um aparelho desatualizado subisse o `s:nex` antigo com
  `hist` dentro. Aparelho velho recebendo `nxh:` apenas ignora (prefixo desconhecido).
- **`rbZerarTudo`** ganhou wrapper que marca os baldes como apagados no banco, senão outro
  aparelho devolvia tudo na sincronização seguinte. O botão `#rb-zerar` foi **reamarrado**
  (guardava a referência da função antiga).
- **Armadilha**: `nuvLocal` roda a cada sincronização e agora percorre as 3.368 chaves para
  montar os baldes. É barato, mas não ponha nada pesado ali dentro.

### Auditoria do mesmo dia — pendências que não são do app
- O **robô de backup** não copiava `hs_fotos`, `hs_versoes` nem `hs_auditoria`; as duas
  primeiras estão descritas aqui como permanentes e **não tinham cópia nenhuma**. Corrigido no
  repositório `Health_Search_Backups`: `hs_fotos` inteira, `hs_auditoria` 90 dias, `hs_versoes`
  em arquivo próprio e só o que é novo (com `estado.json` guardando o último id).
- O **Supabase caiu às 09:23 de 16/11** (HTTP 521). O robô agora tenta 4 vezes antes de desistir.
- **Custo não é tamanho**: o banco inteiro tem 4,2 MB num plano de 8 GB. Trocar de servidor não
  economizaria nada.

## v10.3.0 (16/11/2026) — Prioridade 1: os dados saem do localStorage para o IndexedDB
**Quem mexe no app:** a conversa `session_01Gof5gngXKVm7DYTZnqnNpL` (mesma dona desde a v10.2.10).
Primeira das 4 prioridades que o Tiago autorizou executar em sequência (IndexedDB → sync em tempo real →
UI de sync simplificada → backup mensal). Causa de fundo: o localStorage do navegador trava em ~9,5 MB
por site; foi esse teto que fez agendamento/divergência sumirem em 16/11. O IndexedDB cabe centenas de MB.

**Camada HSDB (`window.LS`), um bloco no TOPO do `index.html` (antes de todos os outros scripts):**
- `LS` tem a MESMA cara do localStorage (`getItem/setItem/removeItem/key/length`). Todas as 163 chamadas
  `localStorage.*` do app viraram `LS.*`. **Nunca mais escrever `localStorage.` no código do app** — use `LS.`.
- O que é DADO vai para o IndexedDB (regex `DADO` no bloco): `healthSearch.v1`, `op.*` (bipes/fila),
  `reentregas*`, `rotas`, `xlNomes`, `romBanco`, `nuvHash/nuvDesde/nuvBase/nuvBaseVal`, `copiaEm`,
  `xmlArquivo`, `geoPub/geoEdit`, `preAtualizacao`, `healthRomaneio.v1` (e `rt.`/`db.` reservados p/ o futuro).
- O que é config/flag pequeno (xlAuto, nuvem, perfilCache, aparelho, menus, vistos, datas, `espAlto`…)
  **continua no localStorage real** — é síncrono e sobrevive se o navegador limpar o IndexedDB.
- **NUNCA vão para o IndexedDB:** `hs-sessao`, `sb-*-auth-token`, `healthSearch.vivo` (sessão do Supabase
  e batida de coração entre abas — precisam do `storage` event nativo e do escopo do localStorage).
- Leitura é síncrona (cópia em memória carregada no início); gravação é assíncrona (uma transação por
  rodada, a mais nova vence). `LS.assentar()` resolve quando tudo que foi gravado está no disco.
- **Migração automática e segura (1 vez):** copia o localStorage → IndexedDB, **relê do IndexedDB e
  confere letra por letra**, e só então apaga do localStorage. Se qualquer coisa falhar, NADA é apagado e
  o app segue no localStorage (`LS.diag.modo==='ls'`). Marca em `localStorage['healthSearch.idb']`.
- **Regra de ouro (igual ao s:nex):** ao reencontrar a mesma chave de bipes no localStorage depois de
  migrar (aba velha), **UNIÃO pelo `local_id`**, nunca substituição. O resto vira `sobras` (cópia de
  segurança no IndexedDB), nunca apaga.
- **Boot travado em `await window.LS.pronto`** (primeira linha do IIFE de início): o `Store.init` só lê
  os dados depois que a memória está carregada. Se o IndexedDB não abrir num aparelho que JÁ migrou, aparece
  uma tela "tentando de novo" (não inicia com dados vazios, que apagariam a nuvem) com escape manual.
- **Painel do 💾**: `espLim()`/`espIDB()` — no modo idb mostra a capacidade real (`navigator.storage.estimate`),
  então a porcentagem fica perto de 0 e some o susto do "navegador para de gravar a 100%".
- **Cross-tab**: como o `storage` event nativo não dispara para o IndexedDB, o HSDB usa `BroadcastChannel`
  e re-dispara um `StorageEvent` sintético para as chaves que mudaram — o handler de `window.'storage'` do
  app (linha ~6750) continua funcionando sem mudança.
- **Apagar o aparelho** (`blqApagarAparelho`, usuário bloqueado): chama `LS.apagarTudo()` além de limpar o
  localStorage e deletar os bancos IndexedDB.

**Testes:** `testes/regressao.js` roda forçando o modo localStorage (esconde o `indexedDB` antes do app
carregar) — prova que a troca para `LS` é transparente. `testes/idb.js` (novo) sobe um servidor local e
testa o IndexedDB de verdade: migração sem perda, persistência após recarregar, união entre abas, sessão
intacta, falha de gravação virando erro (e recuperação), apagar-tudo. **Os dois têm que passar.**

**Armadilhas novas:**
- **O Chromium NÃO dá IndexedDB em `file://`** de forma confiável — por isso o teste do IDB usa http://127.0.0.1.
- **Ler tudo para a memória no início** é O(tamanho dos dados). Hoje é barato (poucos MB, com faxina
  automática de bipes/XML). Se um dia crescer para centenas de MB, trocar por leitura preguiçosa por chave
  com índice — mas aí perde a API síncrona do localStorage. Fica anotado como melhoria futura.
- Config pequena (nuvem, perfilCache) ficou de propósito no localStorage: se o navegador limpar o IndexedDB,
  o app ainda acha o banco e baixa tudo de novo depois do login.

## v10.4.0 (16/11/2026) — Prioridade 2: o canal do ping religa sozinho (tempo real de verdade)
**Quem mexe no app:** `session_01Gof5gngXKVm7DYTZnqnNpL`. Segunda das 4 prioridades.

Investigação primeiro (a maior parte da Prioridade 2 já existia): bipe chega ao vivo pelo canal
`hs-bipagens` (+`opPuxarDia` de 45s, v10.2.6); divergência/reentrega/ajuste sobem pelo `hs_sync` e o
`nuvSinc` dispara `nuvPing()` (broadcast `mudou` no canal `hs-sync-ping`) quando sobe algo — os outros
aparelhos puxam em ~300ms. O `online`/`nuvJa` já mandam na hora quando a internet volta.

**O buraco real:** o canal `hs-sync-ping` (`NUV.canal`) **não tinha reconexão** — ao contrário do
`OP.canal`, que ganhou religação na v10.2.6. Se caísse (tela bloqueada, internet oscilando, app aberto
há horas), `NUV.aoVivo` virava falso e nunca voltava: o aparelho parava de avisar e de receber avisos ao
vivo, caindo no poll de 5 min, calado.

**Conserto (espelha o `opAoVivo` da v10.2.6):** `nuvAoVivo()` virou função reconectável (antes era um IIFE):
no `subscribe`, em `CLOSED`/`CHANNEL_ERROR`/`TIMED_OUT` remove o canal e religa em 2s; ao voltar a
`SUBSCRIBED` (reconexão), puxa com `nuvSinc()` o que ficou para trás (`NUV.jaLigou` evita puxar na 1ª
conexão, que o `Store.init` já trouxe). Vigia de 45s religa se o estado for `closed`/`errored`; `online` e
`visibilitychange` também religam. O guard no topo (`state==='joined'||'joining'` → sai) evita canal dobrado.

**Não dá para testar daqui:** o comportamento ao vivo precisa de dois aparelhos com Supabase real (daqui a
nuvem é cortada). O que foi testado: sintaxe, regressão (lógica intacta) e idb. O poll de 5 min continua de
rede de segurança, então o pior caso de um bug aqui é voltar ao atraso de antes, nunca perder dado.

## v10.5.0 (16/11/2026) — Prioridade 3: um status de sync, 3 cores
`nuvStatus()` reescrito: uma bolinha ● em 3 estados — vermelho (erro/algo não gravou, toque),
amarelo (salvando / falta subir / sem internet, o app resolve), verde (salvo; ⚡ quando ao vivo).
Clique = `nuvSinc()` na hora. Não mexi nos handlers do painel (7991/8064/8155 montam um painel só em
camadas) nem no chip 💾 (espaço, outra coisa). Só o indicador ficou direto.

## v10.6.00 (17/11/2026) — numeração nova e o app emagreceu
**Regra de versão (dita pelo Tiago):** a partir daqui é `10.6.NN` — só os dois últimos dígitos sobem
(10.6.01, 10.6.02…). O número do meio só muda quando ele pedir.
- **`HSA` (bloco logo depois do HSDB)**: leitor de PDF, OCR, fotos do manual e malha saíram do `index.html`
  (9,4 MB → 2,3 MB) para a pasta `a/`. Cada arquivo chama `HSA.poe(id,tipo,conteudo)`, que recria o mesmo
  `<script id=...>` de antes — por isso `OCR.txt()`, `malha()` e o manual quase não mudaram.
  `HSA.pdf()` (substituiu todo `pdfjsLib` solto), `HSA.ocr()` (dentro de `OCR.iniciar`), `HSA.manual()`,
  `HSA.malha()` (chamado 3 s depois do `load`; `malha()` devolve vazio e redesenha quando chega).
  Carrega por `<script src>`, que funciona até em `file://` (os testes rodam assim).
- **`sw.js`**: pasta `a/` vai para o cache `hs-partes-vN`, que **não** é apagado na troca de versão
  (pega do aparelho, sem rede). `HSA.aquecer()` baixa tudo 20 s depois de abrir, para funcionar sem internet.
- **Arquivo do WhatsApp (`gerarPacote`)**: `HSA.embutir(doc)` põe o leitor de PDF e a malha dentro do arquivo.
- **`testes/partes.js`** (novo, roda junto): PDF real, OCR real, manual com fotos, malha, cache do SW e
  abertura **sem internet**.
- `sql/` antigos foram para `sql/historico/` (só registro).
- **Endereço oficial: GitHub Pages.** A Vercel é cópia sobrando — cada endereço guarda dados separados no aparelho.

## v10.6.01 (17/11/2026) — cortes pedidos pelo Tiago (código apagado, conceito guardado aqui)
Regra dele: "apagar completamente mas deixar na memória o conceito quando formos remontar um dia".
**Os dados de todos eles continuam na nuvem e no aparelho** (os campos seguem em `NUV_CAMPOS`), só não
são mais usados nem alterados. O código antigo está no histórico do git (commit da v10.6.00 para trás).

| módulo | o que fazia | onde mora o dado |
|---|---|---|
| **Cérebro do BIT** (`cer*`, v8.6.0) | aprendia sozinho com cada bipe: formato de QR (`C.qr` por assinatura `cerSig`: números→N{tam}, letras→a), posição do número em cada modelo de etiqueta (`C.mod[chave].pos` com texto antes + altura relativa), trocas de letra por dígito (`C.troca`), apelido de cliente (`C.ali`), vínculos fora→nota (`C.vinc`), dúvidas que o admin respondia (`C.duv`) e instruções "sempre…" (`C.evaNotas`). Resetar fazia backup `bkp:cer:*`. | `S.cerebro` (`s:cerebro`) |
| **Ensinar o BIT** (`evaEnsino*`) | admin cadastrava regras e pares pergunta→resposta (com foto); o BIT respondia pelo fato mais parecido | `S.evaEnsino` (admin) |
| **Treino por foto** (`fot*`, `etqDados`) | arrastar fotos de etiqueta na aba do BIT: lia todos os campos, admin aprovava (ensinava o Cérebro) ou lançava a caixa como fora do romaneio | — |
| **Falar com o ADM** (`ch*`) | chamados (sugestão, bug, dúvida) com conversa, status Aberto/Em análise/Feito/Recusado, aviso de resposta e badge | tabela `hs_chamados` (intacta) e `S.chamados` |
| **Relatório Minas** (`rd*`) | XMLs do romaneio "ROMANEIO - LKR X AQA" → planilha/PDF só com destinos MG + cidades de SP da rota (`RD_SP`), ranking das cidades mais atendidas | `S.rdXml`, `S.rdHist` |
| **Avarias** (`av*`, `AV_ST`) | aba própria: registro pela Busca/bipe com foto, volumes avariados (grade), 3 status (aguardando/tratativa/resolvido), solução (ressalva, devolvida, reposta, descartada, reentrega) | dentro de `S.divergencias` com `cat:'av'` — `dvSo()` esconde |
| **Registro** (`rg*`) | foto de Recebimento (chegada) / Expedição (saída) de carreta + formulário (motorista, CPF, placas, romaneios, paletes, lacre) → WhatsApp | `S.registros` |
| **Rotas** (`rota*`, `rot*`) | folha de rota do dia em PDF (placa/motorista/cidades por veículo, "CARRO 10" = motorista), publicada por admin ou Roteirizador (papel por usuário com gravação confirmada em `s:rotMarcas`), histórico por dia | `S.rotas`, `S.roteirizadores`, `S.rotMarcas` |

**Ficou (não é aprendizado):** `etqPorCliente` — regra fixa: etiqueta cujo número não achou nada vira a nota do
romaneio de hoje se cliente+cidade baterem com UMA só. `evaEtqSug`/`ores*` (sugestão e "Resolver" de bipe fora) ficam,
sem gravar vínculo. `cpfFmt` (Cadastros) e a leitura de XML (`rdTexto`, `rdLerXml`, `rdN`…) ficaram porque a Operação usa.
**Teste novo:** `testes/abas.js` passa por todas as abas como admin e conferente e acusa qualquer erro de código.
**Bugs antigos achados pelo verificador (ESLint no-undef) e corrigidos:** `hora` não existia (cartão "✅ Resolvidos"
quebrava; agora é função global), `OCR` em vez de `HS_OCR` na chave da DANFE por texto (nunca funcionava em aparelho
sem leitor de código de barras — iPhone e computador), `nvAud` (não existe; auditoria é no banco), `geoDesenhar`→`desenharGeo`.
**Verificador:** ESLint 8 com `no-undef` sobre os scripts do index (ver v10.6.01 nesta conversa) — rodar depois de cortar código.

## v10.6.02 (17/11/2026) — Painel de Gestão refeito, (?), Via Minas, Mural e Salvar
- **Painel de Gestão** (bloco "Painel de Gestão refeito", fim do script principal): `gestorRender` virou UMA função;
  as 3 camadas antigas (mensal, cartão do dia, "ao vivo") e `gestorDados`/`gsSeletor` foram apagadas. A declaração
  `function gestorRender(){}` original ficou vazia de propósito (script em 'use strict': sem ela a atribuição quebra).
  `GS.per` (hoje/7/15/30, guardado em `healthSearch.gsPer`) vale para todos os quadros; `gsPerDias()`.
  `gsNotasUnicas()`: **conta nota, não bipe** (primeiro bipe da nota; `dup` e `fora` não contam). A foto do dia ganhou
  `ph` (por hora) e `pp` (por pessoa) — dia cujos bipes crus já foram apagados do aparelho usa isso.
  `reEhDivergencia(l)`: reentrega com motivo de divergência/avaria não entra no painel, no semanal nem no mensal.
  Saíram "Avarias por tipo" e a linha "Avarias" das ocorrências. Mensal sem "cidades mais atendidas" (era do Relatório Minas).
- **(?) de todas as telas**: o estilo inline tinha `font:700 14px/1 inherit` (inválido → o navegador jogava fora e o ?
  herdava a letra do título). Agora é a classe `.ajuda-q`. Mesmo erro corrigido nos chips de Cadastros (`font:600 12px inherit`).
- **Via Minas**: título, números e "Transferências" ocupam a largura toda; "Falta Chegar" começa na linha da lista (`grid-row:5`).
- **Mural**: só o cabeçalho; os quadros ficam escondidos por CSS (`.mural-in>:not(.mu-hero)`) e entra `murBussola()`
  (SVG: aro parado, agulha balançando — `@keyframes muAgulha`, respeita "reduzir movimento").
- **Salvar**: mesma função; teal + borda aqua, ícone de nuvem por `mask` no `::before` (texto "Salvar"/"Salvando…" sem emoji).
- **Testes**: `testes/abertura.js` acusa ~460–650 ms neste servidor **também na v10.5.14** — é o ambiente, não regressão.

## v10.6.03 (17/11/2026) — divergência NUNCA é reentrega + limpeza dos motivos
Pedido do Tiago, com o "pode" dele: apagar **só os motivos e as reentregas que eram divergência** (as outras ficam).
- **Janela única do administrador** (`reZerarJanela` → `reZerarAgora`): baixa a planilha `Backup reentregas e motivos
  AAAA-MM-DD.csv` (todas as reentregas, coluna "vai sair" e a lista de motivos) e **só então** apaga. "Agora não" adia
  para a próxima entrada. Depois abre `reMotivosJanela` (admin/líder/supervisor): não fecha sem pelo menos 1 motivo.
- **Travas para o apagado não voltar** (a junção de `re:` é UNIÃO e o `atuDevolver` devolve o que "sumiu"):
  `S.reTirados` (chave `nf|obs` → quando; sincronizado), filtro no `nuvAplicar('re:*')`, no `atuDevolver` e varredura
  `reVarrerTirados()` a cada entrada. Motivos agora em **`S.motivos2 {em,l}`** (vale o mais novo); `S.cadMotivos` virou
  espelho (`cadInit` copia de `motivos2`; `cadMudou` grava em `motivos2`). Sem `motivos2` tudo funciona como antes.
- **Portas fechadas:** `dvParaReentregas` (dar baixa na divergência lançava reentrega "DIVERGÊNCIA DV-… RESOLVIDA") foi
  apagada; o aviso "Reentregas detectadas" e a reentrega rápida da Busca não preenchem mais o motivo com a divergência
  nem marcam `d.reent`; `nexParaReentrega` recusa motivo de divergência (devolve `null`); digitar divergência na tabela
  é recusado na fase de captura. Regra única: `reEhDivergencia(l)` = /DIVERGENCIA|ERA DIVERG|AVARIA AV\W?\d/ em obs/motivo ("AVARIA" sozinho continua motivo normal).

## v10.6.04 (17/11/2026) — segurança e o fluxo "caixa d'água" sem goteira
- **Cargo protegido no banco**: migração `2026-11-17-001-cargos-so-admin.sql` põe `s:cargos` (e `s:zapGrupo`,
  `s:evaEnsino`, `s:evaVisual`, que o app já tratava como só-admin) em `hs_chave_admin`. A regra de escrita do
  `hs_sync` (blindagem v7.0.0) já usa essa função; a migração confere e falha se a regra não existir.
  No app, `NUV_SO_ADMIN` faz o não-admin nem tentar subir `s:cargos` (senão a bolinha ficava vermelha).
- **Recarregar seguro** (`hsRecarregar`, bloco HSDB): os 12 `location.reload()` esperam o IndexedDB confirmar
  (`LS.assentar`, máx. 4 s) e avisam o `beforeunload` (`__hsRecarregando`). Antes, "internet voltou → recarrega"
  podia levar o último bipe/registro que ainda estava sendo gravado.
- **Prazo no banco** (`hsFetchComPrazo`, 60 s, no `createClient` via `global.fetch`): rede "pendurada" deixava
  `opEnviando` (fila de bipes) e `NUV.rodando` (sincronização) presos para sempre.
- **Divergência mexida em dois aparelhos**: `nuvJuntar('dv:*')` continua com o estado mais novo, mas junta o
  **histórico** dos dois lados e avisa quando houve mexida simultânea.
- **Foto de avaria no aparelho**: deixou de ser problema — a aba Avarias saiu (v10.6.01) e o armazenamento é
  IndexedDB desde a v10.3.0 (centenas de MB). Nada novo grava foto em `S`.
- **Caixa d'água (revisado)**: bipe → fila no aparelho (IndexedDB) → `opFila` no `online`, a cada rodada e no
  `visibilitychange`; banco não duplica (`local_id` único + `ignoreDuplicates`). Cadastro → `nuvSujo` → `nuvSinc`
  no `online`/30 s/`visibilitychange`/`pagehide`; o que mudou é achado por hash (`NUV.h`, guardado), então até com o
  app fechado sem internet sobe na próxima abertura. Depois de subir: `nuvPing` + canais ao vivo com religação
  (v10.2.6/v10.4.0) e `opPuxarDia` de 45 s atualizam a porcentagem em todos.

## v10.6.05 (17/11/2026) — Manual em dia e varredura
- **Manual**: bloco "Manual em dia com a v10.6" no fim do script (roda depois de todos que montam o `MAN`):
  tira as seções Rotas e Resetar o BIT, reescreve os passos que citavam Avarias/Registro/Rotas/Relatório Minas/
  chamados/Cérebro/mural antigo e cria a seção "Painel de Gestão" (`gestao-v106`). Fotos novas de Mural,
  Divergências, Via Minas e Painel de Gestão; a de chamados saiu. **`HSA` ganhou versão por arquivo** (`VERS`):
  só `manual.js` subiu para `?v=2` — os outros 5 MB continuam guardados nos aparelhos.
- **Varredura**: apagados `gsTrocarOrigem`, `AV_TIPOS`, `AV_SOL`, `dvavNum`, `cadMotCPF`, `corujar`, `relEhSoftlog`
  (sem uso). ESLint (`no-undef`) limpo, salvo `conferirRomaneio` (protegido por `typeof`, de propósito).
- **Ainda não feito (item 2 do Tiago):** juntar os ~190 remendos (`{ const _x=f; f=function(){…} }`) módulo a módulo.
  Só o Painel de Gestão foi consolidado nesta rodada.

## v10.6.06 (17/11/2026) — BIT fora de vez, celular arrumado
- **BIT removido inteiro** (aba, boneco do canto, balões, chat, cumprimento, observação do dia, recados no NexBip,
  ensino/cérebro já tinham saído). Ficaram, porque não dependiam dele: leitura de etiqueta em várias passadas
  (mensagem agora é "Leitura em andamento…"), "Resolver" do NexBip (`evaEtqSug`/`ores*`, nome antigo mantido) e o
  conversor de XML (`xc*`) — o resumo dos XMLs agora abre numa janela própria (`xmlResumo`).
  **Armadilha paga:** blocos do BIT tinham regras de outros assuntos dentro (Salvar escondido com a câmera aberta,
  `#op-xml/#op-diag` escondidos no NexBip, passos do manual da câmera). Foram recuperadas num bloco próprio. Ao apagar
  bloco grande, comparar as linhas apagadas que NÃO citam o módulo (script de diff usado nesta versão).
- **Aba Ajuda removida**; o (?) de cada tela leva ao Manual. Manual sem as seções do BIT.
- **Celular (≤860 px)**: topo `[☰][status] · logo no centro (abre o Mural) · [💾 %][🔔]`; título da aba saiu do topo;
  número do sino preso no sino (regra antiga `#mb-bar #nx-sino{position:static}` era mais forte — usar `#mb-bar` no seletor).
  Menu aberto: só as abas desde o topo; trava a tela de trás (`html.mb-trava`).
- **Zoom**: só na Geolocalização (meta viewport muda no `irPara` + `touch-action:pan-x pan-y` + `gesturestart` no iPhone).
- **Mural**: bússola saiu; "Entrar no programa" (`#mural-x`) ocupa a linha toda no celular.

## v10.6.07 (17/11/2026) — notificações, atalhos, ✕ da divergência, manual em folhas, reentregas no celular
- **Sino**: `nexAvisos` filtra os dispensados (`healthSearch.avisosIgn`, chave = ação + texto; volta se o texto mudar
  ou depois de 24 h). `nexAbrirNotif` ganhou o ✕ em cada aviso. **Notificação do aparelho**: janela própria pede
  a permissão UMA vez (`healthSearch.notifPedido`; "Agora não" volta em 3 dias); aviso novo no sino vira
  notificação (`notifVarrer` a cada 30 s, `reg.showNotification`); `sw.js` abre o app no toque. Com o app FECHADO
  precisa Web Push (VAPID + função no Supabase) — ainda não feito. iPhone só com o app instalado (iOS 16.4+).
- **Atalhos configuráveis** (Ajustes → ⌨ Teclas de atalho, `ATALHO_ACOES`/`ATALHO_PADRAO`, por aparelho em
  `healthSearch.atalhos`). Os Ctrl+K e Ctrl+S fixos antigos saíram (agora vêm daqui). Teclas do navegador recusadas.
- **✕ Cancelar divergência** (`dvCancelar`): sem histórico; tira também o(s) bipe(s) da nota no dia e a marcação à mão
  (`gsAjuste`), e a nota volta para pendente. Banco: bipe só o admin apaga, ou o próprio nos 5 min (v8.3.0).
- **Manual em folhas** (só na tela) e foto nova do Mural (`manual.js` → `?v=3`).
- **Reentregas no celular**: cartão em duas colunas, rótulo pequeno em cima, ✕ no canto, "Reentrega nº".

## v10.6.08 (17/11/2026) — restos e decisão sobre os remendos
- Saíram restos do BIT/Avarias que apontavam para telas que não existem (`#eva-bt`, `#t-eva`, ramo `t-avarias`).
- **Remendos (item 2 do Tiago):** ficam ~218 em 98 funções. **Decisão:** não juntar as cadeias vivas às cegas —
  várias têm efeito de negócio escondido (ex.: o remendo do `muralAbrir` em 6166 chama `dvVarrer`, que marca
  divergência como "apareceu"). Plano: um módulo por rodada, com teste próprio antes/depois; NexBip (`opRender`,
  `opMostrar`, `opLerEtiqueta`) só com teste em aparelho real.

## v10.6.09 (17/11/2026) — remendos: o que foi feito e a medição que decide o resto
- **`nexAvisos`**: os 9 remendos viraram UMA função, na mesma ordem. Conferido com "foto" antes/depois
  (4 cenários, 33 avisos, saída idêntica). Linhas que usam `const` definidas depois (`bkAtrasado`, `foraLimite`)
  ficaram em `try` — antes do fim do carregamento a função não pode quebrar por TDZ.
- Saíram 3 remendos que não faziam nada (`irPara` repassando sem mudar, `rotas→buscar`).
- **Medição (300 notas, 250 bipes, PC):** `irPara` 0,3–6 ms, `opRender` 3,7 ms, `nexAvisos` 0,3 ms, `nexVarrer` 1,6 ms.
  Os remendos NÃO pesam na fluidez. Juntar o resto (`irPara` tem 24, quase todos presos a variáveis locais do seu
  bloco) só melhora organização e traz risco. **Decisão:** juntar só quando for mexer naquele módulo por outro
  motivo, sempre com "foto" antes/depois (modelo: `gold-avisos.js` desta conversa).

## v10.6.10 (18/11/2026) — correções dos prints do Tiago (uso real no iPhone)
- Janela automática de limpeza das reentregas / motivos novos **saiu** (voltava a cada login). Ele cadastra os
  motivos à mão em Reentregas. As travas (`S.reTirados`, `S.motivos2`) continuam.
- **Checklist**: motorista do Cadastro Agregado NÃO entra mais sozinho (`ckSincronizar` não cria linha). No celular,
  cada motorista é um cartão (rótulo vem do cabeçalho via `data-l`, porque a coluna de arrastar só existe para o admin);
  a cor do vencimento pinta o cartão inteiro.
- **Conferência total → Por romaneio** no celular: linha quebra, barra cabe na tela.
- **Buscar → Pesquisas recentes** no celular: termo em cima, resumo embaixo, ✕ à direita (hora escondida).
- **Notificações**: lista limpa com divisórias, ✕ redondo pequeno e centralizado.

## v10.6.11 (18/11/2026) — cartão da divergência
- Remendo final do `duCard` (bloco "Cartão da divergência"): lê os `.du-l` que o cartão já monta e reorganiza —
  cliente grande + cidade, blocos NF / Pedido / Quanto falta (vermelho; sobra em laranja) / Volumes, resto no rodapé.
  Só aparência; campo novo cai sozinho no rodapé. **Classes `dvc-*` próprias** — `.du-topo` já existia e quebrou o layout.

## v10.6.12 (18/11/2026) — Checklist legível no modo escuro
- `.ck-amarelo/.ck-laranja/.ck-vermelho td` usam cor clara de fundo (boa no modo claro); no escuro a letra branca
  sumia. Bloco "Checklist no modo escuro": no tema escuro o fundo vira um tom escuro da mesma cor, faixa forte na
  esquerda e a Situação escrita na cor do alerta. Modo claro intocado; no celular continua o cartão (v10.6.10).

## v10.6.13 (18/11/2026)
- Legenda do Checklist virou um quadro (`.ck-leg`): validade, cores com quadradinho e regras do rastreador em lista.

## v10.6.14 (18/11/2026) — GRAVE: nota em divergência ficava em "Faltando"
- Com a conferência caixa a caixa (`opPorVol`), marcar à mão "faltaram 2 de 15" deixava a nota "13 de 15" nas
  pendentes e segurava a %. Remendo final em `opPendentes`: nota com divergência aberta (ou `conferida`) sai das
  pendentes — mesma regra do `gsContar` (Painel). Índice de NF/pedido montado uma vez por chamada (bipagem igual: ~98 ms).
- Teste novo no `regressao.js` cobre os dois modos (nota e caixa a caixa).

## v10.6.15 (18/11/2026) — ✕ do bipe tira a nota inteira
- `oresGrupo`: para bipe conferido/duplicado, o grupo é TODAS as caixas da mesma NF (ou do pedido, se não tem NF) no dia.
  `oresApagar` confirma dizendo quantas caixas saem. Fora do romaneio continua agrupando pelo pedido, como antes.
  Banco: apagar bipe na nuvem continua só admin (ou o próprio nos 5 min).

## v10.6.16 (18/11/2026)
- `oresGrupo`: ✕ num bipe **duplicado** agrupa só os duplicados da nota (a conferida NUNCA sai junto); ✕ num conferido continua tirando a nota inteira. Teste no `regressao.js`.

## v10.6.17 (18/11/2026) — etiqueta MAFRA amarela (SITE M30/M39): achar pelo cliente
- **Fato apurado no backup do robô (17/11):** o "Pedido" grande da etiqueta MAFRA e o número do QR (ex.: 045865)
  NÃO são a NF nem o pedido do romaneio (Elaine/Poços de Caldas = NF 46568, sem pedido). Só o cliente casa.
  No dia 17 ela entrou pelo Cérebro (apelido de cliente) — que saiu na v10.6.01.
- Remendo final do `opLerEtiqueta` (bloco "Etiqueta sem número que bata"): só quando NENHUM número lido bate.
  `etqCandidatos(p)` compara palavras do cliente (sem LTDA/DE/DA…) + cidade nas notas do dia: 1 pendente → baixa;
  várias → janela `etqEscolher` (toque escolhe; "✕ Nenhuma" → `etqLancarFora` com cliente, cidade e pedido do QR);
  nenhuma → com NF legível segue o fora automático de antes; sem número e nome com ≥2 palavras → janela só com o ✕.
  `opCamTratar` passa os números do QR em `p.qr`. Com a janela aberta as leituras são ignoradas (`ETQC.aberto`).
- **Leitor de texto em foto inteira lê mal essas etiquetas** (testado com as 4 fotos do Tiago); na câmera ele recorta a
  etiqueta amarela e lê melhor, mas depende de chegar perto. Não deu para validar no aparelho real.

### v10.6.18 · Relatório de Divergências (Excel + PDF para a diretoria)
- O botão "Exportar Excel (CSV)" da aba Divergências virou **⬇ Relatório** (`dvrJanela`): escolhe período
  (tudo, 7 dias, 30 dias, mês, datas) e situação (todas, pendentes, abertas, apareceram, resolvidas).
- **Excel** (`dvrXLSX`, .xlsx de verdade): aba *Resumo* (números, % resolvidas, média de dias até resolver,
  pendentes há +7 dias, por tipo/remetente/cliente) e aba *Divergências* (cabeçalho fixo, filtro, situação
  colorida, dias em aberto, rodapé com página). Usa `RomExcel._i.zip/xesc/colL` (exportados do módulo do romaneio).
- **PDF** (`dvrHTML`/`dvrPDF`): janela de impressão A4 deitada com logo, cartões, barras e a tabela.
- Só lê: usa `dvSo()` (sem avarias antigas) e a cidade é buscada numa cópia — gerar relatório não grava nada.
- O clique é pego em captura no `document` antes do `onclick` antigo (que continua no código, sem uso).

### v10.6.19 · Etiqueta por cliente: origem no canto
- Em `etqEscolher`, cada opção mostra a origem do romaneio (`x.base` ou `r.base`) numa pílula no canto
  (`.etq-ori`) e uma faixa à esquerda, com a cor de `opCorBase` — a mesma da Conferência total.

### v10.6.20 · Grade "Quais caixas faltaram?" em laranja
- `.vol-cx.on[data-dcx]` (janela de divergência) e `[data-mcx]` (marcar à mão) usam `var(--ag)`.
  A grade da câmera (`data-cx`, marca as que CHEGARAM) continua verde.

### v10.6.21 · Caixas que faltaram escritas à mão
- Nota segregada (1/3, 2/3, 3/3, 1/2, 2/2) ou com caixa fracionada (1/1): botão **✍ Escrever as caixas à mão**
  na janela de divergência (aba Divergências e Busca), na marcação à mão (Conferência total) e no ✗ da câmera.
- `volEscrever(tot,ini)` abre a janela "caixa / total": Enter (ou ＋) anota, limpa e volta para o primeiro campo;
  "/" ou Enter no primeiro pula para o segundo; recusa 5/2 e mais caixas que a nota tem. No iPhone o teclado
  numérico não tem Enter: usa o ＋.
- Gravado em `d.faltM` (texto, ex. ["3/10","1/1"]); `d.falt` (grade) fica null. `dvCaixas(d)` mostra qualquer um dos
  dois (cartão, PDF do Painel, WhatsApp, relatório). `opConfFalta` aceita lista de texto. `dvRegistrar` (Busca)
  passou a guardar também as caixas da grade e o total da nota (antes perdia).
- Aparelho com versão antiga não conhece `faltM`, mas a quantidade e a observação ("faltaram as caixas …") vão iguais.

### v10.6.22 · Etiquetas fracionadas no NexBip
- QR do volume MAFRA: `12420164002109@0009@0013@739273` = código fixo · caixa · total DA SÉRIE · pedido.
  A primeira parte é igual em todas as etiquetas (não identifica a caixa). Pedido segregado tem várias séries
  (1/13…13/13 + 1/2, 2/2) e caixa fracionada pode repetir a etiqueta inteira (duas 1/1 iguais no mesmo pedido).
- Caixa = número + total da série: `opJaBipado(ped,nf,vol,tot,etq)` e `opLidosBips` (série principal = maior total
  conta pelo número como antes; as outras contam à parte). `opEtqB(b)` = bipe de etiqueta (não ":contado").
- Etiqueta IGUAL só pergunta (`opMesmaEtiqueta`) quando cabe outra série igual na nota ((cópias+1)×total ≤ volumes
  do romaneio) e ainda falta caixa. "Outra caixa" grava o bipe com tipo `…:outra` (conta sozinho; `opConferirOutro`
  não marca como duplicado). Câmera parada na mesma etiqueta continua sendo a mesma caixa.
- Sem coluna nova no banco: tudo vai em `vol`, `tot` e `tipo`, que já existem.
- Pallet de 8 dígitos (`100xxxxx`) reconhecido (`opEhPallet`): sozinho não vira bipe e é guardado no campo pallet.
- `opConfCompletar` não passa da conta quando há séries.

### v10.6.23 · Verificação em 2 etapas do admin DESLIGADA (fase de testes)
- Pedido do Tiago (18/11/2026): só ele e o Christian usam o app. `HS_2ETAPAS=false` (antes de `nvMfa`) pula a tela
  do código e libera as chaves de admin sem aal2. No banco, `sql/migracoes/2026-11-18-001-admin-sem-2etapas.sql`
  tirou o aal2 de `hs_eh_admin()`. O autenticador cadastrado no Supabase NÃO foi apagado.
- **Religar antes de abrir para mais gente:** `HS_2ETAPAS=true` + migração nova devolvendo
  `and coalesce(auth.jwt()->>'aal','') = 'aal2'` (texto em sql/historico/supabase-v7.1.0-auditoria-2etapas.sql).

### v10.6.24 · Prints de 18/11 (celular)
- Toast (`#toast`): arrastar para cima (ou tocar) fecha na hora — pointer events + `translate` (o CSS do celular
  usa `transform:none!important`, por isso não dá para animar por transform). Continua sumindo sozinho em 3,8 s.
- Checklist: `input[type=date]` com `appearance:none` + `min-width:0` (o iPhone dava largura mínima própria e saía do cartão).
- Cadastros: cada motorista (`.cad-m`) em cartão; formulário `.cad-add` com borda tracejada e "➕ Cadastrar novo".
- Usuários: `#nv-users .tb-cartao td` com rótulo em cima e `overflow-wrap:anywhere` (e-mail longo).
- Reentregas (celular): cartão com áreas (cliente grande, 📍cidade, caixinhas NF/Pedido/Qtd/Valor, motivo laranja);
  perecível = faixa laranja (`:has(option:checked:last-child)`). No computador: NF e valor em negrito.

### v10.6.25 · Varredura geral (lint + código morto + CSS morto + celular)
- **Bug:** Divergência → "Ou preencher à mão": a busca no **Banco de romaneios** gravava numa `const` (TypeError engolido
  pelo try) — nota que não estava nos romaneios carregados nunca preenchia. Virou `let`.
- `AJUDA_MAP` tinha `operacao` duas vezes (valia a 2ª — comportamento mantido); `linhas=linhas` tirado.
- Código morto removido: `cadBaseNome`, `geoJuntar3` (junção 3 vias aposentada na 9.19.13), `linhasDoAg`,
  `opNotaTemDv`, `rpNoop`, `somaVol`, flag `HS_ROTEIRIZACAO`, janela de limpeza das reentregas e de motivos
  obrigatórios (`reZerar*`, `reMotivosJanela/Obrigado/Csv` — o pop-up saiu na 10.6.10; as TRAVAS `reTirados`/`motivos2`
  continuam), capítulos do manual do BIT/Rotas que eram montados e tirados na hora, CSS do Rotas (`rt-*`, ~70 linhas,
  inclusive um `.rodape` global que deixava o rodapé da tela de boas-vindas com letra de 9px), `#eva-*`, `#ch-aviso`.
- Conferidos e OK: nenhum `localStorage.` direto (tudo pela camada LS); apagar o aparelho só com bloqueio confirmado
  pelo servidor; relógios periódicos custam <0,1 ms; service worker ok. Retiradas continua desligada de propósito.
- `testes/abas.js` agora passa também no tamanho de celular (390px).
- **Lição:** ao apagar um bloco por intervalo de linhas, conferir `git diff` linha a linha — o primeiro corte levou junto
  o bloco de conflito de divergências e a recusa de motivo na tabela; o teste de regressão pegou e foi restaurado.
- `testes/idb.js` cenário 5 usava a chave do estado do app (`healthSearch.v1`) e o salvamento automático às vezes gravava
  por cima no meio do teste (falha intermitente, não perda de dado). Agora usa `healthSearch.db.testeFalha`.

### v10.6.26 · Desbipar na Conferência total + chegada parcial da divergência
- Janela do romaneio (Conferência total, `opRomLista`): ✕ vermelho nas **Bipadas**, no lugar dos botões ✔/⚠ das Faltando.
  `opDesbipar(x)` pergunta (`simNao`: ✔ Sim verde / ✕ Não vermelho), apaga os bipes da nota (mesma regra do banco:
  admin qualquer; os outros só os próprios até 5 min — avisa o que ficou) e a marcação manual do dia (`gsAjuste`).
- Divergência da nota NUNCA é apagada no desbipar: continua na aba, mesma data. As chegadas de HOJE são desfeitas
  (`dvDesfazChegadas`: entradas do histórico com `chegou` ou "Chegaram N…") e a resolvida hoje reabre. Ganha
  `d.desbip={dia,em,por}`: enquanto a nota não for bipada de novo, `dvDesbipada()` faz o filtro de pendentes e o
  `gsDvDoDia` (Painel) ignorarem essa divergência — a nota volta a ser cobrada. Rebipou: volta ao normal sozinho.
- Chegada parcial: `dvChegou(d,n,onde)` — em "Reentregas detectadas" (campo "chegaram __ de N") e no "📦 Dar baixa agora"
  (`dvPerguntarChegou`, quando faltam 2+). Parcial = continua aberta com o resto + histórico + aviso a quem abriu.
- "Não é reentrega" desalinhado: o ✕ das notificações reaproveitava a classe `.nx-ign` (círculo de 34px) → agora
  `button.nx-ign`; a etiqueta `label.nx-ign` volta a ser quadradinho + texto na mesma linha.
- Estilos que saíram por engano no corte das Avarias (10.6.01) e ainda eram usados voltaram: `.dvav-leg` (legenda de
  cores), `.dvav-bar/.dvav-q` (quadrado Divergência da Busca), `.dvav-selo` (selo laranja), `.av-l`. Legenda sem "Avaria".

### v10.6.27 · O ✕ "não funcionava" na nota tirada da conta
- Caso real: NF 448310 (715 vol.) com a Simulação ligada. `opRomLista` punha em "Bipadas" tudo que não estava em
  Faltando — inclusive nota fora da conta (`opForaFiltro`: Simulação/Retiradas), que nunca foi bipada. O ✕ não tinha
  o que desfazer e mesmo assim dizia "cancelada". Agora: grupo "🚫 Fora da conta" sem ✕; `opDesbipar` sem bipe,
  sem marcação e sem divergência avisa e não faz nada; e NUNCA apaga a marcação `m:'fora'` do Painel (gsAjuste).

### v10.6.28 · ✕ do desbipar em tempo real
- `opApagarLote(bips,depoisLocal)`: tira da tela/aparelho na hora (otimista), redesenha a janela e só então apaga no
  servidor numa chamada (`delete().in('id',…).select('id')`); o que o servidor não apagou (regra dos 5 min) volta e avisa.
  Antes `opDesbipar` usava `opApagar` um a um (35 idas ao servidor + 35 redesenhos numa nota de 35 caixas).
