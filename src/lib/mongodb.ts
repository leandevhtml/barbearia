import mongoose from 'mongoose';
import os from 'os';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const MONGODB_URI = process.env.MONGODB_URI;
const NEON_DB_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_1etfTpdj9MIs@ep-solitary-grass-aw63o3pp-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
    localServer: null,
    pgPool: null,
    syncHookAttached: false,
  };
}

function getPgPool(): Pool | null {
  if (!NEON_DB_URL) return null;
  if (!cached.pgPool) {
    cached.pgPool = new Pool({
      connectionString: NEON_DB_URL,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return cached.pgPool;
}

export async function syncStateToCloud() {
  const pool = getPgPool();
  if (!pool || !mongoose.connection.db) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gdc_mongo_collections (
        collection_name TEXT PRIMARY KEY,
        docs_json TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const collections = ['barbershops', 'users', 'services', 'products', 'settings', 'appointments', 'transactions', 'notifications'];
    for (const colName of collections) {
      const docs = await mongoose.connection.db.collection(colName).find({}).toArray();
      const serialized = mongoose.mongo.BSON.EJSON.stringify(docs);
      await pool.query(
        `INSERT INTO gdc_mongo_collections (collection_name, docs_json, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (collection_name) DO UPDATE SET docs_json = EXCLUDED.docs_json, updated_at = NOW();`,
        [colName, serialized]
      );
    }
  } catch (err) {
    console.warn('[CloudSync] Push warning:', err);
  }
}

async function restoreStateFromCloud(): Promise<boolean> {
  const pool = getPgPool();
  if (!pool || !mongoose.connection.db) return false;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gdc_mongo_collections (
        collection_name TEXT PRIMARY KEY,
        docs_json TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const res = await pool.query(`SELECT collection_name, docs_json FROM gdc_mongo_collections`);
    if (!res.rows || res.rows.length === 0) return false;

    let restoredUsers = 0;
    for (const row of res.rows) {
      const colName = row.collection_name;
      const docs = mongoose.mongo.BSON.EJSON.parse(row.docs_json);
      if (Array.isArray(docs) && docs.length > 0) {
        const col = mongoose.connection.db.collection(colName);
        const existingCount = await col.countDocuments();
        if (existingCount === 0) {
          await col.insertMany(docs, { ordered: false }).catch(() => {});
          if (colName === 'users') restoredUsers = docs.length;
        } else {
          for (const doc of docs) {
            if (doc._id) {
              await col.replaceOne({ _id: doc._id }, doc, { upsert: true }).catch(() => {});
            }
          }
          if (colName === 'users') restoredUsers = docs.length;
        }
      }
    }
    return restoredUsers > 0;
  } catch (err) {
    console.warn('[CloudSync] Restore warning:', err);
    return false;
  }
}

function attachAutoCloudSync() {
  if (cached.syncHookAttached) return;
  cached.syncHookAttached = true;

  mongoose.plugin((schema) => {
    schema.post('save', function () {
      syncStateToCloud().catch(() => {});
    });
    schema.post('findOneAndUpdate', function () {
      syncStateToCloud().catch(() => {});
    });
    schema.post('deleteOne', function () {
      syncStateToCloud().catch(() => {});
    });
    schema.post('deleteMany', function () {
      syncStateToCloud().catch(() => {});
    });
    schema.post('insertMany', function () {
      syncStateToCloud().catch(() => {});
    });
  });
}

attachAutoCloudSync();

async function ensureDefaultData() {
  try {
    await restoreStateFromCloud();

    const Barbershop = (await import('@/models/Barbershop')).default;
    const User = (await import('@/models/User')).default;
    const Service = (await import('@/models/Service')).default;
    const Settings = (await import('@/models/Settings')).default;

    let defaultShop = await Barbershop.findOne({ slug: 'gigantes-do-corte' });
    if (!defaultShop) {
      defaultShop = await Barbershop.create({
        name: 'Gigantes do Corte',
        slug: 'gigantes-do-corte',
        ownerName: 'Administrador',
        ownerEmail: 'admin@gigantes.com',
        phone: '11999999999',
        plan: 'pro',
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        planActivatedAt: new Date(),
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        logoUrl: '/logo.png',
        primaryColor: '#EA580C',
      });
    }

    const existingSettings = await Settings.findOne({ barbershopId: defaultShop._id });
    if (!existingSettings) {
      await Settings.create({
        barbershopId: defaultShop._id,
        fidelityEnabled: true,
        stampsPerReward: 10,
        rewardServiceName: 'Corte Social',
      });
    }

    const existingAdmin = await User.findOne({ email: 'admin@gigantes.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Administrador Gigantes',
        email: 'admin@gigantes.com',
        password: hashedPassword,
        phone: '11999999999',
        role: 'admin',
        barbershopId: defaultShop._id,
        active: true,
      });
    } else if (!existingAdmin.barbershopId) {
      existingAdmin.barbershopId = defaultShop._id;
      await existingAdmin.save();
    }

    const serviceCount = await Service.countDocuments({ barbershopId: defaultShop._id });
    if (serviceCount === 0) {
      await Service.insertMany([
        { barbershopId: defaultShop._id, name: 'Corte Social', price: 45, duration: 30, icon: '✂️', active: true },
        { barbershopId: defaultShop._id, name: 'Barba Terapia', price: 60, duration: 45, icon: '🪒', active: true },
        { barbershopId: defaultShop._id, name: 'Combo Gigante', price: 90, duration: 75, icon: '🔥', active: true },
        { barbershopId: defaultShop._id, name: 'Degradê Navalhado', price: 55, duration: 40, icon: '💈', active: true },
        { barbershopId: defaultShop._id, name: 'Pigmentação', price: 35, duration: 25, icon: '🎨', active: true },
        { barbershopId: defaultShop._id, name: 'Sobrancelha', price: 20, duration: 15, icon: '✨', active: true },
      ]);
    }

    const barberCount = await User.countDocuments({ barbershopId: defaultShop._id, role: 'barber' });
    if (barberCount === 0) {
      const barberPassword = await bcrypt.hash('barber123', 10);
      await User.create({
        name: 'Mestre Navalha',
        email: 'barbeiro@gigantes.com',
        password: barberPassword,
        phone: '11988888888',
        role: 'barber',
        barbershopId: defaultShop._id,
        specialty: 'Degradê & Barba',
        commissionRate: 50,
        available: true,
        active: true,
      });
    }

    await syncStateToCloud();
  } catch (seedErr) {
    console.warn('[MongoDB] Seed warning:', seedErr);
  }
}

async function startLocalMongoServer(): Promise<string> {
  if (cached.localServer) {
    return `${cached.localServer.getUri()}gigantes-do-corte`;
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const isVercel = Boolean(process.env.VERCEL);
  const dbPath = isVercel
    ? path.join(os.tmpdir(), 'gdc-mongo-data')
    : path.join(process.cwd(), '.mongodb-data');

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  if (!isVercel) {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/gigantes-do-corte', {
        serverSelectionTimeoutMS: 1500,
      });
      return 'mongodb://127.0.0.1:27017/gigantes-do-corte';
    } catch {
      // Fall through to launch MongoMemoryServer
    }
  }

  cached.localServer = await MongoMemoryServer.create({
    instance: {
      dbPath,
      storageEngine: 'wiredTiger',
    },
    binary: isVercel
      ? {
          downloadDir: path.join(os.tmpdir(), 'mongodb-binaries'),
        }
      : undefined,
  });

  return `${cached.localServer.getUri()}gigantes-do-corte`;
}

async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    await restoreStateFromCloud();
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 2500,
      };

      const isDeadCluster =
        !MONGODB_URI ||
        MONGODB_URI.includes('tl4z4zi.mongodb.net') ||
        MONGODB_URI.includes('z1lusk1.mongodb.net') ||
        MONGODB_URI.includes('peooqrd.mongodb.net');

      if (!isDeadCluster && MONGODB_URI) {
        try {
          const conn = await mongoose.connect(MONGODB_URI, opts);
          await ensureDefaultData();
          return conn;
        } catch (err) {
          console.warn('[MongoDB] Remote URI unreachable, activating embedded MongoDB + Neon 24/7 Cloud Sync...');
        }
      }

      const localUri = await startLocalMongoServer();
      const conn = await mongoose.connect(localUri, { bufferCommands: false });
      await ensureDefaultData();
      return conn;
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
