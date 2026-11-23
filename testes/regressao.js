// Teste automático do Health Search — roda antes de cada publicação: node testes/regressao.js
// Cobre os fluxos que já deram problema: bipagem caixa a caixa, mesma caixa parada, outro usuário,
// reentrega confirmada não volta, mesclagem entre aparelhos, atualização devolve o que sumiu, rotas, busca.
const {chromium}=require('playwright'); const path=require('path');
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{
  const ch44=()=>'35261112345678000199550010000000251000000025';
  const opKi=v=>String(v||'').replace(/\D/g,'').replace(/^0+(?=\d)/,''); const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}); const falhas=[]; const ok=(c,m)=>{ if(!c) falhas.push(m); };
  /* v10.3.0: a camada HSDB (IndexedDB) tem teste próprio em testes/idb.js. Esta suíte valida a LÓGICA do app
     pela camada LS no modo localStorage (o fallback real de produção, síncrono e determinístico). Para isso,
     escondemos o IndexedDB antes do app carregar — o LS cai no localStorage e os testes que escrevem direto
     no localStorage voltam a enxergar o que o app lê. */
  const nova=async()=>{ const p=await b.newPage(); const er=[]; p.on('pageerror',e=>er.push(e.message));
    await p.addInitScript(()=>{ try{ Object.defineProperty(window,'indexedDB',{configurable:true,get:()=>undefined}); }catch(e){ try{ window.indexedDB=undefined; }catch(e2){} } });
    await p.route(/^https?:\/\//,r=>r.abort()); await p.goto(URL); await p.waitForTimeout(1500); p._er=er; return p; };
  let p=await nova();
  const r=await p.evaluate(async()=>{ const out={}; const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
    S.romaneios=[{id:'a',numero:'0019486',arquivo:a,rows:[{nf:'731084',ped:'724486',vol:'3',dest:'A',cid:'LAVRAS',uf:'MG'}]}]; renderTudo(); irPara('operacao'); OP.dia=h; OP.bipes=[];
    const w=ms=>new Promise(x=>setTimeout(x,ms));
    for(let i=0;i<3;i++){ OP.camGap=600; opLer(['724486'],'camera'); await w(300); } out.parada=OP.bipes.length;
    for(let i=0;i<3;i++){ await w(1900); OP.camGap=1500; opLer(['724486'],'camera'); } out.trocando=OP.bipes.map(b=>b.status).join(',');
    OP.bipes=[{local_id:'x',dia:h,status:'ok',ped:'724486',nf:'731084',vol:1,tot:3,usuario:'Outro Usuario',criado_em:new Date(Date.now()-60000).toISOString()}]; opLer(['724486'],'leitor'); out.outro=!!document.getElementById('op-outra'); document.getElementById('op-outra')&&document.getElementById('op-outra').remove();
    const n=nexS(); n.reent={'731084':{d:h,rom:'a',status:'suspeita'}}; const D=RE.ler(); D.dias[h]=[{nf:'731084',obs:'FERIADO'}]; RE.gravar(); out.reentregaVolta=nexSuspeitas().length;
    const m=nuvJuntar('s:nex',{reent:{k:{d:h,status:'suspeita'}}},{reent:{k:{d:h,status:'confirmada'}}}); out.mescla=m.reent.k.status;
    executar('724486'); out.busca=/Está no romaneio/.test($('#resultado').innerText);
    /* soltar arquivo na tela (quebrou na 9.3.2) e abrir todas as telas do menu */
    out.soltar=false; const _imp=importar; importar=function(fs){ out.soltar=fs&&fs.length===1; }; irPara('romaneios');
    const dt=new DataTransfer(); dt.items.add(new File(['x'],'Romaneio - MESA 10-11.pdf',{type:'application/pdf'})); document.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true})); importar=_imp;
    out.telas=[]; for(const b of document.querySelectorAll('.nav [data-tela]')){ try{ irPara(b.dataset.tela); }catch(e){ out.telas.push(b.dataset.tela+': '+e.message); } }
    return out; });
  ok(r.parada===1,'câmera parada contou mais de 1 caixa'); ok(r.trocando==='dup,ok,ok,ok','troca de caixa: esperado 3 caixas e o 4º duplicado, veio '+r.trocando); ok(r.outro,'outro usuário: não perguntou "É outra caixa"');
  ok(r.reentregaVolta===0,'reentrega já lançada voltou para a janela'); ok(r.mescla==='confirmada','mesclagem voltou para suspeita'); ok(r.busca,'Buscar não achou o pedido'); ok(r.soltar,'soltar arquivo na aba Romaneios não importou'); ok(!r.telas.length,'tela do menu com erro: '+r.telas.join(' | '));
  /* 9.13.1: version.json tem que anunciar a mesma versão do app (já saiu descasado na 9.9.0 e na 9.11–9.13) e o Manual tem que citar a pausa de 2 s */
  { const vj=JSON.parse(require('fs').readFileSync(path.resolve(__dirname,'../version.json'),'utf8')).versao; const va=await p.evaluate(()=>HS_VERSAO); ok(vj===va,'version.json ('+vj+') diferente da versão do app ('+va+'): o aviso de nova versão não vai aparecer');
    ok(await p.evaluate(()=>MAN.some(x=>(x.passos||[]).some(q=>/Pausa entre bipes/.test(q[0])))),'Manual sem o passo da pausa entre bipes'); }
  /* 9.19.11: na câmera, o aviso do bipe e a faixa VOLUMES ficam no topo (o BIT ao lado tinha jogado o aviso para baixo do vídeo) */
  { const c=await p.evaluate(async()=>{ const f=document.createElement('div'); f.id='op-cam'; f.innerHTML='<video></video><div class="mira"></div><div class="msg"><b>x</b></div><div class="bar"></div>'; document.body.appendChild(f);
      opMostrar({status:'ok',titulo:'CONFERIDO',linha:'teste',_vt:3,_vk:3}); await new Promise(x=>setTimeout(x,300)); const m=f.querySelector('.msg').getBoundingClientRect().top, v=f.querySelector('.vtot').getBoundingClientRect().top; f.remove(); return {m,v,h:innerHeight}; });
    ok(c.m<c.h/3,'aviso do bipe na câmera saiu do topo (top='+c.m+')'); ok(c.v<c.h/2,'faixa VOLUMES na câmera saiu do topo (top='+c.v+')'); }
  /* 9.19.12: mapa do aparelho sem edição feita ali (cópia velha/fábrica) nunca vence nem encolhe o mapa publicado */
  { const g=await p.evaluate(()=>{ const pub=JSON.parse(JSON.stringify(S.geo)); pub.em='2026-11-11T08:22:37.481Z'; const velho=JSON.parse(JSON.stringify(pub)); velho.listas.forEach(l=>{ l.cidades=l.cidades.slice(0,Math.floor(l.cidades.length/2)); }); velho.em=new Date().toISOString();
      vsnBaseGravar('s:geo',pub); GEOE.limpar(); const sem=geoConta(nuvJuntar('s:geo',velho,pub)); localStorage.setItem(GEOE.ch,'{"em":"x"}'); const com=geoConta(nuvJuntar('s:geo',velho,pub)); GEOE.limpar(); return {pub:geoConta(pub),sem,com}; });
    ok(g.sem===g.pub,'mapa: cópia velha sem edição encolheu o publicado ('+g.sem+' de '+g.pub+')'); ok(g.com<g.pub,'mapa: edição de verdade (retirada de cidades) não foi respeitada na junção'); }
  /* 9.19.17: Checklist Agregados — a ordem arrastada fica salva e "Baixar a de hoje" sai em JPEG */
  { const ck=await p.evaluate(async()=>{
      S.checklist=[{id:'ckA',mot:'TESTE A',placa:'AAA-1A11',data:'2026-10-01',ativo:true},{id:'ckB',mot:'TESTE B',placa:'BBB-2B22',data:'2026-10-02',ativo:true}];
      const L=ckS(); const [mov]=L.splice(1,1); L.splice(0,0,mov); S.checklist=L; /* arrastou a 2ª linha para o topo */
      irPara('checklist'); const blob=await ckImagem('jpeg');
      return {ordem:ckS().map(x=>x.id).join(','),
        tela:[...document.querySelectorAll('#ck-tbody tr[data-ck-row]')].map(t=>t.dataset.ckRow).join(','), tipo:blob.type}; });
    ok(ck.ordem==='ckB,ckA','checklist: a ordem reordenada não ficou salva ('+ck.ordem+')');
    ok(ck.tela==='ckB,ckA','checklist: a tabela não desenhou na ordem salva ('+ck.tela+')');
    ok(ck.tipo==='image/jpeg','checklist: "Baixar a de hoje" não saiu em JPEG ('+ck.tipo+')'); }
  /* 9.20.0: a câmera para depois de cada bipe e o conferente responde ✓ (tudo certo) ou ✗ (quantos volumes chegaram → divergência) */
  { const c=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'c',numero:'0019486',arquivo:a,rows:[{nf:'731084',ped:'724486',vol:'3',dest:'CLIENTE TESTE',cid:'LAVRAS',uf:'MG'}]}]; S.divergencias=[]; S.opPorVolume=true;
      renderTudo(); irPara('operacao'); OP.dia=h; OP.bipes=[]; window.__cods=[]; OP.det=async()=>window.__cods.slice();
      await opCamAbrir(); const out={cam:!!document.querySelector('#op-cam')};
      window.__cods=['724486']; await w(2500);
      /* 9.20.1: barra de baixo sem encavalar (Desfazer dentro da barra e 💾 Salvar escondido) */
      out.barra=(()=>{ const d=document.querySelector('#op-cam #op-desf'), sv=document.getElementById('hs-salvar');
        return {naBarra:!!(d&&d.closest('.bar')), salvarOculto:!sv||getComputedStyle(sv).display==='none'}; })();
      out.bipes1=OP.bipes.length; out.espera=!!OP.espera; out.bts=[...document.querySelectorAll('#op-cam .op-conf .bts button')].map(x=>x.className).join(',');
      await w(2500); out.fantasma=OP.bipes.length; /* etiqueta parada na frente não pode bipar sozinha de novo */
      document.querySelector('#op-cam .op-conf .no').click(); await w(200);
      out.qtd=[...document.querySelectorAll('#op-cam .op-qt .vol-cx')].map(x=>x.textContent).join(',');
      document.querySelector('#op-cam .op-qt [data-cx="1"]').click(); await w(80);
      document.querySelector('#op-cam .op-qt [data-a="ok"]').click(); await w(300);
      const d=S.divergencias[0]||{}; out.dv=d.tipo+'/'+d.qtd;
      { const bb=OP.bipes.find(x=>x.ped==='724486')||{}; out.conf={conferido_por:bb.conferido_por||'',conferido_qt:bb.conferido_qt}; } out.esperaFim=!!OP.espera; out.vols=OP.bipes.filter(x=>x.ped==='724486').length;
      /* 9.20.1: nota de um volume só não abre a tela de conferência (o parar é o sinal de "tem mais de uma caixa") */
      S.romaneios[0].rows.push({nf:'731085',ped:'724487',vol:'1',dest:'UM VOLUME',cid:'LAVRAS',uf:'MG'}); renderTudo();
      window.__cods=[]; await w(1700); window.__cods=['724487']; await w(2500);
      out.um1={painel:!!document.querySelector('#op-cam .op-conf'),espera:!!OP.espera,bipado:OP.bipes.some(x=>x.ped==='724487')};
      opCamFechar(); S.divergencias=[]; S.opPorVolume=false; return out; });
    ok(c.barra&&c.barra.naBarra,'câmera: "Desfazer último" saiu de dentro da barra e volta a encavalar na Lanterna');
    ok(c.barra&&c.barra.salvarOculto,'câmera: o 💾 Salvar voltou a aparecer por cima do botão Fechar');
    ok(c.bipes1===1,'conferência do bipe: a câmera registrou '+c.bipes1+' bipe(s) em vez de 1');
    ok(c.espera===true,'conferência do bipe: a câmera não travou esperando a resposta');
    ok(c.bts==='no,sim','conferência do bipe: botões ✗ e ✓ não apareceram ('+c.bts+')');
    ok(c.fantasma===1,'bipe fantasma: a etiqueta parada na frente foi bipada de novo ('+c.fantasma+' bipes)');
    ok(c.qtd==='1/3,2/3,3/3','conferência do bipe: faltou a grade de caixas ('+c.qtd+')');
    ok(c.dv==='Falta de volume/2','conferência do bipe: divergência errada ('+c.dv+')');
    ok(c.conf&&c.conf.conferido_por&&c.conf.conferido_qt===1,'conferência do bipe: não gravou quem respondeu / quantos volumes contou ('+JSON.stringify(c.conf)+')');
    ok(c.vols===1,'conferência do bipe: chegou 1 de 3 e o app marcou '+c.vols+' volume(s) conferido(s)');
    ok(c.esperaFim===false,'conferência do bipe: a câmera não voltou a ler depois da resposta');
    ok(c.um1&&c.um1.bipado&&!c.um1.painel&&!c.um1.espera,'nota de 1 volume: abriu a tela de conferência em vez de seguir direto'); }
  /* 9.20.1: caixa já bipada por outro conferente tem que dar duplicado e dizer quem bipou */
  { const d=await p.evaluate(()=>{ const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'d',numero:'0019486',arquivo:a,rows:[{nf:'731084',ped:'724486',vol:'1',dest:'CLIENTE',cid:'LAVRAS',uf:'MG'}]}]; renderTudo(); irPara('operacao'); OP.dia=h;
      OP.bipes=[opDoBanco({local_id:'zz1',dia:h,status:'ok',ped:'724486',nf:'731084',vol:1,tot:1,usuario:'Christian Souza',criado_em:new Date(Date.now()-20000).toISOString()})];
      opLer(['724486'],'leitor'); const b=OP.bipes[0]; return {st:b.status,tit:(document.querySelector('#op-res')||{}).innerText||''}; });
    ok(d.st==='dup','caixa já bipada por outro conferente passou como '+d.st+' em vez de duplicado');
    ok(/Christian/.test(d.tit),'duplicado não disse quem já tinha bipado a caixa'); }
  /* 9.20.1: com mais de um romaneio de Cajamar, a origem vira o nome do motorista */
  { const o=await p.evaluate(()=>{ const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'c1',numero:'0235414',base:'CAJ',motorista:'ADRIEL DOS SANTOS',arquivo:a,rows:[{nf:'1',ped:'1',vol:'1',dest:'A',cid:'X'}]},
                   {id:'c2',numero:'0235415',base:'CAJ',motorista:'REGINALDO PEREIRA',arquivo:a,rows:[{nf:'2',ped:'2',vol:'1',dest:'B',cid:'X'}]},
                   {id:'d1',numero:'0019486',base:'DF',motorista:'JOAO',arquivo:a,rows:[{nf:'3',ped:'3',vol:'1',dest:'C',cid:'X'}]},
                   {id:'m1',numero:'0077001',base:'MESA',motorista:'CARLOS LIMA',arquivo:a,rows:[{nf:'4',ped:'4',vol:'1',dest:'D',cid:'X'}]},
                   {id:'m2',numero:'0077002',base:'MESA',motorista:'PEDRO ALVES',arquivo:a,rows:[{nf:'5',ped:'5',vol:'1',dest:'E',cid:'X'}]}];
      OP.bipes=[]; opRender(); return [...document.querySelectorAll('#op-romchips [data-op-rf]')].map(x=>x.innerText.replace(/\s+/g,' ').trim()).join(' | '); });
    ok(/Adriel/.test(o)&&/Reginaldo/.test(o)&&!/CAJ/.test(o),'origem com 2 romaneios de Cajamar não trocou CAJ pelo motorista ('+o+')');
    ok(/Carlos/.test(o)&&/Pedro/.test(o)&&!/MESA/.test(o),'origem com 2 romaneios da MESA não trocou pelo motorista ('+o+')');
    ok(/DF/.test(o)&&!/Joao/.test(o),'origem com 1 romaneio só deveria continuar sendo a sigla ('+o+')'); }
  /* 9.21.0: Cadastro Agregado manda na planilha do Checklist (rastreador sim · não · desativado) */
  { const k=await p.evaluate(()=>{ cadInit();
      S.cadMot=[{nome:'ADRIEL',alias:'',cpf:'111.222.333-44',tipo:'agregado',rast:'sim'},
                {nome:'BETO',alias:'',cpf:'',tipo:'agregado',rast:'desativado'},
                {nome:'CARLOS',alias:'',cpf:'',tipo:'agregado',rast:'nao'},
                {nome:'GIOVANNI',alias:'',cpf:'555.666.777-88',tipo:'transf'}];
      S.checklist=[{id:'k1',mot:'ADRIEL',placa:'ABC-1D23',data:hojeISO(),ativo:true},
                   {id:'k2',mot:'BETO',placa:'DEF-4G56',data:'2026-10-01',ativo:true},
                   {id:'k3',mot:'CARLOS',placa:'GHI-7J89',data:hojeISO(),ativo:true}];
      ckSincronizar(); irPara('checklist');
      return {todos:ckLista('todos').map(x=>x.mot).join(','),ativos:ckLista('ativos').map(x=>x.mot).join(','),
              des:ckLista('desativados').map(x=>x.mot).join(','),st:ckStatus(ckS().find(x=>x.mot==='BETO')).txt,
              novo:(()=>{ S.cadMot.push({nome:'NOVATO',alias:'',cpf:'',tipo:'agregado',rast:'sim'}); ckSincronizar(); return ckS().some(x=>x.mot==='NOVATO'); })(),
              cpf:((S.cadMot||[]).find(m=>m.nome===motCanon('GIOVANNI'))||{}).cpf||''}; });
    ok(k.todos==='ADRIEL,BETO','checklist: rastreador Não deveria tirar o motorista da planilha ('+k.todos+')');
    ok(k.ativos==='ADRIEL'&&k.des==='BETO','checklist: filtro de ativos/desativados errado ('+k.ativos+' | '+k.des+')');
    ok(k.st==='DESATIVADO','checklist: rastreador desativado não deixou a linha como DESATIVADO ('+k.st+')');
    ok(!k.novo,'checklist: cadastrar um agregado NÃO pode criar a linha dele (v10.6.10: só à mão)');
    ok(k.cpf==='555.666.777-88','registro: CPF do motorista de transferência não vem do cadastro'); }
  /* 9.21.1: a origem do romaneio sai do motorista cadastrado (troca de motorista da rota sem mexer no código) */
  { const o=await p.evaluate(()=>{ cadInit();
      S.cadMot=[{nome:'FELIPE',alias:'',cpf:'',tipo:'transf',base:'VIA MINAS'},
                {nome:'JULIANO',alias:'',cpf:'',tipo:'transf',base:'DF'},
                {nome:'REGINALDO',alias:'',cpf:'',tipo:'transf',base:'CAJ'}];
      const mk=(mot,baseCod,obs)=>{ const r={id:'r'+mot,numero:'1',motorista:mot,baseCod,observacoes:obs||'',rows:[]}; aplicarRegraBase(r); return r.base; };
      return [mk('FELIPE','001'),mk('JULIANO','001'),mk('REGINALDO','001'),mk('GIOVANNI PEREIRA','001'),mk('ZEZINHO','004')].join(','); });
    ok(o==='VIA MINAS,DF,CAJ,VIA MINAS,DF','origem pelo motorista cadastrado saiu errada ('+o+')'); }
  /* 9.22.0: motorista com duas origens (o código do romaneio desempata) e aviso de quem está fora do cadastro */
  { const m=await p.evaluate(()=>{ cadInit();
      S.cadMot=[{nome:'REGINALDO',alias:'',cpf:'',tipo:'transf',bases:['CAJ','DF'],base:'CAJ, DF'}];
      const mk=(mot,baseCod)=>{ const r={id:'r'+mot+baseCod,numero:'1',motorista:mot,baseCod,observacoes:'',rows:[]}; aplicarRegraBase(r); return r.base; };
      const duas=[mk('REGINALDO','001'),mk('REGINALDO','004')].join(',');
      S.romaneios=[{id:'a',numero:'0235414',base:'CAJ',motorista:'ADRIEL DOS SANTOS',arquivo:'x 12-11.pdf',rows:[]}];
      irPara('romaneios'); renderRomaneios(); const box=document.querySelector('#cad-faltam');
      const banner=!!(box&&!box.hidden); const tinha=cadFaltam().map(x=>x.nome).join(',');
      const bt=document.querySelector('[data-cad-add-mot]'); if(bt) bt.click();
      const novo=(S.cadMot||[]).find(x=>x.nome==='ADRIEL DOS SANTOS');
      const sumiu=!cadFaltam().some(x=>x.nome==='ADRIEL DOS SANTOS');
      return {duas,banner,tinha,sumiu,cadastrado:novo?novo.tipo+'/'+(novo.base||''):''}; });
    ok(m.duas==='CAJ,DF','motorista com duas origens: o código do romaneio não desempatou ('+m.duas+')');
    ok(m.banner&&m.tinha==='ADRIEL DOS SANTOS','aviso de motorista fora do Cadastro Agregado não apareceu ('+m.tinha+')');
    ok(m.cadastrado==='transf/CAJ','botão Cadastrar não cadastrou o motorista com a origem do romaneio ('+m.cadastrado+')');
    ok(m.sumiu,'motorista cadastrado continuou na lista de quem está fora do cadastro'); }
  /* 9.22.1: mapa que perdeu cidades volta ao publicado mesmo com a marca de edição; edição pequena é respeitada */
  { const g=await p.evaluate(()=>{ const pub=JSON.parse(JSON.stringify(S.geo));
      const tri=pub.listas.find(l=>!(l.cidades||[]).length&&l.tipo!=='base')||pub.listas[pub.listas.length-1];
      if(tri) tri.cidades=Array.from({length:60},(_,i)=>'C'+i);
      const pequeno=JSON.parse(JSON.stringify(S.geo)); pequeno.listas[0].cidades.splice(0,3);
      const grande=JSON.parse(JSON.stringify(S.geo)); grande.listas[0].cidades.push(...Array.from({length:40},(_,i)=>'X'+i));
      return {zerada:geoPerdeu(S.geo,pub),pouco:geoPerdeu(pequeno,S.geo),muito:geoPerdeu(S.geo,grande),
              botoes:(()=>{ try{ irPara('geo'); geoPubBarra(); }catch(e){} return !!document.getElementById('geo-voltar')&&!!document.getElementById('geo-diag'); })()}; });
    ok(g.zerada,'mapa: região inteira zerada aqui e cheia no publicado deveria contar como perda');
    ok(!g.pouco,'mapa: apagar 3 cidades à mão não pode contar como perda (é edição de verdade)');
    ok(g.muito,'mapa: 40 cidades a menos que o publicado deveria contar como perda');
    ok(g.botoes,'mapa: faltam os botões “Usar o mapa publicado” e “Diagnóstico”'); }
  /* 9.22.2: apagar linha do Checklist é definitivo (não volta pela sincronização nem pelo cadastro) */
  { const c=await p.evaluate(()=>{ cadInit();
      S.cadMot=[{nome:'GUSMAO',alias:'',cpf:'',tipo:'agregado',rast:'sim'}];
      S.checklist=[{id:'k1',mot:'GUSMAO',placa:'AAA-1A11',data:hojeISO(),ativo:true},{id:'k2',mot:'ANDRE',placa:'BBB-2B22',data:hojeISO(),ativo:true}];
      /* v10.5.9: a exclusao e feita pelo app (marca a LINHA pelo id, nao o nome),
         para que uma linha irma do mesmo motorista continue aparecendo. */
      S.ckApagados=[]; ckExcluir('k1');
      const apagado=ckS().map(x=>x.mot).join(',');
      S.checklist.push({id:'k1',mot:'GUSMAO',placa:'AAA-1A11',data:hojeISO(),ativo:true});
      const nuvem=ckS().map(x=>x.mot).join(',');
      ckSincronizar(); const cadastro=ckS().map(x=>x.mot).join(',');
      S.ckApagados=[]; S.checklist=[]; return {apagado,nuvem,cadastro}; });
    ok(c.apagado==='ANDRE','checklist: apagar a linha não tirou o motorista da planilha');
    ok(c.nuvem==='ANDRE','checklist: a linha apagada voltou pela sincronização');
    ok(c.cadastro==='ANDRE','checklist: a linha apagada foi recriada pelo Cadastro Agregado'); }
  /* 9.22.2: os motivos da reentrega aparecem e salvam dentro da tela de Reentregas */
  { const m=await p.evaluate(()=>{ S.cadMotivos=[]; irPara('reentregas'); reMotivosRender();
      const temForm=!!document.querySelector('#re-motivos #cad-mtv-f');
      S.cadMotivos=['FERIADO']; reMotivosRender();
      return {temForm,naTela:document.getElementById('re-motivos').innerHTML.includes('FERIADO')}; });
    ok(m.temForm,'reentregas: o quadro de motivos não montou (campo de cadastrar ausente)');
    ok(m.naTela,'reentregas: o motivo cadastrado não aparece na lista'); }
  /* 9.23.0: nota com divergência de volume — bipar abate o que chegou e resolve quando zera */
  { const d=await p.evaluate(()=>{ const h=hojeISO();
      S.divergencias=[{id:'d1',n:1,d:h,ped:'724486',nf:'731084',tipo:'Falta de volume',qtd:4,cli:'X',obs:'',st:'aberta',por:'t',em:new Date().toISOString(),hist:[]}];
      const b={ped:'724486',nf:'731084',tot:5,vol:1};
      const achou=!!opDvPend(b);
      opDvChegaram(b,S.divergencias[0],3); const meio=S.divergencias[0].qtd+'/'+(S.divergencias[0].st==='resolvida');
      opDvChegaram(b,S.divergencias[0],1); const fim=S.divergencias[0].qtd+'/'+(S.divergencias[0].st==='resolvida');
      S.divergencias=[]; return {achou,meio,fim}; });
    ok(d.achou,'divergência: o bipe não reconheceu que a nota tinha volume faltando');
    ok(d.meio==='1/false','divergência: faltavam 4, chegaram 3 — deveria sobrar 1 em aberto ('+d.meio+')');
    ok(d.fim==='0/true','divergência: chegando o último volume, deveria resolver sozinha ('+d.fim+')'); }
  /* 9.23.0: caixa de bipe de volta nas Divergências e ranking sem "NENHUM" */
  { const v=await p.evaluate(()=>{ irPara('divergencias');
      return {bip:!!document.getElementById('dv-bip')&&!!document.getElementById('dv-bip').offsetParent,
              sem:[rpSemMot('NENHUM'),rpSemMot('(SEM MOTORISTA)'),rpSemMot('ALEXANDRE')].join(',')}; });
    ok(v.bip,'divergências: a caixa de bipar a nota não está visível');
    ok(v.sem==='true,true,false','ranking: NENHUM / SEM MOTORISTA deveriam ficar fora e um nome de verdade dentro ('+v.sem+')'); }
  /* 9.23.1: Editar abre o formulário (ele vive dentro de "Ou preencher à mão") e traz o total da nota */
  { const e2=await p.evaluate(()=>{ S.divergencias=[{id:'d1',n:1,d:hojeISO(),ped:'',nf:'909958',tipo:'Falta de volume',qtd:1,tot:31,cli:'',obs:'faltavam 1 volume(s)',st:'aberta',por:'t',em:new Date().toISOString(),hist:[]}];
      renderTudo(); irPara('divergencias');
      const card=document.querySelector('#t-divergencias .du-c');
      const linha=(card?card.innerHTML:'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
      const colunas=[...document.querySelectorAll('#t-divergencias .du-col h3')].map(h=>h.textContent.replace(/\s+/g,' ').trim());
      document.querySelector('#t-divergencias [data-dv="editar"]').click();
      const f=document.getElementById('dv-form'), det=f.closest('details');
      const r={linha,colunas,aberto:!!(det&&det.open),qtd:document.getElementById('dv-qtd').value,tot:(document.getElementById('dv-tot')||{}).value,botao:document.getElementById('dv-ok').textContent};
      S.divergencias=[]; return r; });
    ok(/30 de 31/.test(e2.linha)&&/faltavam 1/.test(e2.linha),'divergência: o cartão deveria mostrar "30 de 31" (chegaram) e a observação ('+e2.linha.slice(0,120)+')');
    /* 10.2.4: a visão normal passou a ser duas colunas (Pendentes / Solucionadas) */
    ok(e2.colunas.length===2&&/Pendentes/.test(e2.colunas[0])&&/Solucionadas/.test(e2.colunas[1]),'divergências: as duas colunas não apareceram ('+e2.colunas.join(' | ')+')');
    ok(e2.aberto,'divergência: o Editar não abriu o formulário "Ou preencher à mão"');
    ok(e2.qtd==='1'&&e2.tot==='31'&&e2.botao==='Salvar alterações','divergência: o Editar não trouxe os dados para o formulário ('+JSON.stringify(e2)+')'); }
  /* 9.23.2: os botões do quadro de motivos funcionam dentro da tela de Reentregas */
  { const m2=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      S.cadMotivos=['FERADI','FERIADO','LOCAL FECHADO']; irPara('reentregas'); reMotivosRender();
      document.querySelector('#re-motivos [data-cad-mtv-del="0"]').click(); await w(150); const apagou=S.cadMotivos.join(',');
      document.querySelector('#re-motivos [data-cad-sobe="1"]').click(); await w(150); const subiu=S.cadMotivos.join(',');
      const inp=document.querySelector('#re-motivos [data-cad-mtv="0"]'); inp.value='LOCAL FECHADO 2'; inp.dispatchEvent(new Event('change',{bubbles:true})); await w(150);
      const editou=S.cadMotivos.join(','); const naTela=document.getElementById('re-motivos').innerHTML.includes('LOCAL FECHADO 2');
      S.cadMotivos=[]; return {apagou,subiu,editou,naTela}; });
    ok(m2.apagou==='FERIADO,LOCAL FECHADO','motivos: o botão Excluir não apagou ('+m2.apagou+')');
    ok(m2.subiu==='LOCAL FECHADO,FERIADO','motivos: o botão ▲ não mudou a ordem ('+m2.subiu+')');
    ok(m2.editou==='LOCAL FECHADO 2,FERIADO'&&m2.naTela,'motivos: editar o texto do motivo não salvou ('+m2.editou+')'); }
  /* 9.24.0: motivos da nota acrescentada viraram cadastro, e TODOS os botões do quadro funcionam */
  { const fm=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      S.foraMotivos=null; irPara('romaneios'); renderRomaneios(); const ini=foraMot().length;
      const f=document.getElementById('fm-add'); f.querySelector('[name=n]').value='VEIO NO CARRO SEGUINTE';
      f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); await w(150); const criou=foraMot().slice(-1)[0];
      const n=foraMot().length; document.querySelector(`#rb-motivos [data-fm-sobe="${n-1}"]`).click(); await w(150);
      const subiu=foraMot()[n-2];
      const inp=document.querySelector('#rb-motivos [data-fm-ed="0"]'); inp.value='PRESA NA CAIXA'; inp.dispatchEvent(new Event('change',{bubbles:true})); await w(150);
      const editou=foraMot()[0];
      const usaNoSelect=foraMot().includes('VEIO NO CARRO SEGUINTE');
      S.foraMotivos=null; return {ini,criou,subiu,editou,usaNoSelect}; });
    ok(fm.ini===6,'motivos da nota acrescentada: lista de fábrica deveria ter 6 ('+fm.ini+')');
    ok(fm.criou==='VEIO NO CARRO SEGUINTE','motivos da nota acrescentada: o Cadastrar não funcionou');
    ok(fm.subiu==='VEIO NO CARRO SEGUINTE','motivos da nota acrescentada: o ▲ não mudou a ordem');
    ok(fm.editou==='PRESA NA CAIXA','motivos da nota acrescentada: editar o texto não salvou');
    ok(fm.usaNoSelect,'motivos da nota acrescentada: a lista do pop-up não usa o cadastro'); }
  /* 9.24.2: aviso quando o que falta é maior que o total da nota */
  { const w2=await p.evaluate(()=>{ const h=hojeISO();
      S.divergencias=[{id:'d1',n:1,d:h,ped:'1',nf:'909958',tipo:'Falta de volume',qtd:35,tot:31,cli:'X',obs:'',st:'aberta',por:'t',em:new Date().toISOString(),hist:[]}];
      renderTudo(); irPara('divergencias');
      const t=document.querySelector('#t-divergencias #dv-lista').innerText; S.divergencias=[]; return t.includes('falta mais que o total'); });
    ok(w2,'divergência: faltando mais volumes que o total da nota deveria avisar'); }
  /* 9.25.0: cidade na lista de divergências e faixa VOLUMES acompanhando a resposta */
  { const c3=await p.evaluate(()=>{ const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'a',numero:'0019486',arquivo:a,rows:[{nf:'909958',ped:'537317',vol:'31',dest:'CARDOSO',cid:'FRANCA',uf:'SP'}]}];
      S.divergencias=[{id:'d1',n:1,d:h,ped:'537317',nf:'909958',tipo:'Falta de volume',qtd:1,tot:31,cli:'CARDOSO',obs:'',st:'aberta',por:'t',em:new Date().toISOString(),hist:[]}];
      renderTudo(); irPara('divergencias');
      const t=document.querySelector('#dv-lista').innerText.replace(/\s+/g,' '); S.divergencias=[]; return t.includes('FRANCA/SP'); });
    ok(c3,'divergências: a cidade da nota não apareceu na lista'); }
  { const v3=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO();
      irPara('operacao'); OP.dia=h; OP.bipes=[]; OP.espera=false; S.opPorVolume=false;
      if(!document.querySelector('#op-cam')) await opCamAbrir();
      const b={local_id:'t1',dia:h,status:'ok',ped:'724486',nf:'731084',vol:1,tot:4,usuario:'teste',criado_em:new Date().toISOString()};
      OP.bipes=[b]; opMostrar({status:'ok',_b:b,_vt:4,_vk:1,titulo:'Pode seguir',linha:'volume 1 de 4'}); await w(200);
      const antes=(document.querySelector('#op-cam .vtot')||{}).innerText||'';
      const bt1=document.querySelector('#op-cam .op-conf .sim'); if(!bt1){ opCamFechar(); return {antes,depois:'(painel não abriu)'}; }
      bt1.click(); await w(200);
      const bt2=document.querySelector('#op-cam .op-qt [data-q="s"]'); if(!bt2){ opCamFechar(); return {antes,depois:'(pergunta não abriu)'}; }
      bt2.click(); await w(300);
      const depois=(document.querySelector('#op-cam .vtot')||{}).innerText||''; opCamFechar(); return {antes,depois}; });
    ok(/1 \/ 4/.test(v3.antes),'faixa VOLUMES: deveria começar em 1 / 4 ('+v3.antes.replace(/\n/g,' ')+')');
    ok(/4 \/ 4/.test(v3.depois)&&/completo/.test(v3.depois),'faixa VOLUMES: depois do "sim, todos" deveria mostrar 4 / 4 ('+v3.depois.replace(/\n/g,' ')+')'); }
  /* 9.25.1: etiqueta de caixa da Health Log (sem QR Code) — cliente, cidade, volume e modelo */
  { const e4=await p.evaluate(()=>{ const t=['000151 VOL.: 1 DE 1 000000021','12/11/2026','SANTA CASA DE MISERICORDIA DE PRESIDENTE PRUDENTE','R WENCESLAU BRAZ, 5','VILA EUCLIDES','ESTADO: SP CEP: 19014030','PESO: 0.0000 EMBALADOR:','CIDADE: PRESIDENTE PRUDENTE 000027 000219','TRANSP.: - HEALTH LOG'];
      const r=etqInterpretar(t); return {dest:r.dest,cid:r.cid,vol:r.vol+'/'+r.tot,modelo:r.modelo,semCep:!r.nums.includes('19014030'),nf:r.nfs[0]||'',cod:r.etqCod||''}; });
    ok(e4.dest==='SANTA CASA DE MISERICORDIA DE PRESIDENTE PRUDENTE','etiqueta de caixa: não leu o cliente ('+e4.dest+')');
    ok(e4.cid==='PRESIDENTE PRUDENTE'&&e4.vol==='1/1','etiqueta de caixa: cidade ou volume errado ('+e4.cid+' '+e4.vol+')');
    ok(e4.modelo==='Caixa Health Log','etiqueta de caixa: não reconheceu o modelo ('+e4.modelo+')');
    ok(e4.semCep,'etiqueta de caixa: o CEP não pode entrar como número de nota');
    ok(e4.nf==='000000021','etiqueta de caixa: a NF é o número da DIREITA na linha do VOL. (esperado 000000021, veio "'+e4.nf+'")');
    ok(e4.cod==='000151','etiqueta de caixa: o número da esquerda é o código da etiqueta, não a NF ('+e4.cod+')'); }
  /* 9.26.0: grade de caixas (1/6, 2/6…) na divergência, e o ＋ Adicionar do Checklist */
  { const g=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'a',numero:'0019486',arquivo:a,rows:[{nf:'731084',ped:'724486',vol:'6',dest:'DROGARIA TESTE',cid:'FRANCA',uf:'SP'}]}];
      S.divergencias=[]; renderTudo(); irPara('divergencias'); dvBipar('724486'); await w(400);
      const chips=[...document.querySelectorAll('.fundo [data-dcx]')].map(x=>x.textContent).join(',');
      document.querySelector('.fundo [data-dcx="2"]').click(); document.querySelector('.fundo [data-dcx="6"]').click(); await w(120);
      document.querySelector('.fundo .modal [data-r="1"]').click(); await w(400);
      const d=S.divergencias[0]||{}; const lista=document.querySelector('#dv-lista').innerText.replace(/\s+/g,' ');
      S.divergencias=[]; return {chips,qtd:d.qtd,falt:(d.falt||[]).join(','),obs:d.obs,lista}; });
    ok(g.chips==='1/6,2/6,3/6,4/6,5/6,6/6','divergência: a grade de caixas não apareceu ('+g.chips+')');
    ok(g.qtd===2&&g.falt==='2,6','divergência: marcar 2/6 e 6/6 deveria dar 2 volumes faltando ('+g.qtd+' / '+g.falt+')');
    ok(/faltaram as caixas 2\/6 e 6\/6/.test(g.obs||''),'divergência: a observação deveria dizer quais caixas faltaram ('+g.obs+')');
    ok(/caixas 2\/6 e 6\/6/.test(g.lista),'divergência: a lista deveria mostrar quais caixas faltaram');
}
  { const ad=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      S.ckApagados=[]; S.checklist=[{id:'k1',mot:'ANDRE',placa:'RTR-2J84',data:hojeISO(),ativo:true}]; irPara('checklist'); ckRender();
      const antes=ckTudo().length, linhasAntes=document.querySelectorAll('#ck-tbody tr').length;
      document.getElementById('ck-add').click(); await w(250);
      const r={d:ckTudo().length-antes,dl:document.querySelectorAll('#ck-tbody tr').length-linhasAntes,vazia:ckTudo().some(x=>!x.mot)}; S.checklist=[]; return r; });
    ok(ad.d===1&&ad.dl===1&&ad.vazia,'checklist: o ＋ Adicionar não criou a linha nova ('+JSON.stringify(ad)+')'); }
  /* 9.26.2: na lista de divergências a coluna Vol. mostra quanto CHEGOU (2 de 5), não quanto falta */
  { const v=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      S.divergencias=[{id:'t1',n:1,d:hojeISO(),tipo:'Falta de volume',ped:'724486',nf:'731084',qtd:3,tot:5,falt:[2,4,5],cli:'DROGARIA TESTE',st:'aberta'}];
      irPara('divergencias'); dvRenderLista(); await w(150);
      const t=document.querySelector('#dv-lista').innerText.replace(/\s+/g,' '); S.divergencias=[]; return t; });
    ok(/2 de 5/.test(v),'divergência: a coluna Vol. deveria mostrar 2 de 5 (o que chegou) — '+v.slice(0,180));
    ok(!/3 de 5/.test(v),'divergência: a coluna Vol. ainda está mostrando o que falta (3 de 5)');
    ok(/faltam 3/.test(v),'divergência: deveria dizer "faltam 3" embaixo');
    ok(/2\/5, 4\/5 e 5\/5/.test(v),'divergência: deveria listar as caixas que faltaram — '+v.slice(0,180)); }
  /* 9.26.4: etiqueta de caixa Health Log lida do jeito que o OCR entrega de verdade (letras erradas) */
  { const e5=await p.evaluate(()=>{ const t=['000153 VO oe 2 000000025','LABORSERV PASTEUR LTDA Epp','R VICTORIO SCAPIN, BOE','centro','OOP CEP: 1928\u00a2a00','TESO:_____0.0000 au: a Jie ee','tapas TEODORO mT rrewgp HEALTH Log'];
      const r=etqInterpretar(t); return {m:r.modelo,nf:r.nfs.join(','),nums:r.nums.join(','),cod:r.etqCod||'',dest:r.dest}; });
    ok(e5.m==='Caixa Health Log','etiqueta de caixa: com o OCR errando TRANSP e CIDADE ainda tem que reconhecer o modelo ('+e5.m+')');
    ok(e5.nf==='000000025','etiqueta de caixa: a NF é o número de 9 dígitos da direita ('+e5.nf+')');
    ok(e5.nums==='000000025','etiqueta de caixa: os códigos de 6 dígitos não podem virar nota nem pedido ('+e5.nums+')');
    ok(e5.cod==='000153','etiqueta de caixa: o código da etiqueta é o da esquerda ('+e5.cod+')');
    ok(/LABORSERV PASTEUR/.test(e5.dest||''),'etiqueta de caixa: não leu o destinatário ('+e5.dest+')'); }
  /* 9.26.3: etiqueta de caixa Health Log bipando de verdade — a NF da direita acha a nota no romaneio */
  { const bp=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'hl',numero:'0019486',base:'CAJ',arquivo:a,rows:[{nf:'000021',ped:'555001',vol:'1',dest:'SANTA CASA DE MISERICORDIA DE PRESIDENTE PRUDENTE',cid:'PRESIDENTE PRUDENTE',uf:'SP'}]}];
      OP.dia=h; OP.releitura=false; try{ opConfFechar(); }catch(e){} OP.espera=false; OP.confB=null; OP.visto=new Map(); OP.ultLeitura=0; renderTudo(); irPara('operacao'); OP.bipes=[]; await w(100);
      const t=['000151 VOL.: 1 DE 1 000000021','12/11/2026','SANTA CASA DE MISERICORDIA DE PRESIDENTE PRUDENTE','R WENCESLAU BRAZ, 5','VILA EUCLIDES','ESTADO: SP CEP: 19014030','PESO: 0.0000 EMBALADOR:','CIDADE: PRESIDENTE PRUDENTE 000027 000219','TRANSP.: - HEALTH LOG'];
      opLerEtiqueta(etqInterpretar(t)); await w(300);
      const b=OP.bipes.find(x=>opK(x.nf)==='21')||OP.bipes[0]||{};
      return {st:b.status,nf:b.nf,todos:OP.bipes.map(x=>x.nf+':'+x.status).join(' ')}; });
    ok(bp.st==='ok','etiqueta de caixa Health Log: deveria bipar como conferida e veio "'+bp.st+'" ('+bp.todos+')');
    ok(opKi(bp.nf)==='21','etiqueta de caixa Health Log: bipou a nota errada ('+bp.nf+' em vez de 21)'); }
  /* 9.26.4: o mesmo bipe, mas com o texto sujo que o OCR entrega na foto real (NF 25) */
  { const bp2=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'hl2',numero:'0019487',base:'CAJ',arquivo:a,rows:[{nf:'000025',ped:'555002',vol:'2',dest:'LABORSERV PASTEUR LTDA EPP',cid:'TEODORO SAMPAIO',uf:'SP'}]}];
      OP.dia=h; OP.releitura=false; try{ opConfFechar(); }catch(e){} OP.espera=false; OP.confB=null; OP.visto=new Map(); OP.ultLeitura=0; renderTudo(); irPara('operacao'); OP.bipes=[];
      const t=['000153 VO oe 2 000000025','LABORSERV PASTEUR LTDA Epp','R VICTORIO SCAPIN, BOE','centro','OOP CEP: 1928\u00a2a00','TESO:_____0.0000 au: a Jie ee','tapas TEODORO mT rrewgp HEALTH Log'];
      opLerEtiqueta(etqInterpretar(t)); await w(300);
      const b=OP.bipes.find(x=>opK(x.nf)==='25')||OP.bipes[0]||{};
      return {st:b.status,nf:b.nf,todos:OP.bipes.map(x=>x.nf+':'+x.status).join(' ')}; });
    ok(bp2.st==='ok','etiqueta de caixa (foto real): deveria bipar como conferida e veio "'+bp2.st+'" ('+bp2.todos+')');
    ok(opKi(bp2.nf)==='25','etiqueta de caixa (foto real): bipou a nota errada ('+bp2.nf+' em vez de 25)'); }
  /* 9.26.5: o OCR erra os zeros da frente (000000037 sai 800000037) — vale o maior final que existe no romaneio */
  { const sf=await p.evaluate(()=>({ a:etqHLSufixos('800000037'), b:etqHLSufixos('000000025'), c:etqHLSufixos('200008025') }));
    ok(sf.a.includes('37'),'sufixos: 800000037 tem que oferecer 37 ('+sf.a.join('|')+')');
    ok(sf.b[0]==='25','sufixos: 000000025 tem que começar por 25 ('+sf.b.join('|')+')');
    ok(sf.c.includes('25')&&sf.c.includes('8025'),'sufixos: 200008025 tem que oferecer 8025 e 25 ('+sf.c.join('|')+')'); }
  /* a NF é o número de cima à direita (regra fixa da etiqueta de caixa) */
  { const tp=await p.evaluate(()=>etqNfTopoDir([
      {text:'000153',x0:10,x1:60,y0:10,y1:30},{text:'VOL.:',x0:70,x1:100,y0:10,y1:30},
      {text:'000000025',x0:200,x1:300,y0:8,y1:34},{text:'19280000',x0:200,x1:280,y0:200,y1:220}]));
    ok(tp==='000000025','NF do topo à direita: esperado 000000025, veio "'+tp+'"'); }
  /* 9.26.5: botão verde na lista do romaneio dá baixa total (sem perguntar volumes, igual conferência total) */
  { const mk=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'mk1',numero:'0236360',base:'CAJ',motorista:'REGINALDO',arquivo:a,rows:[
        {nf:'741351',ped:'734641',vol:'1',dest:'CLINICA VERA CRUZ LTDA',cid:'PATOS DE MINAS',uf:'MG'},
        {nf:'741828',ped:'735284',vol:'4',dest:'EDUARDA APARECIDA',cid:'PLANURA',uf:'MG'}]}];
      S.divergencias=[]; OP.dia=h; renderTudo(); irPara('operacao'); OP.bipes=[];
      opRomLista('mk1'); await w(200);
      const cx=[...document.querySelectorAll('.fundo [data-rl-mk]')]; const antes=cx.length;
      /* 1 volume: marca e pronto */
      cx[0].click(); await w(400);
      const depois1=document.querySelectorAll('.fundo [data-rl-mk]').length;
      const aberta1=!!document.querySelector('.fundo [data-rl-mk]');
      /* 4 volumes: verde também dá baixa direta, sem dialog de volumes */
      document.querySelector('.fundo [data-rl-mk]').click(); await w(400);
      const naoAbriuDialog=!document.querySelector('[data-mcx]');
      const depois2=document.querySelectorAll('.fundo [data-rl-mk]').length;
      const aberta2=!!document.querySelector('.fundo [data-rl-mk]')||!!document.querySelector('.fundo .modal');
      const bip=OP.bipes.map(x=>x.nf+':'+x.status).join(' ');
      [...document.querySelectorAll('.fundo')].forEach(x=>x.remove()); S.divergencias=[];
      return {antes,depois1,aberta1,naoAbriuDialog,depois2,bip,aberta2}; });
    ok(mk.antes===2,'romaneio: cada nota faltando precisa de um botão verde ('+mk.antes+')');
    ok(mk.depois1===1&&mk.aberta1,'romaneio: ao marcar, a nota sai de Faltando e a janela continua aberta ('+mk.depois1+')');
    ok(mk.naoAbriuDialog,'romaneio: botão verde nunca deve abrir dialog de volumes (semDialogo)');
    ok(mk.depois2===0,'romaneio: após marcar as 2 notas, nenhuma deve sobrar em Faltando ('+mk.depois2+')');
    ok(/741351:ok/.test(mk.bip),'romaneio: a nota de 1 volume tinha que ficar conferida ('+mk.bip+')');
    ok(/741828:ok/.test(mk.bip),'romaneio: a nota de 4 volumes também tem que ficar conferida ('+mk.bip+')');
    ok(mk.aberta2,'romaneio: depois de marcar a janela tem que continuar aberta'); }
  /* 10.5.5: modo por volume + nota já bipada em parte por OUTRO conferente: o verde fecha a nota inteira com 1 clique */
  { const pv=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf'; const era=S.opPorVolume;
      S.opPorVolume=true; S.opFaltas={}; S.romaneios=[{id:'pv1',numero:'0236556',base:'CAJ',motorista:'R',arquivo:a,rows:[{nf:'741900',ped:'735900',vol:'170',dest:'EDU',cid:'PLANURA',uf:'MG'}]}];
      S.divergencias=[]; OP.dia=h; renderTudo(); irPara('operacao');
      OP.bipes=Array.from({length:13},(_,i)=>({local_id:'pv'+i,dia:h,status:'ok',ped:'735900',nf:'741900',vol:i+1,tot:170,usuario:'Outro Usuario',criado_em:new Date(Date.now()-600000).toISOString(),tipo:'numero:camera'}));
      opRomLista('pv1'); await w(200); document.querySelector('.fundo [data-rl-mk]').click(); await w(600);
      const c=opContagem('735900','741900'); const r={lidos:c.lidos,esp:c.esp,pend:opPendentes().length,perguntou:!!document.getElementById('op-outra')||!!document.querySelector('[data-mcx]')};
      [...document.querySelectorAll('.fundo')].forEach(x=>x.remove()); const o=document.getElementById('op-outra'); if(o) o.remove(); S.opPorVolume=era; S.opFaltas={}; S.divergencias=[]; OP.bipes=[]; return r; });
    ok(!pv.perguntou,'baixa manual verde: não pode perguntar nada quando outro conferente já bipou parte');
    ok(pv.lidos===170&&pv.esp===170,'baixa manual verde: 1 clique tem que fechar 170 de 170 (veio '+pv.lidos+' de '+pv.esp+')');
    ok(pv.pend===0,'baixa manual verde: a nota tem que sair da lista de falta ('+pv.pend+')'); }
  /* 9.26.6: marcar como divergência na lista do romaneio (fica laranja do lado das bipadas) */
  { const dvm=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'dv1',numero:'0236361',base:'CAJ',arquivo:a,rows:[{nf:'770001',ped:'880001',vol:'1',dest:'CLIENTE DV',cid:'FRANCA',uf:'SP'}]}];
      S.divergencias=[]; OP.dia=h; renderTudo(); irPara('operacao'); OP.bipes=[];
      opRomLista('dv1'); await w(200);
      document.querySelector('.fundo [data-rl-dv]').click(); await w(500);
      const txt=(document.querySelector('.fundo .modal')||{}).innerText||'';
      const d=S.divergencias[0]||{}; const bip=OP.bipes.map(x=>x.nf+':'+x.status).join(' ');
      const aberta=!!document.querySelector('.fundo [data-rl-mk]')||/Bipadas/.test(txt);
      [...document.querySelectorAll('.fundo')].forEach(x=>x.remove()); S.divergencias=[];
      return {qtd:d.qtd,tot:d.tot,bip,txt:txt.replace(/\s+/g,' '),aberta}; });
    ok(dvm.qtd===1&&dvm.tot===1,'romaneio: o botão de divergência tinha que abrir divergência de 1 volume ('+dvm.qtd+'/'+dvm.tot+')');
    ok(/divergência/i.test(dvm.txt),'romaneio: a nota marcada tem que aparecer como divergência do lado das bipadas');
    ok(/Faltando \(0\)/.test(dvm.txt),'romaneio: a nota marcada como divergência sai de Faltando ('+dvm.txt.slice(0,120)+')');
    ok(dvm.aberta,'romaneio: a janela tem que continuar aberta depois de marcar divergência'); }
  /* 9.26.6: busca na Conferência total marca batida/divergência sem abrir romaneio */
  { const bq=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'bq1',numero:'0236362',base:'DF',arquivo:a,rows:[
        {nf:'880011',ped:'990011',vol:'1',dest:'DROGARIA ESTRELA',cid:'UBERABA',uf:'MG'},
        {nf:'880012',ped:'990012',vol:'1',dest:'OUTRO CLIENTE',cid:'ASSIS',uf:'SP'}]}];
      S.divergencias=[]; OP.dia=h; OP.bipes=[]; renderTudo(); irPara('conftotal'); await w(250);
      const inp=document.getElementById('ct-q'); if(!inp) return {erro:'sem campo de busca'};
      inp.value='ESTRELA'; inp.dispatchEvent(new Event('input',{bubbles:true})); await w(200);
      const achou=document.querySelectorAll('#ct-res [data-ctb]').length;
      document.querySelector('#ct-res [data-m="ok"]').click(); await w(450);
      const bip=OP.bipes.map(x=>x.nf+':'+x.status).join(' ');
      const depois=(document.getElementById('ct-res')||{}).innerText||'';
      inp.value='OUTRO'; inp.dispatchEvent(new Event('input',{bubbles:true})); await w(200);
      document.querySelector('#ct-res [data-m="dv"]').click(); await w(500);
      const d=S.divergencias[0]||{}; S.divergencias=[];
      return {achou,bip,depois:depois.replace(/\s+/g,' '),dvNf:d.nf,dvQtd:d.qtd}; });
    ok(!bq.erro,'conferência total: '+bq.erro);
    ok(bq.achou===2,'busca: "ESTRELA" tinha que achar a nota com os dois botões ('+bq.achou+')');
    ok(/880011:ok/.test(bq.bip),'busca: o botão Batida tinha que conferir a NF 880011 ('+bq.bip+')');
    ok(/conferida/.test(bq.depois),'busca: depois de marcar, a nota tem que aparecer como conferida ('+bq.depois.slice(0,120)+')');
    ok(String(bq.dvNf)==='880012'&&bq.dvQtd===1,'busca: o botão Divergência tinha que abrir divergência da NF 880012 ('+bq.dvNf+' '+bq.dvQtd+')'); }
  /* 9.26.6 (balão do BIT no NexBip) saiu na v10.6.06 junto com o BIT */
  /* 9.26.7: nota com todos os volumes confirmados — as outras caixas têm que dar duplicidade */
  { const du=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'du1',numero:'0236363',base:'CAJ',arquivo:a,rows:[{nf:'660055',ped:'770055',vol:'5',dest:'CLIENTE CINCO',cid:'FRANCA',uf:'SP'}]}];
      OP.dia=h; renderTudo(); irPara('operacao'); OP.bipes=[];
      OP.extra={tot:5}; opLer(['CX1@1@5@770055'],'texto'); await w(200);
      const b=OP.bipes[0]; if(b){ b.tot=5; b.vol=1; opConfMarcar(b,'ok',5); }
      const ja=opJaBipado(opK('770055'),opK('660055'),2);
      OP.extra={tot:5}; opLer(['CX2@2@5@770055'],'texto'); await w(250);
      const lista=OP.bipes.map(x=>(x.vol||'?')+':'+x.status).join(' ');
      return {achou:!!ja,lista}; });
    ok(du.achou,'duplicidade: depois de confirmar as 5 caixas, a caixa 2/5 tinha que ser vista como já bipada');
    ok(/dup/.test(du.lista),'duplicidade: a segunda caixa tinha que entrar como duplicada ('+du.lista+')'); }
  /* 9.26.7: aparelho sem os romaneios do dia avisa em vez de dar tudo "fora do romaneio" */
  { const sr=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO();
      const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[]; OP.dia=h; renderTudo(); irPara('operacao'); await w(150);
      const com=(document.getElementById('op-sem-rom')||{}).innerHTML||'';
      S.romaneios=[{id:'sr1',numero:'0236364',base:'CAJ',arquivo:a,rows:[{nf:'1',ped:'1',vol:'1',dest:'A',cid:'X'}]}]; renderTudo(); opRender(); await w(250);
      const sem=!!document.getElementById('op-sem-rom');
      return {com,sem}; });
    ok(/sem os romaneios de hoje/.test(sr.com),'aviso: aparelho sem romaneios do dia tem que avisar na tela do NexBip');
    ok(!sr.sem,'aviso: com os romaneios carregados o aviso tem que sumir'); }
  /* 9.26.9: impressão em PDF — sem rolagem no papel e sem parar na folha 1 */
  { await p.evaluate(()=>{ const sec=document.querySelector('.tela:not([hidden])')||document.body;
      const d=document.createElement('div'); d.id='teste-impressao';
      d.innerHTML='<div class="rolagem" style="max-height:200px;overflow:auto">'+Array.from({length:120},(_,i)=>'<p>linha '+(i+1)+'</p>').join('')+'</div>';
      sec.appendChild(d); });
    await p.emulateMedia({media:'print'});
    const imp=await p.evaluate(()=>{ const g=(el,q)=>el?getComputedStyle(el)[q]:'';
      return { body:g(document.body,'overflowY'), rail:g(document.querySelector('.rail'),'display'),
        rol:g(document.querySelector('#teste-impressao .rolagem'),'overflowY'),
        alt:g(document.querySelector('#teste-impressao .rolagem'),'maxHeight'),
        alturaPagina:document.documentElement.scrollHeight }; });
    const pdf=await p.pdf({format:'A4'});
    const folhas=(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
    await p.emulateMedia({media:'screen'});
    await p.evaluate(()=>{ const d=document.getElementById('teste-impressao'); if(d) d.remove(); });
    ok(imp.body==='visible','impressão: o corpo da página não pode ficar com rolagem no papel ('+imp.body+')');
    ok(imp.rail==='none','impressão: o menu da esquerda não deve sair no papel ('+imp.rail+')');
    ok(imp.rol==='visible'&&imp.alt==='none','impressão: caixas com rolagem própria têm que abrir inteiras ('+imp.rol+' / '+imp.alt+')');
    ok(folhas>1,'impressão: o PDF tinha que sair com mais de uma folha ('+folhas+')'); }
  /* 9.27.0 (rotas, CARRO 10) saiu na v10.6.01 junto com a aba Rotas */
  /* 9.27.0: o cartão de motoristas sobe para perto dos clientes no painel de reentregas */
  { const pos=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      irPara('reentregas'); await w(200); try{ reSub('painel'); }catch(e){} await w(400);
      const t=[...document.querySelectorAll('#re-painel .rp-card h3')].map(x=>x.textContent);
      return { i:t.findIndex(x=>/Motoristas com mais/.test(x)), mes:t.findIndex(x=>/Notas e volumes/.test(x)), n:t.length }; });
    ok(pos.i>=0,'painel: o cartão "Motoristas com mais reentregas" tem que existir');
    ok(pos.i<pos.mes,'painel: o cartão de motoristas tem que vir antes do gráfico por mês ('+pos.i+' de '+pos.n+')'); }
  /* 9.27.0: "N reentrega(s) sem motorista — acerte em Correção" agora tem o bloco correspondente na Correção */
  { const cm=await p.evaluate(()=>{ const h=hojeISO(); const D=RE.ler(); D.dias=D.dias||{};
      D.dias[h]=[{nf:'5001',ped:'1',cli:'CLIENTE SEM MOT',cid:'ASSIS',uf:'SP',qtd:1,val:10,obs:'FALTA DE VOLUME'},
                 {nf:'5002',ped:'2',cli:'CLIENTE COM MOT',cid:'ASSIS',uf:'SP',qtd:1,val:10,obs:'AVARIA - JOAO'},
                 {nf:'5003',ped:'3',cli:'SEM OBS',cid:'ASSIS',uf:'SP',qtd:1,val:10,obs:''}];
      try{ RE.gravar(D); }catch(e){ try{ localStorage.setItem(RE.chave,JSON.stringify(D)); RE.d=D; }catch(e2){} }
      const o=corItens(); const sm=(o.reSemMot||[]).map(x=>x.l.nf).join(',');
      const antes=sm; const alvo=(o.reSemMot||[])[0];
      let depois=''; if(alvo){ const l=RE.ler().dias[alvo.d][alvo.i]; l.mot='MARCIA'; RE.gravar(); depois=(corItens().reSemMot||[]).map(x=>x.l.nf).join(','); }
      D.dias[h]=[]; try{ RE.gravar(D); }catch(e){}
      return {antes,depois,semObs:(o.reMot||[]).map(x=>x.l.nf).join(',')}; });
    ok(cm.antes==='5001','correção: a nota com motivo e sem motorista tem que entrar no bloco novo ('+cm.antes+')');
    ok(cm.semObs==='5003','correção: a nota sem observação continua no bloco de "sem motivo" ('+cm.semObs+')');
    ok(cm.depois==='','correção: depois de anotar o motorista a nota tem que sair da lista ('+cm.depois+')'); }
  /* 9.27.1: a nota sem base E sem motorista tem que entrar nos dois blocos, e o campo da tela faz a linha sumir */
  { const c2=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO();
      const guardaCid=S.cidAtend; S.cidAtend={}; S.geo=S.geo||{listas:[],aprend:{}}; if(!S.geo.listas) S.geo.listas=[];
      const D=RE.ler(); D.dias=D.dias||{};
      D.dias[h]=[{nf:'6001',ped:'1',cli:'SEM BASE E SEM MOT',cid:'CIDADE QUE NAO EXISTE',uf:'SP',qtd:1,val:10,obs:'FALTA DE VOLUME'},
                 {nf:'6002',ped:'2',cli:'COM BASE SEM MOT',cid:'ASSIS',uf:'SP',qtd:1,val:10,base:'AQA',obs:'AVARIA'}];
      RE.gravar();
      const o=corItens(); const nosDois=(o.reSemMot||[]).some(x=>x.l.nf==='6001')&&(o.reBase||[]).some(x=>x.l.nf==='6001');
      try{ NV.perfil={papel:'admin',ativo:true}; }catch(e){} renderCorrecao(); await w(150);
      const campos=document.querySelectorAll('[data-cor-semmot]').length;
      const x=document.querySelectorAll('[data-cor-naore]').length;
      const inp=document.querySelector('[data-cor-semmot]');
      if(inp){ inp.value='MARCIA'; inp.dispatchEvent(new Event('change',{bubbles:true})); }
      await w(250);
      const sobrou=(corItens().reSemMot||[]).length;
      D.dias[h]=[]; RE.gravar(); S.cidAtend=guardaCid; renderCorrecao();
      return {nosDois,campos,sobrou,x}; });
    ok(c2.nosDois,'correção: nota sem base e sem motorista tem que aparecer nos dois blocos');
    ok(c2.campos===2,'correção: os dois casos sem motorista precisam de campo ('+c2.campos+')');
    ok(c2.sobrou===1,'correção: ao escrever o motorista a linha tem que sair ('+c2.sobrou+' sobrou de 2)');
    ok(c2.x===2,'correção: cada linha precisa do X de "não é reentrega" ('+c2.x+')'); }
  /* 9.27.2: a janela de relatório (Ver todos) não pode sair cortada no PDF */
  { await p.evaluate(async()=>{ const h=hojeISO(); const D=RE.ler(); D.dias=D.dias||{};
      D.dias[h]=Array.from({length:40},(_,i)=>({nf:String(700000+i),ped:String(800000+i),cli:'CLIENTE COM NOME BEM COMPRIDO LTDA '+i,
        cid:['SAO JOSE DO RIO PRETO','SAO CARLOS','POCOS DE CALDAS'][i%3],uf:i%3===2?'MG':'SP',qtd:1+i%4,val:1000+i*37,base:'AQA',
        mot:['ALEXANDRE','M. HENRIQUE','DIEGO'][i%3],obs:'ERA DIVERGENCIA (CHEGARAM VOLUMES) - X'}));
      RE.gravar(); irPara('reentregas'); try{ reSub('painel'); }catch(e){} await new Promise(r=>setTimeout(r,400));
      rxAbrir('Todos · por motorista',RP._sel||[]); await new Promise(r=>setTimeout(r,300)); });
    await p.emulateMedia({media:'print'});
    const rx=await p.evaluate(()=>{ const cx=document.querySelector('#rx .cx'), co=document.querySelector('#rx .corpo');
      return { larg:document.documentElement.scrollWidth, tela:document.documentElement.clientWidth,
        cx:getComputedStyle(cx).overflow, corpo:getComputedStyle(co).overflow, alt:document.documentElement.scrollHeight }; });
    const pdf=await p.pdf({format:'A4',landscape:true});
    const folhas=(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
    await p.emulateMedia({media:'screen'});
    await p.evaluate(()=>{ const f=document.getElementById('rx'); if(f) f.remove(); const h=hojeISO(); const D=RE.ler(); D.dias[h]=[]; RE.gravar(); });
    ok(rx.larg<=rx.tela,'relatório: no papel não pode sobrar nada para o lado ('+rx.larg+' > '+rx.tela+')');
    ok(rx.cx==='visible'&&rx.corpo==='visible','relatório: a caixa da janela não pode cortar o conteúdo no papel ('+rx.cx+'/'+rx.corpo+')');
    ok(folhas>1,'relatório: o PDF tinha que sair com mais de uma folha ('+folhas+')'); }
  /* v10: o texto da faixa da câmera sai antes de entrar o novo, e o BIT não aparece no NexBip */
  { const tr=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const el=document.createElement('div'); el.className='msg'; document.body.appendChild(el);
      opMsgTrocar(el,'<b>primeiro</b>'); const vazio=el.innerHTML;
      opMsgTrocar(el,'<b>segundo</b>'); const naTroca=el.className+'|'+el.innerHTML;
      await w(260); const depois=el.innerHTML; el.remove();
      irPara('operacao'); await w(120); const noBip=!document.getElementById('eva-bt');
      irPara('conftotal'); await w(120); const fora=(document.getElementById('eva-bt')||{}).hidden;
      irPara('operacao');
      return {vazio,naTroca,depois,noBip,fora}; });
    ok(/primeiro/.test(tr.vazio),'faixa: o primeiro texto entra na hora quando a faixa está vazia');
    ok(/saindo/.test(tr.naTroca)&&/primeiro/.test(tr.naTroca),'faixa: o texto antigo tem que sair antes do novo entrar ('+tr.naTroca.slice(0,60)+')');
    ok(/segundo/.test(tr.depois),'faixa: depois da saída o texto novo entra ('+tr.depois+')');
    ok(tr.noBip===true,'BIT: o boneco não pode aparecer na tela do NexBip'); }
  /* v10: chave da DANFE pela câmera — confere os dados e acrescenta a nota no romaneio */
  { const cv=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      const ch='35261112345678000199550010000000251000000025';
      const d1=chvDigitos('NFe'+ch), d2=chvDigitos('123'), d3=chvDigitos(ch.slice(0,43));
      S.romaneios=[{id:'ch1',numero:'0236399',base:'CAJ',motorista:'REGINALDO',arquivo:a,rows:[{nf:'111',ped:'222',vol:'1',dest:'A',cid:'X'}]}];
      OP.dia=h; renderTudo(); irPara('operacao'); await w(150);
      const temBotao=!!document.getElementById('op-bt-chave');
      const velho=window.redPelaChave;
      window.redPelaChave=async()=>({nf:'900123',ped:'770001',dest:'DROGARIA TESTE LTDA',cid:'ARARAQUARA',uf:'SP',vol:'3',valor:'1.234,56',chave:ch});
      [...document.querySelectorAll('.fundo')].forEach(x=>x.remove()); /* tira pergunta do BIT que tenha aberto no meio */
      await chvConfirmar(ch); await w(250);
      const mods=[...document.querySelectorAll('.fundo .modal')];
      const painel=((mods.find(m=>m.querySelector('#chv-rom'))||mods[mods.length-1]||{}).innerText)||'';
      const temSelect=!!document.getElementById('chv-rom');
      const okb=[...document.querySelectorAll('.fundo [data-a="ok"]')].pop(); if(okb) okb.click(); await w(250);
      window.redPelaChave=velho;
      const r=S.romaneios[0]; const nova=(r.rows||[]).find(x=>opK(x.nf)==='900123')||{};
      [...document.querySelectorAll('.fundo')].forEach(x=>x.remove());
      return {d1,d2,d3,temBotao,temSelect,painel:painel.replace(/\s+/g,' ').slice(0,220),nf:nova.nf,vol:nova.vol,cid:nova.cid,por:!!nova._por,linhas:(r.rows||[]).length}; });
    ok(cv.d1===ch44(),'chave: tem que achar os 44 dígitos dentro do texto lido ('+cv.d1+')');
    ok(cv.d2===''&&cv.d3==='','chave: código curto não pode passar por chave ('+cv.d2+'|'+cv.d3+')');
    ok(cv.temBotao,'NexBip: falta o botão da chave da DANFE ao lado de abrir câmera');
    ok(/DROGARIA TESTE/.test(cv.painel)&&/ARARAQUARA/.test(cv.painel),'chave: o painel tem que mostrar os dados do Meu Danfe para conferir ('+cv.painel.slice(0,100)+')');
    ok(cv.temSelect,'chave: tem que dar para escolher em qual romaneio acrescentar');
    ok(cv.nf==='900123'&&cv.vol==='3'&&cv.cid==='ARARAQUARA','chave: a nota tinha que entrar no romaneio com os dados certos ('+cv.nf+'/'+cv.vol+'/'+cv.cid+')');
    ok(cv.por,'chave: a nota acrescentada tem que registrar quem acrescentou');
    ok(cv.linhas===2,'chave: o romaneio tinha que ficar com 2 notas ('+cv.linhas+')'); }
  /* v10.6.06: o BIT saiu inteiro (aba, boneco no canto, balões, chat) e a aba Ajuda também */
  { const bt=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); try{ NV.perfil={papel:'admin',ativo:true}; }catch(e){}
      await w(200); return {aba:!!document.querySelector('.nav [data-tela="eva"]'),ajuda:!!document.querySelector('.nav [data-tela="ajuda"]'),
        tela:!!document.getElementById('t-eva')||!!document.getElementById('t-ajuda'),boneco:!!document.getElementById('eva-bt'),
        painel:!!document.getElementById('eva-painel'),fn:typeof window.evaFala+typeof window.evaEntender, manual:!!document.querySelector('.nav [data-tela="manual"]')}; });
    ok(!bt.aba&&!bt.ajuda&&!bt.tela,'BIT/Ajuda: as abas tinham que ter saído do menu');
    ok(!bt.boneco&&!bt.painel,'BIT: o boneco do canto e o chat tinham que ter saído');
    ok(bt.fn==='undefinedundefined','BIT: o código dele ainda existe ('+bt.fn+')');
    ok(bt.manual,'o Manual tem que continuar no menu'); }
  /* v10.6.02: Painel de Gestão — nota bipada duas vezes conta uma, fora não conta, período nos títulos, divergência não é reentrega */
  { const g2=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO();
      const guarda=localStorage.getItem(OP_LOCAL+h); const D=RE.ler(); const guardaRe=JSON.stringify(D.dias||{});
      const t=x=>h+'T1'+x+':00:00.000Z';
      OP.dia=h; OP.bipes=[{nf:'100',status:'ok',usuario:'ANA',criado_em:t(0)},{nf:'100',status:'ok',usuario:'BETO',criado_em:t(1)},
        {nf:'100',status:'dup',usuario:'BETO',criado_em:t(2)},{nf:'200',status:'ok',usuario:'BETO',criado_em:t(1)},{nf:'300',status:'fora',usuario:'ANA',criado_em:t(1)}];
      D.dias=D.dias||{}; D.dias[h]=[{nf:'1',obs:'CLIENTE FECHADO'},{nf:'2',obs:'ERA DIVERGENCIA #12'},{nf:'3',obs:'DIVERGÊNCIA DV-004 - Falta de volume'}];
      GS.dia=h; GS.per='hoje'; irPara('gestor'); await w(300);
      const d=gestorDados2(); const tit1=[...document.querySelectorAll('#gs-corpo .gs-box h3')].map(x=>x.textContent);
      document.querySelector('[data-gs-per="7"]').click(); await w(200);
      const tit7=[...document.querySelectorAll('#gs-corpo .gs-box h3')].map(x=>x.textContent);
      const r={ph:d.ph.reduce((a,x)=>a+x[1],0), pp:Object.fromEntries(d.pp), tot:d.tot, mot:d.mot.map(x=>x[0]).join('|'), tit1, tit7,
        avaria:tit1.some(x=>/Avarias/i.test(x)), mensal:!!document.getElementById('gs-pdf'), filtro:document.querySelectorAll('[data-gs-per]').length};
      GS.per='hoje'; try{ LS.removeItem('healthSearch.gsPer'); }catch(e){} D.dias=JSON.parse(guardaRe); OP.bipes=[]; if(guarda) localStorage.setItem(OP_LOCAL+h,guarda); GS.dia=''; return r; });
    ok(g2.ph===2,'gestor: 2 notas bipadas (uma delas 2x, uma repetida e uma fora) tinham que dar 2 no "por hora" (deu '+g2.ph+')');
    ok(g2.pp.ANA===1&&g2.pp.BETO===1,'gestor: a nota conta para quem bipou PRIMEIRO ('+JSON.stringify(g2.pp)+')');
    ok(g2.tot===1&&!/DIVERG/.test(g2.mot),'gestor: reentrega que veio de divergência não pode entrar ('+g2.tot+' · '+g2.mot+')');
    ok(g2.tit1.some(x=>x==='Reentregas (por motivo / hoje)')&&g2.tit1.some(x=>x==='Conferência por origem (hoje em %)'),'gestor: títulos com o período ('+g2.tit1.join(' | ')+')');
    ok(g2.tit7.some(x=>x==='Bipes (por hora / 7 dias)'),'gestor: o filtro de 7 dias tinha que mudar os títulos ('+g2.tit7.join(' | ')+')');
    ok(!g2.avaria&&g2.mensal&&g2.filtro===4,'gestor: sem "Avarias por tipo", com painel mensal e com os 4 períodos'); }
  /* v10.6.03: reentregas — divergência sai, o resto fica, e nada volta pela sincronização */
  { const z3=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const D=RE.ler(); const guarda=JSON.stringify(D.dias||{}); const gS=JSON.stringify({c:S.cadMotivos,m:S.motivos2,t:S.reTirados});
      try{ NV.perfil={papel:'admin',ativo:true}; }catch(e){}
      document.querySelectorAll('.fundo').forEach(f=>f.remove());
      delete S.motivos2; delete S.reTirados; S.cadMotivos=['CLIENTE FECHADO','DIVERGENCIA #3','LOCAL FECHADO'];
      D.dias={'2026-11-10':[{nf:'1',obs:'CLIENTE FECHADO'},{nf:'2',obs:'ERA DIVERGENCIA (chegou depois)'}],'2026-11-11':[{nf:'3',obs:'DIVERGÊNCIA DV-004 · Falta de volume · RESOLVIDA'}]}; RE.gravar();
      const baixou=[]; const _nb=nexBaixar; nexBaixar=(txt,nome)=>baixou.push({nome,txt});
      const recusa=nexParaReentrega({nf:'9',motivo:'DIVERGENCIA #12'},'2026-11-12','teste');
      /* v10.6.25: a janela de limpeza saiu (já rodou); as travas continuam: o que está em S.reTirados sai e não volta */
      const ag=new Date().toISOString(); S.reTirados={}; for(const l of [{nf:'2',obs:'ERA DIVERGENCIA (chegou depois)'},{nf:'3',obs:'DIVERGÊNCIA DV-004 · Falta de volume · RESOLVIDA'}]) S.reTirados[reChaveT(l)]=ag;
      reVarrerTirados(); S.motivos2={em:ag,l:['CLIENTE AUSENTE']}; S.cadMotivos=['CLIENTE AUSENTE'];
      const linhas=Object.values(RE.ler().dias).flat().map(l=>l.nf).join(',');
      nuvAplicar('re:2026-11-10',[{nf:'1',obs:'CLIENTE FECHADO'},{nf:'2',obs:'ERA DIVERGENCIA (chegou depois)'}],false);
      const depoisSinc=(RE.ler().dias['2026-11-10']||[]).map(l=>l.nf).join(',');
      S.cadMotivos=['VELHO']; cadInit(); const espelho=S.cadMotivos.join('|');
      const r={recusa, linhas, depoisSinc, espelho};
      nexBaixar=_nb; D.dias=JSON.parse(guarda); RE.gravar(); const g=JSON.parse(gS); S.cadMotivos=g.c; if(g.m) S.motivos2=g.m; else delete S.motivos2; if(g.t) S.reTirados=g.t; else delete S.reTirados;
      document.querySelectorAll('.fundo').forEach(f=>f.remove()); return r; });
    ok(z3.recusa===null,'reentregas: motivo de divergência tinha que ser recusado');
    ok(z3.linhas==='1','reentregas: só a reentrega normal fica ('+z3.linhas+')');
    ok(z3.depoisSinc==='1','reentregas: a sincronização devolveu uma reentrega que foi tirada ('+z3.depoisSinc+')');
    ok(z3.espelho==='CLIENTE AUSENTE','reentregas: a lista velha de motivos voltou pela junção ('+z3.espelho+')'); }
  /* v10.6.04: divergência mexida em dois aparelhos — histórico dos dois lados fica; recarregar espera o disco */
  { const c4=await p.evaluate(()=>{ const a={id:'x',n:7,st:'aberta',d:'2026-11-10',hist:[{em:'2026-11-10T10:00:00Z',t:'Criada',por:'A'},{em:'2026-11-10T11:00:00Z',t:'Mudou o dia',por:'A'}]};
      const b={id:'x',n:7,st:'resolvida',d:'2026-11-09',hist:[{em:'2026-11-10T10:00:00Z',t:'Criada',por:'A'},{em:'2026-11-10T12:00:00Z',t:'Resolvida',por:'B'}]};
      const j=nuvJuntar('dv:x',a,b); return {st:j.st,n:j.hist.length,t:j.hist.map(x=>x.t).join('>'),rec:typeof hsRecarregar,prazo:typeof hsFetchComPrazo}; });
    ok(c4.st==='resolvida'&&c4.n===3&&c4.t==='Criada>Mudou o dia>Resolvida','conflito: o histórico dos dois aparelhos tinha que ficar ('+c4.st+' · '+c4.t+')');
    ok(c4.rec==='function'&&c4.prazo==='function','recarregar seguro / prazo do banco não existem'); }
  /* v10.6.07: aviso do sino com ✕ — dispensado some e não volta enquanto não mudar */
  { const nt=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); document.querySelectorAll('.fundo').forEach(f=>f.remove());
      try{ LS.removeItem('healthSearch.avisosIgn'); }catch(e){}
      const orig=window.nexAvisos; let base=null;
      const fake=[{cor:'red',txt:'<b>3</b> aviso de teste A',acao:'x1'},{cor:'red',txt:'aviso de teste B',acao:'x2'}];
      const n0=nexAvisos().filter(a=>/aviso de teste/.test(a.txt)).length;
      const _nb=nexAbrirNotif; /* injeta os avisos falsos por baixo do filtro */
      const r={};
      const _base=Object.getOwnPropertyDescriptor(window,'nexAvisos');
      return {n0, temX:typeof avisoChave==='function', ign:typeof nexAbrirNotif}; });
    ok(nt.temX&&nt.ign==='function','notificações: funções do ✕ não existem'); }
  { const nt2=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); document.querySelectorAll('.fundo').forEach(f=>f.remove());
      try{ LS.removeItem('healthSearch.avisosIgn'); }catch(e){}
      const ig={}; ig[avisoChave({acao:'x2',txt:'aviso de teste B'})]=Date.now(); LS.setItem('healthSearch.avisosIgn',JSON.stringify(ig));
      const lista=[{cor:'red',txt:'<b>3</b> aviso de teste A',acao:'x1'},{cor:'red',txt:'aviso de teste B',acao:'x2'}];
      const lim=Date.now()-864e5; const fil=lista.filter(x=>!(ig[avisoChave(x)]>lim));
      nexAbrirNotif(); await w(100); const f=[...document.querySelectorAll('.fundo')].pop(); const temX=!!(f&&f.querySelectorAll('.nx-ign').length===f.querySelectorAll('.nx-aviso').length);
      if(f) f.remove(); LS.removeItem('healthSearch.avisosIgn'); return {fil:fil.map(x=>x.acao).join(','),temX}; });
    ok(nt2.fil==='x1','notificações: aviso dispensado tinha que sumir ('+nt2.fil+')');
    ok(nt2.temX,'notificações: cada aviso da janela do sino tem que ter o ✕'); }
  /* v10.6.07: ✕ Cancelar divergência — some sem histórico e a nota volta a ficar pendente; atalhos configuráveis */
  { const cx=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      try{ NV.perfil={papel:'admin',ativo:true,nome:'Teste'}; }catch(e){} document.querySelectorAll('.fundo').forEach(f=>f.remove());
      S.romaneios=[{id:'cx1',numero:'0999001',base:'CAJ',arquivo:a,rows:[{nf:'990001',ped:'880001',vol:'1',dest:'CLIENTE CX',cid:'FRANCA',uf:'SP'}]}];
      OP.dia=h; OP.bipes=[]; renderTudo();
      const pend0=opPendentes().some(x=>opK(x.nf)==='990001');
      const fez=await opMarcarMao(S.romaneios[0].rows[0],'dv',true); await w(200);
      const d=dvS().find(x=>opK(x.nf)==='990001'); const pend1=opPendentes().some(x=>opK(x.nf)==='990001');
      irPara('divergencias'); dvRender(); await w(200); const bt=!!document.querySelector('[data-du-cancelar="'+(d&&d.id)+'"]');
      const _c=confirmar; window.confirmar=async()=>true; const ok=d?await dvCancelar(d.id):false; window.confirmar=_c; await w(200);
      const r={pend0,fez,temDv:!!d,pend1,bt,ok,sumiu:!dvS().some(x=>opK(x.nf)==='990001'),bips:OP.bipes.filter(b=>opK(b.nf)==='990001').length,pend2:opPendentes().some(x=>opK(x.nf)==='990001')};
      /* atalhos */
      LS.removeItem('healthSearch.atalhos'); r.padrao=atalhosLer().buscar; irPara('ajustes'); await w(150);
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'5',code:'Digit5',altKey:true,bubbles:true})); await w(150);
      r.alt5=!document.getElementById('t-divergencias').hidden;
      S.romaneios=[]; OP.bipes=[]; renderTudo(); return r; });
    ok(cx.pend0&&cx.fez&&cx.temDv&&!cx.pend1,'cancelar dv: a preparação falhou ('+JSON.stringify(cx)+')');
    ok(cx.bt,'cancelar dv: o cartão da divergência tinha que ter o ✕ Cancelar');
    ok(cx.ok&&cx.sumiu&&cx.bips===0&&cx.pend2,'cancelar dv: a divergência e o bipe tinham que sair e a nota voltar para pendente ('+JSON.stringify(cx)+')');
    ok(cx.padrao==='Ctrl+K'&&cx.alt5,'atalhos: o padrão (Ctrl+K / Alt+5) não funcionou ('+cx.padrao+', '+cx.alt5+')'); }
  /* v10.6.14: nota marcada à mão como divergência (2 de 15 caixas faltando) sai das pendentes também caixa a caixa */
  { const dvm=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const out={}; NV.perfil={papel:'admin',ativo:true,nome:'Teste'}; document.querySelectorAll('.fundo').forEach(f=>f.remove());
      const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf'; const _q=window.opQuantosMao; window.opQuantosMao=async()=>({chegou:13,faltaram:[1,2]});
      for(const pv of [false,true]){ S.opPorVolume=pv; S.divergencias=[];
        S.romaneios=[{id:'dm1',numero:'EXTRA I',base:'CAJ',arquivo:a,rows:[{nf:'746346',ped:'740001',vol:'15',dest:'UNIMED',cid:'SAO CARLOS',uf:'SP'},{nf:'746347',ped:'740002',vol:'10',dest:'X',cid:'Y',uf:'SP'}]}]; OP.dia=h; OP.bipes=[]; renderTudo();
        await opMarcarMao(S.romaneios[0].rows[0],'dv',false); await w(200);
        OP._semFiltro=true; const pend=opPendentes(); OP._semFiltro=false; out[pv?'caixa':'nota']=pend.map(i=>opK(i.x.nf)).join(','); }
      window.opQuantosMao=_q; S.opPorVolume=false; S.divergencias=[]; S.romaneios=[]; OP.bipes=[]; renderTudo(); return out; });
    ok(dvm.nota==='746347'&&dvm.caixa==='746347','divergência à mão: a nota com caixas faltando tinha que sair das pendentes (nota: '+dvm.nota+' · caixa a caixa: '+dvm.caixa+')'); }
  /* v10.6.15: ✕ num bipe de nota com vários volumes tira a nota inteira */
  { const dx=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); NV.perfil={papel:'admin',ativo:true,nome:'Teste'}; document.querySelectorAll('.fundo').forEach(f=>f.remove());
      const h=hojeISO(); OP.dia=h; OP.bipes=[]; for(let i=1;i<=5;i++) OP.bipes.push({local_id:'v'+i,nf:'746274',ped:'739270',vol:i,tot:5,status:'ok',dia:h,criado_em:new Date().toISOString()});
      OP.bipes.push({local_id:'o1',nf:'746159',ped:'739272',vol:1,tot:8,status:'ok',dia:h,criado_em:new Date().toISOString()});
      const _c=window.confirmar; window.confirmar=async()=>true; await oresApagar('v3'); window.confirmar=_c; await w(100);
      const r=OP.bipes.map(b=>b.local_id).join(','); OP.bipes=[]; return r; });
    ok(dx==='o1','apagar bipe: o ✕ tinha que tirar as 5 caixas da nota e deixar a outra ('+dx+')'); }
  /* v10.6.16: ✕ num duplicado tira só os duplicados; a conferida fica */
  { const dd=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); NV.perfil={papel:'admin',ativo:true,nome:'Teste'}; document.querySelectorAll('.fundo').forEach(f=>f.remove());
      const h=hojeISO(); OP.dia=h; const t=new Date().toISOString();
      OP.bipes=[{local_id:'c1',nf:'746274',ped:'739270',vol:1,tot:2,status:'ok',dia:h,criado_em:t},{local_id:'c2',nf:'746274',ped:'739270',vol:2,tot:2,status:'ok',dia:h,criado_em:t},
        {local_id:'d1',nf:'746274',ped:'739270',vol:1,tot:2,status:'dup',dia:h,criado_em:t},{local_id:'d2',nf:'746274',ped:'739270',vol:2,tot:2,status:'dup',dia:h,criado_em:t}];
      const _c=window.confirmar; window.confirmar=async()=>true; await oresApagar('d1'); window.confirmar=_c; await w(100);
      const r=OP.bipes.map(b=>b.local_id).join(','); OP.bipes=[]; return r; });
    ok(dd==='c1,c2','apagar duplicado: só os duplicados podiam sair, a conferida tinha que ficar ('+dd+')'); }
  /* v10.6.17: etiqueta MAFRA sem número que bata → acha pelo cliente; várias → escolher; nenhuma → ✕ lança fora com o pedido do QR */
  { const eq=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); NV.perfil={papel:'admin',ativo:true,nome:'T'}; document.querySelectorAll('.fundo').forEach(f=>f.remove());
      const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'eq1',numero:'0017824',base:'DF',arquivo:a,rows:[{nf:'46568',ped:'',vol:'1',dest:'ELAINE CRISTINA FARIA ABRAHAO',cid:'POCOS DE CALDAS',uf:'MG'},{nf:'46205',ped:'',vol:'1',dest:'CAROLINA FERNANDES PEREIRA',cid:'POUSO ALEGRE',uf:'MG'},{nf:'46300',ped:'',vol:'2',dest:'CAROLINA FERNANDES SILVA',cid:'POUSO ALEGRE',uf:'MG'}]}];
      OP.dia=h; OP.bipes=[]; renderTudo(); const R={}; const P=(dest,cid,qr)=>({dest,cid,nfs:[],nums:[],qr:qr?[qr]:[],tot:1,modelo:''});
      opLerEtiqueta(P('ELAINE CRISTINA FAR','CALDAS','045865')); await w(250); R.um=OP.bipes.map(b=>b.nf+':'+b.status).join(',');
      opLerEtiqueta(P('CAROLINA FERNANDES','POUSO ALEGRE','046159')); await w(150); const j=document.getElementById('etq-escolha'); R.n=j?j.querySelectorAll('.etq-op').length:0; R.ori=j?[...j.querySelectorAll('.etq-ori')].map(x=>x.textContent).join(','):''; if(j) j.querySelector('[data-etq-i="0"]').click(); await w(250);
      opLerEtiqueta(P('WALKIRIA SILVIA SANT','COTIA','051208')); await w(150); const j3=document.getElementById('etq-escolha'); if(j3) j3.querySelector('[data-etq-fora]').click(); await w(250);
      const bf=OP.bipes[0]; R.fora=bf&&(bf.status+':'+bf.ped); S.romaneios=[]; OP.bipes=[]; renderTudo(); return R; });
    ok(eq.um==='46568:ok','etiqueta por cliente: 1 nota batendo tinha que dar baixa direto ('+eq.um+')');
    ok(eq.ori==='DF,DF','etiqueta por cliente: cada opção tinha que mostrar a origem no canto ('+eq.ori+')'); ok(eq.n===2,'etiqueta por cliente: com 2 notas iguais tinha que abrir a janela de escolha ('+eq.n+')');
    ok(eq.fora==='fora:51208','etiqueta por cliente: o ✕ tinha que lançar fora com o pedido do QR ('+eq.fora+')'); }
  { /* v10.6.18 · relatório de divergências (Excel + PDF): só lê, não grava nada */
    const rl=await p.evaluate(async()=>{ const antes=JSON.stringify(S.divergencias||[]); const guard=S.divergencias;
      const h=hojeISO(), m=n=>{ const t=new Date(h+'T12:00'); t.setDate(t.getDate()-n); return t.toISOString().slice(0,10); };
      S.divergencias=[{id:'r1',n:1,d:m(2),nf:'111',ped:'P1',tipo:'Falta de volume',cli:'A & <B>',st:'aberta'},{id:'r2',n:2,d:m(40),nf:'222',tipo:'Sobra de volume',cli:'C',st:'resolvida',res:{d:m(36),obs:'ok'}},
        {id:'r3',n:3,d:h,nf:'333',tipo:'Falta de volume',cli:'A & <B>',st:'apareceu',apareceu:{d:h,rom:'9'}},{id:'av',n:4,d:h,cat:'av',tipo:'Avaria',st:'aberta'}];
      const snap=JSON.stringify(S.divergencias);
      DVR.per='tudo'; DVR.st='todas'; const todas=dvrLista().map(d=>d.id).join(',');
      DVR.per='7'; const sete=dvrLista().length; DVR.per='tudo'; DVR.st='pend'; const pend=dvrLista().length; DVR.st='todas';
      const c=dvrConta(dvrLista()); const blob=dvrXLSX(dvrLista(),dvrPeriodo()); const u=new Uint8Array(await blob.arrayBuffer());
      const txt=new TextDecoder().decode(u); const html=dvrHTML(dvrLista(),dvrPeriodo());
      const r={todas,sete,pend,pk:u[0]===0x50&&u[1]===0x4B,abas:/name="Resumo"/.test(txt)&&/name="Divergências"/.test(txt),esc:/A &amp; &lt;B&gt;/.test(txt)&&!/A & <B>/.test(txt),
        htmlEsc:html.includes('A &amp; &lt;B&gt;'),rod:html.includes('Grupo VIVEO'),media:c.media,intacto:JSON.stringify(S.divergencias)===snap};
      S.divergencias=guard; return r; });
    ok(rl.todas==='r3,r1,r2','relatório: a lista tinha que vir sem a avaria e da mais nova para a mais velha ('+rl.todas+')');
    ok(rl.sete===2&&rl.pend===2,'relatório: filtro de período/situação errado (7 dias='+rl.sete+', pendentes='+rl.pend+')');
    ok(rl.pk&&rl.abas,'relatório: o Excel não saiu como .xlsx com as abas Resumo e Divergências');
    ok(rl.esc&&rl.htmlEsc,'relatório: texto do cliente não foi protegido no Excel/PDF');
    ok(rl.rod,'relatório: PDF sem o rodapé da empresa'); ok(rl.media===4,'relatório: média de dias até resolver errada ('+rl.media+')');
    ok(rl.intacto,'relatório: gerar o relatório mexeu nos dados'); }
  { /* v10.6.21 · caixas escritas à mão (3/10, 10/10, 1/1): guardadas em faltM e mostradas em todo lugar */
    const cm=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const guard=S.divergencias; S.divergencias=[];
      const r={}; r.lista=volListaM(['3/10','10/10','1/1']); r.grade=dvCaixas({falt:[2,4],tot:5}); r.mao=dvCaixas({falt:[2],tot:5,faltM:['1/2','2/2']});
      const pr=volEscrever(12,[]); await w(80); const A=document.querySelector('#ve-a'),B=document.querySelector('#ve-b');
      A.value='03'; B.value='10'; document.querySelector('#ve-f button').click(); A.value='5'; B.value='2'; document.querySelector('#ve-f button').click();
      r.travou=document.querySelectorAll('.ve-chip').length; A.value=''; B.value=''; A.value='1'; B.value='1'; document.querySelector('[data-ve="ok"]').click(); r.esc=JSON.stringify(await pr);
      const b={ped:'P77',nf:'N77',dest:'X'}; try{ opConfFalta(b,12,10,'',['3/10','1/1']); }catch(e){ r.err=e.message; }
      const d=dvAcha('P77','N77'); r.d=d?[d.qtd,JSON.stringify(d.faltM),String(d.falt),d.obs].join('|'):'sem';
      document.querySelectorAll('.fundo').forEach(f=>f.remove()); S.divergencias=guard; return r; });
    ok(cm.lista==='3/10, 10/10 e 1/1','caixas à mão: lista mal escrita ('+cm.lista+')');
    ok(cm.grade==='2/5 e 4/5'&&cm.mao==='1/2 e 2/2','caixas à mão: grade/escritas mostradas errado ('+cm.grade+' | '+cm.mao+')');
    ok(cm.travou===1,'caixas à mão: 5/2 não podia entrar ('+cm.travou+')');
    ok(cm.esc==='["3/10","1/1"]','caixas à mão: a janela devolveu errado ('+cm.esc+')');
    ok(cm.d==='2|["3/10","1/1"]|null|faltaram as caixas 3/10 e 1/1','caixas à mão: divergência gravada errada ('+cm.d+(cm.err?' '+cm.err:'')+')'); }
  { /* v10.6.32 · NexBip simples: etiqueta fracionada ignorada — mesmo número de caixa = duplicada, sem pergunta; total = do pedido */
    const fr=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); NV.perfil={papel:'admin',ativo:true,nome:'T'}; document.querySelectorAll('.fundo').forEach(f=>f.remove());
      const h=hojeISO(), arq='x '+h.split('-').reverse().join('-')+'.pdf'; const rs=S.romaneios;
      S.romaneios=[{id:'fr1',numero:'1',base:'CAJ',arquivo:arq,rows:[{nf:'50001',ped:'739273',vol:'15',dest:'HOSPITAL'},{nf:'50002',ped:'733772',vol:'2',dest:'VACCINE'}]}];
      OP.dia=h; OP.bipes=[]; renderTudo(); const Q=(c,t,pd)=>'12420164002109@'+String(c).padStart(4,'0')+'@'+String(t).padStart(4,'0')+'@'+pd; const r={};
      const ler=async(c,t,pd)=>{ OP.ultLeitura=0; opLer([Q(c,t,pd)],'teclado'); await w(30); };
      await ler(9,13,'739273'); r.tot=OP.bipes[0].tot+'|'+OP.bipes[0].vol;
      await ler(1,1,'733772'); await ler(1,1,'733772'); r.igual=OP.bipes[0].status+' perg='+!!document.querySelector('.fundo');
      const n1=OP.bipes.length; OP.ultLeitura=0; opLer(['10067143'],'teclado'); await w(30); r.pallet=OP.bipes.length===n1;
      OP.ultLeitura=0; opLer([Q(2,13,'739273'),'10093019'],'teclado'); await w(30); r.palletCampo=OP.bipes[0].pallet;
      document.querySelectorAll('.fundo').forEach(f=>f.remove()); OP.bipes=[]; S.romaneios=rs; return r; });
    ok(fr.tot==='15|9','NexBip: o total tinha que ser o do pedido no romaneio (15), caixa 9 ('+fr.tot+')');
    ok(fr.igual==='dup perg=false','NexBip: etiqueta repetida tinha que ser duplicada, sem pergunta ('+fr.igual+')');
    ok(fr.pallet,'pallet de 8 dígitos sozinho virou bipe'); ok(fr.palletCampo==='10093019','pallet de 8 dígitos não foi guardado no bipe ('+fr.palletCampo+')'); }
  /* v10.0.1: o Painel do gestor mostra o dia escolhido e começa no último dia que teve bipe */
  { const gs=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const ont=diaLocal(new Date(Date.now()-864e5).toISOString()); /* ontem no fuso local: às 21h o UTC já virou e o teste quebrava sozinho */
      const bs=[]; for(let i=0;i<12;i++) bs.push({nf:String(900+i),status:'ok',usuario:'TIAGO SOUZA',criado_em:ont+'T1'+(i%2?'4':'0')+':00:00.000Z'});
      bs.push({nf:'999',status:'ok',usuario:'CHRISTIAN L',criado_em:ont+'T15:00:00.000Z'});
      localStorage.setItem(OP_LOCAL+ont,JSON.stringify(bs));
      const guardaHoje=localStorage.getItem(OP_LOCAL+hojeISO());
      localStorage.removeItem(OP_LOCAL+hojeISO()); OP.bipes=[]; OP.dia=hojeISO(); GS.dia='';
      irPara('gestor'); await w(500);
      const txt=(document.getElementById('gs-corpo')||{}).innerText||'';
      const sel=document.getElementById('gs-dia');
      const r={dia:gsDia(),ont,sel:!!sel,val:sel&&sel.value,pessoa:/CHRISTIAN/.test(txt),hora:/Bipes \(por hora/.test(txt),nBip:gsBipes(ont).length};
      localStorage.removeItem(OP_LOCAL+ont); if(guardaHoje) localStorage.setItem(OP_LOCAL+hojeISO(),guardaHoje); GS.dia=''; return r; });
    ok(gs.dia===gs.ont,'gestor: tinha que começar no último dia com bipe ('+gs.dia+' ≠ '+gs.ont+')');
    ok(gs.sel&&gs.val===gs.ont,'gestor: falta o seletor de dia ('+gs.val+')');
    ok(gs.nBip===13,'gestor: tinha que ler os 13 bipes gravados naquele dia ('+gs.nBip+')');
    ok(gs.pessoa&&gs.hora,'gestor: bipes por hora e por pessoa precisam sair do dia escolhido'); }
  /* v10.1.0: cargos (Anexo I), tela inicial por cargo, mural do dia e Painel de Gestão */
  { const cg=await p.evaluate(()=>{
      const r={};
      r.cfVe=cargoPodeVer('conftotal','conferente'); r.cfNao=cargoPodeVer('usuarios','conferente');
      r.cfRe=cargoPodeVer('reentregas','conferente');
      r.usVe=cargoPodeVer('operacao','usuario'); r.usNao=cargoPodeVer('conftotal','usuario');
      r.supVe=cargoPodeVer('reentregas','supervisor'); r.supNao=cargoPodeVer('usuarios','supervisor');
      r.ldVe=cargoPodeVer('romaneios','lider'); r.admEva=cargoPodeVer('eva','admin'); r.supEva=cargoPodeVer('eva','supervisor');
      r.cargos=Object.keys(CARGOS).join(',');
      return r; });
    ok(cg.cfVe&&!cg.cfNao&&!cg.cfRe,'cargo: o Conferente vê Conferência total e não vê Usuários nem Reentregas');
    ok(cg.usVe&&!cg.usNao,'cargo: o Usuário só chega no NexBip, não na Conferência total');
    ok(cg.supVe&&!cg.supNao,'cargo: o Supervisor vê tudo menos o que é só do Admin');
    ok(cg.ldVe,'cargo: o Líder vê os romaneios');
    ok(cg.cargos==='admin,lider,supervisor,conferente,usuario','cargo: faltam cargos do Anexo I ('+cg.cargos+')'); }
  { const mu=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      muralAbrir(); await w(350); murArrumar();
      const g=document.querySelector('#mural .mural-g');
      const tit=[...g.querySelectorAll('.mural-c h3')].map(h=>h.textContent.trim());
      const pri=g.firstElementChild;
      return {tit,topo:!!(pri&&pri.classList.contains('mural-topo')),
        primeiro:(pri&&pri.querySelector('h3')||{}).textContent||'',
        larg:pri?getComputedStyle(pri).gridColumn:'',
        bit:!document.getElementById('eva-bt')}; });
    const fora=t=>mu.tit.some(x=>new RegExp(t,'i').test(x));
    ok(/Opera/i.test(mu.primeiro)&&mu.topo,'mural: Operação tem que abrir o mural, grande, na primeira linha ('+mu.primeiro+')');
    ok(/1 \/ -1|1\/-1/.test(mu.larg),'mural: o quadro da Operação tem que ocupar a linha toda ('+mu.larg+')');
    ok(!fora('sem regi'),'mural: "Cidades sem região" tinha que sair');
    ok(!fora('via minas'),'mural: "Via Minas" tinha que sair');
    ok(!fora('fora.*romaneio'),'mural: "Fora do Romaneio" tinha que sair');
    ok(!mu.tit.some(x=>/^Agendamentos$/i.test(x.trim())),'mural: o quadro "Agendamentos" tinha que sair (já tem o da mesa)');
    ok(!mu.tit.some(x=>/MESA/i.test(x)),'mural: tirar o "(MESA)" do título dos agendados');
    ok(fora('feriados'),'mural: "Feriados (próximos 3 dias)" tinha que ficar');
    ok(mu.bit===true,'mural: o BIT não aparece nessa tela'); }
  { const gp=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      muralFechar&&muralFechar(); irPara('gestor'); await w(400);
      const tit=(document.querySelector('#t-gestor h1')||{}).textContent||'';
      const txt=(document.getElementById('gs-corpo')||{}).innerText||'';
      const f=gsFotoMontar();
      return {tit,temCartao:/Confer(ê|e)ncia de/i.test(txt),pdf:!!document.querySelector('[data-gs-pdf]'),
        foto:f?{pct:f.pct,tn:f.tn,falta:Array.isArray(f.falta)}:null}; });
    ok(/Painel de Gest(ã|a)o/i.test(gp.tit),'painel: o nome tem que ser "Painel de Gestão" ('+gp.tit+')');
    ok(gp.temCartao,'painel: falta o cartão com a porcentagem real do dia');
    ok(gp.pdf,'painel: falta o botão do PDF para projetor');
    ok(!gp.foto||(typeof gp.foto.pct==='number'&&gp.foto.falta),'painel: a foto do dia precisa ter porcentagem e a lista do que não entrou'); }
  /* v10.1.1: a conferência por origem tem que ser do DIA ESCOLHIDO, remontada do banco de romaneios */
  { const px=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const ant='2026-10-20';
      const guardaRB=localStorage.getItem(RB.local), guardaBip=localStorage.getItem(OP_LOCAL+ant), guardaSnap=JSON.stringify(S.gsSnap||{});
      const L={}; L[ant]={};
      L[ant][ant+'|CAJ1']={id:ant+'|CAJ1',dia:ant,base:'CAJ',motorista:'JOAO',rows:[
        {nf:'800001',ped:'P1',dest:'CLI A',cid:'ARARAQUARA',vol:'1'},
        {nf:'800002',ped:'P2',dest:'CLI B',cid:'BAURU',vol:'1'}]};
      L[ant][ant+'|DF1']={id:ant+'|DF1',dia:ant,base:'DF',motorista:'PEDRO',rows:[
        {nf:'800003',ped:'P3',dest:'CLI C',cid:'MARILIA',vol:'1'},
        {nf:'800004',ped:'P4',dest:'CLI D',cid:'BOTUCATU',vol:'1'}]};
      localStorage.setItem(RB.local,JSON.stringify(L));
      localStorage.setItem(OP_LOCAL+ant,JSON.stringify([
        {nf:opK('800001'),ped:opK('P1'),status:'ok',dia:ant,local_id:'x1',criado_em:ant+'T12:00:00.000Z'}]));
      delete (S.gsSnap||{})[ant];
      const f=await gsFotoDeDiaPassado(ant);
      GS.dia=ant; irPara('gestor'); await w(300); gestorRender(); await w(1200);
      const txt=(document.getElementById('gs-corpo')||{}).innerText||'';
      const box=[...document.querySelectorAll('#gs-corpo .gs-box')].find(b=>/por origem/i.test((b.querySelector('h3')||{}).textContent||''));
      const r={foto:f?{tn:f.tn,fn:f.fn,pct:f.pct,orig:(f.orig||[]).map(o=>o.base+':'+o.tn+'/'+o.fn).sort().join(' ')}:null,
        boxTxt:box?box.innerText.replace(/\s+/g,' '):'', tit:box?(box.querySelector('h3')||{}).textContent:'',
        remontar:!!document.querySelector('[data-gs-remontar]')};
      localStorage.setItem(RB.local,guardaRB||'{}'); if(guardaBip) localStorage.setItem(OP_LOCAL+ant,guardaBip); else localStorage.removeItem(OP_LOCAL+ant);
      S.gsSnap=JSON.parse(guardaSnap); GS.dia=''; return r; });
    ok(px.foto&&px.foto.tn===4&&px.foto.fn===3,'dia passado: tinha que contar 4 notas, 3 sem conferir ('+JSON.stringify(px.foto)+')');
    ok(px.foto&&px.foto.pct===25,'dia passado: a porcentagem do dia tinha que ser 25% ('+(px.foto&&px.foto.pct)+')');
    ok(/CAJ:2\/1 DF:2\/2/.test(px.foto&&px.foto.orig||''),'dia passado: origem errada ('+(px.foto&&px.foto.orig)+')');
    ok(/20\/10\/2026/.test(px.tit),'dia passado: o título da origem tem que ser do dia escolhido ('+px.tit+')');
    ok(/50%/.test(px.boxTxt)&&/0%/.test(px.boxTxt),'dia passado: o quadro por origem tem que mostrar CAJ 50% e DF 0% ('+px.boxTxt+')');
    ok(px.remontar,'painel: falta o botão de remontar o histórico'); }
  /* v10.1.1: conferência de integridade — o que existe na nuvem e sumiu daqui volta sozinho */
  { const ig=await p.evaluate(()=>{ const h={'dv:abc':'h1','dv:def':'x','re:2026-10-01':'h2','s:cadMot':'h3'};
      const guarda=JSON.stringify((window.NUV&&NUV.h)||{}); window.NUV=window.NUV||{}; NUV.h=h;
      const antes=S.divergencias; S.divergencias=[{id:'abc',cat:'dv',st:'aberta'}];
      const f=integFalta(); S.divergencias=antes; NUV.h=JSON.parse(guarda);
      return {f,tem:typeof integConferir==='function'}; });
    ok(ig.tem,'integridade: falta a função de conferir o aparelho contra a nuvem');
    ok(!ig.f.includes('dv:abc'),'integridade: não pode pedir de volta o que já está aqui');
    ok(!ig.f.includes('dv:def'),'integridade: o que foi apagado de propósito não volta');
    ok(ig.f.includes('re:2026-10-01'),'integridade: reentrega que existe na nuvem e sumiu daqui tem que voltar'); }
  /* v10.1.2: escolher o que sai no relatório antes de gerar o PDF */
  { const es=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const ant='2026-10-21';
      S.gsSnap=S.gsSnap||{}; S.gsSnap[ant]={dia:ant,tn:10,fn:1,tv:12,fv:1,pct:90,pctVol:92,roms:2,dv:0,bipes:9,
        orig:[{base:'CAJ',mot:'REGINALDO SOUZA',tn:6,fn:0,tv:7,fv:0},{base:'DF',mot:'',tn:4,fn:1,tv:5,fv:1}],
        falta:[{nf:'900001',ped:'P9',cli:'CLI Z',cid:'BAURU',base:'DF',vol:1,lidos:0}]};
      gsPdfEscolher(ant); await w(200);
      const m=document.querySelector('.fundo .modal');
      const cx=[...document.querySelectorAll('[data-gsr]')].map(c=>c.dataset.gsr);
      const obs=!!document.getElementById('gsr-obs');
      const r={cx,obs,tem:!!m,tit:m?(m.querySelector('h2')||{}).textContent:''};
      document.querySelector('[data-gsr-x]').click(); await w(100);
      r.fechou=!document.querySelector('.fundo .modal [data-gsr]');
      delete S.gsSnap[ant]; return r; });
    ok(es.tem&&/21\/10\/2026/.test(es.tit),'relatório: falta a janela de escolher o que sai ('+es.tit+')');
    ok(es.cx.length===6&&es.cx.includes('falta')&&es.cx.includes('pessoa'),'relatório: faltam opções para marcar ('+es.cx.join(',')+')');
    ok(es.obs,'relatório: falta o campo de observação para a diretoria');
    ok(es.fechou,'relatório: a janela tem que fechar no Cancelar'); }
  { const pdf=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const ant='2026-10-22';
      S.gsSnap=S.gsSnap||{}; S.gsSnap[ant]={dia:ant,tn:10,fn:2,tv:12,fv:2,pct:80,pctVol:83,roms:1,dv:0,bipes:8,
        orig:[{base:'CAJ',mot:'REGINALDO SOUZA',tn:10,fn:2,tv:12,fv:2}],
        falta:[{nf:'900002',ped:'P8',cli:'CLI Y',cid:'MARILIA',base:'CAJ',vol:1,lidos:0}]};
      let html=''; const _open=window.open;
      window.open=()=>({document:{write:t=>{html+=t;},close(){}},focus(){},print(){}});
      gsPdfProjetor(ant,{pct:true,orig:true,falta:false,dv:false,pessoa:false,hora:false,obs:'Fechamos 100% com 3 conferentes'});
      await w(50);
      const semFalta=html;
      html=''; gsPdfProjetor(ant,{pct:false,orig:false,falta:true,dv:false,pessoa:false,hora:false,obs:''});
      await w(50);
      const soFalta=html; window.open=_open; delete S.gsSnap[ant];
      return {semFaltaTemLista:/O que não entrou/.test(semFalta),semFaltaTemPct:/class="pct"/.test(semFalta),
        semFaltaObs:/3 conferentes/.test(semFalta), semFaltaOrig:/Por origem/.test(semFalta),
        soFaltaTemLista:/O que não entrou/.test(soFalta), soFaltaTemPct:/class="pct"/.test(soFalta),
        soFaltaOrig:/Por origem/.test(soFalta), rodape:/uso interno/.test(semFalta)}; });
    ok(!pdf.semFaltaTemLista&&pdf.semFaltaTemPct&&pdf.semFaltaOrig,'relatório: desmarcar "o que não entrou" tem que tirar a lista e manter o resto');
    ok(pdf.semFaltaObs,'relatório: a observação digitada tem que sair no PDF');
    ok(pdf.soFaltaTemLista&&!pdf.soFaltaTemPct&&!pdf.soFaltaOrig,'relatório: marcar só a lista tem que tirar a porcentagem e a origem');
    ok(pdf.rodape,'relatório: o rodapé de uso interno tem que sair sempre'); }
  /* v10.1.3: nota que estava em divergência não volta como reentrega — é o volume que faltou chegando */
  { const dvr=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const hoje=hojeISO(), ont='2026-11-13';
      const guardaRom=JSON.stringify(S.romaneios||[]), guardaDv=JSON.stringify(S.divergencias||[]);
      const guardaNex=JSON.stringify(nexS()), guardaFeito=JSON.stringify(S.reFeito||{});
      const rid='T-DVRE-1';
      S.romaneios=[{id:rid,numero:'900',base:'CAJ',motorista:'REGINALDO',dia:hoje,rows:[
        {nf:'742414',ped:'735678',dest:'SANTA CASA FRANCA',cid:'FRANCA',uf:'SP',vol:'1'},
        {nf:'742415',ped:'735679',dest:'CLIENTE COMUM',cid:'BAURU',uf:'SP',vol:'1'}]}];
      S.divergencias=[{id:'dv-teste-1',n:7,cat:'dv',st:'aberta',tipo:'Falta de volume',d:ont,
        nf:'742414',ped:'735678',cli:'SANTA CASA FRANCA',qtd:1,obs:'faltou 1 volume'}];
      const n=nexS(); n.reent={};
      n.reent['742414']={status:'suspeita',rom:rid,d:hoje,anterior:ont,romAnt:'0236361',num:'EXTRA I',nf:'742414',ped:'735678'};
      n.reent['742415']={status:'suspeita',rom:rid,d:hoje,anterior:ont,romAnt:'0236361',num:'EXTRA I',nf:'742415',ped:'735679'};
      S.reFeito={};
      await nexAbrirSuspeitas(); await w(300);
      const trs=[...document.querySelectorAll('.modal.largo tr[data-k]')];
      const comDv=trs.filter(t=>t.dataset.dvid).map(t=>t.dataset.k);
      const txtDv=trs.find(t=>t.dataset.dvid), txt=txtDv?txtDv.innerText.replace(/\s+/g,' '):'';
      const temMotivo=txtDv?!!txtDv.querySelector('[data-mot]'):true;
      /* confirma: a divergência tem que receber baixa e NÃO virar reentrega */
      const outra=trs.find(t=>!t.dataset.dvid); if(outra) outra.querySelector('[data-ign]').checked=true;
      document.querySelector('.modal.largo [data-a="ok"]').click(); await w(500);
      const d=(S.divergencias||[])[0];
      const reDoDia=((RE.ler().dias||{})[hoje]||[]).filter(x=>String(x.nf||'')==='742414').length;
      const r={comDv,txt,temMotivo,st:d&&d.st,res:d&&d.res&&d.res.obs||'',hist:(d&&d.hist||[]).length,reDoDia};
      S.romaneios=JSON.parse(guardaRom); S.divergencias=JSON.parse(guardaDv); S.reFeito=JSON.parse(guardaFeito);
      try{ const nn=nexS(); const g=JSON.parse(guardaNex); nn.reent=g.reent||{}; }catch(e){}
      document.querySelectorAll('.fundo').forEach(x=>x.remove()); return r; });
    ok(dvr.comDv.length===1&&dvr.comDv[0]==='742414','divergência: só a nota que estava em divergência pode ser marcada ('+dvr.comDv.join(',')+')');
    ok(/faltou chegou/i.test(dvr.txt)&&/#007/.test(dvr.txt),'divergência: a linha tem que dizer que é o volume que faltou e o número da divergência ('+dvr.txt+')');
    ok(!dvr.temMotivo,'divergência: essa linha não pode pedir motivo nem motorista de reentrega');
    ok(dvr.st==='resolvida','divergência: ao confirmar, a divergência tinha que receber baixa ('+dvr.st+')');
    ok(/chegou no romaneio/i.test(dvr.res)&&dvr.hist>=1,'divergência: a baixa tem que registrar o romaneio que trouxe o volume ('+dvr.res+')');
    ok(dvr.reDoDia===0,'divergência: a nota não pode entrar como reentrega do dia'); }
  /* v10.1.4: conta fiel — marcação à mão conta, divergência conta como conferida e sai em laranja */
  { const fi=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const ant='2026-10-23';
      const gRB=localStorage.getItem(RB.local), gBip=localStorage.getItem(OP_LOCAL+ant), gDv=JSON.stringify(S.divergencias||[]), gSnap=JSON.stringify(S.gsSnap||{});
      const L={}; L[ant]={}; L[ant][ant+'|R1']={id:ant+'|R1',dia:ant,base:'CAJ',motorista:'REGINALDO SOUZA',rows:[
        {nf:'810001',ped:'A1',dest:'C1',cid:'FRANCA',vol:'1'},{nf:'810002',ped:'A2',dest:'C2',cid:'BAURU',vol:'1'},
        {nf:'810003',ped:'A3',dest:'C3',cid:'MARILIA',vol:'1'},{nf:'810004',ped:'A4',dest:'C4',cid:'ASSIS',vol:'1'}]};
      localStorage.setItem(RB.local,JSON.stringify(L));
      /* 2 bipes normais, 1 bipe "à mão" (mesma gravação), 1 nota só com divergência */
      localStorage.setItem(OP_LOCAL+ant,JSON.stringify([
        {nf:opK('810001'),ped:opK('A1'),status:'ok',dia:ant,local_id:'b1',criado_em:ant+'T10:00:00.000Z'},
        {nf:opK('810002'),ped:opK('A2'),status:'ok',dia:ant,local_id:'b2',criado_em:ant+'T10:05:00.000Z'},
        {nf:opK('810003'),ped:opK('A3'),status:'ok',dia:ant,local_id:'b3',origem:'mão',criado_em:ant+'T10:09:00.000Z'}]));
      S.divergencias=[{id:'dvx',n:9,cat:'dv',st:'aberta',tipo:'Falta de volume',d:ant,nf:'810004',ped:'A4',qtd:1,por:'OUTRA PESSOA'}];
      delete (S.gsSnap||{})[ant];
      const f=await gsFotoDeDiaPassado(ant);
      S.gsSnap=S.gsSnap||{}; S.gsSnap[ant]=f; GS.dia=ant; irPara('gestor'); await w(400); gestorRender(); await w(300);
      const box=[...document.querySelectorAll('#gs-corpo .gs-box')].find(b=>/por origem/i.test((b.querySelector('h3')||{}).textContent||''));
      const barras=box?box.querySelector('.gs-b2'):null;
      const cores=barras?[...barras.querySelectorAll('b')].map(x=>x.getAttribute('style')||''):[];
      const cartao=(document.getElementById('gs-corpo')||{}).innerText||'';
      const r={pct:f&&f.pct,pctOk:f&&f.pctOk,pctDv:f&&f.pctDv,dn:f&&f.dn,fn:f&&f.fn,
        duas:cores.length===2,laranja:cores.some(c=>/F59F00/i.test(c)),
        legenda:/em divergência/i.test(box?box.innerText:''),cartaoDv:/em divergência/i.test(cartao)};
      localStorage.setItem(RB.local,gRB||'{}'); if(gBip) localStorage.setItem(OP_LOCAL+ant,gBip); else localStorage.removeItem(OP_LOCAL+ant);
      S.divergencias=JSON.parse(gDv); S.gsSnap=JSON.parse(gSnap); GS.dia=''; return r; });
    ok(fi.pct===100&&fi.fn===0,'conta fiel: o dia tinha que fechar 100% (nota em divergência conta como conferida) ('+fi.pct+'%, faltando '+fi.fn+')');
    ok(fi.pctDv===25&&fi.dn===1,'conta fiel: 1 das 4 notas é divergência, tinha que marcar 25% ('+fi.pctDv+'%)');
    ok(fi.pctOk===75,'conta fiel: o verde tinha que ser 75% ('+fi.pctOk+'%)');
    ok(fi.duas&&fi.laranja,'conta fiel: a barra tem que ter o pedaço laranja da divergência');
    ok(fi.legenda&&fi.cartaoDv,'conta fiel: falta dizer na tela quanto foi conferido em divergência'); }
  /* v10.1.4: bipes de dia já fotografado saem do aparelho; limpeza das reentregas que eram divergência */
  { const ex=await p.evaluate(async()=>{ const velho='2026-09-15';
      const gSnap=JSON.stringify(S.gsSnap||{});
      localStorage.setItem(OP_LOCAL+velho,JSON.stringify([{nf:'1',status:'ok',dia:velho,local_id:'z1'}]));
      S.gsSnap=S.gsSnap||{}; S.gsSnap[velho]={dia:velho,tn:5,fn:0,pct:100,orig:[],falta:[]};
      const antes=!!localStorage.getItem(OP_LOCAL+velho);
      const r1=await gsEnxugarBipes(false);
      const depois=!!localStorage.getItem(OP_LOCAL+velho);
      /* dia sem foto não pode ser apagado sem remontar */
      const semFoto='2026-09-16'; localStorage.setItem(OP_LOCAL+semFoto,JSON.stringify([{nf:'2',status:'ok',dia:semFoto,local_id:'z2'}]));
      await gsEnxugarBipes(false);
      const ficou=!!localStorage.getItem(OP_LOCAL+semFoto);
      localStorage.removeItem(OP_LOCAL+semFoto); S.gsSnap=JSON.parse(gSnap);
      return {antes,depois,dias:r1.dias,ficou}; });
    ok(ex.antes&&!ex.depois&&ex.dias>=1,'espaço: bipe de dia com foto tinha que sair do aparelho');
    ok(ex.ficou,'espaço: dia sem foto não pode perder os bipes'); }
  { const cd=await p.evaluate(()=>{ const D=RE.ler(); const g=JSON.stringify(D.dias||{});
      D.dias['2026-11-13']=[{nf:'742414',cli:'SANTA CASA',motivo:'ERA DIVERGENCIA (CHEGARAM OS VOLUMES)'},
        {nf:'742499',cli:'OUTRO',motivo:'DIVERGENCIA #003 · FALTA DE VOLUME'},
        {nf:'742500',cli:'NORMAL',motivo:'FERIADO NA CIDADE'}];
      const achou=corEraDv().length; const csv=corEraDvCsv(corEraDv());
      D.dias=JSON.parse(g); RE.gravar();
      return {achou,csv:csv.slice(0,80),temBom:/FERIADO/.test(csv)}; });
    ok(cd.achou===2,'limpeza: tinha que achar as 2 reentregas que eram divergência ('+cd.achou+')');
    ok(!cd.temBom,'limpeza: reentrega de verdade não pode entrar na planilha de exclusão');
    ok(/Dia;|"Dia"/.test(cd.csv),'limpeza: a planilha precisa sair com cabeçalho ('+cd.csv+')'); }
  { const nb=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const gDv=JSON.stringify(S.divergencias||[]), gAv=JSON.stringify(S.dvAvisos||[]);
      S.divergencias=[{id:'dvb',n:11,cat:'dv',st:'aberta',tipo:'Falta de volume',d:hojeISO(),nf:'820001',ped:'B1',qtd:2,por:'MARIA DA SILVA'}];
      irPara('operacao'); await w(200);
      opMostrar({titulo:'NF 820001',linha:'teste',status:'ok',_ped:opK('B1'),_nf:opK('820001')}); await w(150);
      const bar=document.getElementById('op-dvacao');
      let R2perg=null; const tem=!!(bar&&bar.querySelector('[data-dvbaixa]'));
      if(tem) bar.querySelector('[data-dvbaixa]').click(); await w(150);
      /* v10.6.26: faltando 2 ou mais, pergunta quantos chegaram — aqui chegaram todos */
      { const ok2=document.querySelector('[data-dpc="ok"]'); R2perg=!!ok2; if(ok2){ ok2.click(); } } await w(300);
      const d=(S.divergencias||[])[0];
      const r={tem,st:d&&d.st,obs:(d&&d.res&&d.res.obs)||'',avisos:(S.dvAvisos||[]).length,
        para:((S.dvAvisos||[])[0]||{}).para||'',sumiu:!document.getElementById('op-dvacao')};
      S.divergencias=JSON.parse(gDv); S.dvAvisos=JSON.parse(gAv); return r; });
    ok(nb.tem,'bipe: falta o botão "dar baixa agora" quando a nota é de uma divergência');
    ok(nb.st==='resolvida'&&/faltou chegou/i.test(nb.obs),'bipe: o botão tinha que dar baixa na divergência ('+nb.st+')');
    ok(nb.avisos===1&&/MARIA/.test(nb.para),'bipe: quem abriu a divergência tem que ser avisado ('+nb.para+')');
    ok(nb.sumiu,'bipe: depois da baixa o aviso sai da tela'); }
  /* v10.1.5: gravação que falha não passa batida e nada fica só no aparelho */
  { const gv=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const orig=localStorage.setItem.bind(localStorage); let tentou=0;
      localStorage.setItem=function(k,v){ if(k===Store.chave){ tentou++; const er=new Error('QuotaExceededError'); er.name='QuotaExceededError'; throw er; } return orig(k,v); };
      await Store.salvar({teste:1}); await w(300);
      const faixa=document.getElementById('grav-falha');
      const r={tentou,faixa:!!faixa,txt:faixa?faixa.innerText.replace(/\s+/g,' ').slice(0,90):''};
      localStorage.setItem=orig;
      await Store.salvar(S); await w(100);
      r.sumiu=!document.getElementById('grav-falha');
      return r; });
    ok(gv.tentou>=2,'gravação: quando o aparelho recusa, o app tem que liberar espaço e tentar de novo ('+gv.tentou+')');
    ok(gv.faixa&&/não está conseguindo gravar/i.test(gv.txt),'gravação: falha tem que virar faixa fixa na tela, não um toast que some');
    ok(gv.sumiu,'gravação: quando volta a gravar, a faixa tem que sair'); }
  { const pd=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const g=NUV.sujo, gd=NUV.sujoDesde;
      nuvAgendar(); const sujo=!!NUV.sujo;
      NUV.sujoDesde=Date.now()-120000; pendFaixa(); await w(50);
      const faixa=!!document.getElementById('pend-aviso');
      nuvSujo(false); pendFaixa();
      const sumiu=!document.getElementById('pend-aviso');
      NUV.sujo=g; NUV.sujoDesde=gd;
      return {sujo,faixa,sumiu}; });
    ok(pd.sujo,'nuvem: mudança local tem que marcar que há coisa para subir');
    ok(pd.faixa,'nuvem: se demorar para subir, tem que avisar na tela');
    ok(pd.sumiu,'nuvem: depois que sobe, o aviso sai'); }
  /* v10.1.7: foto do dia em tabela própria, cobrança da cópia da semana e aviso de espaço da equipe */
  { const ft=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const dia='2026-10-24'; let up=null, pediu=null;
      const velho=NV.cli; NV.cli={from(t){ return {
        upsert:(o)=>{ up={t,o}; return Promise.resolve({error:null}); },
        select:()=>({eq:()=>({maybeSingle:()=>{ pediu=t; return Promise.resolve({data:{dados:{dia,tn:9,fn:0,pct:100,orig:[],falta:[]}},error:null}); }}),
                     order:()=>({limit:()=>Promise.resolve({data:[{dia}],error:null})})}) }; }};
      const gUser=NV.user; NV.user=NV.user||{id:'teste'}; /* opOnline() = NV.cli && NV.user */
      const gSnap=JSON.stringify(S.gsSnap||{}); delete (S.gsSnap||{})[dia];
      const ok1=await gsFotoNuvemGravar({dia,tn:5,fn:0,pct:100},true);
      const f=await gsGarantirFoto(dia);
      S.gsSnap=JSON.parse(gSnap); NV.cli=velho; NV.user=gUser;
      return {ok1,tabela:up&&up.t,temDia:!!(up&&up.o&&up.o.dia),pediu,achou:!!(f&&f.tn===9)}; });
    ok(ft.ok1&&ft.tabela==='hs_fotos'&&ft.temDia,'foto: a foto do dia tem que ser gravada na tabela própria ('+ft.tabela+')');
    ok(ft.pediu==='hs_fotos'&&ft.achou,'foto: dia sem foto no aparelho tem que vir da tabela antes de remontar'); }
  { const sx=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const g=localStorage.getItem('healthSearch.bkSemana'); const gAdm=window.nvAdmin;
      window.nvAdmin=()=>true;
      localStorage.removeItem('healthSearch.bkSemana');
      const hj=new Date(), dow=(hj.getDay()+6)%7;
      const faltaHoje=semBkFalta();
      localStorage.setItem('healthSearch.bkSemana',hojeISO());
      const depois=semBkFalta();
      const segunda=semSegunda(hojeISO());
      if(g) localStorage.setItem('healthSearch.bkSemana',g); else localStorage.removeItem('healthSearch.bkSemana');
      window.nvAdmin=gAdm;
      return {dow,faltaHoje,depois,segunda,alto:ESPE.alto}; });
    ok(sx.dow<4||sx.faltaHoje,'cópia da semana: de sexta em diante, sem cópia na semana, tem que cobrar');
    ok(!sx.depois,'cópia da semana: depois de baixar, não pode continuar cobrando');
    ok(/^\d{4}-\d{2}-\d{2}$/.test(sx.segunda),'cópia da semana: a semana tem que começar na segunda ('+sx.segunda+')');
    ok(sx.alto===75,'espaço da equipe: o aviso tem que começar em 75% ('+sx.alto+')'); }
  /* v10.1.8: um bipe confere a nota inteira — volume não pode derrubar a porcentagem */
  { const vl=await p.evaluate(async()=>{ const ant='2026-10-25';
      const gRB=localStorage.getItem(RB.local), gBip=localStorage.getItem(OP_LOCAL+ant), gDv=JSON.stringify(S.divergencias||[]), gSnap=JSON.stringify(S.gsSnap||{}), gPv=S.opPorVolume;
      const L={}; L[ant]={}; L[ant][ant+'|R1']={id:ant+'|R1',dia:ant,base:'CAJ',motorista:'REGINALDO',rows:[
        {nf:'830001',ped:'C1',dest:'A',cid:'FRANCA',vol:'20'},{nf:'830002',ped:'C2',dest:'B',cid:'BAURU',vol:'30'},
        {nf:'830003',ped:'C3',dest:'C',cid:'ASSIS',vol:'10'}]};
      localStorage.setItem(RB.local,JSON.stringify(L));
      localStorage.setItem(OP_LOCAL+ant,JSON.stringify([
        {nf:opK('830001'),ped:opK('C1'),status:'ok',dia:ant,local_id:'v1',criado_em:ant+'T10:00:00.000Z'},
        {nf:opK('830002'),ped:opK('C2'),status:'ok',dia:ant,local_id:'v2',criado_em:ant+'T10:01:00.000Z'}]));
      S.opPorVolume=false;
      S.divergencias=[{id:'dvv',n:12,cat:'dv',st:'aberta',tipo:'Falta de volume',d:ant,nf:'830003',ped:'C3',qtd:2}];
      delete (S.gsSnap||{})[ant];
      const f=await gsFotoDeDiaPassado(ant);
      /* sem as divergências no aparelho, a nota não conferida tem que aparecer com o aviso */
      S.divergencias=[]; delete (S.gsSnap||{})[ant];
      const f2=await gsFotoDeDiaPassado(ant);
      const cart=gsCartao(f2);
      localStorage.setItem(RB.local,gRB||'{}'); if(gBip) localStorage.setItem(OP_LOCAL+ant,gBip); else localStorage.removeItem(OP_LOCAL+ant);
      S.divergencias=JSON.parse(gDv); S.gsSnap=JSON.parse(gSnap); S.opPorVolume=gPv;
      return {pct:f&&f.pct,pctVol:f&&f.pctVol,tv:f&&f.tv,fv:f&&f.fv,dn:f&&f.dn,
        pct2:f2&&f2.pct,aviso:/sem as divergências deste dia/i.test(cart),bt:/data-gs-puxardv/.test(cart)}; });
    ok(vl.pct===100,'volumes: com as divergências no lugar, o dia tinha que fechar 100% ('+vl.pct+'%)');
    ok(vl.pctVol===100&&vl.fv===0,'volumes: um bipe confere a nota inteira — 60 volumes, nenhum faltando ('+vl.pctVol+'%, faltando '+vl.fv+')');
    ok(vl.dn===1,'volumes: a nota apontada como falta tem que entrar como divergência ('+vl.dn+')');
    ok(vl.pct2===67,'volumes: sem as divergências no aparelho, a conta cai (2 de 3 = 67%) ('+vl.pct2+'%)');
    ok(vl.aviso&&vl.bt,'volumes: quando falta divergência no aparelho, o cartão tem que avisar e oferecer baixar'); }
  /* v10.1.9: a abertura não se pula */
  { const ab=await p.evaluate(()=>{
      const fonte=String((window.hsCineHtml||function(){return ''})());
      return {dica:/pular/i.test(fonte)}; });
    ok(!ab.dica,'abertura: não pode mais aparecer "toque para pular"'); }
  /* v10.2.0: fechar a conta do dia à mão, com autoria, e divergência de qualquer dia vale */
  { const aj=await p.evaluate(async()=>{ const ant='2026-10-26';
      const gRB=localStorage.getItem(RB.local), gBip=localStorage.getItem(OP_LOCAL+ant);
      const gDv=JSON.stringify(S.divergencias||[]), gSnap=JSON.stringify(S.gsSnap||{}), gAj=JSON.stringify(S.gsAjuste||{});
      const L={}; L[ant]={}; L[ant][ant+'|R1']={id:ant+'|R1',dia:ant,base:'CAJ',motorista:'REGINALDO',rows:[
        {nf:'840001',ped:'D1',dest:'A',cid:'FRANCA',vol:'2'},
        {nf:'840002',ped:'D2',dest:'B',cid:'BAURU',vol:'3'},
        {nf:'840003',ped:'D3',dest:'C',cid:'ASSIS',vol:'1'}]};
      localStorage.setItem(RB.local,JSON.stringify(L));
      localStorage.setItem(OP_LOCAL+ant,JSON.stringify([{nf:opK('840001'),ped:opK('D1'),status:'ok',dia:ant,local_id:'a1',criado_em:ant+'T10:00:00.000Z'}]));
      /* divergência da nota 840002 registrada NAQUELE dia (v10.6.37: só a do dia conta) */
      S.divergencias=[{id:'dvo',n:6,cat:'dv',st:'aberta',tipo:'Falta de volume',d:ant,nf:'840002',ped:'D2',qtd:1}];
      S.gsAjuste={}; delete (S.gsSnap||{})[ant];
      const f1=await gsFotoDeDiaPassado(ant);
      /* fecha a última à mão */
      gsAjMarcar(ant,'840003','D3','ok');
      delete (S.gsSnap||{})[ant];
      const f2=await gsFotoDeDiaPassado(ant);
      const reg=((S.gsAjuste||{})[ant]||{})['N840003']||{};
      /* e como divergência */
      gsAjMarcar(ant,'840003','D3','dv'); delete (S.gsSnap||{})[ant];
      const f3=await gsFotoDeDiaPassado(ant);
      S.gsSnap=S.gsSnap||{}; S.gsSnap[ant]=f3;
      const cart=gsCartao(f3);
      localStorage.setItem(RB.local,gRB||'{}'); if(gBip) localStorage.setItem(OP_LOCAL+ant,gBip); else localStorage.removeItem(OP_LOCAL+ant);
      S.divergencias=JSON.parse(gDv); S.gsSnap=JSON.parse(gSnap); S.gsAjuste=JSON.parse(gAj);
      return {p1:f1&&f1.pct,dn1:f1&&f1.dn,p2:f2&&f2.pct,dn2:f2&&f2.dn,p3:f3&&f3.pct,dn3:f3&&f3.dn,
        por:reg.por||'',em:!!reg.em,semBotao:!/data-gs-aj/.test(cart)}; });
    ok(aj.p1===67&&aj.dn1===1,'divergência de outro dia: a nota 840002 tinha que entrar como laranja ('+aj.p1+'%, '+aj.dn1+' laranja)');
    ok(aj.p2===100&&aj.dn2===1,'fechar à mão: marcando "conferida", o dia tem que fechar 100% ('+aj.p2+'%)');
    ok(aj.por&&aj.em,'fechar à mão: tem que gravar quem marcou e quando ('+aj.por+')');
    ok(aj.p3===100&&aj.dn3===2,'fechar à mão: marcando "divergência", conta 100% com 2 laranjas ('+aj.p3+'%, '+aj.dn3+')');
    ok(aj.semBotao,'fechar à mão: com o dia 100% não sobra lista de notas para marcar'); }
  /* v10.2.1: nota tirada da conta (Simulação) não entra no total — nem hoje nem no histórico */
  { const fo=await p.evaluate(async()=>{ const ant='2026-10-27';
      const gRB=localStorage.getItem(RB.local), gBip=localStorage.getItem(OP_LOCAL+ant);
      const gDv=JSON.stringify(S.divergencias||[]), gSnap=JSON.stringify(S.gsSnap||{}), gAj=JSON.stringify(S.gsAjuste||{});
      const L={}; L[ant]={}; L[ant][ant+'|R1']={id:ant+'|R1',dia:ant,base:'CAJ',motorista:'REGINALDO',rows:[
        {nf:'850001',ped:'E1',dest:'A',cid:'FRANCA',vol:'1'},
        {nf:'850002',ped:'E2',dest:'B',cid:'BAURU',vol:'1'},
        {nf:'850003',ped:'E3',dest:'C',cid:'ASSIS',vol:'1'}]};
      localStorage.setItem(RB.local,JSON.stringify(L));
      localStorage.setItem(OP_LOCAL+ant,JSON.stringify([
        {nf:opK('850001'),ped:opK('E1'),status:'ok',dia:ant,local_id:'f1',criado_em:ant+'T10:00:00.000Z'},
        {nf:opK('850002'),ped:opK('E2'),status:'ok',dia:ant,local_id:'f2',criado_em:ant+'T10:01:00.000Z'}]));
      S.divergencias=[]; S.gsAjuste={}; delete (S.gsSnap||{})[ant];
      const f1=await gsFotoDeDiaPassado(ant);
      gsAjMarcar(ant,'850003','E3','fora'); delete (S.gsSnap||{})[ant];
      const f2=await gsFotoDeDiaPassado(ant);
      S.gsSnap=S.gsSnap||{}; S.gsSnap[ant]=f2;
      /* mesmo tirando a marcação, a foto guardada lembra que aquela nota estava fora */
      S.gsAjuste={};
      const f3=await gsFotoDeDiaPassado(ant);
      const cart=gsCartao(f2);
      localStorage.setItem(RB.local,gRB||'{}'); if(gBip) localStorage.setItem(OP_LOCAL+ant,gBip); else localStorage.removeItem(OP_LOCAL+ant);
      S.divergencias=JSON.parse(gDv); S.gsSnap=JSON.parse(gSnap); S.gsAjuste=JSON.parse(gAj);
      return {p1:f1&&f1.pct,tn1:f1&&f1.tn,p2:f2&&f2.pct,tn2:f2&&f2.tn,fora2:(f2&&f2.fora||[]).length,
        tn3:f3&&f3.tn,p3:f3&&f3.pct,txt:/tiradas? da conta/i.test(cart),bt:/\|fora"/.test(gsCartao(f1))}; });
    ok(fo.p1===67&&fo.tn1===3,'fora da conta: antes de tirar, o dia é 2 de 3 ('+fo.p1+'%, '+fo.tn1+' notas)');
    ok(fo.p2===100&&fo.tn2===2&&fo.fora2===1,'fora da conta: tirando a nota, o dia fecha 100% com 2 notas ('+fo.p2+'%, '+fo.tn2+', fora '+fo.fora2+')');
    ok(fo.tn3===2&&fo.p3===100,'fora da conta: a foto guardada lembra quais notas estavam fora ('+fo.tn3+' notas)');
    ok(fo.txt,'fora da conta: o cartão tem que dizer quantas notas saíram da conta');
    ok(fo.bt,'fora da conta: falta o botão "não conta" na lista do que não entrou'); }
  /* v10.2.2: foto feita com regra antiga se refaz sozinha, e fechar o dia num clique */
  { const fc=await p.evaluate(async()=>{ const ant='2026-10-28';
      const gRB=localStorage.getItem(RB.local), gBip=localStorage.getItem(OP_LOCAL+ant);
      const gDv=JSON.stringify(S.divergencias||[]), gSnap=JSON.stringify(S.gsSnap||{}), gAj=JSON.stringify(S.gsAjuste||{});
      const L={}; L[ant]={}; L[ant][ant+'|R1']={id:ant+'|R1',dia:ant,base:'CAJ',motorista:'REGINALDO',rows:[
        {nf:'860001',ped:'F1',dest:'A',cid:'FRANCA',vol:'1'},{nf:'860002',ped:'F2',dest:'B',cid:'BAURU',vol:'1'},
        {nf:'860003',ped:'F3',dest:'C',cid:'ASSIS',vol:'1'},{nf:'860004',ped:'F4',dest:'D',cid:'MARILIA',vol:'1'}]};
      localStorage.setItem(RB.local,JSON.stringify(L));
      localStorage.setItem(OP_LOCAL+ant,JSON.stringify([{nf:opK('860001'),ped:opK('F1'),status:'ok',dia:ant,local_id:'g1',criado_em:ant+'T10:00:00.000Z'}]));
      S.divergencias=[]; S.gsAjuste={};
      const f1=await gsFotoDeDiaPassado(ant); S.gsSnap=S.gsSnap||{}; S.gsSnap[ant]=f1;
      const carimbo=f1&&f1.v;
      /* simula foto velha, feita com regra antiga */
      S.gsSnap[ant]=Object.assign({},f1,{v:'antiga',pct:11});
      const velha=(S.gsSnap[ant]||{}).v!==GS_REGRA;
      /* fechar o dia num clique: as 3 que faltam saem da conta */
      const gC=window.confirmar; window.confirmar=async()=>true;
      const gCg=window.cargoMeu; window.cargoMeu=()=>'admin';
      await gsFecharDia(ant,null);
      window.confirmar=gC; window.cargoMeu=gCg;
      const f2=gsFotoLer(ant);
      const reg=((S.gsAjuste||{})[ant]||{})['N860003']||{};
      localStorage.setItem(RB.local,gRB||'{}'); if(gBip) localStorage.setItem(OP_LOCAL+ant,gBip); else localStorage.removeItem(OP_LOCAL+ant);
      S.divergencias=JSON.parse(gDv); S.gsSnap=JSON.parse(gSnap); S.gsAjuste=JSON.parse(gAj);
      return {carimbo,velha,p1:f1&&f1.pct,p2:f2&&f2.pct,tn2:f2&&f2.tn,fora2:(f2&&f2.fora||[]).length,por:reg.por||'',em:!!reg.em}; });
    ok(fc.velha,'carimbo: foto com regra antiga tem que ser reconhecida como velha');
    ok(fc.p1===25,'fechar o dia: antes, 1 de 4 conferidas = 25% ('+fc.p1+'%)');
    ok(fc.p2===100&&fc.tn2===1&&fc.fora2===3,'fechar o dia: num clique, as 3 que faltavam saem da conta e o dia fecha 100% ('+fc.p2+'%, '+fc.tn2+' notas, '+fc.fora2+' fora)');
    ok(fc.por&&fc.em,'fechar o dia: tem que gravar quem fechou e quando ('+fc.por+')'); }
  /* v10.2.3: desmarcar de uma vez as reentregas erradas de um romaneio */
  { const lr=await p.evaluate(async()=>{ const hoje=hojeISO(), rid='T-LIMPRE';
      const gRom=JSON.stringify(S.romaneios||[]), gNex=JSON.stringify(nexS()), gRE=JSON.stringify(RE.ler().dias||{}), gFeito=JSON.stringify(S.reFeito||{});
      S.romaneios=[{id:rid,numero:'0017795',base:'MESA',dia:hoje,rows:[
        {nf:'870001',ped:'G1',dest:'CLI A',cid:'ARARAQUARA',uf:'SP',vol:'2'},
        {nf:'870002',ped:'G2',dest:'CLI B',cid:'BAURU',uf:'SP',vol:'1'},
        {nf:'870003',ped:'G3',dest:'CLI C',cid:'ASSIS',uf:'SP',vol:'1'}]}];
      const n=nexS(); n.reent={};
      for(const x of S.romaneios[0].rows.slice(0,2)) n.reent[nexK(x)]={status:'suspeita',rom:rid,d:hoje,nf:x.nf,ped:x.ped};
      const D=RE.ler(); D.dias[hoje]=[{nf:'870001',cli:'CLI A',obs:'ERA REENTREGA',origem:'nex'},{nf:'999999',cli:'REAL',obs:'FERIADO',origem:'manual'}];
      S.reFeito={};
      const gB=window.nexBaixar; let csv=''; window.nexBaixar=(t)=>{ csv=t; };
      const gC=window.confirmar; window.confirmar=async()=>true;
      const gCg=window.cargoMeu; window.cargoMeu=()=>'admin';
      await nexLimparReent(rid);
      window.nexBaixar=gB; window.confirmar=gC; window.cargoMeu=gCg;
      const nn=nexS();
      const ign=S.romaneios[0].rows.slice(0,2).every(x=>(nn.reent[nexK(x)]||{}).status==='ignorada');
      const re=(RE.ler().dias[hoje]||[]);
      const r={ign,csvTemNF:/870001/.test(csv),csvCab:/Romaneio;|"Romaneio"/.test(csv),
        sobrou:re.length,sobrouReal:re.some(l=>String(l.nf)==='999999')};
      S.romaneios=JSON.parse(gRom); const g=JSON.parse(gNex); nexS().reent=g.reent||{};
      RE.ler().dias=JSON.parse(gRE); RE.gravar(); S.reFeito=JSON.parse(gFeito);
      return r; });
    ok(lr.ign,'desmarcar: as reentregas do romaneio têm que ficar como ignoradas');
    ok(lr.csvTemNF&&lr.csvCab,'desmarcar: a planilha tem que sair antes, com cabeçalho e as notas');
    ok(lr.sobrou===1&&lr.sobrouReal,'desmarcar: só a lançada pelo app sai do controle; a reentrega de verdade fica ('+lr.sobrou+')'); }
  /* v10.2.4: divergências do dia detalhadas no PDF */
  { const dt=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const dia='2026-10-29';
      const gDv=JSON.stringify(S.divergencias||[]), gSnap=JSON.stringify(S.gsSnap||{});
      S.divergencias=[{id:'d1',n:3,cat:'dv',st:'aberta',tipo:'Falta de volume',d:dia,ped:'722746',nf:'729009',
        cli:'LABORATORIO ALPHA DE ANALISES',cid:'GUAXUPE',uf:'MG',rem:'CM HOSPITALAR S.A. CAJAMAR',
        qtd:1,tot:3,falt:[2],obs:'faltava 1 volume de 3',por:'TIAGO SOUZA'},
       {id:'d2',n:6,cat:'dv',st:'resolvida',tipo:'Falta de volume',d:dia,ped:'207360',nf:'205420',
        cli:'UNIMED DE RIBEIRAO PRETO',cid:'RIBEIRAO PRETO',qtd:3,tot:4,falt:[1,2,3],obs:'faltaram as caixas',
        por:'TIAGO SOUZA',apareceu:{d:'2026-11-13',rom:'0236361'},res:{d:'2026-11-16',por:'TIAGO SOUZA',obs:'O volume que faltou chegou no romaneio 900.'}}];
      S.gsSnap=S.gsSnap||{}; S.gsSnap[dia]={dia,tn:10,fn:0,tv:10,fv:0,pct:100,pctVol:100,dn:2,dv:2,roms:1,orig:[{base:'CAJ',mot:'',tn:10,fn:0,tv:10,fv:0,dn:2}],falta:[],fora:[],v:GS_REGRA};
      let html=''; const _open=window.open;
      window.open=()=>({document:{write:t=>{html+=t;},close(){}},focus(){},print(){}});
      gsPdfProjetor(dia,{pct:true,orig:false,falta:false,dv:true,pessoa:false,hora:false,obs:''});
      await w(60); window.open=_open;
      S.divergencias=JSON.parse(gDv); S.gsSnap=JSON.parse(gSnap);
      const cols=(html.match(/<th>([^<]*)<\/th>/g)||[]).map(t=>t.replace(/<\/?th>/g,''));
      return {cols,temCaixas:/Caixas que faltaram/.test(html),temRem:/CM HOSPITALAR/.test(html),
        temCid:/GUAXUPE/.test(html),temPor:/TIAGO SOUZA/.test(html),temBaixa:/faltou chegou/.test(html),
        temApar:/0236361/.test(html),temNum:/#003/.test(html),temSit:/Resolvida/i.test(html),
        temFalta:/faltam/.test(html)}; });
    ok(dt.cols.length>=12,'divergências no PDF: a tabela tem que sair detalhada ('+dt.cols.length+' colunas)');
    ok(dt.temNum&&dt.temSit,'divergências no PDF: falta o número e a situação de cada uma');
    ok(dt.temFalta&&dt.temCaixas,'divergências no PDF: falta quantos volumes e quais caixas faltaram');
    ok(dt.temCid&&dt.temRem,'divergências no PDF: falta cidade e remetente');
    ok(dt.temPor&&dt.temApar&&dt.temBaixa,'divergências no PDF: falta quem registrou, onde apareceu e a baixa'); }
  /* v10.2.6: a conta soma o bipe de todo mundo, não só o deste aparelho */
  { const jt=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const dia=hojeISO();
      const gCli=NV.cli, gUser=NV.user, gBip=(OP.bipes||[]).slice();
      /* o banco "tem" 2 bipes: um meu e um do Christian */
      const linhas=[{local_id:'meu1',dia,nf:opK('910001'),ped:opK('X1'),status:'ok',usuario:'TIAGO',criado_em:dia+'T05:00:00.000Z'},
                    {local_id:'dele1',dia,nf:opK('910002'),ped:opK('X2'),status:'ok',usuario:'CHRISTIAN',criado_em:dia+'T05:01:00.000Z'}];
      NV.user=NV.user||{id:'t'};
      NV.cli={from(){ return {select:()=>({eq:()=>({order:()=>({range:()=>Promise.resolve({data:linhas,error:null})})})}),
                              upsert:()=>Promise.resolve({error:null})}; }, channel(){ return {on(){return this;},subscribe(){return this;}}; }, removeChannel(){}};
      OP.dia=dia; OP.bipes=[linhas[0]].map(opDoBanco); const antes=OP.bipes.length;
      const novos=await opPuxarDia(false);
      const nomes=(OP.bipes||[]).map(b=>b.usuario).sort().join(',');
      NV.cli=gCli; NV.user=gUser; OP.bipes=gBip;
      return {antes,novos,nomes,total:nomes.split(',').length}; });
    ok(jt.antes===1,'juntar: o teste começa com só o bipe deste aparelho');
    ok(jt.novos===1&&jt.total===2,'juntar: repuxar o dia tem que trazer o bipe da outra pessoa ('+jt.novos+' novo(s))');
    ok(/CHRISTIAN/.test(jt.nomes)&&/TIAGO/.test(jt.nomes),'juntar: a conta tem que ficar com os dois ('+jt.nomes+')'); }
  { const bt=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      irPara('conftotal'); await w(400); try{ ctMontar(); }catch(e){} await w(200);
      const g=document.getElementById('ct-geral');
      return {bt:!!document.querySelector('[data-op-puxar]'),txt:g?g.innerText:''}; });
    ok(bt.bt||!/[0-9]%/.test(bt.txt),'juntar: falta o botão "Atualizar a conta" na Conferência total'); }
  /* v10.2.7: fila grande sobe em lotes e linha recusada não trava o resto */
  { const fl=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const dia=hojeISO();
      const gFila=localStorage.getItem('healthSearch.op.fila'), gCli=NV.cli, gUser=NV.user, gBip=(OP.bipes||[]).slice();
      localStorage.removeItem('healthSearch.op.fila.ruins');
      const fila=[]; for(let i=0;i<450;i++) fila.push({local_id:'f'+i,dia,codigo:'C'+i,nf:'92'+i,ped:'P'+i,status:'ok',usuario:'TIAGO',criado_em:dia+'T05:00:00.000Z',chave:'x'});
      fila[300].status='INVALIDO'; fila[301].campoEstranho='quebra'; /* uma com status fora da regra, outra com campo que não existe */
      localStorage.setItem('healthSearch.op.fila',JSON.stringify(fila));
      NV.user=NV.user||{id:'u1'};
      let envios=0, linhas=0;
      NV.cli={from(){ return {upsert:(L)=>{ envios++; linhas+=L.length;
          const ruim=L.find(x=>x.local_id==='f300'); /* o banco recusa essa linha, aconteça o que acontecer */
          if(ruim) return Promise.resolve({error:{message:'violates check constraint hs_bipagens_status_check'}});
          return Promise.resolve({error:null}); },
        select:()=>({eq:()=>({order:()=>({range:()=>Promise.resolve({data:[],error:null})})})})}; },
        channel(){ return {on(){return this;},subscribe(){return this;}}; }, removeChannel(){}};
      OP.dia=dia;
      await opFila();
      const resto=JSON.parse(localStorage.getItem('healthSearch.op.fila')||'[]');
      const ruins=JSON.parse(localStorage.getItem('healthSearch.op.fila.ruins')||'[]');
      const mandouChave=linhas>0;
      localStorage.setItem('healthSearch.op.fila',gFila||'[]'); localStorage.removeItem('healthSearch.op.fila.ruins');
      NV.cli=gCli; NV.user=gUser; OP.bipes=gBip;
      return {envios,resto:resto.length,ruins:ruins.length,ruim:(ruins[0]||{}).b&&ruins[0].b.local_id,erro:(ruins[0]||{}).erro||''}; });
    ok(fl.envios>1,'fila: 450 bipes não podem ir num envio só ('+fl.envios+' envio(s))');
    ok(fl.resto===0,'fila: depois de subir, a fila tem que esvaziar ('+fl.resto+' sobrando)');
    ok(fl.ruins===1&&fl.ruim==='f300','fila: a linha recusada tem que ser isolada, não travar o resto ('+fl.ruins+', '+fl.ruim+')');
    ok(/constraint/.test(fl.erro),'fila: o motivo da recusa tem que ser guardado ('+fl.erro.slice(0,40)+')'); }
  { const lb=await p.evaluate(()=>{ const o=opLinhaBanco({local_id:'z1',dia:hojeISO(),nf:'1',ped:'2',status:'zzz',vol:'3',tot:'4',valor:'12,50',chave:'X',campoEstranho:'y',usuario:'T'});
      return {temEstranho:'campoEstranho' in o, temChave:'chave' in o, status:o.status, vol:o.vol, valor:o.valor, codigo:o.codigo}; });
    ok(!lb.temEstranho&&!lb.temChave,'fila: campo que não existe na tabela não pode ser enviado');
    ok(lb.status==='ok'&&lb.vol===3&&lb.valor===12.5&&lb.codigo==='1','fila: a linha tem que ser arrumada antes de subir ('+JSON.stringify(lb)+')'); }
  /* v10.2.8: marcar à mão dá baixa em todos os volumes, não em 1 */
  { const mm=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      const hoje=hojeISO(), rid='T-MAO5';
      const gRom=JSON.stringify(S.romaneios||[]), gBip=(OP.bipes||[]).slice(), gPV=S.opPorVolume;
      S.opPorVolume=true; /* conferência caixa a caixa ligada: é aí que o erro aparecia */
      S.romaneios=[{id:rid,numero:'991',base:'CAJ',dia:hoje,rows:[{nf:'930001',ped:'M1',dest:'CLI',cid:'FRANCA',vol:'5'}]}];
      OP.dia=hoje; OP.bipes=[];
      /* o bipe que a marcação à mão cria: um só, carimbado com a nota inteira */
      OP.bipes=[{local_id:'mao1',dia:hoje,nf:opK('930001'),ped:opK('M1'),status:'ok',usuario:'TIAGO',criado_em:new Date().toISOString()}];
      opConfMarcar(OP.bipes[0],'ok',5);
      const ok=true;
      const c=opContagem(opK('M1'),opK('930001'));
      const pend=opPendentes().filter(it=>String(it.nf)===opK('930001')).length;
      const b=OP.bipes[0]||{};
      const r={ok,esp:c.esp,lidos:c.lidos,pend,qt:b.conferido_qt,
        soma1:opLidosBips([{local_id:'a'}]), soma5:opLidosBips([{local_id:'a',conferido_qt:5}]),
        somaVol:opLidosBips([{local_id:'a',vol:1},{local_id:'b',vol:2}])};
      S.romaneios=JSON.parse(gRom); OP.bipes=gBip; S.opPorVolume=gPV;
      return r; });
    ok(mm.ok&&mm.qt===5,'marcar à mão: o bipe tem que guardar que a nota inteira foi conferida ('+mm.qt+')');
    ok(mm.lidos===5&&mm.lidos>=mm.esp,'marcar à mão: nota de 5 volumes tem que contar os 5, não 1 ('+mm.lidos+' de '+mm.esp+')');
    ok(mm.pend===0,'marcar à mão: a nota tem que sair das pendentes');
    ok(mm.soma1===1&&mm.soma5===5&&mm.somaVol===2,'marcar à mão: a conta de volumes lidos está errada ('+mm.soma1+','+mm.soma5+','+mm.somaVol+')'); }
  /* v10.0.1: a aba Relatórios saiu e os blocos de XML/diagnóstico não aparecem no NexBip */
  { const lp=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      irPara('operacao'); await w(200);
      const g=id=>{ const e=document.getElementById(id); return e?getComputedStyle(e).display:'(sem elemento)'; };
      return {rel:!!document.querySelector('[data-ir="relatorios"],#nav [data-ir="relatorios"]'),
        relBtn:[...document.querySelectorAll('nav button,nav a')].some(b=>/^\s*Relatórios\s*$/.test(b.textContent||'')),
        xml:g('op-xml'), diag:g('op-diag')}; });
    ok(!lp.relBtn,'menu: a aba "Relatórios" tinha que sair');
    ok(lp.xml==='none'&&lp.diag==='none','NexBip: XML das notas e diagnóstico de reentrega não podem aparecer ('+lp.xml+'/'+lp.diag+')'); }
  /* 9.26.1: o total da Conferência conta cada nota uma vez (repetida em dois romaneios) e ignora o que foi tirado da operação */
  { const c=await p.evaluate(()=>{ const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.nex=null; nexS();
      S.romaneios=[{id:'r1',numero:'0001',base:'CAJ',arquivo:a,rows:[{nf:'100',ped:'900',vol:'1',dest:'A',cid:'X'},{nf:'101',ped:'901',vol:'1',dest:'B',cid:'X'},{nf:'102',ped:'902',vol:'1',dest:'C',cid:'X'}]},
                   {id:'r2',numero:'0002',base:'DF',arquivo:a,rows:[{nf:'100',ped:'900',vol:'1',dest:'A',cid:'X'},{nf:'103',ped:'903',vol:'1',dest:'D',cid:'X'}]}];
      OP.dia=h; OP.bipes=[]; renderTudo();
      const bruto=opPorRom().reduce((s,x)=>s+x.tn,0);
      nexRetirar(S.romaneios[0],S.romaneios[0].rows[2],'teste');
      const L=opPorRom(); const comFiltro=L.reduce((s,x)=>s+x.tn,0), falt=L.reduce((s,x)=>s+x.fn,0);
      const cada=L.map(x=>x.r.numero+':'+x.tn+'/'+x.fn).join(' ');
      const pend=opPendentes().length;
      S.nex=null; nexS(); return {bruto,comFiltro,falt,cada,pend,ok:L.every(x=>x.fn<=x.tn)}; });
    ok(c.bruto===4,'conferência: a NF repetida em dois romaneios deveria contar uma vez só (deu '+c.bruto+' de 4)');
    ok(c.comFiltro===3,'conferência: a nota retirada da operação não deveria entrar no total (deu '+c.comFiltro+' de 3)');
    ok(c.falt===3,'conferência: faltando deveria ser 3 ('+c.falt+') — '+c.cada);
    ok(c.ok,'conferência: nenhuma origem pode ter mais faltando do que notas ('+c.cada+')');
    ok(c.pend===3,'lista do que falta: deveria ter 3 notas (sem a repetida e sem a retirada), veio '+c.pend); }
  /* 10.6.01 · a aba Avarias saiu: avaria antiga continua guardada, mas não aparece como divergência */
  { const a2=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO();
      S.divergencias=[{id:'a1',n:1,cat:'av',d:h,ped:'724486',nf:'731084',tipo:'Avaria',sub:'Caixa molhada',qtd:2,st:'aberta',por:'Teste',em:new Date().toISOString(),hist:[]},
        {id:'d1',n:1,d:h,ped:'5',nf:'6',tipo:'Falta de volume',qtd:1,st:'aberta',por:'Teste',em:new Date().toISOString(),hist:[]}];
      irPara('divergencias'); dvRender(); await w(250);
      const txt=document.getElementById('dv-lista').innerHTML;
      const r={temDv:/d1|DV-|Falta de volume/.test(txt), mostraAv:/Caixa molhada/.test(txt), guardada:S.divergencias.some(d=>d.id==='a1'),
        aba:!!document.querySelector('.nav [data-tela="avarias"]'), tela:!!document.getElementById('t-avarias')};
      S.divergencias=[]; dvRender(); return r; });
    ok(a2.temDv&&!a2.mostraAv,'avarias: a lista de divergências não pode mostrar avaria (mostrou='+a2.mostraAv+')');
    ok(a2.guardada,'avarias: a avaria antiga tem que continuar guardada nos dados');
    ok(!a2.aba&&!a2.tela,'avarias: a aba Avarias tinha que ter saído do menu'); }
  /* 10.2.4 · segurança: foto gravada no banco não pode virar script na tela (XSS armazenado) */
  { const seg=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO();
      window.__xss=0;
      S.divergencias=[{id:'x1',n:9,d:h,ped:'1',nf:'2',tipo:'Falta de volume',qtd:1,
        foto:'x" onerror="window.__xss=1" data-x="',st:'aberta',por:'t',em:new Date().toISOString(),hist:[]}];
      irPara('divergencias'); dvRender(); await w(400);
      const img=document.querySelector('#dv-lista .du-foto');
      const r={executou:window.__xss,src:img?img.getAttribute('src'):'(sem img)',
               boa:fotoSegura('data:image/jpeg;base64,/9j/4AAQ')!=='', ruim:fotoSegura('javascript:alert(1)')===''};
      S.divergencias=[]; dvRender(); return r; });
    ok(!seg.executou,'segurança: foto gravada no banco executou script no cartão (XSS armazenado)');
    ok(seg.src==='','segurança: o src da foto inválida deveria sair vazio ('+seg.src+')');
    ok(seg.boa&&seg.ruim,'segurança: fotoSegura está barrando foto boa ou deixando passar endereço perigoso'); }
  /* 10.2.10 · o historico do NexBip viaja em baldes — nada pode se perder na juncao */
  { const nx=await p.evaluate(()=>{
      const n=nexS(); n.hist={}; n.histPed={};
      n.hist['NF1|P1']=[{d:'2026-11-10',rom:'r1',num:'001',m:'bip',v:5}];
      n.hist['NF2|P2']=[{d:'2026-11-11',rom:'r2',num:'002',m:'bip',v:3}];
      n.histPed['P1']=[{d:'2026-11-10',rom:'r1',num:'001',nf:'NF1'}];
      salvar();
      const m=nuvLocal();
      const chaves=[...m.keys()].filter(k=>/^nx[hp]:/.test(k)).sort();
      const sNex=m.get('s:nex');
      /* 1) s:nex nao leva mais o historico */
      const limpo=!sNex||(!sNex.valor.hist&&!sNex.valor.histPed);
      /* 2) todo item esta em algum balde, e sempre no mesmo */
      const dentroH=chaves.filter(k=>k.startsWith('nxh:')).reduce((a,k)=>a.concat(Object.keys(m.get(k).valor)),[]).sort().join(',');
      const dentroP=chaves.filter(k=>k.startsWith('nxp:')).reduce((a,k)=>a.concat(Object.keys(m.get(k).valor)),[]).sort().join(',');
      const estavel=nxIdx('NF1|P1')===nxIdx('NF1|P1');
      /* 3) o balde que chega do outro aparelho ENTRA, nao substitui */
      const bal='nxh:'+nxIdx('NF3|P3');
      nuvAplicar(bal,{'NF3|P3':[{d:'2026-11-12',rom:'r3',num:'003'}]},false);
      const somou=!!(nexS().hist['NF3|P3']&&nexS().hist['NF1|P1']);
      /* 4) mesma nota bipada nos dois aparelhos no mesmo dia, romaneios diferentes: ficam as duas */
      const b1='nxh:'+nxIdx('NF1|P1');
      nuvAplicar(b1,{'NF1|P1':[{d:'2026-11-13',rom:'rX',num:'009'}]},false);
      const duas=nexS().hist['NF1|P1'].length;
      /* 5) a mesma aparicao chegando de novo nao duplica, e completa o campo que faltava */
      nuvAplicar(b1,{'NF1|P1':[{d:'2026-11-13',rom:'rX',num:'009',v:7}]},false);
      const h1=nexS().hist['NF1|P1'];
      const semDup=h1.length===duas, completou=(h1.find(e=>e.rom==='rX')||{}).v===7;
      /* 6) conflito nos dois lados ao mesmo tempo: fica a uniao */
      const j=nuvJuntar(b1,{'A':[{d:'2026-11-01',rom:'a'}]},{'A':[{d:'2026-11-02',rom:'b'}],'B':[{d:'2026-11-03',rom:'c'}]});
      const juntou=j.A.length===2&&!!j.B;
      /* 7) s:nex de aparelho desatualizado (com hist dentro) soma, nao apaga o que ja tem */
      nuvAplicar('s:nex',{versao:1,hist:{'NF9|P9':[{d:'2026-11-05',rom:'r9'}]}},false);
      const velho=!!(nexS().hist['NF9|P9']&&nexS().hist['NF1|P1']);
      const r={limpo,chaves:chaves.length,dentroH,dentroP,estavel,somou,duas,semDup,completou,juntou,velho};
      n.hist={}; n.histPed={}; salvar(); return r; });
    ok(nx.limpo,'nex: o s:nex ainda está levando o histórico junto');
    ok(nx.dentroH==='NF1|P1,NF2|P2','nex: as notas não foram todas para os baldes de hist ('+nx.dentroH+')');
    ok(nx.dentroP==='P1','nex: os pedidos não foram para os baldes de histPed ('+nx.dentroP+')');
    ok(nx.estavel,'nex: o mesmo item caiu em baldes diferentes');
    ok(nx.somou,'nex: o balde que chegou do outro aparelho apagou o que já estava aqui');
    ok(nx.duas===2,'nex: duas aparições da mesma nota deveriam coexistir, ficaram '+nx.duas);
    ok(nx.semDup,'nex: a mesma aparição chegando de novo duplicou a linha');
    ok(nx.completou,'nex: ao receber a mesma aparição com mais informação, o campo não foi preenchido');
    ok(nx.juntou,'nex: conflito nos dois lados deveria virar união');
    ok(nx.velho,'nex: s:nex de aparelho desatualizado apagou o histórico novo'); }
  { /* v10.6.26 · desbipar (✕ vermelho na Conferência total) e chegada parcial da divergência */
    const db=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); NV.perfil={papel:'admin',ativo:true,nome:'T'}; document.querySelectorAll('.fundo').forEach(f=>f.remove());
      const h=hojeISO(), arq='x '+h.split('-').reverse().join('-')+'.pdf', rs=S.romaneios, ds=S.divergencias, bs=OP.bipes;
      S.romaneios=[{id:'db1',numero:'1',base:'CAJ',arquivo:arq,rows:[{nf:'81001',ped:'91001',vol:'3',dest:'A'},{nf:'81002',ped:'91002',vol:'35',dest:'B'},{nf:'81003',ped:'91003',vol:'15',dest:'C'}]}];
      S.divergencias=[]; OP.dia=h; OP.bipes=[]; renderTudo(); const R={};
      const pend=()=>{ OP._semFiltro=true; try{ return opPendentes().map(it=>opK(it.x.nf)).sort().join(','); }finally{ OP._semFiltro=false; } };
      opLer(['81001'],'teclado'); await w(20);
      const _q=window.opQuantosMao; window.opQuantosMao=async()=>({chegou:23,faltaram:[]}); await opMarcarMao(S.romaneios[0].rows[1],'dv'); window.opQuantosMao=_q;
      S.divergencias.push({id:'dbx',n:9,d:'2026-01-02',nf:'81003',ped:'91003',tipo:'Falta de volume',qtd:13,tot:15,st:'aberta',hist:[]}); const dx=S.divergencias[S.divergencias.length-1];
      dvChegou(dx,10,'teste'); R.parcial=dx.st+'|'+dx.qtd;
      opLer(['81003'],'teclado'); await w(20); opDvChegaram(OP.bipes[0],dx,3); R.bateu=dx.st;
      R.antes=pend();
      for(const nf of ['81001','81002','81003']){ document.querySelectorAll('.fundo').forEach(f=>f.remove()); opRomLista('db1');
        const bt=[...document.querySelectorAll('[data-rl-des]')].find(b=>b.closest('div[style*="padding:6px 0"]').textContent.includes('NF '+nf)); if(!bt){ R.falta=(R.falta||'')+nf; continue; }
        bt.click(); await w(60); document.querySelector('[data-sn="1"]').click(); await w(250); }
      const d1=dvAcha('91002','81002');
      R.depois=pend(); R.bips=OP.bipes.length; R.d1=d1?[d1.st,d1.qtd,d1.conferida,!!d1.desbip].join('|'):'sumiu'; R.dx=[dx.st,dx.qtd,!!dx.res,dx.d].join('|');
      R.painel=gsDvDoDia(h).nf.has('81002');
      opLer(['81002'],'teclado'); await w(20); R.rebip=pend();
      document.querySelectorAll('.fundo').forEach(f=>f.remove()); S.romaneios=rs; S.divergencias=ds; OP.bipes=bs; renderTudo(); return R; });
    ok(db.parcial==='aberta|3','chegada parcial: 10 de 13 tinha que deixar aberta faltando 3 ('+db.parcial+')');
    ok(db.bateu==='resolvida'&&db.antes==='','desbipar: preparação errada ('+db.bateu+' · pendentes "'+db.antes+'")');
    ok(!db.falta,'desbipar: faltou o ✕ vermelho na nota '+db.falta);
    ok(db.depois==='81001,81002,81003'&&db.bips===0,'desbipar: as 3 notas tinham que voltar para Faltando sem bipes ('+db.depois+' · '+db.bips+' bipes)');
    ok(db.d1==='aberta|12|false|true','desbipar: a divergência da nota tinha que continuar aberta faltando 12 ('+db.d1+')');
    ok(db.dx==='aberta|13|false|2026-01-02','desbipar: a divergência que bateu hoje tinha que reabrir faltando 13, com a data dela ('+db.dx+')');
    ok(db.painel===false,'desbipar: o Painel ainda contava a nota desbipada como conferida em divergência');
    ok(db.rebip==='81001,81003','desbipar: rebipada, a nota em divergência tinha que sair de Faltando de novo ('+db.rebip+')'); }
  { /* v10.6.27 · nota tirada da conta não aparece como bipada e o ✕ não "cancela" o que não existe */
    const fc=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); NV.perfil={papel:'admin',ativo:true,nome:'T'}; document.querySelectorAll('.fundo').forEach(f=>f.remove());
      const h=hojeISO(), arq='x '+h.split('-').reverse().join('-')+'.pdf', rs=S.romaneios, bs=OP.bipes, aj0=JSON.stringify(S.gsAjuste||{}), fo0=JSON.stringify(nexS().fora||{});
      S.romaneios=[{id:'fc1',numero:'0236908',base:'CAJ',arquivo:arq,rows:[{nf:'448310',ped:'',vol:'715',dest:'HDL LOGISTICA'},{nf:'82002',ped:'92002',vol:'2',dest:'B'}]}];
      OP.dia=h; OP.bipes=[]; const n=nexS(); n.fora=n.fora||{}; n.fora[nexK(S.romaneios[0].rows[0])]={motivo:'teste',em:new Date().toISOString()};
      S.gsAjuste=S.gsAjuste||{}; S.gsAjuste[h]=S.gsAjuste[h]||{}; S.gsAjuste[h][gsAjK('82002','92002')]={m:'fora',por:'T'}; renderTudo();
      opLer(['82002'],'teclado'); await w(20);
      opRomLista('fc1'); const f=document.querySelector('.fundo'); const R={};
      const blocos=[...f.querySelectorAll('h3')].map(x=>x.textContent); R.grupos=blocos.join('|');
      R.xHdl=[...f.querySelectorAll('[data-rl-des]')].some(b=>b.closest('div[style*="padding:6px 0"]').textContent.includes('448310'));
      R.semX=await opDesbipar(S.romaneios[0].rows[0]);
      const bt=[...f.querySelectorAll('[data-rl-des]')].find(b=>b.closest('div[style*="padding:6px 0"]').textContent.includes('82002')); if(bt){ bt.click(); await w(60); document.querySelector('[data-sn="1"]').click(); await w(250); }
      R.foraFicou=!!(S.gsAjuste[h]&&S.gsAjuste[h][gsAjK('82002','92002')]);
      document.querySelectorAll('.fundo').forEach(f=>f.remove()); S.romaneios=rs; OP.bipes=bs; S.gsAjuste=JSON.parse(aj0); n.fora=JSON.parse(fo0); renderTudo(); return R; });
    ok(/Fora da conta \(1\)/.test(fc.grupos)&&/Bipadas \(1\)/.test(fc.grupos),'fora da conta: a nota tirada da conta tinha que ir para o grupo próprio ('+fc.grupos+')');
    ok(!fc.xHdl,'fora da conta: a nota tirada da conta não pode ter o ✕');
    ok(fc.semX===false,'fora da conta: o ✕ não pode dizer que cancelou o que não existe');
    ok(fc.foraFicou,'desbipar: a marcação "tirada da conta" da Simulação não pode sair'); }
  { /* v10.6.28 · ✕ em tempo real: some da tela na hora, apaga tudo numa chamada e devolve o que o servidor recusar */
    const rt=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); NV.perfil={papel:'admin',ativo:true,nome:'T'}; document.querySelectorAll('.fundo').forEach(f=>f.remove());
      const h=hojeISO(), arq='x '+h.split('-').reverse().join('-')+'.pdf', rs=S.romaneios, bs=OP.bipes, ds=S.divergencias;
      S.romaneios=[{id:'rt1',numero:'1',base:'CAJ',arquivo:arq,rows:[{nf:'83001',ped:'93001',vol:'35',dest:'A'},{nf:'83002',ped:'93002',vol:'2',dest:'B'}]}]; S.divergencias=[];
      OP.dia=h; OP.bipes=[]; renderTudo();
      for(let i=1;i<=35;i++) opLer(['X@'+String(i).padStart(4,'0')+'@0035@93001'],'teclado'); opLer(['X@0001@0002@93002'],'teclado'); opLer(['X@0002@0002@93002'],'teclado');
      OP.bipes.forEach((b,i)=>b.id=5000+i); const recusado=OP.bipes.find(b=>b.ped==='93002').id;
      let chamadas=0; const cliO=NV.cli, usO=NV.user; NV.user={id:'u'};
      NV.cli={from:()=>({delete:()=>({in:(c,ids)=>({select:async()=>{ chamadas++; await w(800); return {data:ids.filter(i=>i!==recusado).map(id=>({id})),error:null}; }})})})};
      opRomLista('rt1'); await w(30); const st=()=>[...document.querySelectorAll('.fundo h3')].map(x=>x.textContent).join('|'); const R={};
      const clica=async nf=>{ const bt=[...document.querySelectorAll('[data-rl-des]')].find(b=>b.closest('div[style*="padding:6px 0"]').textContent.includes('NF '+nf)); bt.click(); await w(40); document.querySelector('[data-sn="1"]').click(); };
      try{ await clica('83001'); await w(100); R.na_hora=st(); await w(900); await clica('83002'); await w(100); R.b_na_hora=st(); await w(900); R.b_depois=st(); R.chamadas=chamadas; }
      finally{ NV.cli=cliO; NV.user=usO; document.querySelectorAll('.fundo').forEach(f=>f.remove()); S.romaneios=rs; OP.bipes=bs; S.divergencias=ds; renderTudo(); }
      return R; });
    ok(/Bipadas \(1\)\|⏳ Faltando \(1\)/.test(rt.na_hora),'tempo real: a nota tinha que mudar de lado antes do servidor responder ('+rt.na_hora+')');
    ok(/Bipadas \(0\)/.test(rt.b_na_hora)&&/Bipadas \(1\)/.test(rt.b_depois),'tempo real: o bipe recusado pelo servidor tinha que voltar ('+rt.b_na_hora+' → '+rt.b_depois+')');
    ok(rt.chamadas===2,'tempo real: tinha que ser UMA chamada ao servidor por nota ('+rt.chamadas+')'); }
  { /* v10.6.29 · clientes fixos / agendamentos não somem pela sincronização */
    const ls=await p.evaluate(async()=>{ const R={}; const cliO=NV.cli, usO=NV.user, c0=S.clientesReq, t0=S.listaTirados, h0=NV&&NUV.h['s:clientesReq']; NV.user={id:'u'};
      const C=n=>({id:'c'+n,nome:'CLIENTE '+n,em:'2026-11-1'+n+'T00:00:00Z',fixo:true}); const nuvem=[C(1),C(2),C(3),C(4),C(5)];
      NV.cli={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{valor:nuvem,apagado:false},error:null})})})})};
      try{ S.listaTirados={};
        S.clientesReq=[]; NUV.h['s:clientesReq']=nuvHash(nuvem); await listasProteger(); R.voltou=S.clientesReq.map(c=>c.id).join(',');
        S.clientesReq=[C(1),C(2),C(9)]; NUV.h['s:clientesReq']=nuvHash([C(1),C(2)]); await listasProteger(); R.juntou=S.clientesReq.map(c=>c.id).sort().join(',');
        listaTirar('clientesReq',['c3']); S.clientesReq=S.clientesReq.filter(c=>c.id!=='c3'); NUV.h['s:clientesReq']='velho'; await listasProteger(); R.excluido=S.clientesReq.map(c=>c.id).sort().join(',');
        R.conflito=nuvJuntar('s:clientesReq',[C(1)],[C(2),C(3)]).map(c=>c.id).sort().join(',');
      } finally { NV.cli=cliO; NV.user=usO; S.clientesReq=c0; S.listaTirados=t0; NUV.h['s:clientesReq']=h0; }
      return R; });
    ok(ls.voltou==='c1,c2,c3,c4,c5','listas: aparelho com a lista vazia tinha que trazer da nuvem ('+ls.voltou+')');
    ok(ls.juntou==='c1,c2,c3,c4,c5,c9','listas: cadastrar com cópia velha tinha que juntar com a nuvem, não sobrescrever ('+ls.juntou+')');
    ok(ls.excluido==='c1,c2,c4,c5,c9','listas: excluído pelo botão não pode voltar ('+ls.excluido+')');
    ok(ls.conflito==='c1,c2','listas: conflito tinha que juntar e respeitar o excluído (c3) ('+ls.conflito+')'); }
  { /* v10.6.33 · leitura cedo das reentregas não apaga a Api-Key; reentrega tirada pelo ✕ não volta (sincronização nem atualização) */
    const rk=await p.evaluate(async()=>{ const R={}; const guardaD=JSON.stringify(RE.ler()), tir0=S.reTirados;
      try{ const D=RE.ler(); D.apiKey='CHAVE-X'; D.dias['2026-11-13']=[{nf:'909958',cli:'CARDOSO',obs:'CLIENTE AUSENTE'},{nf:'111',cli:'OUTRA',obs:'FERIADO'}]; RE.gravar();
        /* simula a tela lendo antes do banco carregar: pacote vazio guardado em memória */
        RE.d={dias:{},apiKey:'',atual:null}; RE.cedo=true; RE.gravar(); R.chave=RE.ler().apiKey; R.dias=(RE.ler().dias['2026-11-13']||[]).length;
        /* ✕ "Não é reentrega" na Correção */
        reTirar(RE.ler().dias['2026-11-13'][0],'2026-11-13'); RE.ler().dias['2026-11-13'].splice(0,1); RE.gravar();
        nuvAplicar('re:2026-11-13',[{nf:'909958',cli:'CARDOSO',obs:'CLIENTE AUSENTE'},{nf:'111',cli:'OUTRA',obs:'FERIADO'}],false);
        R.sinc=(RE.ler().dias['2026-11-13']||[]).map(l=>l.nf).join(',');
        R.outroDia=!reTirado({nf:'909958',obs:'CLIENTE AUSENTE'},'2026-11-20');
      } finally { RE.d=JSON.parse(guardaD); RE.cedo=false; RE.gravar(); S.reTirados=tir0; }
      return R; });
    ok(rk.chave==='CHAVE-X'&&rk.dias===2,'leitura cedo: a Api-Key/reentregas tinham que continuar ('+rk.chave+' · '+rk.dias+')');
    ok(rk.sinc==='111','✕ da reentrega: a sincronização devolveu a linha tirada ('+rk.sinc+')');
    ok(rk.outroDia,'✕ da reentrega: a mesma NF tem que poder voltar a ser reentrega em outro dia'); }
  { /* v10.6.36 · Conferência total: notas conferidas em divergência aparecem em laranja nas barras */
    const cb=await p.evaluate(async()=>{ try{ irPara('conftotal'); }catch(e){} const h=hojeISO(), arq='x '+h.split('-').reverse().join('-')+'.pdf', rs=S.romaneios, ds=S.divergencias, bs=OP.bipes;
      try{ S.romaneios=[{id:'cb1',numero:'1',base:'DF',arquivo:arq,rows:[1,2,3,4].map(i=>({nf:'9100'+i,ped:'9200'+i,vol:'1',dest:'C'}))}]; OP.dia=h; OP.bipes=[]; renderTudo();
        for(const x of S.romaneios[0].rows) opLer([x.nf],'teclado');
        S.divergencias=[{id:'cbd',n:1,d:h,nf:'91001',tipo:'Falta de volume',qtd:1,st:'aberta',hist:[]},{id:'cbv',n:2,d:'2026-01-05',nf:'91002',tipo:'Falta de volume',qtd:1,st:'resolvida',hist:[]}]; /* a de outro dia não conta (v10.6.37) */
        await new Promise(r=>setTimeout(r,0)); /* fora do redesenho (o cache dele vale só dentro dele) */
        const L=opPorRom(); const html=opPorRomHtml(); ctMontar(); const anel=(document.querySelector('#ct-geral .ct-anel')||{}).getAttribute?document.querySelector('#ct-geral .ct-anel').getAttribute('style'):''; return {dn:L[0].dn, txt:/1 em divergência/.test(html), faixa:/width:25%;background:repeating-linear-gradient/.test(html), anel}; }
      finally{ S.romaneios=rs; S.divergencias=ds; OP.bipes=bs; renderTudo(); } });
    ok(cb.dn===1&&cb.txt&&cb.faixa,'conferência total: a fatia em divergência tinha que aparecer em laranja ('+JSON.stringify(cb)+')');
    ok(/--d:25/.test(cb.anel||''),'conferência total: o anel do total tinha que ter a fatia em divergência ('+cb.anel+')'); }
  ok(!p._er.length,'erros na página: '+p._er.join(' | ')); await p.close();
  console.log(falhas.length?'FALHOU:\n- '+falhas.join('\n- '):'OK: todos os testes passaram'); await b.close(); process.exit(falhas.length?1:0); })();
