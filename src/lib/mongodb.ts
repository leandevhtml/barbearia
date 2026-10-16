import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { startPureJsMongoWireServer, loadCollectionsFromNeon } from './pureJsMongoServer';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

export async function syncStateToCloud() {
  // Handled automatically by pureJsMongoServer on every insert/update/delete
}

async function ensureDefaultData() {
  try {
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

    const Product = (await import('@/models/Product')).default;

    const allServices = await Service.find({ barbershopId: defaultShop._id });
    if (allServices.length === 0) {
      await Service.insertMany([
        { barbershopId: defaultShop._id, name: 'Corte Social', price: 45, duration: 30, icon: '✂️', active: true },
        { barbershopId: defaultShop._id, name: 'Barba Terapia', price: 60, duration: 45, icon: '🪒', active: true },
        { barbershopId: defaultShop._id, name: 'Combo Gigante', price: 90, duration: 75, icon: '🔥', active: true },
        { barbershopId: defaultShop._id, name: 'Degradê Navalhado', price: 55, duration: 40, icon: '💈', active: true },
        { barbershopId: defaultShop._id, name: 'Pigmentação', price: 35, duration: 25, icon: '🎨', active: true },
        { barbershopId: defaultShop._id, name: 'Sobrancelha', price: 20, duration: 15, icon: '✨', active: true },
      ]);
    } else if (allServices.length > 6) {
      const seenNames = new Set<string>();
      for (const svc of allServices) {
        const key = (svc.name || '').trim().toLowerCase();
        if (seenNames.has(key)) {
          await Service.deleteOne({ _id: svc._id });
        } else {
          seenNames.add(key);
        }
      }
    }

    const allProducts = await Product.find({ barbershopId: defaultShop._id });
    if (allProducts.length === 0) {
      await Product.insertMany([
        { barbershopId: defaultShop._id, name: 'Pomada Efeito Matte', price: 35, stock: 25, category: 'Cosméticos', active: true },
        { barbershopId: defaultShop._id, name: 'Óleo para Barba Premium', price: 40, stock: 20, category: 'Cosméticos', active: true },
        { barbershopId: defaultShop._id, name: 'Cerveja Artesanal Gelada', price: 15, stock: 48, category: 'Bebidas', active: true },
        { barbershopId: defaultShop._id, name: 'Refrigerante Lata', price: 8, stock: 36, category: 'Bebidas', active: true },
      ]);
    } else if (allProducts.length > 4) {
      const seenProducts = new Set<string>();
      for (const prod of allProducts) {
        const key = (prod.name || '').trim().toLowerCase();
        if (seenProducts.has(key)) {
          await Product.deleteOne({ _id: prod._id });
        } else {
          seenProducts.add(key);
        }
      }
    }

    const allBarbers = await User.find({ barbershopId: defaultShop._id, role: 'barber' });
    if (allBarbers.length === 0) {
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
    } else if (allBarbers.length > 1) {
      const seenEmails = new Set<string>();
      for (const brb of allBarbers) {
        const key = (brb.email || brb.name || '').trim().toLowerCase();
        if (seenEmails.has(key)) {
          await User.deleteOne({ _id: brb._id });
        } else {
          seenEmails.add(key);
        }
      }
    }
  } catch (seedErr) {
    console.warn('[MongoDB] Seed warning:', seedErr);
  }
}

async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    await loadCollectionsFromNeon(true);
    await ensureDefaultData();
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const isDeadCluster =
        !MONGODB_URI ||
        MONGODB_URI.includes('127.0.0.1') ||
        MONGODB_URI.includes('localhost') ||
        MONGODB_URI.includes('tl4z4zi.mongodb.net') ||
        MONGODB_URI.includes('z1lusk1.mongodb.net') ||
        MONGODB_URI.includes('peooqrd.mongodb.net');

      if (!isDeadCluster && MONGODB_URI && !process.env.VERCEL) {
        try {
          const conn = await mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 2000,
          });
          await ensureDefaultData();
          return conn;
        } catch {
          // Fall back to pure-JS wire server + Neon cloud
        }
      }

      const wireUri = await startPureJsMongoWireServer();
      const conn = await mongoose.connect(wireUri, { bufferCommands: false });
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
