const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('food_delivery');

  const admin = await db.collection('users').findOne({ email: 'admin@fooddelivery.com' });
  if (!admin) {
    console.log('Admin not found');
    await client.close();
    return;
  }

  const driverEmail = 'driver@fooddelivery.com';
  let driver = await db.collection('users').findOne({ email: driverEmail });

  if (!driver) {
    console.log('Creating driver@fooddelivery.com...');
    const insertUser = await db.collection('users').insertOne({
      name: 'Raju Delivery Partner',
      email: driverEmail,
      password: admin.password, // bcrypt hash for Admin@123 or similar valid bcrypt
      phone: '9876543211',
      role: 'DELIVERY_PARTNER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    driver = { _id: insertUser.insertedId };
    console.log('Driver user created with ID:', driver._id);
  } else {
    console.log('Driver user already exists with ID:', driver._id);
    await db.collection('users').updateOne(
      { _id: driver._id },
      { $set: { role: 'DELIVERY_PARTNER', isActive: true } }
    );
  }

  // Ensure delivery_partners document exists
  let partner = await db.collection('delivery_partners').findOne({ userId: driver._id.toString() });
  if (!partner) {
    const insertPartner = await db.collection('delivery_partners').insertOne({
      userId: driver._id.toString(),
      vehicleType: 'MOTORCYCLE',
      status: 'ONLINE',
      currentLocation: {
        type: 'Point',
        coordinates: [73.8567, 18.5204] // [lng, lat]
      },
      lastLocationUpdateTime: new Date(),
      lastActiveTime: new Date(),
      rating: 4.8,
      dailyDeliveryCount: 5,
      acceptanceRate: 95.0,
      averageDeliveryTimeMinutes: 22.0,
      totalAssignments: 10,
      totalAccepted: 9,
      totalRejected: 1,
      totalTimeouts: 0,
      consecutiveRejections: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created delivery_partners record:', insertPartner.insertedId);
  } else {
    console.log('Delivery partner record already exists with status:', partner.status);
    await db.collection('delivery_partners').updateOne(
      { _id: partner._id },
      { $set: { status: 'ONLINE', lastLocationUpdateTime: new Date() } }
    );
  }

  await client.close();
  console.log('Driver seeding complete!');
}

main().catch(console.error);
