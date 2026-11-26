require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const Review = require('../models/Review');

const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);

const seedDatabase = async () => {
  await connectDB();

  await Promise.all([
    Review.deleteMany({}),
    Request.deleteMany({}),
    Donation.deleteMany({}),
    User.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Aarav Mehta',
    email: 'admin@foodrescue.org',
    password: 'Password@123',
    role: 'admin',
    phone: '+91 98000 11100',
    organizationName: 'FoodRescue Platform Governance',
    address: 'Suite 400, Civic Impact Hub, Bengaluru',
    isVerified: true,
  });

  const donor1 = await User.create({
    name: 'Elena Rostova',
    email: 'donor@greenbistro.com',
    password: 'Password@123',
    role: 'donor',
    phone: '+91 98111 22334',
    organizationName: 'The Green Bistro & Kitchen',
    address: '42 Indiranagar 100ft Road, Bengaluru',
    isVerified: true,
  });

  const donor2 = await User.create({
    name: 'Marcus Vance',
    email: 'events@grandpalacehotel.com',
    password: 'Password@123',
    role: 'donor',
    phone: '+91 98222 33445',
    organizationName: 'Grand Palace Convention Hotel',
    address: '18 MG Road, Central District, Bengaluru',
    isVerified: false,
  });

  const ngo1 = await User.create({
    name: 'Priya Nair',
    email: 'ngo@hopeharvest.org',
    password: 'Password@123',
    role: 'ngo',
    phone: '+91 98333 44556',
    organizationName: 'HopeHarvest Community Kitchen',
    address: '91 Koramangala 4th Block, Bengaluru',
    isVerified: true,
  });

  const ngo2 = await User.create({
    name: 'Daniel Okafor',
    email: 'ngo@carebridge.org',
    password: 'Password@123',
    role: 'ngo',
    phone: '+91 98444 55667',
    organizationName: 'CareBridge Relief Foundation',
    address: '12 Jayanagar 3rd Block, Bengaluru',
    isVerified: true,
  });

  const donations = await Donation.create([
    {
      donorId: donor1._id,
      foodName: 'Vegetable Pulao & Dal Tadka Trays',
      category: 'Cooked Meals',
      description:
        'Freshly prepared afternoon buffet surplus sealed in sanitized steel gastronorm trays. Ideal for evening community shelter distribution.',
      quantity: 60,
      availableQuantity: 60,
      unit: 'servings',
      pickupLocation: '42 Indiranagar 100ft Road, Bengaluru',
      preparedAt: hoursAgo(2),
      useBy: hoursFromNow(10),
      pickupDeadline: hoursFromNow(6),
      allergenInformation: 'Contains ghee (dairy) and mild spices',
      storageInformation: 'Stored hot above 63°C in insulated chafing containers',
      status: 'Available',
    },
    {
      donorId: donor1._id,
      foodName: 'Artisan Multigrain Loaves & Croissants',
      category: 'Bakery & Bread',
      description:
        'End-of-day bakery batch including whole wheat loaves, sourdough boules, and plain butter croissants packed in food-grade paper crates.',
      quantity: 35,
      availableQuantity: 35,
      unit: 'packs',
      pickupLocation: '42 Indiranagar 100ft Road, Bengaluru',
      preparedAt: hoursAgo(4),
      useBy: hoursFromNow(36),
      pickupDeadline: hoursFromNow(14),
      allergenInformation: 'Contains wheat gluten and dairy',
      storageInformation: 'Dry ambient storage in sealed bakery crates',
      status: 'Available',
    },
    {
      donorId: donor2._id,
      foodName: 'Corporate Summit Fruit & Salad Boxes',
      category: 'Fruits & Vegetables',
      description:
        'Unopened individual fruit bowls and garden salad packs left over from a 200-guest conference lunch.',
      quantity: 45,
      availableQuantity: 25,
      unit: 'boxes',
      pickupLocation: '18 MG Road, Central District, Bengaluru',
      preparedAt: hoursAgo(3),
      useBy: hoursFromNow(18),
      pickupDeadline: hoursFromNow(8),
      allergenInformation: 'Nut-free; dressing packets packed separately',
      storageInformation: 'Chilled at 4°C in walk-in cold room',
      status: 'Requested',
    },
    {
      donorId: donor2._id,
      foodName: 'Packaged Milk Cartons & Yogurt Cups',
      category: 'Dairy & Beverages',
      description:
        'Sealed UHT milk tetra packs and plain yogurt cups with 4 days remaining before best-before date.',
      quantity: 40,
      availableQuantity: 0,
      unit: 'packs',
      pickupLocation: '18 MG Road, Central District, Bengaluru',
      preparedAt: hoursAgo(24),
      useBy: hoursFromNow(72),
      pickupDeadline: hoursAgo(1),
      allergenInformation: 'Contains dairy',
      storageInformation: 'Refrigerated below 5°C',
      status: 'Completed',
    },
  ]);

  // Pending request on donation[2]
  await Request.create({
    donationId: donations[2]._id,
    ngoId: ngo2._id,
    requestedQuantity: 15,
    message: 'Our evening outreach van is 10 minutes from MG Road and can collect at 7 PM.',
    status: 'Requested',
  });

  // Completed request on donation[3] + Review
  await Request.create({
    donationId: donations[3]._id,
    ngoId: ngo1._id,
    requestedQuantity: 40,
    message: 'Collected for children morning nutrition program.',
    status: 'Completed',
    pickedUpAt: hoursAgo(4),
    completedAt: hoursAgo(2),
  });

  await Review.create({
    donationId: donations[3]._id,
    reviewerId: ngo1._id,
    revieweeId: donor2._id,
    rating: 5,
    comment:
      'Everything was chilled, neatly boxed, and ready at the loading bay. Smooth coordination!',
  });

  console.log('Seeded FoodRescue database successfully:');
  console.log(`  Admin:  ${admin.email} / Password@123`);
  console.log(`  Donor:  ${donor1.email} / Password@123`);
  console.log(`  Donor2: ${donor2.email} / Password@123`);
  console.log(`  NGO:    ${ngo1.email} / Password@123`);
  console.log(`  NGO2:   ${ngo2.email} / Password@123`);

  await mongoose.disconnect();
};

seedDatabase().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
