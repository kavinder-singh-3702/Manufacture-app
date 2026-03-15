const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
jest.mock('../src/services/email.service', () => ({
  sendEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-email',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  sendDocumentRequestEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-doc-email',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  sendBusinessSetupSubmissionEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-startup-submit',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  sendBusinessSetupStatusEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-startup-status',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  verifyConnection: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-verify',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  }))
}));

const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Notification = require('../src/models/notification.model');
const {
  sendBusinessSetupSubmissionEmail,
  sendBusinessSetupStatusEmail
} = require('../src/services/email.service');
const {
  createBusinessSetupRequest,
  listBusinessSetupRequestsAdmin,
  updateBusinessSetupRequestWorkflowAdmin,
  listOpsRequestsAdmin
} = require('../src/modules/businessSetup/services/businessSetup.service');
const {
  createServiceRequest
} = require('../src/modules/services/services/serviceRequest.service');
const {
  assertAdminPermission,
  ADMIN_PERMISSIONS
} = require('../src/modules/admin/permissions');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Biz',
    lastName: 'Tester',
    displayName: `Biz ${suffix}`,
    email: `biz-${suffix}@example.com`,
    phone: `+1555900${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer',
    status: 'active'
  });

const createCompany = async (owner, suffix) =>
  Company.create({
    displayName: `Biz Co ${suffix}`,
    owner: owner._id,
    createdBy: owner._id,
    contact: { phone: `+9193000${suffix}` }
  });

describe('Business setup requests and merged ops queue', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    jest.clearAllMocks();
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('authenticated user can submit request and notifications are created', async () => {
    const admin = await createUser('8101', 'admin');
    const user = await createUser('8102', 'user');
    const company = await createCompany(user, '8101');

    user.activeCompany = company._id;
    await user.save();

    const request = await createBusinessSetupRequest(
      {
        businessType: 'Snacks Manufacturing',
        workModel: 'manufacturing',
        location: 'Surat, Gujarat',
        budgetRange: '10_25_lakh',
        startTimeline: 'within_1_month',
        supportAreas: ['business_plan', 'licenses'],
        notes: 'Need launch support before festive season',
        contactName: 'Kavin',
        contactPhone: '+919111111111'
      },
      { id: user._id.toString(), role: 'user', email: user.email, activeCompany: company._id.toString() }
    );

    expect(request.id).toBeTruthy();
    expect(request.referenceCode).toMatch(/^BSR-/);
    expect(request.source).toBe('authenticated');
    expect(request.status).toBe('new');

    const notifications = await Notification.find({
      eventKey: { $in: ['business_setup.request.created', 'business_setup.request.submitted'] }
    }).lean();

    const adminAlert = notifications.find((item) => item.eventKey === 'business_setup.request.created' && String(item.user) === String(admin._id));
    const userAck = notifications.find((item) => item.eventKey === 'business_setup.request.submitted' && String(item.user) === String(user._id));

    expect(adminAlert).toBeTruthy();
    expect(userAck).toBeTruthy();
    expect(adminAlert.channels).toContain('email');
    expect(userAck.channels).toContain('email');
    expect(sendBusinessSetupSubmissionEmail).not.toHaveBeenCalled();
  });

  test('guest request requires contact and succeeds with required guest fields', async () => {
    await createUser('8201', 'admin');

    await expect(
      createBusinessSetupRequest({
        businessType: 'Packaging Unit',
        workModel: 'manufacturing',
        location: 'Pune',
        budgetRange: '5_10_lakh',
        startTimeline: '1_3_months'
      })
    ).rejects.toThrow('contactName is required for guest submissions');

    const request = await createBusinessSetupRequest({
      businessType: 'Packaging Unit',
      workModel: 'manufacturing',
      location: 'Pune',
      budgetRange: '5_10_lakh',
      startTimeline: '1_3_months',
      contactName: 'Guest Founder',
      contactEmail: 'guest-founder@example.com'
    });

    expect(request.source).toBe('guest');
    expect(request.contactName).toBe('Guest Founder');
    expect(sendBusinessSetupSubmissionEmail).toHaveBeenCalledTimes(1);
    expect(sendBusinessSetupSubmissionEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'guest-founder@example.com',
        referenceCode: request.referenceCode
      })
    );

    const userAck = await Notification.findOne({ eventKey: 'business_setup.request.submitted' }).lean();
    expect(userAck).toBeNull();

    await createBusinessSetupRequest({
      businessType: 'Warehouse Setup',
      workModel: 'trading',
      location: 'Nagpur',
      budgetRange: 'under_5_lakh',
      startTimeline: '3_6_months',
      contactName: 'Phone Only Guest',
      contactPhone: '+919333333333'
    });

    expect(sendBusinessSetupSubmissionEmail).toHaveBeenCalledTimes(1);
  });

  test('admin list supports filters and pagination', async () => {
    const admin = await createUser('8301', 'admin');
    const user = await createUser('8302', 'user');
    const company = await createCompany(user, '8301');

    user.activeCompany = company._id;
    await user.save();

    const first = await createBusinessSetupRequest(
      {
        businessType: 'Dairy Processing',
        workModel: 'manufacturing',
        location: 'Jaipur',
        budgetRange: '25_50_lakh',
        startTimeline: 'within_1_month',
        contactName: 'Owner One',
        contactPhone: '+919222222221'
      },
      { id: user._id.toString(), role: 'user', email: user.email, activeCompany: company._id.toString() }
    );

    await createBusinessSetupRequest(
      {
        businessType: 'Online Distribution',
        workModel: 'online',
        location: 'Indore',
        budgetRange: 'under_5_lakh',
        startTimeline: '3_6_months',
        contactName: 'Owner Two',
        contactPhone: '+919222222222'
      },
      { id: user._id.toString(), role: 'user', email: user.email, activeCompany: company._id.toString() }
    );

    await updateBusinessSetupRequestWorkflowAdmin({
      requestId: first.id,
      actorId: admin._id.toString(),
      actorRole: 'admin',
      contextCompanyId: company._id.toString(),
      status: 'contacted',
      reason: 'Initial call completed'
    });

    const contactedOnly = await listBusinessSetupRequestsAdmin({ status: 'contacted', limit: 10, offset: 0 });
    expect(contactedOnly.requests.length).toBe(1);
    expect(contactedOnly.requests[0].businessType).toContain('Dairy');

    const searchResult = await listBusinessSetupRequestsAdmin({ search: 'online', limit: 10, offset: 0 });
    expect(searchResult.requests.length).toBe(1);
  });

  test('workflow transitions enforce valid sequence and emit status notification', async () => {
    const admin = await createUser('8401', 'admin');
    const user = await createUser('8402', 'user');
    const company = await createCompany(user, '8401');

    user.activeCompany = company._id;
    await user.save();

    const request = await createBusinessSetupRequest(
      {
        businessType: 'Chemical Formulation',
        workModel: 'manufacturing',
        location: 'Vadodara',
        budgetRange: '50_lakh_1_cr',
        startTimeline: 'immediately',
        contactName: 'Founder',
        contactPhone: '+919222222233'
      },
      { id: user._id.toString(), role: 'user', email: user.email, activeCompany: company._id.toString() }
    );

    await expect(
      updateBusinessSetupRequestWorkflowAdmin({
        requestId: request.id,
        actorId: admin._id.toString(),
        actorRole: 'admin',
        contextCompanyId: company._id.toString(),
        status: 'onboarding',
        reason: 'Skipping steps'
      })
    ).rejects.toThrow('Invalid status transition');

    const contacted = await updateBusinessSetupRequestWorkflowAdmin({
      requestId: request.id,
      actorId: admin._id.toString(),
      actorRole: 'admin',
      contextCompanyId: company._id.toString(),
      status: 'contacted',
      reason: 'Spoke with founder'
    });

    expect(contacted.status).toBe('contacted');

    const statusNotification = await Notification.findOne({
      eventKey: 'business_setup.request.status_changed',
      user: user._id
    }).lean();

    expect(statusNotification).toBeTruthy();
    expect(statusNotification.channels).toContain('email');
    expect(sendBusinessSetupStatusEmail).not.toHaveBeenCalled();
  });

  test('guest status transitions send direct guest status email when contactEmail exists', async () => {
    const superAdmin = await createUser('8450', 'super-admin');

    const guestRequest = await createBusinessSetupRequest({
      businessType: 'Cloud Kitchen',
      workModel: 'services',
      location: 'Ahmedabad',
      budgetRange: '10_25_lakh',
      startTimeline: '1_3_months',
      contactName: 'Guest Owner',
      contactEmail: 'guest-owner@example.com'
    });

    const updated = await updateBusinessSetupRequestWorkflowAdmin({
      requestId: guestRequest.id,
      actorId: superAdmin._id.toString(),
      actorRole: 'super-admin',
      status: 'contacted',
      reason: 'Initial outreach completed'
    });

    expect(updated.status).toBe('contacted');
    expect(sendBusinessSetupStatusEmail).toHaveBeenCalledTimes(1);
    expect(sendBusinessSetupStatusEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'guest-owner@example.com',
        referenceCode: guestRequest.referenceCode,
        status: 'contacted'
      })
    );
  });

  test('merged ops queue returns service and business setup items with filters', async () => {
    const admin = await createUser('8501', 'admin');
    const user = await createUser('8502', 'user');
    const company = await createCompany(user, '8501');

    user.activeCompany = company._id;
    await user.save();

    await createServiceRequest(
      {
        serviceType: 'worker',
        title: 'Need workers for evening shift',
        description: 'Packaging line staffing',
        priority: 'high',
        workerDetails: {
          industry: 'packaging',
          headcount: 10
        }
      },
      { id: user._id.toString(), role: 'user', activeCompany: company._id.toString() }
    );

    await createBusinessSetupRequest(
      {
        businessType: 'Cold Storage Unit',
        workModel: 'manufacturing',
        location: 'Nashik',
        budgetRange: '25_50_lakh',
        startTimeline: '1_3_months',
        contactName: 'Founder CS',
        contactPhone: '+919222222244'
      },
      { id: user._id.toString(), role: 'user', email: user.email, activeCompany: company._id.toString() }
    );

    const merged = await listOpsRequestsAdmin({ kind: 'all', limit: 20, offset: 0 });
    const kinds = new Set(merged.requests.map((item) => item.kind));

    expect(kinds.has('service')).toBe(true);
    expect(kinds.has('business_setup')).toBe(true);

    const startupOnly = await listOpsRequestsAdmin({ kind: 'business_setup', limit: 20, offset: 0 });
    expect(startupOnly.requests.every((item) => item.kind === 'business_setup')).toBe(true);

    const openOnly = await listOpsRequestsAdmin({ kind: 'all', statusBucket: 'open', limit: 20, offset: 0 });
    expect(openOnly.requests.length).toBeGreaterThan(0);
  });

  test('admin permission guard rejects non-admin users', () => {
    expect(() =>
      assertAdminPermission({ role: 'user' }, ADMIN_PERMISSIONS.READ_SERVICE_REQUESTS)
    ).toThrow('not allowed');

    expect(() =>
      assertAdminPermission({ role: 'admin' }, ADMIN_PERMISSIONS.READ_SERVICE_REQUESTS)
    ).not.toThrow();
  });
});
