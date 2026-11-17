// v10.5.7: o Painel de Gestão não pode listar um "dia" que não é dia.
// O bug: Restaurar backup/versão carimbava {em:<data>} dentro de todo campo s:, inclusive
// o s:gsSnap, que é um mapa dia->foto. O "em" virava uma chave e aparecia como um dia,
// e escolher esse dia mostrava "undefined%".
const {chromium}=require('playwright'); const path=require('path'); const http=require('http'); const fs=require('fs');
const ARQ=process.argv[2]||'index.html'; const RAIZ=path.resolve(__dirname,'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{ let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+ARQ; const f=path.join(RAIZ,u);
  if(!f.startsWith(RAIZ)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ r.writeHead(404); return r.end('no'); }
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
(async()=>{
  await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const P=srv.address().port;
  const b=await chromium.launch(); const pg=await b.newPage();
  await pg.goto(`http://127.0.0.1:${P}/${ARQ}`,{waitUntil:'domcontentloaded'});
  await pg.waitForFunction(()=>typeof gsDiasFoto==='function'&&typeof S==='object',null,{timeout:60000});
  const r=await pg.evaluate(()=>{
    S.gsSnap={'2026-11-16':{dia:'2026-11-16',pct:97},'2026-11-13':{dia:'2026-11-13',pct:100},em:'2026-11-17T04:00:00.000Z',dia:'2026-11-16'};
    const lista=gsDiasFoto();
    GS.dia='em'; const escolhido=gsDia();
    const foto=gsFotoLer('em'); const chaves=Object.keys(S.gsSnap);
    /* o lixo tambem nao pode VOLTAR da nuvem: entrada, merge e saida */
    const daNuvem={'2026-11-12':{dia:'2026-11-12',pct:88},em:'2026-11-17T04:00:00.000Z'};
    nuvAplicar('s:gsSnap',JSON.parse(JSON.stringify(daNuvem)),false);
    const aposNuvem=Object.keys(S.gsSnap||{});
    const juntado=Object.keys(nuvJuntar('s:gsSnap',{'2026-11-16':{pct:1}},JSON.parse(JSON.stringify(daNuvem)))||{});
    const sobe=Object.keys((nuvLocal().get('s:gsSnap')||{valor:{}}).valor||{});
    return {lista, chaves, escolhido, fotoLixo:foto, aposNuvem, juntado, sobe};

  });
  /* caminho do botao "Puxar tudo da nuvem": o banco devolve o lixo e o app nao pode aceitar */
  const puxou=await pg.evaluate(async()=>{
    const linha={chave:'s:gsSnap',tipo:'s',apagado:false,atualizado_em:'2026-11-17T05:00:00.000Z',
      valor:{'2026-11-10':{dia:'2026-11-10',pct:91},em:'2026-11-17T05:00:00.000Z'}};
    const resp={data:[linha],error:null};
    const cadeia={select:()=>cadeia,order:()=>cadeia,range:async()=>resp};
    if(!NV.cli) NV.cli={};
    const _from=NV.cli.from; NV.cli.from=t=>t==='hs_sync'?cadeia:(_from?_from.call(NV.cli,t):cadeia);
    const _cf=window.confirmar; window.confirmar=async()=>true;
    const _on=window.opOnline; window.opOnline=()=>true;
    try{ await nuvPuxarTudo(); }catch(e){ return {erro:String(e)}; }
    finally{ NV.cli.from=_from; window.confirmar=_cf; window.opOnline=_on; }
    return {chaves:Object.keys(S.gsSnap||{}), lista:gsDiasFoto()};
  });
  const ok=d=>/^\d{4}-\d{2}-\d{2}$/.test(d);
  const falhas=[];
  if(r.lista.some(d=>!ok(d))) falhas.push('a lista de dias ainda traz lixo: '+JSON.stringify(r.lista));
  if(r.chaves.some(k=>!ok(k))) falhas.push('o gsSnap não foi faxinado: '+JSON.stringify(r.chaves));
  if(!ok(r.escolhido)) falhas.push('gsDia() devolveu um dia inválido: '+r.escolhido);
  if(r.fotoLixo!==null) falhas.push('gsFotoLer("em") devia devolver null e devolveu '+JSON.stringify(r.fotoLixo));
  if(r.aposNuvem.some(k=>!ok(k))) falhas.push('o lixo voltou da nuvem: '+JSON.stringify(r.aposNuvem));
  if(r.juntado.some(k=>!ok(k))) falhas.push('o lixo voltou no merge com a nuvem: '+JSON.stringify(r.juntado));
  if(r.sobe.some(k=>!ok(k))) falhas.push('o aparelho ainda sobe lixo para a nuvem: '+JSON.stringify(r.sobe));
  if(puxou.erro) falhas.push('Puxar tudo da nuvem quebrou: '+puxou.erro);
  else { if((puxou.chaves||[]).some(k=>!ok(k))) falhas.push('Puxar tudo da nuvem trouxe lixo: '+JSON.stringify(puxou.chaves));
         if((puxou.lista||[]).some(k=>!ok(k))) falhas.push('depois de Puxar tudo, a lista tem lixo: '+JSON.stringify(puxou.lista)); }
  await b.close(); srv.close();
  if(falhas.length){ console.error('FALHOU:\n- '+falhas.join('\n- ')); process.exit(1); }
  console.log('OK: o Painel de Gestão só aceita dia de verdade (lista: '+r.lista.join(', ')+')');
})();
