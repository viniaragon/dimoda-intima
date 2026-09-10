import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const hash = value => createHash('sha256').update(value).digest('hex');
export function normalizePhone(value) {
  if (typeof value !== 'string' || !/^\+?[\d ()-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}

export async function verifyRecipient(client, phone) {
  if (!client.info?.wid?._serialized) return { state: 'not_authenticated', target: null };
  const resolved = await client.getNumberId(normalizePhone(phone));
  if (!resolved?._serialized) return { state: 'number_unresolved', target: null };
  return { state: 'ready', target: resolved._serialized };
}

export function createGateway({ token, phone, dbPath, adapter, ui = '', timeoutMs = 30000, maxPerHour = 30 }) {
  if (!/^[A-Za-z0-9_-]{43,}$/.test(token ?? '') || new Set(token).size < 12) throw new Error('GATEWAY_TOKEN must be a random base64url token of at least 32 bytes');
  const allowed = normalizePhone(phone);
  if (!allowed) throw new Error('ALLOWED_PHONE invalid');
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS messages (key TEXT PRIMARY KEY, hash TEXT NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL);
    UPDATE messages SET status='unknown' WHERE status IN ('pending','sending');`);
  let queue = [], draining = false, closing = false;
  // Socket peer only: never trust user-supplied X-Forwarded-For.
  const authFailures = new Map();
  const get = key => db.prepare('SELECT * FROM messages WHERE key=?').get(key);
  const set = (key, status) => db.prepare('UPDATE messages SET status=? WHERE key=?').run(status, key);
  const result = row => ({ status: row.status === 'sending' ? 'pending' : row.status, idempotencyKey: row.key });
  const code = row => row.status === 'sent' ? 200 : row.status === 'failed' ? 503 : 202;
  async function drain() {
    if (draining) return;
    draining = true;
    while (queue.length && !closing) {
      const item = queue.shift();
      if (!adapter.status().canSend) { set(item.key, 'failed'); continue; }
      set(item.key, 'sending');
      const timer = setTimeout(() => set(item.key, 'unknown'), timeoutMs);
      try {
        // Await actual completion even after timeout: never overlap an ambiguous send.
        await adapter.send(item.message);
        set(item.key, 'sent');
      } catch { set(item.key, 'unknown'); }
      finally { clearTimeout(timer); }
    }
    draining = false;
  }
  const server = createServer(async (req, res) => {
    const reply = (status, body, type = 'application/json') => {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" });
      res.end(type === 'application/json' ? JSON.stringify(body) : body);
    };
    if (req.url === '/health' && req.method === 'GET') return reply(200, { ok: true });
    if (req.url === '/' && req.method === 'GET') return reply(200, ui, 'text/html; charset=utf-8');
    if (req.url === '/ui.js' && req.method === 'GET') return reply(200, UI_JS, 'text/javascript; charset=utf-8');
    const auth = req.headers.authorization ?? '';
    if (!timingSafeEqual(Buffer.from(hash(auth)), Buffer.from(hash(`Bearer ${token}`)))) {
      const peer = req.socket.remoteAddress ?? 'unknown', now = Date.now();
      for (const [ip, bucket] of authFailures) if (bucket.until <= now) authFailures.delete(ip);
      if (authFailures.size >= 1024 && !authFailures.has(peer)) return reply(429, { error: 'auth_rate_limited' });
      const bucket = authFailures.get(peer) ?? { count: 0, until: now + 60000 };
      bucket.count++; authFailures.set(peer, bucket);
      return reply(bucket.count > 20 ? 429 : 401, { error: bucket.count > 20 ? 'auth_rate_limited' : 'unauthorized' });
    }
    if (req.url === '/status' && req.method === 'GET') return reply(200, adapter.status());
    if (req.url === '/qr' && req.method === 'GET') {
      const qr = await adapter.qr();
      return qr ? reply(200, { qr }) : reply(404, { error: 'qr_unavailable' });
    }
    if (req.url !== '/messages' || req.method !== 'POST') return reply(404, { error: 'not_found' });
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? '')) return reply(415, { error: 'json_required' });
    const key = req.headers['idempotency-key'];
    if (typeof key !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(key)) return reply(400, { error: 'invalid_idempotency_key' });
    let body, chunks = [], size = 0;
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 24576) { reply(413, { error: 'body_too_large' }); return; }
        chunks.push(chunk);
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch { return reply(400, { error: 'invalid_json' }); }
    const destination = normalizePhone(body?.phone);
    if (!destination) return reply(400, { error: 'invalid_phone' });
    if (destination !== allowed) return reply(403, { error: 'destination_not_allowed' });
    if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 4096) return reply(400, { error: 'invalid_message' });
    const digest = hash(JSON.stringify([destination, body.message]));
    try {
      const existing = get(key);
      if (existing) return existing.hash === digest ? reply(code(existing), result(existing)) : reply(409, { error: 'idempotency_conflict' });
      if (closing || !adapter.status().canSend) return reply(503, { error: 'not_ready' });
      if (queue.length >= 20 || db.prepare('SELECT COUNT(*) AS n FROM messages WHERE created > ?').get(Date.now() - 3600000).n >= maxPerHour) return reply(429, { error: 'rate_limited' });
      db.prepare('INSERT INTO messages VALUES (?, ?, ?, ?)').run(key, digest, 'pending', Date.now());
      queue.push({ key, message: body.message });
      void drain();
      return reply(202, { status: 'pending', idempotencyKey: key });
    } catch { return reply(503, { error: 'storage_unavailable' }); }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.maxConnections = 100;
  return { server, close: async () => { closing = true; await new Promise(resolve => server.close(resolve)); if (!draining) db.close(); } };
}

const UI_JS = `let token=''; const status=document.querySelector('#status'), qr=document.querySelector('#qr');
document.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();token=document.querySelector('input').value;document.querySelector('input').value='';await refresh();});
document.querySelector('#logout').onclick=()=>{token='';qr.removeAttribute('src');status.textContent='Desconectado da interface';};
async function refresh(){if(!token)return;try{const headers={Authorization:'Bearer '+token};const r=await fetch('/status',{headers});if(!r.ok)throw Error();const s=await r.json();status.textContent=JSON.stringify(s,null,2);qr.removeAttribute('src');if(s.state==='qr'){const q=await fetch('/qr',{headers});if(q.ok)qr.src=(await q.json()).qr;}}catch{status.textContent='Falha de acesso ou serviço indisponível';qr.removeAttribute('src');}}
setInterval(refresh,5000);`;
