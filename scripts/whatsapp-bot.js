const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = 3001;
const AUTH_DIR = path.join(__dirname, '..', '.whatsapp-auth');

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let sock = null;
let currentQrCode = null;
let connectionStatus = 'disconnected'; // 'connecting', 'open', 'disconnected'
let connectedPhone = null;

async function startWhatsAppBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Barbearia Gigantes do Corte', 'Chrome', '1.0.0'],
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
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('[WhatsApp Bot] Conexão fechada. Reconectar:', shouldReconnect);
        connectionStatus = 'disconnected';
        currentQrCode = null;
        if (shouldReconnect) {
          setTimeout(startWhatsAppBot, 5000);
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp Bot] Conexão estabelecida com sucesso!');
        connectionStatus = 'open';
        currentQrCode = null;
        connectedPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Conectado';
      }
    });
  } catch (error) {
    console.error('[WhatsApp Bot Error]:', error);
  }
}

// Servidor HTTP interno para o Next.js se comunicar com o robô
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[WhatsApp Bot Gateway] Rodando localmente na porta ${PORT}`);
  startWhatsAppBot();
});
