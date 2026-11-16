// Teste da camada HSDB (IndexedDB) — roda antes de publicar junto com regressao.js: node testes/idb.js
// O Chromium só dá IndexedDB de verdade em origem http/https (em file:// é instável), então este teste
// sobe um servidor local e abre o app por http://127.0.0.1. Valida a CAMADA DE ARMAZENAMENTO (LS) direto,
// lendo por LS.getItem — não depende do boot do app nem da tela de login da nuvem. Cobre o que não pode falhar:
//  1. Migração: o que estava no localStorage vai para o IndexedDB SEM PERDER NADA e some do localStorage.
//  2. Persistência: fechou e abriu, continua lá (veio do IndexedDB).
//  3. União entre abas: aba velha gravando no localStorage depois da migração não apaga o que já havia.
//  4. Sessão intacta: hs-sessao, sb-*-auth-token e healthSearch.vivo NUNCA entram no IndexedDB.
//  5. Gravação que falha vira erro de verdade (assentar rejeita), não um "ok" silencioso, e se recupera.
//  6. Apagar tudo do aparelho (bloqueio) limpa o IndexedDB.
const {chromium}=require('playwright'); const path=require('path'); const http=require('http'); const fs=require('fs');
const RAIZ=path.resolve(__dirname,'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((req,res)=>{ let u=decodeURIComponent(req.url.split('?')[0]); if(u==='/') u='/index.html';
  const f=path.join(RAIZ,u); if(!f.startsWith(RAIZ)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end('no'); }
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(res); });

