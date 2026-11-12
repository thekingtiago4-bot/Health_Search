// Teste automático do Health Search — roda antes de cada publicação: node testes/regressao.js
// Cobre os fluxos que já deram problema: bipagem caixa a caixa, mesma caixa parada, outro usuário,
// reentrega confirmada não volta, mesclagem entre aparelhos, atualização devolve o que sumiu, rotas, busca.
const {chromium}=require('playwright'); const path=require('path');
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}); const falhas=[]; const ok=(c,m)=>{ if(!c) falhas.push(m); };
  const nova=async()=>{ const p=await b.newPage(); const er=[]; p.on('pageerror',e=>er.push(e.message)); await p.route(/^https?:\/\//,r=>r.abort()); await p.goto(URL); await p.waitForTimeout(1500); p._er=er; return p; };
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
      out.bipes1=OP.bipes.length; out.espera=!!OP.espera; out.bts=[...document.querySelectorAll('#op-cam .op-conf .bts button')].map(x=>x.className).join(',');
      await w(2500); out.fantasma=OP.bipes.length; /* etiqueta parada na frente não pode bipar sozinha de novo */
      document.querySelector('#op-cam .op-conf .no').click(); await w(200);
      out.qtd=[...document.querySelectorAll('#op-cam .op-qt .gr button')].map(x=>x.textContent).join(',');
      document.querySelector('#op-cam .op-qt .gr button[data-n="1"]').click(); await w(300);
      const d=S.divergencias[0]||{}; out.dv=d.tipo+'/'+d.qtd; out.esperaFim=!!OP.espera; out.vols=OP.bipes.filter(x=>x.ped==='724486').length;
      opCamFechar(); S.divergencias=[]; S.opPorVolume=false; return out; });
    ok(c.bipes1===1,'conferência do bipe: a câmera registrou '+c.bipes1+' bipe(s) em vez de 1');
    ok(c.espera===true,'conferência do bipe: a câmera não travou esperando a resposta');
    ok(c.bts==='no,sim','conferência do bipe: botões ✗ e ✓ não apareceram ('+c.bts+')');
    ok(c.fantasma===1,'bipe fantasma: a etiqueta parada na frente foi bipada de novo ('+c.fantasma+' bipes)');
    ok(c.qtd==='0,1,2,3','conferência do bipe: faltou a escolha de quantos volumes chegaram ('+c.qtd+')');
    ok(c.dv==='Falta de volume/2','conferência do bipe: divergência errada ('+c.dv+')');
    ok(c.vols===1,'conferência do bipe: chegou 1 de 3 e o app marcou '+c.vols+' volume(s) conferido(s)');
    ok(c.esperaFim===false,'conferência do bipe: a câmera não voltou a ler depois da resposta'); }
  ok(!p._er.length,'erros na página: '+p._er.join(' | ')); await p.close();
  console.log(falhas.length?'FALHOU:\n- '+falhas.join('\n- '):'OK: todos os testes passaram'); await b.close(); process.exit(falhas.length?1:0); })();
