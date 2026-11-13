// Teste automático do Health Search — roda antes de cada publicação: node testes/regressao.js
// Cobre os fluxos que já deram problema: bipagem caixa a caixa, mesma caixa parada, outro usuário,
// reentrega confirmada não volta, mesclagem entre aparelhos, atualização devolve o que sumiu, rotas, busca.
const {chromium}=require('playwright'); const path=require('path');
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{
  const opKi=v=>String(v||'').replace(/\D/g,'').replace(/^0+(?=\d)/,''); const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}); const falhas=[]; const ok=(c,m)=>{ if(!c) falhas.push(m); };
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
              cpf:cadMotCPF('GIOVANNI')}; });
    ok(k.todos==='ADRIEL,BETO','checklist: rastreador Não deveria tirar o motorista da planilha ('+k.todos+')');
    ok(k.ativos==='ADRIEL'&&k.des==='BETO','checklist: filtro de ativos/desativados errado ('+k.ativos+' | '+k.des+')');
    ok(k.st==='DESATIVADO','checklist: rastreador desativado não deixou a linha como DESATIVADO ('+k.st+')');
    ok(k.novo,'checklist: cadastrar um agregado não criou a linha dele na planilha');
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
      S.ckApagados=[{mot:'GUSMAO',em:new Date().toISOString(),por:'teste'}];
      S.checklist=ckTudo().filter(x=>x.id!=='k1');
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
      const linha=document.querySelector('#t-divergencias .op-tab tbody tr').innerText.replace(/\s+/g,' ');
      document.querySelector('[data-dv="editar"]').click();
      const f=document.getElementById('dv-form'), det=f.closest('details');
      const r={linha,aberto:!!(det&&det.open),qtd:document.getElementById('dv-qtd').value,tot:(document.getElementById('dv-tot')||{}).value,botao:document.getElementById('dv-ok').textContent};
      S.divergencias=[]; return r; });
    ok(/30 de 31/.test(e2.linha)&&/faltam 1/.test(e2.linha),'divergência: a coluna Vol. deveria mostrar "30 de 31" (chegaram) e "faltam 1" ('+e2.linha.slice(0,90)+')');
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
    ok(/caixas 2\/5, 4\/5 e 5\/5/.test(v),'divergência: deveria listar as caixas que faltaram — '+v.slice(0,180)); }
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
  /* 9.26.5: quadradinho na lista do romaneio marca a nota como bipada (e pergunta os volumes se tiver mais de 1) */
  { const mk=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); const h=hojeISO(); const a='x '+h.split('-').reverse().join('-')+'.pdf';
      S.romaneios=[{id:'mk1',numero:'0236360',base:'CAJ',motorista:'REGINALDO',arquivo:a,rows:[
        {nf:'741351',ped:'734641',vol:'1',dest:'CLINICA VERA CRUZ LTDA',cid:'PATOS DE MINAS',uf:'MG'},
        {nf:'741828',ped:'735284',vol:'4',dest:'EDUARDA APARECIDA',cid:'PLANURA',uf:'MG'}]}];
      S.divergencias=[]; OP.dia=h; renderTudo(); irPara('operacao'); OP.bipes=[];
      opRomLista('mk1'); await w(200);
      const cx=[...document.querySelectorAll('.fundo [data-rl-mk]')]; const antes=cx.length;
      /* 1 volume: marca e pronto */
      cx[0].checked=true; cx[0].dispatchEvent(new Event('change',{bubbles:true})); await w(400);
      const depois1=document.querySelectorAll('.fundo [data-rl-mk]').length;
      const aberta1=!!document.querySelector('.fundo [data-rl-mk]');
      /* 4 volumes: tem que perguntar */
      document.querySelector('.fundo [data-rl-mk]').checked=true;
      document.querySelector('.fundo [data-rl-mk]').dispatchEvent(new Event('change',{bubbles:true})); await w(300);
      const perguntou=!!document.querySelector('[data-mcx]');
      const grade=[...document.querySelectorAll('[data-mcx]')].map(x=>x.textContent).join(',');
      document.querySelector('[data-mcx="3"]').click();
      [...document.querySelectorAll('.fundo [data-a="ok"]')].pop().click(); await w(450);
      const d=S.divergencias[0]||{}; const aberta2=!!document.querySelector('.fundo [data-rl-mk]')||!!document.querySelector('.fundo .modal');
      const bip=OP.bipes.map(x=>x.nf+':'+x.status).join(' ');
      [...document.querySelectorAll('.fundo')].forEach(x=>x.remove()); S.divergencias=[];
      return {antes,depois1,aberta1,perguntou,grade,qtd:d.qtd,tot:d.tot,falt:(d.falt||[]).join(','),bip,aberta2}; });
    ok(mk.antes===2,'romaneio: cada nota faltando precisa de um quadradinho ('+mk.antes+')');
    ok(mk.depois1===1&&mk.aberta1,'romaneio: ao marcar, a nota sai de Faltando e a janela continua aberta ('+mk.depois1+')');
    ok(mk.perguntou,'romaneio: nota com 4 volumes tem que perguntar quais chegaram');
    ok(mk.grade==='1/4,2/4,3/4,4/4','romaneio: a grade de caixas veio errada ('+mk.grade+')');
    ok(mk.qtd===1&&mk.tot===4&&mk.falt==='3','romaneio: faltando a caixa 3/4 tem que virar divergência ('+mk.qtd+'/'+mk.tot+' falt='+mk.falt+')');
    ok(/741351:ok/.test(mk.bip),'romaneio: a nota de 1 volume tinha que ficar conferida ('+mk.bip+')');
    ok(mk.aberta2,'romaneio: depois de confirmar os volumes a janela tem que continuar aberta'); }
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
  /* 9.26.6: na aba NexBip o BIT não abre balão — só o número na cabeça dele */
  { const bb=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      irPara('operacao'); await w(150); EVA.naoLidas=0; EVA.aberta=false;
      const antes=(document.getElementById('eva-qt')||{}).textContent;
      evaBalao('teste de recado na operação',4000); await w(150);
      const bal=document.getElementById('eva-balao'); const naOp={bal:!bal||bal.hidden,qt:(document.getElementById('eva-qt')||{}).textContent,esc:(document.getElementById('eva-qt')||{}).hidden};
      irPara('conftotal'); await w(150); evaBalao('recado fora da operação',4000); await w(150);
      const b2=document.getElementById('eva-balao'); const fora=!!b2&&!b2.hidden;
      if(b2) b2.hidden=true; EVA.naoLidas=0; irPara('operacao');
      return {antes,naOp,fora}; });
    ok(bb.naOp.bal,'BIT: na aba NexBip não pode abrir balão de recado');
    ok(bb.naOp.esc===false&&+bb.naOp.qt>0,'BIT: o recado da aba NexBip tem que virar número na cabeça dele ('+bb.naOp.qt+')');
    ok(bb.fora,'BIT: fora da aba NexBip o balão continua aparecendo'); }
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
  ok(!p._er.length,'erros na página: '+p._er.join(' | ')); await p.close();
  console.log(falhas.length?'FALHOU:\n- '+falhas.join('\n- '):'OK: todos os testes passaram'); await b.close(); process.exit(falhas.length?1:0); })();