(async()=>{
  await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const PORT=srv.address().port; const BASE=`http://127.0.0.1:${PORT}/index.html`;
  const b=await chromium.launch(); const falhas=[]; const ok=(c,m)=>{ if(!c) falhas.push(m); };
  const ctx=await b.newContext(); // um contexto só = mesmo "aparelho" (IndexedDB persiste entre reloads)
  const er=[]; ctx.on('console',m=>{ if(m.type()==='error'&&!/frame-ancestors|ERR_FAILED|favicon|404/.test(m.text())) er.push(m.text().slice(0,160)); });
  const p=await ctx.newPage(); p.on('pageerror',e=>er.push('PAGEERROR '+e.message));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort()); // corta rede externa, deixa o localhost

  const DIA='2026-11-10';
  // semeia o localStorage como um aparelho que JÁ tinha dados — só na primeira vez (antes de existir a marca
  // de migração). Depois que o app migra, a marca aparece e esta função não semeia de novo: assim os reloads
  // dos cenários 2 e 3 não reescrevem o que o teste quer medir.
  await p.addInitScript(([dia])=>{ try{ if(localStorage.getItem('healthSearch.idb')) return;
    localStorage.setItem('healthSearch.v1',JSON.stringify({versao:1,romaneios:[{id:'r1',numero:'0019486',rows:[{nf:'731084',ped:'724486',vol:'3'}]}],agendamentos:[{nf:'111',em:'2026-11-09'}],historico:[],divergencias:[{id:'d1',nf:'731084',st:'abertas',por:'Tiago'}]}));
    localStorage.setItem('healthSearch.op.dia.'+dia,JSON.stringify([{local_id:'b1',dia,status:'ok',nf:'731084',ped:'724486'}]));
    localStorage.setItem('healthSearch.romBanco',JSON.stringify({s:'2026-11',dias:{[dia]:[{id:'r1',numero:'0019486'}]}}));
    localStorage.setItem('healthSearch.reentregas',JSON.stringify({dias:{[dia]:[{nf:'999',obs:'FERIADO'}]},atual:null,apiKey:''}));
    localStorage.setItem('healthSearch.nuvHash',JSON.stringify({'s:nex':'abc'}));
    localStorage.setItem('hs-sessao','{"token":"x"}'); localStorage.setItem('sb-proj-auth-token','{"access":"y"}');
    localStorage.setItem('healthSearch.vivo',String(Date.now())); localStorage.setItem('healthSearch.nuvem','{"url":"u","chave":"k"}');
  }catch(e){} },[DIA]);

  const esperaIdb=async()=>{ await p.waitForFunction(()=>window.LS&&window.LS.diag&&window.LS.diag.modo==='idb',{timeout:20000});
    await p.evaluate(()=>window.LS.pronto); await p.evaluate(()=>window.LS.assentar().catch(()=>{})); };

  // ---- 1) migração ----
  await p.goto(BASE); await esperaIdb();
  const m1=await p.evaluate(()=>JSON.parse(JSON.stringify(window.LS.diag)));
  ok(m1.modo==='idb','1) devia estar em modo idb, veio '+m1.modo+' (erro: '+m1.erro+')');
  ok(m1.migrou&&m1.migrou.n>=5,'1) migração não contou as chaves ('+JSON.stringify(m1.migrou)+')');
  ok(!m1.perdido,'1) o app achou que perdeu dados na migração');

  const d1=await p.evaluate(dia=>{ const g=k=>window.LS.getItem(k); const v1=JSON.parse(g('healthSearch.v1')||'{}');
    return { roms:(v1.romaneios||[]).length, ag:(v1.agendamentos||[]).length, dv:(v1.divergencias||[]).length,
      bip:JSON.parse(g('healthSearch.op.dia.'+dia)||'[]').length, rom:!!g('healthSearch.romBanco'),
      re:(JSON.parse(g('healthSearch.reentregas')||'{}').dias)?Object.keys(JSON.parse(g('healthSearch.reentregas')).dias).length:0,
      hash:!!g('healthSearch.nuvHash') }; },DIA);
  ok(d1.roms===1&&d1.ag===1&&d1.dv===1,'1) estado principal não sobreviveu à migração ('+JSON.stringify(d1)+')');
  ok(d1.bip===1&&d1.rom&&d1.re===1&&d1.hash,'1) bipes/romBanco/reentregas/hash não sobreviveram ('+JSON.stringify(d1)+')');

  const ls1=await p.evaluate(dia=>({ v1:localStorage.getItem('healthSearch.v1'), bip:localStorage.getItem('healthSearch.op.dia.'+dia),
    re:localStorage.getItem('healthSearch.reentregas'), rom:localStorage.getItem('healthSearch.romBanco'),
    sessao:localStorage.getItem('hs-sessao'), sb:localStorage.getItem('sb-proj-auth-token'),
    vivo:localStorage.getItem('healthSearch.vivo'), nuvem:localStorage.getItem('healthSearch.nuvem'), marca:localStorage.getItem('healthSearch.idb') }),DIA);
  ok(ls1.v1===null&&ls1.bip===null&&ls1.re===null&&ls1.rom===null,'1) dados continuaram no localStorage depois de migrar (não liberou espaço)');
  ok(ls1.sessao&&ls1.sb&&ls1.vivo&&ls1.nuvem,'4) sessão/config foram movidas indevidamente para o IndexedDB ('+JSON.stringify(ls1)+')');
  ok(!!ls1.marca,'1) a marca de migração não ficou no localStorage');

  // ---- 2) persistência após recarregar ----
  await p.reload(); await esperaIdb();
  const d2=await p.evaluate(dia=>({ roms:(JSON.parse(window.LS.getItem('healthSearch.v1')||'{}').romaneios||[]).length,
    bip:JSON.parse(window.LS.getItem('healthSearch.op.dia.'+dia)||'[]').length, migrou:window.LS.diag.migrou }),DIA);
  ok(d2.roms===1&&d2.bip===1,'2) dados não persistiram após recarregar ('+JSON.stringify(d2)+')');
  ok(!d2.migrou,'2) migrou de novo numa abertura que já tinha o IndexedDB (devia ler direto)');

  // ---- 3) união entre abas ----
  await p.evaluate(dia=>{ localStorage.setItem('healthSearch.op.dia.'+dia,JSON.stringify([{local_id:'b2',dia,status:'ok',nf:'222',ped:'222'}])); },DIA);
  await p.reload(); await esperaIdb();
  const uni=await p.evaluate(dia=>{ const l=JSON.parse(window.LS.getItem('healthSearch.op.dia.'+dia)||'[]');
    return { ids:l.map(x=>x.local_id).sort().join(','), n:l.length, lsVazio:localStorage.getItem('healthSearch.op.dia.'+dia)===null }; },DIA);
  ok(uni.ids==='b1,b2','3) união entre abas perdeu ou duplicou bipe (ficou: '+uni.ids+')');
  ok(uni.lsVazio,'3) depois de unir, o bipe devia sair do localStorage de novo');

  // ---- 5) gravação que falha é erro de verdade, e se recupera ----
  const fal=await p.evaluate(async()=>{ const out={}; let avisou=false; window.LS.aoFalhar=()=>{ avisou=true; };
    window.LS.simularFalha=k=>k==='healthSearch.v1';
    window.LS.setItem('healthSearch.v1',JSON.stringify({versao:1,marca:'tentativa'}));
    try{ await window.LS.assentar(); out.rejeitou=false; }catch(e){ out.rejeitou=true; }
    out.avisou=avisou; out.falhas=window.LS.diag.falhas;
    window.LS.simularFalha=null; window.LS.setItem('healthSearch.v1',JSON.stringify({versao:1,marca:'ok'}));
    try{ await window.LS.assentar(); out.recuperou=true; }catch(e){ out.recuperou=false; }
    out.valor=JSON.parse(window.LS.getItem('healthSearch.v1')||'{}').marca; return out; });
  ok(fal.rejeitou,'5) gravação que falhou não rejeitou o assentar (passou como ok silencioso)');
  ok(fal.avisou&&fal.falhas>0,'5) a falha não foi sinalizada (aoFalhar/diag.falhas)');
  ok(fal.recuperou&&fal.valor==='ok','5) depois que a falha passou, o app não conseguiu gravar ('+JSON.stringify(fal)+')');

  // ---- 6) apagar tudo do aparelho limpa o IndexedDB ----
  await p.evaluate(()=>window.LS.apagarTudo());
  await p.reload(); await p.waitForFunction(()=>window.LS&&window.LS.diag&&window.LS.diag.modo!=='espera',{timeout:20000}); await p.evaluate(()=>window.LS.pronto);
  const limpo=await p.evaluate(dia=>({ bip:window.LS.getItem('healthSearch.op.dia.'+dia) }),DIA);
  ok(limpo.bip===null,'6) apagar tudo não limpou os bipes do IndexedDB (ficou: '+limpo.bip+')');

  await b.close(); srv.close();
  if(falhas.length){ console.log('FALHOU:\n- '+falhas.join('\n- ')); if(er.length) console.log('erros de página:',er.slice(0,8)); process.exit(1); }
  if(er.length) console.log('(avisos de console, sem falha de teste):',er.slice(0,4));
  console.log('OK: camada HSDB (IndexedDB) passou em todos os cenários');
})().catch(e=>{ console.error(e); srv.close(); process.exit(1); });
