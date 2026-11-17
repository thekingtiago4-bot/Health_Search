// Checklist Agregados: cadastrar não pode duplicar, e apagar UMA linha não pode sumir com duas.
// Bug real relatado em 17/11/2026 (TARCÍSIO e CARLOS AMARAL).
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
  await pg.waitForFunction(()=>typeof ckS==='function'&&typeof S==='object',null,{timeout:60000});
  const r=await pg.evaluate(()=>{
    const nomes=L=>L.map(x=>String(x.mot||'').toUpperCase());
    // dois aparelhos criaram a mesma pessoa, cada um com o seu id (o merge da nuvem guarda as duas)
    S.ckApagados=[]; S.cadMot=[];
    S.checklist=[{id:'ckAAA',mot:'TARCÍSIO',placa:'',data:'2026-11-10',ativo:true},
                 {id:'ckBBB',mot:'TARCISIO',placa:'ABC-1234',data:'',ativo:true},
                 {id:'ckCCC',mot:'CARLOS AMARAL',placa:'XYZ-9988',data:'2026-11-01',ativo:true}];
    const depoisDoDedup=nomes(ckS());
    const tarc=ckS().find(x=>String(x.mot||'').toUpperCase().indexOf('TARC')===0)||{};
    // agora, com duas linhas iguais de propósito, apagar UMA não pode sumir com a outra
    S.ckApagados=[]; 
    S.checklist=[{id:'ck111',mot:'CARLOS AMARAL',placa:'AAA-1111',data:'2026-11-01',ativo:true},
                 {id:'ck222',mot:'CARLOS AMARAL',placa:'BBB-2222',data:'2026-11-02',ativo:true}];
    const antes=S.checklist.length;
    ckExcluir('ck111');
    const sobrouLista=nomes(S.checklist);
    const bloqueouCedo=ckApagados().filter(x=>x&&x.mot).length;
    // apagando a ultima, ai sim o nome fica bloqueado para nao voltar sozinho
    ckExcluir('ck222');
    const bloqueouNoFim=ckApagados().filter(x=>x&&x.mot).length;
    S.cadMot=[{nome:'CARLOS AMARAL',tipo:'agregado'}];
    const voltou=(()=>{ try{ ckSincronizar(); }catch(e){} return nomes(ckTudo()).includes('CARLOS AMARAL'); })();
    /* a linha apagada nao pode voltar quando a nuvem reenvia a MESMA linha */
    S.ckApagados=[]; S.checklist=[{id:'ckZZZ',mot:'GUSMAO',placa:'ZZZ-1111',data:'2026-11-01',ativo:true}];
    ckExcluir('ckZZZ');
    S.checklist.push({id:'ckZZZ',mot:'GUSMAO',placa:'ZZZ-1111',data:'2026-11-01',ativo:true});
    const voltouDaNuvem=nomes(ckS()).includes('GUSMAO');
    return {depoisDoDedup, tarcPlaca:tarc.placa||'', tarcData:tarc.data||'', antes, sobrouLista, bloqueouCedo, bloqueouNoFim, voltou, voltouDaNuvem};
  });
  const falhas=[];
  if(r.depoisDoDedup.filter(n=>n.indexOf('TARC')===0).length!==1) falhas.push('a mesma pessoa continua em duas linhas: '+JSON.stringify(r.depoisDoDedup));
  if(r.tarcPlaca!=='ABC-1234') falhas.push('ao juntar as linhas, perdeu a placa (ficou "'+r.tarcPlaca+'")');
  if(r.tarcData!=='2026-11-10') falhas.push('ao juntar as linhas, perdeu a data do checklist (ficou "'+r.tarcData+'")');
  if(r.sobrouLista.length!==1) falhas.push('apagar uma linha sumiu com '+(r.antes-r.sobrouLista.length)+' linha(s): '+JSON.stringify(r.sobrouLista));
  if(r.bloqueouCedo!==0) falhas.push('bloqueou o nome ainda tendo linha dele na planilha');
  if(r.bloqueouNoFim!==1) falhas.push('apagou a ultima linha e nao marcou o nome para nao voltar sozinho');
  if(r.voltou) falhas.push('o nome apagado voltou sozinho pela sincronizacao');
  if(r.voltouDaNuvem) falhas.push('a linha apagada voltou quando a nuvem reenviou a mesma linha');
  await b.close(); srv.close();
  if(falhas.length){ console.error('FALHOU:\n- '+falhas.join('\n- ')); process.exit(1); }
  console.log('OK: Checklist não duplica e apagar uma linha tira só ela');
})();
