// Robô de backup do Health Search — roda no GitHub Actions, sem ninguém logado.
// Copia o banco inteiro do Supabase para backups/AAAA/MM/Health Search backup DD-MM-AAAA.json.gz
import { gzipSync, gunzipSync } from 'node:zlib'; import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const URL_ = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
if (!URL_ || !KEY) { console.error('Faltam os segredos SUPABASE_URL e SUPABASE_SERVICE_KEY.'); process.exit(1); }
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
async function tabela(t, filtro = '') { const out = []; for (let pg = 0; pg < 500; pg++) {
    const r = await fetch(`${URL_}/rest/v1/${t}?select=*${filtro}`, { headers: { ...H, Range: `${pg * 1000}-${pg * 1000 + 999}`, 'Range-Unit': 'items' } });
    if (!r.ok && r.status !== 416) throw new Error(`${t}: HTTP ${r.status} ${await r.text()}`); if (r.status === 416) break;
    const d = await r.json(); out.push(...d); if (d.length < 1000) break; } return out; }
const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
const dd = String(agora.getDate()).padStart(2, '0'), mm = String(agora.getMonth() + 1).padStart(2, '0'), aa = agora.getFullYear();
const dump = { app: 'Health Search', tipo: 'backup-robo', geradoEm: new Date().toISOString(), por: 'robô GitHub', tabelas: {} };
dump.tabelas.hs_sync = await tabela('hs_sync', '&chave=not.like.bkp:*');
for (const t of ['hs_rom_banco', 'hs_bipagens', 'hs_chamados', 'perfis']) { try { dump.tabelas[t] = await tabela(t); } catch (e) { dump.erros = (dump.erros || []).concat(e.message); } }
const cont = Object.fromEntries(Object.entries(dump.tabelas).map(([t, a]) => [t, a.length])); dump.contagem = cont;
const gz = gzipSync(JSON.stringify(dump), { level: 9 });
const chk = JSON.parse(gunzipSync(gz).toString()); for (const [t, n] of Object.entries(cont)) if ((chk.tabelas[t] || []).length !== n) throw new Error('conferência falhou em ' + t);
const pasta = `backups/${aa}/${mm}`; mkdirSync(pasta, { recursive: true });
writeFileSync(`${pasta}/Health Search backup ${dd}-${mm}-${aa}.json.gz`, gz);
let log = ''; try { log = readFileSync('registro.txt', 'utf8'); } catch {}
writeFileSync('registro.txt', log + `${dd}/${mm}/${aa} ${agora.toTimeString().slice(0, 5)} · ${Object.entries(cont).map(([t, n]) => t + '=' + n).join(' ')} · ${(gz.length / 1048576).toFixed(2)} MB${dump.erros ? ' · AVISOS: ' + dump.erros.join('; ') : ''}\n`);
console.log('Backup OK', cont, (gz.length / 1048576).toFixed(2) + ' MB');
