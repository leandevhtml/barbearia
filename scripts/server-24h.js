const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const dbPath = path.join(__dirname, '..', '.mongodb-data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

let mongoServer = null;

async function startMongo() {
  try {
    console.log('[24/7 Watchdog] Starting persistent MongoDB server on port 27017...');
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    console.log(`[24/7 Watchdog] MongoDB active at ${mongoServer.getUri()} (Persistent data: ${dbPath})`);
  } catch (err) {
    console.log('[24/7 Watchdog] Port 27017 already active or managed externally:', err.message);
  }
}

function startNextServer() {
  console.log('[24/7 Watchdog] Starting Next.js server on http://localhost:3000 ...');
  const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBin, 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/gigantes-do-corte',
    },
  });

  child.on('exit', (code) => {
    console.warn(`[24/7 Watchdog] Next.js process exited with code ${code}. Restarting in 2 seconds...`);
    setTimeout(startNextServer, 2000);
  });
}

(async () => {
  await startMongo();
  startNextServer();
})();
