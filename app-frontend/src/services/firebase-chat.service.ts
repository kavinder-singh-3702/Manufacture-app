/**
 * Firebase Chat Service
 *
 * This service handles real-time chat using Firebase Firestore.
 *
 * HOW IT WORKS:
 * - Messages are stored in Firestore collections
 * - Real-time listeners update the UI instantly when new messages arrive
 * - No need for polling - Firebase pushes updates automatically
 *
 * FIRESTORE STRUCTURE:
 * /conversations/{conversationId}
 *   - participants: [userId, adminId]
 *   - lastMessage: string
 *   - lastMessageTime: timestamp
 *   - createdAt: timestamp
 *
 * /conversations/{conversationId}/messages/{messageId}
 *   - senderId: string
 *   - senderName: string
 *   - senderRole: "admin" | "user"
 *   - content: string
 *   - timestamp: timestamp
 *   - read: boolean
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { ChatMessage, ChatConversation, ChatUser } from "../types/chat";
import { IMessage } from "react-native-gifted-chat";

// Collection names
const CONVERSATIONS_COLLECTION = "conversations";
const MESSAGES_SUBCOLLECTION = "messages";
const CALL_REQUESTS_COLLECTION = "callRequests"; // For scheduled call requests

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Convert Firestore timestamp to Date
 */
const toDate = (timestamp: Timestamp | null): Date => {
  return timestamp ? timestamp.toDate() : new Date();
};

/**
 * Convert Firestore message to Gifted Chat format
 */
const toGiftedMessage = (
  id: string,
  data: any,
  currentUserId: string
): IMessage => ({
  _id: id,
  text: data.content || "",
  createdAt: toDate(data.timestamp),
  user: {
    _id: data.senderId,
    name: data.senderName || "Unknown",
  },
});

// ============================================================
// FIREBASE CHAT SERVICE
// ============================================================

