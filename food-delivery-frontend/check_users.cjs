const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('food_delivery');
  
  console.log('--- USERS ---');
  const users = await db.collection('users').find({}).toArray();
  for (const u of users) {
    console.log(`- ${u.email} | Role: ${u.role} | ID: ${u._id}`);
  }

  console.log('\n--- DELIVERY PARTNERS ---');
  const partners = await db.collection('delivery_partners').find({}).toArray();
  for (const p of partners) {
    console.log(`- Partner ID: ${p._id} | User ID: ${p.userId} | Status: ${p.status} | Order: ${p.currentOrderId}`);
  }

  await client.close();
}

main().catch(console.error);
