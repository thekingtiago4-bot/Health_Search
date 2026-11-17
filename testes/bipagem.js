// A conferência não pode ficar lenta nem mudar de resultado.
// Bug real (17/11/2026): a cada bipe o app varria todos os bipes para cada linha de cada
// romaneio — multiplicação que travava a bipagem. Este teste mede o tempo por bipe e
// confere que o resultado continua igual ao do método antigo (varredura direta).
const {chromium}=require('playwright'); const path=require('path'); const http=require('http'); const fs=require('fs');
const ARQ=process.argv[2]||'index.html'; const RAIZ=path.resolve(__dirname,'..'); const LIMITE=170; // ms por bipe, CPU freada 4x (medido na v10.5.13: ~353 ms)
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{ let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+ARQ; const f=path.join(RAIZ,u);
  if(!f.startsWith(RAIZ)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ r.writeHead(404); return r.end('no'); }
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
(async()=>{
  await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const P=srv.address().port;
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:800}});
  const cdp=await pg.context().newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await pg.goto(`http://127.0.0.1:${P}/${ARQ}`,{waitUntil:'domcontentloaded'});
  await pg.waitForFunction(()=>typeof opLer==='function'&&typeof opPendentes==='function',null,{timeout:60000});
  const r=await pg.evaluate(()=>{
    /* tamanho de um dia de operacao do Tiago: 7 romaneios, ~1.400 linhas, 600 bipes */
    let nf=100000; S.romaneios=[]; const codigos=[]; const hoje=hojeISO();
    for(let k=0;k<7;k++){ const rows=[]; for(let i=0;i<200;i++){ nf++;
        rows.push({nf:String(nf),ped:'P'+nf,dest:'CLIENTE '+(nf%80),cid:'ARARAQUARA',uf:'SP',vol:'3',valor:'1.234,56'});
        codigos.push(String(nf)); }
      S.romaneios.push({id:'r'+k,numero:'R'+k,dia:hoje,importadoEm:hoje+'T08:00:00.000Z',rows}); }
    OP.dia=hoje; OP.bipes=[];
    const t=[]; for(let i=0;i<600;i++){ const a=performance.now(); try{ opLer([codigos[i%codigos.length]],'teclado'); }catch(e){} t.push(performance.now()-a); }
    const fim50=t.slice(-50).reduce((s,v)=>s+v,0)/50;
    t.sort((x,y)=>x-y);
    /* mesmo resultado que a varredura direta? */
    const bs=OP.bipes.filter(b=>b.status==='ok'||b.status==='semnota'||b.status==='dup');
    const ix=opBipIx(bs); let difs=0, pares=0;
    for(const r of S.romaneios) for(const x of r.rows){ const ped=opK(x.ped), nf2=opK(x.nf); if(!ped&&!nf2) continue;
      const velho=bs.filter(b=>(ped&&b.ped===ped)||(nf2&&b.nf===nf2));
      const novo=opBipsDe(ix,ped,nf2); pares++;
      if(velho.length!==novo.length||velho.some((v,i)=>v!==novo[i])) difs++; }
    return {bipes:OP.bipes.length, mediana:+t[300].toFixed(1), p90:+t[540].toFixed(1), pior:+t[599].toFixed(1), fim50:+fim50.toFixed(1), difs, pares,
            pendentes:(()=>{ try{ return opPendentes().length; }catch(e){ return -1; } })()};
  });
  const falhas=[];
  if(r.difs>0) falhas.push(`o indice mudou o resultado em ${r.difs} de ${r.pares} linhas — nao pode mudar nada`);
  if(r.mediana>LIMITE) falhas.push(`bipe lento: mediana ${r.mediana} ms (limite ${LIMITE} ms)`);
  if(r.bipes!==600) falhas.push(`gravou ${r.bipes} bipes de 600`);
  if(r.fim50>LIMITE*1.6) falhas.push(`a bipagem piora ao longo do turno: ultimos 50 bipes a ${r.fim50} ms`);
  await b.close(); srv.close();
  console.log(`600 bipes · 7 romaneios · 1.400 linhas · CPU freada 4x: mediana ${r.mediana} ms · p90 ${r.p90} ms · ultimos 50 ${r.fim50} ms · ${r.pendentes} pendentes`);
  if(falhas.length){ console.error('FALHOU:\n- '+falhas.join('\n- ')); process.exit(1); }
  console.log('OK: bipagem rápida e com o mesmo resultado de antes');
})();
