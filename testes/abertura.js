// Fluidez da abertura (#hs-cine): mede o CPU que o navegador gasta durante a animação de entrada,
// com a CPU freada 4x (simula celular/tablet). Uso: node testes/abertura.js [arquivo.html]
// Mede o CUSTO DA ABERTURA: roda o mesmo boot duas vezes (com e sem a animação) e tira a diferença,
// para não confundir o peso da animação com o peso normal de abrir o app.
// Referência medida em 16/11/2026: v10.5.2 custava ~1.700ms; v10.5.3 custa ~150ms (limite do teste: 400ms).
const {chromium}=require('playwright'); const path=require('path'); const http=require('http'); const fs=require('fs');
const ARQ=process.argv[2]||'index.html'; const RAIZ=path.resolve(__dirname,'..'); const LIMITE=400;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{ let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+ARQ; const f=path.join(RAIZ,u);
  if(!f.startsWith(RAIZ)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ r.writeHead(404); return r.end('no'); }
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
const val=(m,k)=>(m.metrics.find(x=>x.name===k)||{value:0}).value;
(async()=>{ await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const P=srv.address().port;
  const b=await chromium.launch(); const falhas=[];
  const medir=async(W,H,mov)=>{
    const pg=await b.newPage({viewport:{width:W,height:H},reducedMotion:mov?'no-preference':'reduce'});
    const cdp=await pg.context().newCDPSession(pg); await cdp.send('Performance.enable');
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
    await pg.goto(`http://127.0.0.1:${P}/${ARQ}`,{waitUntil:'domcontentloaded'});
    await pg.waitForTimeout(800);
    const modo=await pg.evaluate(()=>{ const c=document.getElementById('hs-cine'); return c?(c.classList.contains('leve')?'leve':'cheio'):'sem abertura'; });
    const a=await cdp.send('Performance.getMetrics'); await pg.waitForTimeout(4000);
    const z=await cdp.send('Performance.getMetrics');
    const cpu=(val(z,'ProcessTime')-val(a,'ProcessTime'))*1000;
    await pg.close(); return {modo,cpu};
  };
  for(const [nome,W,H] of [['celular/tablet',820,1180],['PC',1600,900]]){
    const com=await medir(W,H,true), sem=await medir(W,H,false);
    const custo=com.cpu-sem.cpu;
    console.log(`${nome}: modo ${com.modo} | boot sem animação ${sem.cpu.toFixed(0)}ms | com animação ${com.cpu.toFixed(0)}ms | custo da abertura ${custo.toFixed(0)}ms`);
    if(com.modo==='sem abertura') falhas.push(`${nome}: a abertura não apareceu`);
    if(custo>LIMITE) falhas.push(`${nome}: a abertura custou ${custo.toFixed(0)}ms de CPU (limite ${LIMITE}ms) — voltou a pesar`);
  }
  await b.close(); srv.close();
  if(falhas.length){ console.error('FALHOU:\n- '+falhas.join('\n- ')); process.exit(1); }
  console.log('OK: a abertura está leve nos dois tamanhos');
})();
