// Teste das partes pesadas em arquivos à parte (v10.6.00): node testes/partes.js
// Sobe um servidor local (o service worker só existe em http/https) e confere, no app de verdade:
//  1. o app abre sem erro e SEM baixar nenhuma parte pesada na abertura (só o desenho das cidades, 3 s depois);
//  2. leitor de PDF: carrega sob demanda e lê o texto de um PDF de verdade;
//  3. desenho das cidades (Geolocalização) chega e a malha tem as cidades;
//  4. manual: as fotos aparecem quando o manual abre;
//  5. leitor de fotos (OCR): carrega e lê números escritos numa imagem;
//  6. service worker: as partes ficam guardadas no cache próprio e o app abre e lê PDF SEM internet.
const {chromium}=require('playwright'); const path=require('path'); const http=require('http'); const fs=require('fs');
const RAIZ=path.resolve(__dirname,'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
let pedidos=[], fora=false;
const srv=http.createServer((req,res)=>{ pedidos.push(req.url); if(fora){ res.socket.destroy(); return; }
  let u=decodeURIComponent(req.url.split('?')[0]); if(u==='/') u='/index.html';
  const f=path.join(RAIZ,u); if(!f.startsWith(RAIZ)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end('no'); }
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(res); });
function pdfMinimo(txt){ const obj=['<</Type/Catalog/Pages 2 0 R>>','<</Type/Pages/Kids[3 0 R]/Count 1>>',
  '<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',null,'<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>'];
  const st=`BT /F1 18 Tf 20 100 Td (${txt}) Tj ET`; obj[3]=`<</Length ${st.length}>>\nstream\n${st}\nendstream`;
  let s='%PDF-1.4\n'; const off=[]; obj.forEach((o,i)=>{ off.push(s.length); s+=`${i+1} 0 obj\n${o}\nendobj\n`; });
  const x=s.length; s+=`xref\n0 ${obj.length+1}\n0000000000 65535 f \n`+off.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
  return s+`trailer\n<</Size ${obj.length+1}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`; }

(async()=>{
  await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const BASE=`http://127.0.0.1:${srv.address().port}/index.html`;
  const b=await chromium.launch(); const falhas=[]; const ok=(c,m)=>{ if(!c) falhas.push(m); else console.log('  ok  '+m); };
  const ctx=await b.newContext(); const er=[];
  ctx.on('console',m=>{ if(m.type()==='error'&&!/frame-ancestors|ERR_FAILED|ERR_CONNECTION|favicon|404|Failed to load resource/.test(m.text())) er.push(m.text().slice(0,160)); });
  const p=await ctx.newPage(); p.on('pageerror',e=>er.push('PAGEERROR '+e.message));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  await p.goto(BASE); await p.waitForTimeout(1500);
  const cedo=pedidos.filter(u=>/\/a\//.test(u)&&!/malha/.test(u)); ok(cedo.length===0,'abertura não baixa nenhuma parte pesada além do mapa ('+cedo.join(',')+')');
  const tam=fs.statSync(path.join(RAIZ,'index.html')).size; ok(tam<3.5e6,'index.html com '+(tam/1e6).toFixed(2)+' MB');
  await p.waitForTimeout(3000);
  ok(pedidos.some(u=>/\/a\/malha\.js/.test(u)),'desenho das cidades carregou sozinho depois da abertura');
  const mal=await p.evaluate(()=>{ MALHA.d=null; return malha().m.size; }); ok(mal>2000,'malha com '+mal+' cidades');
  const PDF=pdfMinimo('NF 731084 PEDIDO 724486');
  const lido=await p.evaluate(async t=>{ const lib=await HSA.pdf(); const u=new Uint8Array([...t].map(c=>c.charCodeAt(0)));
    const d=await lib.getDocument({data:u,verbosity:0,isOffscreenCanvasSupported:false}).promise; const pg=await d.getPage(1); const c=await pg.getTextContent(); return c.items.map(i=>i.str).join(' '); },PDF);
  ok(/731084/.test(lido),'leitor de PDF carregou sob demanda e leu: '+lido);
  const man=await p.evaluate(async()=>{ irPara('manual'); for(let i=0;i<40;i++){ await new Promise(r=>setTimeout(r,150)); if(Object.keys(MAN_IMG).length&&document.querySelector('#man-doc figure img')) break; }
    return {n:Object.keys(MAN_IMG).length,img:document.querySelectorAll('#man-doc figure img').length}; });
  ok(man.n>0&&man.img>0,'manual com fotos ('+man.n+' fotos, '+man.img+' na tela)');
  const ocr=await p.evaluate(async()=>{ const O=window.HS_OCR; if(!O||!O.tem()||!O.suportado()) return 'sem OCR: tem='+(O&&O.tem())+' suportado='+(O&&O.suportado());
    const cv=document.createElement('canvas'); cv.width=600; cv.height=120; const x=cv.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,600,120); x.fillStyle='#000'; x.font='bold 64px Arial'; x.fillText('731084',40,85);
    try{ const ws=await O.ler(cv,()=>{}); return (ws||[]).map(w=>w.text).join(' '); }catch(e){ return 'erro '+e.message; } });
  ok(/731084/.test(ocr),'leitor de fotos (OCR) carregou e leu: '+ocr);
  // service worker: deixa guardar tudo e testa sem internet
  const sw=await p.evaluate(async()=>{ if(!navigator.serviceWorker) return 'sem sw'; await navigator.serviceWorker.ready; return 'ok'; });
  if(sw==='ok'){ await p.reload(); await p.waitForTimeout(1500);
    await p.evaluate(async()=>{ for(const n of ['pdf.js','pdf-worker.js','ocr.js','manual.js','malha.js']){ const r=await fetch(HSA.url(n)); await r.blob(); } });
    const guard=await p.evaluate(async()=>{ const c=await caches.open('hs-partes-v1'); return (await c.keys()).length; }); ok(guard>=5,'service worker guardou '+guard+' partes no cache próprio');
    fora=true; pedidos=[]; const p2=await ctx.newPage(); p2.on('pageerror',e=>er.push('PAGEERROR(sem net) '+e.message));
    await p2.goto(BASE); await p2.waitForTimeout(2500);
    const off=await p2.evaluate(async t=>{ try{ const lib=await HSA.pdf(); const u=new Uint8Array([...t].map(c=>c.charCodeAt(0))); const d=await lib.getDocument({data:u,verbosity:0,isOffscreenCanvasSupported:false}).promise; return (await (await d.getPage(1)).getTextContent()).items.map(i=>i.str).join(' '); }catch(e){ return 'erro '+e.message; } },PDF);
    ok(/731084/.test(off),'SEM INTERNET: app abriu e leu PDF pelo que estava guardado ('+off+')');
  } else falhas.push('service worker não registrou: '+sw);
  ok(er.length===0,'sem erro no console'+(er.length?': '+er.join(' | '):''));
  await b.close(); srv.close();
  if(falhas.length){ console.log('FALHOU:\n - '+falhas.join('\n - ')); process.exit(1); } console.log('OK: partes pesadas fora do index funcionando');
})().catch(e=>{ console.error(e); process.exit(1); });
