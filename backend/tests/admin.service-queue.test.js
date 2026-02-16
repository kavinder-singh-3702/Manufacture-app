const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const {
  createServiceRequest,
  listServiceRequestsAdmin,
  updateServiceRequestWorkflowAdmin
} = require('../src/modules/services/services/serviceRequest.service');
const {
  getOrCreateConversation,
  sendMessage,
  createCallLog,
  listConversationsAdmin,
  listCallLogsAdmin
} = require('../src/modules/chat/services/chat.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Ops',
    lastName: 'Tester',
    displayName: `Ops ${suffix}`,
    email: `ops-${suffix}@example.com`,
    phone: `+1555600${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer'
  });

const createCompany = async (owner, suffix) =>
  Company.create({
    displayName: `Ops Co ${suffix}`,
    owner: owner._id,
    createdBy: owner._id,
    contact: { phone: `+9192000${suffix}` }
  });

describe('Admin service queue controls', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('admin can list global service queue and mutate workflow with explicit context', async () => {
    const admin = await createUser('7101', 'admin');
    const requester = await createUser('7102', 'user');
    const company = await createCompany(requester, '7101');

    requester.activeCompany = company._id;
    await requester.save();

    const request = await createServiceRequest(
      {
        serviceType: 'worker',
        title: 'Need workers for packaging line',
        description: 'Need 8 skilled workers',
        priority: 'high',
      },
      { id: requester._id.toString(), role: 'user', activeCompany: company._id.toString() }
    );

    const listed = await listServiceRequestsAdmin({
      search: 'packaging',
      status: 'pending',
      limit: 10,
      offset: 0
    });

    expect(listed.requests.length).toBe(1);
    expect(listed.requests[0].id).toBe(String(request._id));

    const updated = await updateServiceRequestWorkflowAdmin({
      serviceRequestId: String(request._id),
      actorId: admin._id.toString(),
      actorRole: 'admin',
      contextCompanyId: company._id.toString(),
      status: 'in_review',
      reason: 'Initial triage'
    });

    expect(updated.status).toBe('in_review');
    expect(updated.statusHistory.length).toBeGreaterThan(1);
  });

  test('admin workflow mutation rejects mismatched context', async () => {
    const admin = await createUser('7201', 'admin');
    const requester = await createUser('7202', 'user');
    const company = await createCompany(requester, '7201');
    const wrongCompany = await createCompany(admin, '7202');

    requester.activeCompany = company._id;
    await requester.save();

    const request = await createServiceRequest(
      {
        serviceType: 'machine_repair',
        title: 'Machine failure in unit 2',
        description: 'Conveyor belt not running',
      },
      { id: requester._id.toString(), role: 'user', activeCompany: company._id.toString() }
    );

    await expect(
      updateServiceRequestWorkflowAdmin({
        serviceRequestId: String(request._id),
        actorId: admin._id.toString(),
        actorRole: 'admin',
        contextCompanyId: wrongCompany._id.toString(),
        status: 'in_review',
        reason: 'try'
      })
    ).rejects.toThrow('contextCompanyId must match the target service request company');
  });

  test('admin communication queue endpoints list conversations and calls', async () => {
    const admin = await createUser('7301', 'admin');
    const requester = await createUser('7302', 'user');
    const conversation = await getOrCreateConversation(admin._id.toString(), requester._id.toString());

    await sendMessage(conversation._id.toString(), requester._id.toString(), {
      content: 'Need update on transport request',
      senderRole: 'user'
    });

    await createCallLog({
      callerId: admin._id.toString(),
      calleeId: requester._id.toString(),
      conversationId: conversation._id.toString(),
      startedAt: new Date(Date.now() - 1000 * 60),
      endedAt: new Date(),
      durationSeconds: 60,
      notes: 'Quick status check'
    });

    const conversations = await listConversationsAdmin({ limit: 10, offset: 0 });
    const calls = await listCallLogsAdmin({ limit: 10, offset: 0 });

    expect(conversations.conversations.length).toBeGreaterThan(0);
    expect(calls.callLogs.length).toBeGreaterThan(0);
  });
});
