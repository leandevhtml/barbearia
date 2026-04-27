const mongoose = require('mongoose');
const uri = "mongodb://leandrogs2003_db_user:Leandro17222@ac-fbpcbpj-shard-00-00.tl4z4zi.mongodb.net:27017/?ssl=true&authSource=admin";

async function list() {
  try {
    await mongoose.connect(uri);
    const dbs = await mongoose.connection.db.admin().listDatabases();
    console.log('Databases:', dbs.databases.map(d => d.name));
    
    // Check current db collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in current db:', collections.map(c => c.name));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

list();
