const mongoose = require('mongoose');
const uri = "mongodb://leandrogs2003_db_user:Leandro17222@ac-fbpcbpj-shard-00-00.tl4z4zi.mongodb.net:27017/?ssl=true&authSource=admin";

async function clear() {
  try {
    await mongoose.connect(uri);
    const result = await mongoose.connection.collection('appointments').deleteMany({});
    console.log(`Sucesso: ${result.deletedCount} agendamentos removidos.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clear();
