const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String, required: true },
  role: { type: String, enum: ['client', 'admin', 'barber'], default: 'client' },
  stamps: { type: Number, default: 0 },
  totalCuts: { type: Number, default: 0 },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { family: 4 });
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@gigantes.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin', 10);

    const adminUser = new User({
      name: 'Administrador',
      email: adminEmail,
      password: hashedPassword,
      phone: '(00) 00000-0000',
      role: 'admin',
    });

    await adminUser.save();
    console.log('Admin user created successfully! Email: admin@gigantes.com | Password: admin');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
