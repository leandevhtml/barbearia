const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const http = require('http');
const localtunnel = require('localtunnel');
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
let tunnelInstance = null;
let tunnelUrl = null;

// Salva a URL do túnel direto no banco PostgreSQL/Neon para a Vercel sempre saber
async function syncTunnelToCloud(url) {
  try {
    const pool = new Pool({
      connectionString: NEON_DB_URL,
      max: 2,
      connectionTimeoutMillis: 5000,
    });
    
    // Atualiza o documento de settings em gdc_mongo_collections
    const res = await pool.query(`SELECT collection_name, docs_json FROM gdc_mongo_collections WHERE collection_name = 'settings'`);
    if (res.rows.length > 0) {
      let docs = JSON.parse(res.rows[0].docs_json);
      if (Array.isArray(docs) && docs.length > 0) {
        docs[0].whatsappTunnelUrl = url;
        await pool.query(
          `UPDATE gdc_mongo_collections SET docs_json = $1, updated_at = NOW() WHERE collection_name = 'settings'`,
          [JSON.stringify(docs)]
        );
        console.log(`[WhatsApp Tunnel] URL sincronizada na nuvem com sucesso: ${url}`);
      }
    }
    await pool.end();
  } catch (err) {
    console.warn('[WhatsApp Tunnel] Erro ao sincronizar URL na nuvem:', err.message);
  }
}

let tunnelHealthInterval = null;

async function startTunnel() {
  try {
    if (tunnelInstance) {
      try { tunnelInstance.close(); } catch (_) {}
      tunnelInstance = null;
    }
    console.log('[WhatsApp Tunnel] Abrindo túnel público seguro para a Vercel...');
    tunnelInstance = await localtunnel({ port: PORT });
    tunnelUrl = tunnelInstance.url;
    console.log(`[WhatsApp Tunnel] Túnel público ATIVO: ${tunnelUrl}`);
    
    await syncTunnelToCloud(tunnelUrl);

    // Eventos do túnel
    tunnelInstance.on('close', () => {
      console.warn('[WhatsApp Tunnel] Túnel fechado. Reiniciando em 5 segundos...');
      setTimeout(startTunnel, 5000);
    });

    tunnelInstance.on('error', (err) => {
      console.warn('[WhatsApp Tunnel] Erro no túnel:', err.message);
      setTimeout(startTunnel, 5000);
    });

  } catch (err) {
    console.warn('[WhatsApp Tunnel] Falha ao iniciar túnel:', err.message);
    setTimeout(startTunnel, 10000);
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
          setTimeout(startWhatsAppBot, 3000);
        } else if (shouldReconnect) {
          connectionStatus = 'connecting';
          setTimeout(startWhatsAppBot, 3000);
        } else {
          connectionStatus = 'disconnected';
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp Bot] ✅ Conexão estabelecida com sucesso no WhatsApp!');
        connectionStatus = 'open';
        currentQrCode = null;
        connectedPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Conectado';
      }
    });
  } catch (error) {
    console.error('[WhatsApp Bot Error]:', error);
    setTimeout(startWhatsAppBot, 5000);
  }
}

// Servidor HTTP interno para o Next.js se comunicar com o robô (tanto local quanto pela nuvem via túnel)
const server = http.createServer(async (req, res) => {
  // CORS & Bypass de proxy do localtunnel
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
      phone: connectedPhone,
      tunnelUrl: tunnelUrl
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
      setTimeout(startWhatsAppBot, 2000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 3. Enviar Mensagem Autônoma
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[WhatsApp Bot Gateway] Rodando na porta ${PORT}`);
  startWhatsAppBot();
  startTunnel();
});
