// Câmera do NexBip não trava (v10.6.34): node testes/camera.js
// Câmera falsa do Chromium + leitor simulado: tratamento que nunca termina, trava de espera presa, janela na frente.
const {chromium}=require('playwright'); const path=require('path'); const http=require('http'); const fs=require('fs');
const RAIZ=path.resolve(__dirname,'..'); const srv=http.createServer((req,res)=>{ let u=decodeURIComponent(req.url.split('?')[0]); if(u==='/') u='/index.html'; const f=path.join(RAIZ,u); if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end(); } res.writeHead(200,{'Content-Type':u.endsWith('.html')?'text/html; charset=utf-8':'text/javascript'}); fs.createReadStream(f).pipe(res); });
(async()=>{ await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const URL=`http://127.0.0.1:${srv.address().port}/index.html`;
 const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}); const ctx=await b.newContext({permissions:['camera']}); await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
 const p=await ctx.newPage(); const er=[]; p.on('pageerror',e=>er.push(e.message)); await p.goto(URL); await p.waitForTimeout(5000);
 const r=await p.evaluate(async()=>{ const w=ms=>new Promise(x=>setTimeout(x,ms)); NV.perfil={papel:'admin',ativo:true,nome:'T'}; document.querySelectorAll('.fundo,#hs-splash').forEach(f=>f.remove());
   const h=hojeISO(), arq='x '+h.split('-').reverse().join('-')+'.pdf';
   S.romaneios=[{id:'r1',numero:'1',base:'CAJ',arquivo:arq,rows:[1,2,3,4,5].map(i=>({nf:'7000'+i,ped:'8000'+i,vol:'1',dest:'C'+i}))}]; OP.dia=h; OP.bipes=[]; renderTudo();
   /* leitor simulado: devolve o código que estiver em OP._frente */
   OP._frente=null; OP.det=async()=>OP._frente?[OP._frente]:[];
   await opCamAbrir(); await w(500); const R={abriu:!!OP.cam};
   const mostra=async(cod,ms)=>{ OP._frente=cod; await w(ms); OP._frente=null; await w(1700); };
   const nb=()=>OP.bipes.length;
   /* A) tratamento que nunca termina */
   const _ct=window.opCamTratar; let travou=false; window.opCamTratar=async(l,v)=>{ if(!travou){ travou=true; return new Promise(()=>{}); } return _ct(l,v); };
   await mostra('80001',400); await mostra('80002',3200); R.A=nb()+' bipe(s) depois do travado';
   window.opCamTratar=_ct;
   /* B) trava de espera presa sem painel */
   OP.espera=true; await w(1500); R.B='espera='+OP.espera; await mostra('80003',800); R.B+=' · bipes='+nb();
   /* C) janela aberta na frente: não lê; fechou: volta */
   const f=document.createElement('div'); f.className='fundo'; f.innerHTML='<div class="modal">pergunta</div>'; document.body.appendChild(f);
   await mostra('80004',900); R.C1=nb(); f.remove(); await mostra('80004',900); R.C2=nb();
   opCamFechar(); return R; });
 const err=er.filter(e=>!/supabase|fetch/i.test(e)); const f=[];
 if(!r.abriu) f.push('a câmera não abriu');
 if(r.A!=='1 bipe(s) depois do travado') f.push('A) depois de um tratamento travado a câmera parou de ler ('+r.A+')');
 if(r.B!=='espera=false · bipes=2') f.push('B) a trava de espera presa não soltou ('+r.B+')');
 if(!(r.C1===2&&r.C2===3)) f.push('C) leu por trás da janela ou não voltou depois ('+r.C1+'/'+r.C2+')');
 if(err.length) f.push('erros: '+err.join(' | '));
 await b.close(); srv.close();
 if(f.length){ console.log('FALHOU:\n - '+f.join('\n - ')); process.exit(1); } console.log('OK: a câmera não trava (tratamento preso, espera presa, janela na frente)'); })();
