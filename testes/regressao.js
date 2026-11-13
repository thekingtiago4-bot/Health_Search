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
      /* 9.20.1: barra de baixo sem encavalar (Desfazer dentro da barra e 💾 Salvar escondido) */
      out.barra=(()=>{ const d=document.querySelector('#op-cam #op-desf'), sv=document.getElementById('hs-salvar');
        return {naBarra:!!(d&&d.closest('.bar')), salvarOculto:!sv||getComputedStyle(sv).display==='none'}; })();
      out.bipes1=OP.bipes.length; out.espera=!!OP.espera; out.bts=[...document.querySelectorAll('#op-cam .op-conf .bts button')].map(x=>x.className).join(',');
      await w(2500); out.fantasma=OP.bipes.length; /* etiqueta parada na frente não pode bipar sozinha de novo */
      document.querySelector('#op-cam .op-conf .no').click(); await w(200);
      out.qtd=[...document.querySelectorAll('#op-cam .op-qt .gr button')].map(x=>x.textContent).join(',');
      document.querySelector('#op-cam .op-qt .gr button[data-n="1"]').click(); await w(300);
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
    ok(c.qtd==='0,1,2,3','conferência do bipe: faltou a escolha de quantos volumes chegaram ('+c.qtd+')');
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
    ok(/1 de 31/.test(e2.linha),'divergência: a coluna Vol. deveria mostrar "1 de 31" ('+e2.linha.slice(0,90)+')');
    ok(e2.aberto,'divergência: o Editar não abriu o formulário "Ou preencher à mão"');
    ok(e2.qtd==='1'&&e2.tot==='31'&&e2.botao==='Salvar alterações','divergência: o Editar não trouxe os dados para o formulário ('+JSON.stringify(e2)+')'); }
  ok(!p._er.length,'erros na página: '+p._er.join(' | ')); await p.close();
  console.log(falhas.length?'FALHOU:\n- '+falhas.join('\n- '):'OK: todos os testes passaram'); await b.close(); process.exit(falhas.length?1:0); })();
