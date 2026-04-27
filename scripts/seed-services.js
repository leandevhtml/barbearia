const mongoose = require('mongoose');

const services = [
  { name: 'Corte Social', price: 45, duration: 30, icon: '✂️', active: true },
  { name: 'Barba Terapia', price: 60, duration: 45, icon: '🪒', active: true },
  { name: 'Combo Gigante', price: 90, duration: 75, icon: '🔥', active: true },
  { name: 'Degradê Navalhado', price: 55, duration: 40, icon: '💈', active: true },
  { name: 'Pigmentação', price: 35, duration: 25, icon: '🎨', active: true },
  { name: 'Sobrancelha', price: 20, duration: 15, icon: '✨', active: true },
];

async function seed() {
  const uri = "mongodb://leandrogs2003_db_user:Leandro17222@ac-fbpcbpj-shard-00-00.tl4z4zi.mongodb.net:27017/?ssl=true&authSource=admin";
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const Service = mongoose.connection.db.collection('services');
    
    // Check if services already exist
    const count = await Service.countDocuments();
    if (count === 0) {
      await Service.insertMany(services);
      console.log('Services seeded successfully');
    } else {
      console.log('Services already exist, skipping seed');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
