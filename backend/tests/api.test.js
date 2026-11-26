process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_foodrescue';
process.env.ADMIN_REGISTRATION_KEY = 'test-admin-key';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/foodrescue_test';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Donation = require('../models/Donation');
const RequestModel = require('../models/Request');
const Review = require('../models/Review');

const hoursFromNow = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

describe('FoodRescue REST API Integration Suite', () => {
  let donorToken;
  let ngo1Token;
  let ngo2Token;
  let adminToken;
  let donorId;
  let ngo1Id;
  let ngo2Id;
  let donationId;
  let req1Id;
  let req2Id;

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await Promise.all([
      Review.deleteMany({}),
      RequestModel.deleteMany({}),
      Donation.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('registers donor, two NGOs, and admin (rejects admin without key)', async () => {
    const badAdmin = await request(app).post('/api/auth/register').send({
      name: 'Fake Admin',
      email: 'fake@admin.com',
      password: 'Password123',
      role: 'admin',
    });
    assert.equal(badAdmin.status, 403);

    const donorRes = await request(app).post('/api/auth/register').send({
      name: 'Bistro Donor',
      email: 'donor@test.com',
      password: 'Password123',
      role: 'donor',
      organizationName: 'Green Kitchen',
      phone: '9998887771',
      address: '10 Main St',
    });
    assert.equal(donorRes.status, 201);
    assert.ok(donorRes.body.data.token);
    assert.equal(donorRes.body.data.user.password, undefined);
    donorToken = donorRes.body.data.token;
    donorId = donorRes.body.data.user._id;

    const ngo1Res = await request(app).post('/api/auth/register').send({
      name: 'Hope NGO',
      email: 'ngo1@test.com',
      password: 'Password123',
      role: 'ngo',
      organizationName: 'Hope Harvest',
    });
    assert.equal(ngo1Res.status, 201);
    ngo1Token = ngo1Res.body.data.token;
    ngo1Id = ngo1Res.body.data.user._id;

    const ngo2Res = await request(app).post('/api/auth/register').send({
      name: 'Care NGO',
      email: 'ngo2@test.com',
      password: 'Password123',
      role: 'ngo',
      organizationName: 'Care Relief',
    });
    assert.equal(ngo2Res.status, 201);
    ngo2Token = ngo2Res.body.data.token;
    ngo2Id = ngo2Res.body.data.user._id;

    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Platform Admin',
      email: 'admin@test.com',
      password: 'Password123',
      role: 'admin',
      adminSecret: 'test-admin-key',
    });
    assert.equal(adminRes.status, 201);
    adminToken = adminRes.body.data.token;
  });

  it('rejects invalid login credentials and authenticates valid login', async () => {
    const badLogin = await request(app).post('/api/auth/login').send({
      email: 'donor@test.com',
      password: 'WrongPassword',
    });
    assert.equal(badLogin.status, 401);

    const goodLogin = await request(app).post('/api/auth/login').send({
      email: 'donor@test.com',
      password: 'Password123',
    });
    assert.equal(goodLogin.status, 200);
    assert.ok(goodLogin.body.data.token);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${donorToken}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.user.email, 'donor@test.com');
  });

  it('enforces role-based authorization on protected endpoints', async () => {
    const unauth = await request(app).get('/api/donations/my');
    assert.equal(unauth.status, 401);

    const ngoCreateDonation = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${ngo1Token}`)
      .send({ foodName: 'Unauthorized' });
    assert.equal(ngoCreateDonation.status, 403);

    const donorAdminStats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${donorToken}`);
    assert.equal(donorAdminStats.status, 403);
  });

  it('allows donor to create and update donation and NGOs to browse with filters', async () => {
    const createRes = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        foodName: 'Fresh Rice Bowls',
        category: 'Cooked Meals',
        description: 'Warm vegetarian rice bowls packed safely in food-grade boxes.',
        quantity: 20,
        unit: 'servings',
        pickupLocation: 'Indiranagar, Bengaluru',
        preparedAt: hoursAgo(1),
        useBy: hoursFromNow(12),
        pickupDeadline: hoursFromNow(6),
        allergenInformation: 'None',
        storageInformation: 'Hot insulated boxes',
      });
    assert.equal(createRes.status, 201);
    donationId = createRes.body.data.donation._id;
    assert.equal(createRes.body.data.donation.availableQuantity, 20);
    assert.equal(createRes.body.data.donation.status, 'Available');

    const updateRes = await request(app)
      .put(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ quantity: 25 });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.donation.availableQuantity, 25);

    const browseRes = await request(app).get(
      '/api/donations?category=Cooked%20Meals&location=Bengaluru&minQuantity=10'
    );
    assert.equal(browseRes.status, 200);
    assert.equal(browseRes.body.data.donations.length, 1);
  });

  it('prevents oversubscription when two NGOs request overlapping quantities concurrently', async () => {
    const r1 = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${ngo1Token}`)
      .send({
        donationId,
        requestedQuantity: 20,
        message: 'Can pick up in 30 mins',
      });
    assert.equal(r1.status, 201);
    req1Id = r1.body.data.request._id;

    const r2 = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${ngo2Token}`)
      .send({
        donationId,
        requestedQuantity: 15,
        message: 'Also need 15 servings',
      });
    assert.equal(r2.status, 201);
    req2Id = r2.body.data.request._id;

    // Approve first request (20 out of 25)
    const app1 = await request(app)
      .patch(`/api/requests/${req1Id}/approve`)
      .set('Authorization', `Bearer ${donorToken}`);
    assert.equal(app1.status, 200);
    assert.equal(app1.body.data.donation.availableQuantity, 5);

    // Second approval (15 > 5 remaining) must fail with 409 Conflict
    const app2 = await request(app)
      .patch(`/api/requests/${req2Id}/approve`)
      .set('Authorization', `Bearer ${donorToken}`);
    assert.equal(app2.status, 409);

    // Donor rejects second request
    const rej2 = await request(app)
      .patch(`/api/requests/${req2Id}/reject`)
      .set('Authorization', `Bearer ${donorToken}`);
    assert.equal(rej2.status, 200);
    assert.equal(rej2.body.data.request.status, 'Rejected');
  });

  it('enforces valid status transitions (Approved -> Picked Up -> Completed) and allows review', async () => {
    // Cannot jump straight from Approved to Completed
    const earlyComplete = await request(app)
      .patch(`/api/requests/${req1Id}/complete`)
      .set('Authorization', `Bearer ${ngo1Token}`);
    assert.equal(earlyComplete.status, 400);

    // Pickup first
    const pickup = await request(app)
      .patch(`/api/requests/${req1Id}/pickup`)
      .set('Authorization', `Bearer ${ngo1Token}`);
    assert.equal(pickup.status, 200);
    assert.equal(pickup.body.data.request.status, 'Picked Up');

    // Now complete
    const complete = await request(app)
      .patch(`/api/requests/${req1Id}/complete`)
      .set('Authorization', `Bearer ${ngo1Token}`);
    assert.equal(complete.status, 200);
    assert.equal(complete.body.data.request.status, 'Completed');

    // NGO submits review
    const rev = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${ngo1Token}`)
      .send({
        donationId,
        rating: 5,
        comment: 'Great quality food and smooth handoff!',
      });
    assert.equal(rev.status, 201);
  });

  it('allows NGO to cancel an approved request and restores availableQuantity', async () => {
    const dRes = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        foodName: 'Bread Packs',
        category: 'Bakery & Bread',
        description: 'Fresh bread loaves ready for pickup.',
        quantity: 10,
        unit: 'packs',
        pickupLocation: 'Koramangala',
        preparedAt: hoursAgo(1),
        useBy: hoursFromNow(10),
        pickupDeadline: hoursFromNow(5),
      });
    const dId = dRes.body.data.donation._id;

    const reqRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${ngo2Token}`)
      .send({ donationId: dId, requestedQuantity: 10 });
    const rId = reqRes.body.data.request._id;

    await request(app)
      .patch(`/api/requests/${rId}/approve`)
      .set('Authorization', `Bearer ${donorToken}`);

    const cancelRes = await request(app)
      .patch(`/api/requests/${rId}/cancel`)
      .set('Authorization', `Bearer ${ngo2Token}`);
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.data.request.status, 'Cancelled');
    assert.equal(cancelRes.body.data.donation.availableQuantity, 10);
    assert.equal(cancelRes.body.data.donation.status, 'Available');
  });

  it('executes admin verification, suspension, and stats endpoints', async () => {
    const verifyRes = await request(app)
      .patch(`/api/admin/users/${donorId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isVerified: true });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.data.user.isVerified, true);

    const suspendRes = await request(app)
      .patch(`/api/admin/users/${ngo2Id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isSuspended: true });
    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.body.data.user.isSuspended, true);

    const suspendedLogin = await request(app).post('/api/auth/login').send({
      email: 'ngo2@test.com',
      password: 'Password123',
    });
    assert.equal(suspendedLogin.status, 403);

    const statsRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(statsRes.status, 200);
    assert.equal(statsRes.body.data.stats.totalUsers, 4);
    assert.ok(statsRes.body.data.stats.totalDonations >= 2);
  });
});
