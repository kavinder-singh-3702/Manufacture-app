/**
 * Chat authorization, aggregation, and pagination tests.
 *
 * `getMessages`/`sendMessage`/`markConversationRead` previously took no
 * viewer identity at all — any authenticated user who knew (or guessed)
 * another pair's conversation ObjectId could read or inject messages into
 * it (IDOR). `assertConversationAccess` closes that: participant OR
 * admin/support role. These tests pin the fix down and cover the
 * aggregation/pagination rework that came with it.
 */

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const User = require('../src/models/user.model');
const {
  getOrCreateConversation,
  listConversations,
  getUnreadCount,
  getMessages,
  sendMessage,
  markConversationRead,
} = require('../src/modules/chat/services/chat.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Chat',
    lastName: 'Tester',
    displayName: `Chat ${role} ${suffix}`,
    email: `chat-platform-${suffix}@example.com`,
    phone: `+1555800${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer',
  });

describe('Chat platform service', () => {
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

  describe('authorization (X2/X3 IDOR fix)', () => {
    test('a non-participant cannot read messages in another pair\'s conversation', async () => {
      const userA = await createUser('9001');
      const userB = await createUser('9002');
      const outsider = await createUser('9003');

      const conv = await getOrCreateConversation(userA._id.toString(), userB._id.toString());
      await sendMessage(conv._id.toString(), userA._id.toString(), { content: 'private', senderRole: 'user' });

      await expect(
        getMessages(conv._id.toString(), { viewerId: outsider._id.toString(), viewerRole: 'user' })
      ).rejects.toMatchObject({ status: 403 });
    });

    test('a non-participant cannot send a message into another pair\'s conversation', async () => {
      const userA = await createUser('9011');
      const userB = await createUser('9012');
      const outsider = await createUser('9013');

      const conv = await getOrCreateConversation(userA._id.toString(), userB._id.toString());

      await expect(
        sendMessage(conv._id.toString(), outsider._id.toString(), {
          content: 'injected',
          senderRole: 'user',
          callerRole: 'user',
        })
      ).rejects.toMatchObject({ status: 403 });
    });

    test('a non-participant cannot mark another pair\'s conversation read', async () => {
      const userA = await createUser('9021');
      const userB = await createUser('9022');
      const outsider = await createUser('9023');

      const conv = await getOrCreateConversation(userA._id.toString(), userB._id.toString());

      await expect(
        markConversationRead(conv._id.toString(), outsider._id.toString(), { callerRole: 'user' })
      ).rejects.toMatchObject({ status: 403 });
    });

    test('an actual participant can read and send in their own conversation', async () => {
      const userA = await createUser('9031');
      const userB = await createUser('9032');

      const conv = await getOrCreateConversation(userA._id.toString(), userB._id.toString());
      await sendMessage(conv._id.toString(), userA._id.toString(), { content: 'hi', senderRole: 'user' });

      const result = await getMessages(conv._id.toString(), {
        viewerId: userB._id.toString(),
        viewerRole: 'user',
      });
      expect(result.messages).toHaveLength(1);
    });

    test('an admin who is NOT a participant can still read and reply (moderation bypass)', async () => {
      const userA = await createUser('9041');
      const userB = await createUser('9042');
      const admin = await createUser('9043', 'admin');

      const conv = await getOrCreateConversation(userA._id.toString(), userB._id.toString());
      await sendMessage(conv._id.toString(), userA._id.toString(), { content: 'hi', senderRole: 'user' });

      const result = await getMessages(conv._id.toString(), {
        viewerId: admin._id.toString(),
        viewerRole: 'admin',
      });
      expect(result.messages).toHaveLength(1);

      const reply = await sendMessage(conv._id.toString(), admin._id.toString(), {
        content: 'moderation note',
        senderRole: 'admin',
        callerRole: 'admin',
      });
      expect(reply.content).toBe('moderation note');
    });

    test('getMessages 404s on a conversation that does not exist', async () => {
      const userA = await createUser('9051');
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        getMessages(fakeId, { viewerId: userA._id.toString(), viewerRole: 'user' })
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('unread aggregation stays correct across multiple conversations', () => {
    test('per-conversation unread counts do not cross-contaminate', async () => {
      const userA = await createUser('9101');
      const userB = await createUser('9102');
      const userC = await createUser('9103');

      const convAB = await getOrCreateConversation(userA._id.toString(), userB._id.toString());
      const convAC = await getOrCreateConversation(userA._id.toString(), userC._id.toString());

      // B sends 2 unread to A; C sends 1 unread to A.
      await sendMessage(convAB._id.toString(), userB._id.toString(), { content: 'b1', senderRole: 'user' });
      await sendMessage(convAB._id.toString(), userB._id.toString(), { content: 'b2', senderRole: 'user' });
      await sendMessage(convAC._id.toString(), userC._id.toString(), { content: 'c1', senderRole: 'user' });

      const { conversations } = await listConversations(userA._id.toString());
      const withB = conversations.find((c) => c.id === String(convAB._id));
      const withC = conversations.find((c) => c.id === String(convAC._id));

      expect(withB.unreadCount).toBe(2);
      expect(withC.unreadCount).toBe(1);

      // Reading one thread must not affect the other's count.
      await markConversationRead(convAB._id.toString(), userA._id.toString(), { callerRole: 'user' });
      const after = await listConversations(userA._id.toString());
      const withBAfter = after.conversations.find((c) => c.id === String(convAB._id));
      const withCAfter = after.conversations.find((c) => c.id === String(convAC._id));
      expect(withBAfter.unreadCount).toBe(0);
      expect(withCAfter.unreadCount).toBe(1);
    });
  });

  describe('pagination', () => {
    test('listConversations clamps limit and reports hasMore', async () => {
      const userA = await createUser('9201');
      const others = await Promise.all(
        Array.from({ length: 3 }).map((_, i) => createUser(`92${10 + i}`))
      );
      for (const other of others) {
        await getOrCreateConversation(userA._id.toString(), other._id.toString());
      }

      const page = await listConversations(userA._id.toString(), { limit: 2, offset: 0 });
      expect(page.conversations).toHaveLength(2);
      expect(page.pagination.total).toBe(3);
      expect(page.pagination.hasMore).toBe(true);

      const rest = await listConversations(userA._id.toString(), { limit: 2, offset: 2 });
      expect(rest.conversations).toHaveLength(1);
      expect(rest.pagination.hasMore).toBe(false);
    });

    test('getUnreadCount totals across ALL conversations, not just the first page', async () => {
      // listConversations now defaults to a page of 30 — getUnreadCount must
      // not undercount a user whose unread messages are spread across more
      // conversations than fit on one page. 4 conversations, limit 2, each
      // with 1 unread message: a naive "sum unreadCount from page 1" would
      // report 2, not 4.
      const userA = await createUser('9401');
      const others = await Promise.all(
        Array.from({ length: 4 }).map((_, i) => createUser(`94${10 + i}`))
      );
      for (const other of others) {
        const conv = await getOrCreateConversation(userA._id.toString(), other._id.toString());
        await sendMessage(conv._id.toString(), other._id.toString(), { content: 'hi', senderRole: 'user' });
      }

      const page = await listConversations(userA._id.toString(), { limit: 2, offset: 0 });
      expect(page.conversations).toHaveLength(2);

      const total = await getUnreadCount(userA._id.toString());
      expect(total).toBe(4);
    });

    test('getMessages clamps an out-of-range limit instead of passing it straight to the query', async () => {
      const userA = await createUser('9301');
      const userB = await createUser('9302');
      const conv = await getOrCreateConversation(userA._id.toString(), userB._id.toString());
      await sendMessage(conv._id.toString(), userA._id.toString(), { content: 'hi', senderRole: 'user' });

      const result = await getMessages(conv._id.toString(), {
        viewerId: userA._id.toString(),
        viewerRole: 'user',
        limit: 5000,
      });
      expect(result.pagination.limit).toBe(200);
    });
  });
});
