const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Pool } = require('pg');

const PORT = 3001;
const AUTH_DIR = path.join(__dirname, '..', '.whatsapp-auth');
const NEON_DB_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_1etfTpdj9MIs@ep-solitary-grass-aw63o3pp-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let sock = null;
let currentQrCode = null;
let connectionStatus = 'disconnected'; // 'connecting', 'open', 'disconnected'
let connectedPhone = null;

// Sincroniza o status e QR Code diretamente no Neon Postgres
// Permitindo que a Vercel e o Frontend leiam instantaneamente sem depender de túnel HTTP
async function syncSessionToCloud(status, qr, phone) {
  try {
    const pool = new Pool({
      connectionString: NEON_DB_URL,
      max: 2,
      connectionTimeoutMillis: 5000,
    });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        qr TEXT,
        phone TEXT,
        action TEXT DEFAULT 'none',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      INSERT INTO whatsapp_sessions (id, status, qr, phone, updated_at)
      VALUES ('primary', $1, $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        qr = EXCLUDED.qr,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    `, [status, qr, phone]);
    await pool.end();
  } catch (err) {
    console.warn('[WhatsApp Bot] Erro ao sincronizar sessão na nuvem:', err.message);
  }
}

async function startWhatsAppBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: Browsers.appropriate('Chrome'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQrCode = await QRCode.toDataURL(qr);
        connectionStatus = 'connecting';
        console.log('[WhatsApp Bot] Novo QR Code gerado.');
        await syncSessionToCloud('connecting', currentQrCode, null);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp Bot] Conexão encerrada (código ${statusCode}). Reconectar:`, shouldReconnect);
        
        if (statusCode === DisconnectReason.loggedOut) {
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (_) {}
          connectionStatus = 'disconnected';
          currentQrCode = null;
          connectedPhone = null;
          await syncSessionToCloud('disconnected', null, null);
          setTimeout(startWhatsAppBot, 3000);
        } else if (shouldReconnect) {
          connectionStatus = 'connecting';
          await syncSessionToCloud('connecting', currentQrCode, null);
          setTimeout(startWhatsAppBot, 3000);
        } else {
          connectionStatus = 'disconnected';
          await syncSessionToCloud('disconnected', null, null);
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp Bot] ✅ Conexão estabelecida com sucesso no WhatsApp!');
        connectionStatus = 'open';
        currentQrCode = null;
        connectedPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Conectado';
        await syncSessionToCloud('open', null, connectedPhone);
      }
    });
  } catch (error) {
    console.error('[WhatsApp Bot Error]:', error);
    setTimeout(startWhatsAppBot, 5000);
  }
}

// Servidor HTTP local (para testes locais rápidos)
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Bypass-Tunnel-Reminder');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Status e QR Code
  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: connectionStatus,
      qr: currentQrCode,
      phone: connectedPhone
    }));
    return;
  }

  // 2. Desconectar WhatsApp
  if (req.url === '/disconnect' && req.method === 'POST') {
    try {
      if (sock) {
        await sock.logout();
      }
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      connectionStatus = 'disconnected';
      currentQrCode = null;
      connectedPhone = null;
      await syncSessionToCloud('disconnected', null, null);
      setTimeout(startWhatsAppBot, 2000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 3. Enviar Mensagem Local
  if (req.url === '/send' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body);
        if (!sock || connectionStatus !== 'open') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, reason: 'Robô do WhatsApp desconectado' }));
          return;
        }

        let cleanNumber = phone.replace(/\D/g, '');
        if (!cleanNumber.startsWith('55') && cleanNumber.length >= 10) {
          cleanNumber = `55${cleanNumber}`;
        }
        const jid = `${cleanNumber}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: message });
        console.log(`[WhatsApp Bot] Mensagem enviada automaticamente para ${cleanNumber}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('[WhatsApp Bot Send Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// Fila de Mensagens Automáticas da Nuvem (Neon DB Poller)
// Garante que qualquer mensagem disparada pela Vercel seja enviada em tempo real
async function pollOutboxQueue() {
  try {
    const pool = new Pool({
      connectionString: NEON_DB_URL,
      max: 2,
      connectionTimeoutMillis: 5000,
    });

    // 1. Verificar se houve solicitação de desconexão pelo Admin na Vercel
    const sessionRes = await pool.query(`SELECT action FROM whatsapp_sessions WHERE id = 'primary'`);
    if (sessionRes.rows.length > 0 && sessionRes.rows[0].action === 'disconnect') {
      console.log('[WhatsApp Bot] Comando de desconexão recebido via Nuvem!');
      await pool.query(`UPDATE whatsapp_sessions SET action = 'none' WHERE id = 'primary'`);
      if (sock) {
        try { await sock.logout(); } catch (_) {}
      }
      try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (_) {}
      connectionStatus = 'disconnected';
      currentQrCode = null;
      connectedPhone = null;
      await syncSessionToCloud('disconnected', null, null);
      setTimeout(startWhatsAppBot, 2000);
      await pool.end();
      return;
    }

    // Se o bot ainda não estiver com conexão aberta, só mantém a sessão atualizada
    if (!sock || connectionStatus !== 'open') {
      await pool.end();
      return;
    }

    // 2. Processar mensagens pendentes da fila
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_outbox (
        id SERIAL PRIMARY KEY,
        phone TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        sent_at TIMESTAMPTZ
      );
    `);

    const res = await pool.query(`
      SELECT id, phone, message FROM whatsapp_outbox 
      WHERE status = 'pending' 
      ORDER BY id ASC LIMIT 5
    `);

    for (const row of res.rows) {
      let cleanNumber = row.phone.replace(/\D/g, '');
      if (!cleanNumber.startsWith('55') && cleanNumber.length >= 10) {
        cleanNumber = `55${cleanNumber}`;
      }
      const jid = `${cleanNumber}@s.whatsapp.net`;

      try {
        await sock.sendMessage(jid, { text: row.message });
        console.log(`[WhatsApp Outbox Worker] ✅ Mensagem da nuvem enviada com sucesso para ${cleanNumber}!`);
        await pool.query(
          `UPDATE whatsapp_outbox SET status = 'sent', sent_at = NOW() WHERE id = $1`,
          [row.id]
        );
      } catch (sendErr) {
        console.error(`[WhatsApp Outbox Worker] Erro ao enviar para ${cleanNumber}:`, sendErr.message);
        await pool.query(
          `UPDATE whatsapp_outbox SET status = 'failed' WHERE id = $1`,
          [row.id]
        );
      }
    }

    await pool.end();
  } catch (err) {
    // Ignora erros temporários de conexão
  }
}

// Inicia polling a cada 2.5 segundos
setInterval(pollOutboxQueue, 2500);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[WhatsApp Bot Gateway] Rodando na porta ${PORT}`);
  startWhatsAppBot();
});
