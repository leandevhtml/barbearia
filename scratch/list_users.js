const mongoose = require('mongoose');
const uri = "mongodb://leandrogs2003_db_user:Leandro17222@ac-fbpcbpj-shard-00-00.tl4z4zi.mongodb.net:27017/?ssl=true&authSource=admin";

async function listUsers() {
  try {
    await mongoose.connect(uri);
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Users found:', users.map(u => ({ email: u.email, role: u.role, name: u.name })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listUsers();
