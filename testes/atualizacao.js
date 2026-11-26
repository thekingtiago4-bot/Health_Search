// A faixa de atualização precisa aparecer, e o botão "Buscar atualização" precisa existir
// e forçar o recarregamento quando há versão nova. Uso: node testes/atualizacao.js [arquivo.html]
const {chromium}=require('playwright'); const path=require('path'); const http=require('http'); const fs=require('fs');
const ARQ=process.argv[2]||'index.html'; const RAIZ=path.resolve(__dirname,'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
let versaoServida=null; // quando preenchido, o servidor finge que ha uma versao mais nova
const srv=http.createServer((q,r)=>{ let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+ARQ;
  if(u==='/version.json'&&versaoServida){ r.writeHead(200,{'Content-Type':'application/json'}); return r.end(JSON.stringify({versao:versaoServida,data:'2026-12-01',novidades:'teste'})); }
  const f=path.join(RAIZ,u); if(!f.startsWith(RAIZ)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ r.writeHead(404); return r.end('no'); }
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
(async()=>{
  await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const P=srv.address().port;
  const b=await chromium.launch(); const falhas=[];
  versaoServida='99.0.0';
  const pg=await b.newPage();
  await pg.goto(`http://127.0.0.1:${P}/${ARQ}`,{waitUntil:'domcontentloaded'});
  const v=await pg.evaluate(()=>typeof HS_VERSAO!=='undefined'?HS_VERSAO:'?');
  try{ await pg.waitForFunction(()=>{const a=document.getElementById('app-att');return a&&!a.hidden;},null,{timeout:20000}); }
  catch(e){ falhas.push('a faixa de nova versão não apareceu'); }
  const temBotao=await pg.evaluate(()=>!!document.getElementById('app-ver-bt'));
  if(!temBotao) falhas.push('o botão "Buscar atualização" não está na tela');
  else {
    const antes=pg.url();
    await pg.evaluate(()=>document.getElementById('app-ver-bt').click());
    try{ await pg.waitForFunction(u=>location.href!==u,antes,{timeout:20000}); }
    catch(e){ falhas.push('o botão "Buscar atualização" não recarregou com versão nova disponível'); }
    if(!/[?&]v=/.test(pg.url())) falhas.push('o recarregamento não furou o cache (faltou o ?v= no endereço): '+pg.url());
  }
  await pg.close();
  { /* v10.6.58: abriu com versão nova = atualiza sozinho, uma vez só (sem laço se o servidor ainda mandar a velha) */
    const pf=await b.newPage(); let cargas=0; pf.on('load',()=>cargas++);
    await pf.goto(`http://127.0.0.1:${P}/${ARQ}`,{waitUntil:'domcontentloaded'});
    try{ await pf.waitForFunction(()=>/[?&]v=/.test(location.href),null,{timeout:25000}); }catch(e){ falhas.push('ao abrir com versão nova, o app não se atualizou sozinho '+await pf.evaluate(()=>JSON.stringify({g:localStorage.getItem('healthSearch.forcouVersao'),ov:!!document.getElementById('hs-forca-att'),f:typeof hsForcarAtualizacao,att:!!document.getElementById('app-att'),u:location.href}))); }
    await pf.waitForTimeout(15000);
    if(cargas>2) falhas.push('o app ficou recarregando em laço ('+cargas+' cargas)');
    await pf.close(); }
  await b.close(); srv.close();
  if(falhas.length){ console.error('FALHOU ('+v+'):\n- '+falhas.join('\n- ')); process.exit(1); }
  console.log('OK: a faixa aparece e o botão "Buscar atualização" força a versão nova (app '+v+')');
})();