export const firebaseChatService = {
  /**
   * Get or create a conversation between user and admin
   */
  async getOrCreateConversation(
    userId: string,
    userName: string,
    userPhone: string,
    adminId: string = "admin-001"
  ): Promise<string> {
    const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);

    // Check if conversation already exists
    const q = query(
      conversationsRef,
      where("userId", "==", userId),
      where("adminId", "==", adminId)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Conversation exists - update phone if provided and return ID
      const existingDoc = snapshot.docs[0];
      if (userPhone) {
        await updateDoc(doc(db, CONVERSATIONS_COLLECTION, existingDoc.id), {
          userPhone,
          userName, // Also update name in case it changed
        });
      }
      return existingDoc.id;
    }

    // Create new conversation
    const newConversation = {
      userId,
      userName,
      userPhone,
      adminId,
      adminName: "Support Admin",
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      createdAt: serverTimestamp(),
      unreadCount: 0,
    };

    const docRef = await addDoc(conversationsRef, newConversation);
    return docRef.id;
  },

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: "admin" | "user",
    content: string
  ): Promise<void> {
    // Add message to subcollection
    const messagesRef = collection(
      db,
      CONVERSATIONS_COLLECTION,
      conversationId,
      MESSAGES_SUBCOLLECTION
    );

    await addDoc(messagesRef, {
      senderId,
      senderName,
      senderRole,
      content,
      timestamp: serverTimestamp(),
      read: false,
    });

    // Update conversation's last message and unread counts
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);
    const currentData = conversationSnap.data() || {};

    // Track unread separately for admin and user
    const updateData: any = {
      lastMessage: content,
      lastMessageTime: serverTimestamp(),
    };

    if (senderRole === "user") {
      // User sent message - increment admin's unread count
      updateData.unreadCount = (currentData.unreadCount || 0) + 1;
    } else {
      // Admin sent message - increment user's unread count
      updateData.userUnreadCount = (currentData.userUnreadCount || 0) + 1;
    }

    await updateDoc(conversationRef, updateData);
  },

  /**
   * Subscribe to messages in a conversation (real-time)
   * Returns an unsubscribe function
   */
  subscribeToMessages(
    conversationId: string,
    currentUserId: string,
    onMessagesUpdate: (messages: IMessage[]) => void
  ): () => void {
    const messagesRef = collection(
      db,
      CONVERSATIONS_COLLECTION,
      conversationId,
      MESSAGES_SUBCOLLECTION
    );

    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(50));

    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: IMessage[] = snapshot.docs.map((doc) =>
        toGiftedMessage(doc.id, doc.data(), currentUserId)
      );
      onMessagesUpdate(messages);
    });

    return unsubscribe;
  },

  /**
   * Get all conversations for admin
   */
  async getAdminConversations(): Promise<ChatConversation[]> {
    const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
    const q = query(conversationsRef, orderBy("lastMessageTime", "desc"));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail || "",
        userPhone: data.userPhone || "",
        userCompany: data.userCompany,
        adminId: data.adminId,
        adminName: data.adminName,
        lastMessage: data.lastMessage,
        lastMessageTime: toDate(data.lastMessageTime).toISOString(),
        unreadCount: data.unreadCount || 0,
        createdAt: toDate(data.createdAt).toISOString(),
        updatedAt: toDate(data.lastMessageTime).toISOString(),
      };
    });
  },

  /**
   * Subscribe to conversations list (real-time) for admin
   */
  subscribeToConversations(
    onUpdate: (conversations: ChatConversation[]) => void
  ): () => void {
    const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
    const q = query(conversationsRef, orderBy("lastMessageTime", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversations: ChatConversation[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail || "",
          userPhone: data.userPhone || "",
          userCompany: data.userCompany,
          adminId: data.adminId,
          adminName: data.adminName,
          lastMessage: data.lastMessage,
          lastMessageTime: toDate(data.lastMessageTime).toISOString(),
          unreadCount: data.unreadCount || 0,
          createdAt: toDate(data.createdAt).toISOString(),
          updatedAt: toDate(data.lastMessageTime).toISOString(),
        };
      });
      onUpdate(conversations);
    });

    return unsubscribe;
  },

  /**
   * Mark conversation as read (for admin - clears unreadCount)
   */
  async markAsRead(conversationId: string): Promise<void> {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationRef, {
      unreadCount: 0,
    });
  },

  /**
   * Mark conversation as read for user (clears userUnreadCount)
   */
  async markAsReadForUser(conversationId: string): Promise<void> {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationRef, {
      userUnreadCount: 0,
    });
  },

  /**
   * Get conversation details (including user phone for calls)
   */
  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const snapshot = await getDoc(conversationRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail || "",
      userPhone: data.userPhone || "",
      userCompany: data.userCompany,
      adminId: data.adminId,
      adminName: data.adminName,
      lastMessage: data.lastMessage,
      lastMessageTime: toDate(data.lastMessageTime).toISOString(),
      unreadCount: data.unreadCount || 0,
      createdAt: toDate(data.createdAt).toISOString(),
      updatedAt: toDate(data.lastMessageTime).toISOString(),
    };
  },

  /**
   * Get user's conversation with admin (for user-side display)
   */
  async getUserConversation(userId: string): Promise<ChatConversation | null> {
    const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
    const q = query(
      conversationsRef,
      where("userId", "==", userId),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail || "",
      userPhone: data.userPhone || "",
      userCompany: data.userCompany,
      adminId: data.adminId,
      adminName: data.adminName,
      lastMessage: data.lastMessage,
      lastMessageTime: data.lastMessageTime ? toDate(data.lastMessageTime).toISOString() : "",
      unreadCount: data.userUnreadCount || 0, // User's unread count (messages from admin)
      createdAt: data.createdAt ? toDate(data.createdAt).toISOString() : "",
      updatedAt: data.lastMessageTime ? toDate(data.lastMessageTime).toISOString() : "",
    };
  },

  /**
   * Subscribe to user's conversation (real-time updates for user side)
   */
  subscribeToUserConversation(
    userId: string,
    onUpdate: (conversation: ChatConversation | null) => void
  ): () => void {
    const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
    const q = query(
      conversationsRef,
      where("userId", "==", userId),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        onUpdate(null);
        return;
      }

      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      onUpdate({
        id: docSnap.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail || "",
        userPhone: data.userPhone || "",
        userCompany: data.userCompany,
        adminId: data.adminId,
        adminName: data.adminName,
        lastMessage: data.lastMessage,
        lastMessageTime: data.lastMessageTime ? toDate(data.lastMessageTime).toISOString() : "",
        unreadCount: data.userUnreadCount || 0,
        createdAt: data.createdAt ? toDate(data.createdAt).toISOString() : "",
        updatedAt: data.lastMessageTime ? toDate(data.lastMessageTime).toISOString() : "",
      });
    });

    return unsubscribe;
  },

  /**
   * Schedule a call request - saves to Firebase for admin to see
   */
  async scheduleCallRequest(
    userId: string,
    userName: string,
    userPhone: string,
    reason: string
  ): Promise<string> {
    const callRequestsRef = collection(db, CALL_REQUESTS_COLLECTION);

    const newRequest = {
      userId,
      userName,
      userPhone,
      reason,
      status: "pending", // pending, completed, cancelled
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(callRequestsRef, newRequest);
    return docRef.id;
  },

  /**
   * Get all pending call requests (for admin)
   */
  async getCallRequests(): Promise<any[]> {
    const callRequestsRef = collection(db, CALL_REQUESTS_COLLECTION);
    const q = query(
      callRequestsRef,
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt).toISOString(),
    }));
  },

  /**
   * Subscribe to call requests (real-time for admin)
   */
  subscribeToCallRequests(
    onUpdate: (requests: any[]) => void
  ): () => void {
    const callRequestsRef = collection(db, CALL_REQUESTS_COLLECTION);
    const q = query(
      callRequestsRef,
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? toDate(doc.data().createdAt).toISOString() : "",
      }));
      onUpdate(requests);
    });

    return unsubscribe;
  },

  /**
   * Mark call request as completed
   */
  async completeCallRequest(requestId: string): Promise<void> {
    const requestRef = doc(db, CALL_REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, {
      status: "completed",
      updatedAt: serverTimestamp(),
    });
  },
};
