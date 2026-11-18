// Passa por TODAS as abas do menu (como admin e como conferente) e acusa qualquer erro de código: node testes/abas.js
// Serve para pegar o que sobra depois de tirar um módulo: uma aba que chama função que não existe mais.
const {chromium}=require('playwright'); const path=require('path');
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{
  const b=await chromium.launch(); const falhas=[]; const ok=(c,m)=>{ if(!c) falhas.push(m); };
  /* v10.6.25: também no tamanho de celular (o CSS e vários remendos do celular só rodam abaixo de 860px) */
  for(const papel of ['admin','conferente','admin-celular']){
    const cel=papel.endsWith('-celular');
    const p=await b.newPage(cel?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:1366,height:900}}); const er=[];
    p.on('pageerror',e=>er.push('PAGEERROR '+e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_|Failed to load|net::|favicon|supabase|fetch|frame-ancestors/i.test(m.text())) er.push(m.text().slice(0,200)); });
    await p.route(/^https?:\/\//,r=>r.abort()); await p.addInitScript(()=>{ try{ Object.defineProperty(window,'indexedDB',{value:undefined}); }catch(e){} });
    await p.goto(URL); await p.waitForTimeout(2500);
    const telas=await p.evaluate(async(papel)=>{ const w=ms=>new Promise(x=>setTimeout(x,ms));
      try{ NV.perfil={papel:/^admin/.test(papel)?'admin':'usuario',ativo:true}; }catch(e){}
      try{ document.querySelectorAll('.fundo').forEach(f=>f.remove()); }catch(e){}
      const ts=[...new Set([...document.querySelectorAll('.nav [data-tela]')].map(x=>x.dataset.tela))]; const vistas=[];
      for(const t of ts){ try{ irPara(t); }catch(e){ vistas.push(t+' ERRO '+e.message); continue; } await w(350);
        const sec=document.getElementById('t-'+t); vistas.push(t+(sec&&!sec.hidden?'':' (sem tela visível)'));
        document.querySelectorAll('.fundo').forEach(f=>f.remove()); }
      try{ muralAbrir&&muralAbrir(); await w(400); muralFechar&&muralFechar(); }catch(e){ vistas.push('mural ERRO '+e.message); }
      return vistas; },papel);
    await p.waitForTimeout(800);
    console.log(papel+': '+telas.join(' · '));
    ok(!telas.some(t=>/ERRO/.test(t)),papel+': aba com erro: '+telas.filter(t=>/ERRO/.test(t)).join(' | '));
    for(const morto of ['avarias','registro','rotadia','reldireto','chamados']) ok(!telas.some(t=>t.startsWith(morto)),papel+': a aba "'+morto+'" ainda está no menu');
    ok(er.length===0,papel+': erro de código ao passar pelas abas: '+er.slice(0,6).join(' | '));
    await p.close(); }
  await b.close();
  if(falhas.length){ console.log('FALHOU:\n - '+falhas.join('\n - ')); process.exit(1); } console.log('OK: todas as abas abrem sem erro');
})().catch(e=>{ console.error(e); process.exit(1); });
