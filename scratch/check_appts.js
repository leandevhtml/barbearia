const mongoose = require('mongoose');
const uri = "mongodb://leandrogs2003_db_user:Leandro17222@ac-fbpcbpj-shard-00-00.tl4z4zi.mongodb.net:27017/?ssl=true&authSource=admin";

async function check() {
  try {
    await mongoose.connect(uri); // defaults to 'test'
    const appts = await mongoose.connection.collection('appointments').find({}).toArray();
    console.log('Appointments found:', appts.length);
    appts.forEach(a => console.log(`ID: ${a._id}, Client: ${a.clientName || 'N/A'}, userId: ${a.userId}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
