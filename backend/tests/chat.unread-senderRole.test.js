/**
 * Tests for user-side unread counting on the chat endpoints.
 *
 * The Support FAB badge shown on ServicesOverviewScreen sources its number
 * from listConversations via UnreadMessagesProvider. For that badge to mean
 * anything, admin replies to the user MUST show up as unread for the user.
 * An earlier attempt at "defense-in-depth" added a `senderRole NOT IN
 * [admin, support]` filter to the user-side query, which (combined with
 * sender = other.user where `other` is the admin) reduced to an impossible
 * condition and forced the count to 0 — silently breaking the badge. These
 * tests pin the correct behaviour: admin messages count, user messages from
 * a counterpart count, and markRead drops the total.
 *
 * Validated functions in chat.service.js:
 *   - getConversationSummaryForUser
 *   - listConversations
 *
 * Also covers the GET /auth/support-admin endpoint that resolves the real
 * admin id used by the frontend chat client.
 */

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const User = require('../src/models/user.model');
const ChatConversation = require('../src/models/chatConversation.model');
const ChatMessage = require('../src/models/chatMessage.model');
const {
  getOrCreateConversation,
  sendMessage,
  listConversations,
  markConversationRead,
} = require('../src/modules/chat/services/chat.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Chat',
    lastName: 'Tester',
    displayName: `Chat ${role} ${suffix}`,
    email: `chat-${role}-${suffix}@example.com`,
    phone: `+1555700${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer',
  });

describe('User-side unread counting (admin replies must show as unread)', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
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

  test('listConversations DOES count admin-role messages as unread for the user (regression guard)', async () => {
    // Regression guard for the SupportFab "always 2 unread" bug. Earlier we
    // had `senderRole: { $nin: ['admin','support'] }` on the user-side query,
    // combined with `sender = other.user` (admin). Those AND together to an
    // impossible condition and forced unreadCount to 0 — so the Support FAB
    // badge never showed admin replies. Filter removed; this test pins the
    // fix down so it doesn't regress.
    const user = await createUser('8001', 'user');
    const admin = await createUser('8002', 'admin');

    const conv = await getOrCreateConversation(user._id.toString(), admin._id.toString());

    await sendMessage(conv._id.toString(), admin._id.toString(), {
      content: 'Hi from admin 1',
      senderRole: 'admin',
    });
    await sendMessage(conv._id.toString(), admin._id.toString(), {
      content: 'Hi from admin 2',
      senderRole: 'admin',
    });

    const userListing = await listConversations(user._id.toString());
    expect(userListing).toHaveLength(1);
    // The user's Support FAB badge must show admin's replies as unread —
    // that's the entire point of the badge.
    expect(userListing[0].unreadCount).toBe(2);
  });

  test('getConversationSummaryForUser DOES count admin-role messages as unread for the user', async () => {
    // Same guarantee as above, but for the per-conversation summary used by
    // socket emits and direct conversation lookups.
    const user = await createUser('8011', 'user');
    const admin = await createUser('8012', 'admin');

    const conv = await getOrCreateConversation(user._id.toString(), admin._id.toString());
    await sendMessage(conv._id.toString(), admin._id.toString(), {
      content: 'Admin reply',
      senderRole: 'admin',
    });

    const {
      getConversationSummaryForUser,
    } = require('../src/modules/chat/services/chat.service');

    const summary = await getConversationSummaryForUser(
      conv._id.toString(),
      user._id.toString()
    );
    expect(summary).not.toBeNull();
    expect(summary.unreadCount).toBe(1);
  });

  test('listConversations counts user-role messages from the counterpart as unread', async () => {
    const userA = await createUser('8101', 'user');
    const userB = await createUser('8102', 'user');

    const conv = await getOrCreateConversation(userA._id.toString(), userB._id.toString());
    await sendMessage(conv._id.toString(), userB._id.toString(), {
      content: 'Hello A',
      senderRole: 'user',
    });
    await sendMessage(conv._id.toString(), userB._id.toString(), {
      content: 'Are you there',
      senderRole: 'user',
    });

    const aListing = await listConversations(userA._id.toString());
    expect(aListing).toHaveLength(1);
    // B's user-role messages should still count for A.
    expect(aListing[0].unreadCount).toBe(2);
  });

  test('listConversations resets unread to 0 after markConversationRead', async () => {
    const userA = await createUser('8201', 'user');
    const userB = await createUser('8202', 'user');

    const conv = await getOrCreateConversation(userA._id.toString(), userB._id.toString());
    await sendMessage(conv._id.toString(), userB._id.toString(), {
      content: 'Ping',
      senderRole: 'user',
    });
    await markConversationRead(conv._id.toString(), userA._id.toString(), { callerRole: 'user' });

    const aListing = await listConversations(userA._id.toString());
    expect(aListing[0].unreadCount).toBe(0);
  });
});

describe('GET /auth/support-admin', () => {
  let mongoServer;
  let app;
  let request;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    await mongoose.connect(mongoServer.getUri());
    // Late-require so the env-driven config has the mocked DB picked up by
    // any module-level reads. The route itself reads PRIMARY_SUPPORT_ADMIN_ID
    // at request time so re-requires aren't needed when we mutate env between
    // tests.
    request = require('supertest');
    app = require('../src/app');
  });

  afterEach(async () => {
    delete process.env.PRIMARY_SUPPORT_ADMIN_ID;
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('returns 503 when no admin user exists and env var is unset', async () => {
    const response = await request(app).get('/api/auth/support-admin');
    expect(response.status).toBe(503);
  });

  test('returns the env var id when set and the user exists', async () => {
    const admin = await createUser('8301', 'admin');
    process.env.PRIMARY_SUPPORT_ADMIN_ID = admin._id.toString();
    const response = await request(app).get('/api/auth/support-admin');
    expect(response.status).toBe(200);
    expect(response.body.supportAdminId).toBe(admin._id.toString());
  });

  test('falls back to oldest admin when env var is unset', async () => {
    // Create admins in two passes so created-at ordering is deterministic.
    const oldest = await createUser('8401', 'admin');
    // 2ms sleep keeps Mongo createdAt monotonic on fast hardware.
    await new Promise((resolve) => setTimeout(resolve, 5));
    await createUser('8402', 'admin');
    const response = await request(app).get('/api/auth/support-admin');
    expect(response.status).toBe(200);
    expect(response.body.supportAdminId).toBe(oldest._id.toString());
  });

  test('ignores a stale PRIMARY_SUPPORT_ADMIN_ID and falls back to oldest admin', async () => {
    // Bogus id — not a real user — must not cause a 200 with a fake id.
    process.env.PRIMARY_SUPPORT_ADMIN_ID = '000000000000000000000099';
    const realAdmin = await createUser('8501', 'admin');
    const response = await request(app).get('/api/auth/support-admin');
    expect(response.status).toBe(200);
    expect(response.body.supportAdminId).toBe(realAdmin._id.toString());
  });
});
