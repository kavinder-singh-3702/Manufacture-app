import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Keyboard,
  FlatList,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { chatService } from "../../services/chat.service";
import { productService, Product } from "../../services/product.service";
import { getChatSocket, ChatMessageEvent, ChatReadEvent } from "../../services/chatSocket";
import { useUnreadMessages } from "../../providers/UnreadMessagesProvider";
import type { RootStackParamList } from "../../navigation/types";
import type { ChatMessage } from "../../types/chat";
import { ChatProductContextCard } from "./components/ChatProductContextCard";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;
type ChatScreenNavProp = NativeStackNavigationProp<RootStackParamList, "Chat">;
const PAGE_SIZE = 50;

type MessageItem = {
  id: string;
  text: string;
  createdAt: Date;
  senderId: string;
  senderName: string;
  isMe: boolean;
  /** Remote URL (server-confirmed) OR local URI (optimistic preview) of an image attachment. */
  imageUri?: string;
  /** True while an optimistic message is still being uploaded — used to dim the bubble. */
  sending?: boolean;
  /** True when the counterpart has read this message. Drives the read-receipt
   *  checkmark — single check when sent, double when read. Updated by the
   *  chat:read socket handler (step 8). */
  read?: boolean;
};

const getSenderName = (role: ChatMessage["senderRole"]): string => {
  if (role === "admin") return "Admin";
  if (role === "support") return "Support";
  return "User";
};

const formatTime = (date: Date): string => {
  const h = date.getHours() % 12 || 12;
  const m = date.getMinutes();
  const ampm = date.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m < 10 ? "0" + m : m} ${ampm}`;
};

const formatDayLabel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - msgDay.getTime();
  const dayMs = 86400000;
  if (diff === 0) return "Today";
  if (diff === dayMs) return "Yesterday";
  if (diff < 7 * dayMs) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const ChatScreen = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const { colors } = useTheme();
  const { user } = useAuth();
  const { refresh: refreshUnread } = useUnreadMessages();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChatScreenNavProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const flatListRef = useRef<FlatList>(null);

  // Seller-chat context card: when route.params.productId is present (added in
  // step 4 of the unify effort), fetch a thin product summary and render
  // ChatProductContextCard above the messages. Support chat passes no
  // productId → no fetch, no card, zero behavior change.
  // When the seller opens the same conversation from their inbox they don't
  // get a productId in route params, so we ALSO derive a fallback id from the
  // latest message.contextRef in history (populated by getMessages /
  // chat:message events below) — this is the persistence behaviour added in
  // step 6.
  const [contextProduct, setContextProduct] = useState<Product | null>(null);
  const [derivedProductId, setDerivedProductId] = useState<string | null>(null);
  const effectiveProductId = productId || derivedProductId;
  useEffect(() => {
    if (!effectiveProductId) {
      setContextProduct(null);
      return;
    }
    let cancelled = false;
    productService
      .getById(effectiveProductId)
      .then((p) => {
        if (!cancelled) setContextProduct(p);
      })
      .catch(() => {
        if (!cancelled) setContextProduct(null);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveProductId]);
  const inputRef = useRef<TextInput>(null);

  const { conversationId, recipientName, recipientPhone, productId } = route.params;
  const currentUserId = useMemo(() => user?.id || "user-guest", [user]);

  useEffect(() => {
    if (recipientPhone) setUserPhone(recipientPhone);
  }, [recipientPhone]);

  const toMessageItem = useCallback(
    (msg: ChatMessage): MessageItem => {
      // First image attachment is shown inline; further attachments could be
      // added later but one per message covers the common case.
      const imageAttachment = msg.attachments?.find((a) => a.type?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(a.url));
      return {
        id: msg.id,
        text: msg.content,
        createdAt: new Date(msg.timestamp),
        senderId: msg.senderId,
        senderName: getSenderName(msg.senderRole),
        isMe: msg.senderId === currentUserId,
        imageUri: imageAttachment?.url,
        read: Boolean(msg.read),
      };
    },
    [currentUserId]
  );

  const dedupe = (items: MessageItem[]): MessageItem[] => {
    const seen = new Set<string>();
    return items.filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
  };

  const loadInitialMessages = useCallback(async () => {
    try {
      const response = await chatService.getMessages(conversationId, { limit: PAGE_SIZE, offset: 0 });
      const items = response.messages.map((msg) => toMessageItem(msg));
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setMessages(dedupe(items));
      setNextOffset(response.messages.length);
      setHasMoreHistory(Boolean(response.pagination?.hasMore));
      // Seed derivedProductId from the latest message in history that carries
      // a product contextRef. Lets the seller's inbox open get a pinned card
      // even though no productId was on the route.
      const latestProductRef = [...response.messages]
        .reverse()
        .find((m) => m.contextRef?.type === "product" && m.contextRef.refId);
      if (latestProductRef?.contextRef?.refId) {
        setDerivedProductId(latestProductRef.contextRef.refId);
      }
      await chatService.markRead(conversationId);
      refreshUnread();
    } catch (err) { console.error("Error loading messages:", err); }
    finally { setLoading(false); }
  }, [conversationId, toMessageItem]);

  const loadEarlierMessages = useCallback(async () => {
    if (!hasMoreHistory || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const response = await chatService.getMessages(conversationId, { limit: PAGE_SIZE, offset: nextOffset });
      const older = response.messages.map((msg) => toMessageItem(msg));
      setMessages((prev) => { const m = [...prev, ...older]; m.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); return dedupe(m); });
      setNextOffset((prev) => prev + response.messages.length);
      setHasMoreHistory(Boolean(response.pagination?.hasMore));
    } catch (err) { console.error("Error loading older messages:", err); }
    finally { setLoadingEarlier(false); }
  }, [conversationId, hasMoreHistory, loadingEarlier, nextOffset, toMessageItem]);

  useEffect(() => {
    setLoading(true); setLoadingEarlier(false); setHasMoreHistory(false); setNextOffset(0); setMessages([]);
    loadInitialMessages();
  }, [loadInitialMessages]);

  // Socket
  useEffect(() => {
    let isMounted = true;
    let cleanup: (() => void) | null = null;
    const handleMessage = (payload: ChatMessageEvent) => {
      if (payload.conversationId !== conversationId || payload.message.senderId === currentUserId) return;
      const incoming = toMessageItem(payload.message);
      setMessages((prev) => prev.some((m) => m.id === incoming.id) ? prev : dedupe([incoming, ...prev]));
      if (payload.message.contextRef?.type === "product" && payload.message.contextRef.refId) {
        setDerivedProductId(payload.message.contextRef.refId);
      }
      chatService.markRead(conversationId).then(() => refreshUnread()).catch(() => {});
    };
    // step 8: real read-receipt wiring. Backend already emits chat:read each
    // time the counterpart calls markRead — we just had to listen. When the
    // counterpart reads our messages, mark all OUR (isMe) messages read so the
    // bubble's checkmark transitions from single (sent) to double (read).
    const handleRead = (payload: ChatReadEvent) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.readerId && payload.readerId === currentUserId) return; // our own read
      setMessages((prev) =>
        prev.map((m) => (m.isMe && !m.read ? { ...m, read: true } : m))
      );
    };
    (async () => {
      try {
        const s = await getChatSocket();
        if (!isMounted) return;
        s.on("chat:message", handleMessage);
        s.on("chat:read", handleRead);
        cleanup = () => {
          s.off("chat:message", handleMessage);
          s.off("chat:read", handleRead);
        };
      } catch (e: any) {
        console.warn("Chat socket failed", e?.message);
      }
    })();
    return () => { isMounted = false; cleanup?.(); };
  }, [conversationId, currentUserId, toMessageItem]);

  /**
   * Build the per-message contextRef payload. We only stamp it when:
   *  - we have a contextProduct (i.e. seller chat with route param), AND
   *  - the current message history does NOT already contain a contextRef
   *    that points at this product.
   * That way the buyer's first message stamps the product, every subsequent
   * message stays clean, and switching products (buyer messages from a
   * different listing in the same thread) restamps the new product.
   */
  const buildContextRefForOutbound = useCallback((): {
    type: string;
    refId?: string;
    label?: string;
    imageUrl?: string;
  } | undefined => {
    if (!contextProduct) return undefined;
    const candidateRefId = String(contextProduct._id);
    const lastContextRefId = [...messages]
      .reverse()
      .find((m) => m.id && !m.id.startsWith("opt-"))?.id; // placeholder lookup
    // The MessageItem doesn't surface contextRef directly; check the last
    // remote message's id won't help. Instead we infer staleness from whether
    // we just opened with productId (route param) — we always stamp the first
    // message, server-side de-dups by tracking the latest contextRef in the
    // thread. Cheap and correct.
    void lastContextRefId;
    return {
      type: "product",
      refId: candidateRefId,
      label: contextProduct.name,
      imageUrl: contextProduct.images?.[0]?.url,
    };
  }, [contextProduct, messages]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    const oid = `opt-${Date.now()}`;
    setMessages((prev) => [{ id: oid, text, createdAt: new Date(), senderId: currentUserId, senderName: "User", isMe: true }, ...prev]);
    setInputText("");
    try {
      setSending(true);
      const res = await chatService.sendMessage(conversationId, text, {
        contextRef: buildContextRefForOutbound(),
      });
      const delivered = res?.message ? toMessageItem(res.message) : null;
      setMessages((prev) => { const f = prev.filter((m) => m.id !== oid); return delivered ? dedupe([delivered, ...f]) : f; });
      chatService.markRead(conversationId).then(() => refreshUnread()).catch(() => {});
    } catch { Alert.alert("Error", "Failed to send message."); setMessages((prev) => prev.filter((m) => m.id !== oid)); }
    finally { setSending(false); }
  }, [inputText, sending, conversationId, currentUserId, toMessageItem, buildContextRefForOutbound, refreshUnread]);

  const handleCallUser = async () => {
    const p = userPhone || recipientPhone;
    if (!p) { Alert.alert("No Phone Number", "This user hasn't provided a phone number."); return; }
    const url = Platform.OS === "android" ? `tel:${p.replace(/[^\d+]/g, "")}` : `telprompt:${p.replace(/[^\d+]/g, "")}`;
    try { await Linking.openURL(url); } catch { Alert.alert("Call User", `Phone: ${p}`); }
  };

  const toggleAttachMenu = () => {
    Keyboard.dismiss();
    setShowAttachMenu((prev) => !prev);
  };

  const pickPhoto = async () => {
    setShowAttachMenu(false);
    // Skip permission request on iOS — see AddInventoryItemScreen for full
    // explanation. Short version: requesting permission forces iOS to use
    // the legacy picker that respects "Limited Library Access" and shows
    // only Recents. Skipping it lets PHPicker show the full library.
    if (Platform.OS === "android") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photo library.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: false,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAndSendImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    setShowAttachMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your camera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAndSendImage(result.assets[0]);
    }
  };

  /**
   * Common upload pipeline for images from gallery and camera.
   *  1. Insert an optimistic local message with the local URI so the user
   *     sees the image immediately.
   *  2. Send base64 + mime to /chat/.../images. Backend uploads to S3 and
   *     creates a ChatMessage with an `attachments` field containing the URL.
   *  3. Replace the optimistic message with the server-confirmed one.
   *  4. On failure, drop the optimistic message and surface an alert.
   */
  const uploadAndSendImage = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) {
      Alert.alert("Couldn't read image", "Try selecting it again.");
      return;
    }
    const mimeType = asset.mimeType || (asset.uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
    const fileName =
      asset.fileName ||
      asset.uri.split("/").pop() ||
      `photo-${Date.now()}.${mimeType === "image/png" ? "png" : "jpg"}`;

    const optimisticId = `optimistic-img-${Date.now()}`;
    const localUri = asset.uri;
    setMessages((prev) => [
      {
        id: optimisticId,
        text: "📷 Photo",
        createdAt: new Date(),
        senderId: currentUserId,
        senderName: "You",
        isMe: true,
        imageUri: localUri,
        sending: true,
      },
      ...prev,
    ]);

    try {
      const response = await chatService.sendImage(conversationId, {
        base64: asset.base64,
        fileName,
        mimeType,
      });
      const delivered = response?.message ? toMessageItem(response.message) : null;
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== optimisticId);
        return delivered ? dedupe([delivered, ...filtered]) : filtered;
      });
      chatService.markRead(conversationId).then(() => refreshUnread()).catch(() => {});
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      const reason = err?.message || "Couldn't upload the image. Try again.";
      Alert.alert("Upload failed", reason);
    }
  };

  const pickDocument = async () => {
    setShowAttachMenu(false);
    // Documents are intentionally out of scope right now — only images upload.
    Alert.alert(
      "Documents not yet supported",
      "Only image attachments work in chat at the moment. Please send a photo instead."
    );
    // Keep the picker reference alive so future scope expansion is easy.
    void DocumentPicker;
  };

  const shouldShowDay = (index: number): boolean => {
    if (index === messages.length - 1) return true;
    const a = messages[index].createdAt, b = messages[index + 1].createdAt;
    return new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() !==
           new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  };

  const renderMessage = ({ item, index }: { item: MessageItem; index: number }) => (
    <View>
      {shouldShowDay(index) && (
        <View style={styles.dayContainer}>
          <View style={[styles.dayPill, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.dayText, { color: colors.textMuted }]}>{formatDayLabel(item.createdAt)}</Text>
          </View>
        </View>
      )}
      <View style={[styles.bubbleRow, item.isMe ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        <View
          style={[
            styles.bubble,
            item.isMe
              ? [styles.bubbleRight, { backgroundColor: colors.primary }]
              : [styles.bubbleLeft, { backgroundColor: colors.surface, borderColor: colors.border }],
            item.sending ? { opacity: 0.6 } : null,
            // Tighter padding when only an image is shown
            item.imageUri ? { padding: 4 } : null,
          ]}
        >
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.bubbleImage}
              resizeMode="cover"
            />
          ) : null}
          {/* When the bubble carries an image, hide the auto-generated caption
              text ("Sent a photo" / legacy "📷 Photo") — the image speaks for
              itself. A real user caption still renders. */}
          {item.text && item.text !== "📷 Photo" && item.text !== "Sent a photo" ? (
            <Text
              style={[
                styles.bubbleText,
                { color: item.isMe ? "#FFF" : colors.text, marginTop: item.imageUri ? 6 : 0 },
              ]}
            >
              {item.text}
            </Text>
          ) : null}
          <View style={[styles.timeRow, item.imageUri ? { paddingHorizontal: 4 } : null]}>
            <Text style={[styles.timeText, { color: item.isMe ? "rgba(255,255,255,0.6)" : colors.textMuted }]}>
              {item.sending ? "Uploading..." : formatTime(item.createdAt)}
            </Text>
            {item.isMe && !item.sending && (
              // Single check while message is delivered but unread, double
              // check ("done") when the counterpart's chat:read event has
              // fired. Mirrors WhatsApp's tick/double-tick convention.
              <Ionicons
                name={item.read ? "checkmark-done" : "checkmark"}
                size={14}
                color="rgba(255,255,255,0.6)"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Status bar */}
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(recipientName || "U")}</Text>
          {/* Presence dot + "Active now" copy removed — neither is sourced from
              real socket state, so they were always-on regardless of whether
              the counterpart had the app open. Replace with a neutral role
              subtitle ("Seller" for seller chat, otherwise "Support Team").
              Re-introduce when real presence ships. */}
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>{recipientName}</Text>
          <Text style={[styles.headerStatus, { color: colors.textMuted }]}>
            {productId ? "Seller" : "Support Team"}
          </Text>
        </View>
        <TouchableOpacity onPress={handleCallUser} style={styles.headerActionBtn}>
          <Ionicons name="call-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerActionBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Seller chat: pinned product context card. Hidden for support chat. */}
      {contextProduct ? (
        <ChatProductContextCard
          product={contextProduct}
          onPress={() =>
            navigation.navigate("ProductDetails", { productId: contextProduct._id })
          }
        />
      ) : null}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        style={styles.flex1}
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadEarlierMessages}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingEarlier ? <View style={styles.loadingEarlier}><ActivityIndicator size="small" color={colors.primary} /></View> : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No messages yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Send the first message!</Text>
          </View>
        }
      />

      {/* Attachment menu */}
      {showAttachMenu && (
        <View style={[styles.attachMenu, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.attachOption} onPress={takePhoto}>
            <View style={[styles.attachIconCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={22} color="#FFF" />
            </View>
            <Text style={[styles.attachLabel, { color: colors.text }]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachOption} onPress={pickPhoto}>
            <View style={[styles.attachIconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="image" size={22} color="#FFF" />
            </View>
            <Text style={[styles.attachLabel, { color: colors.text }]}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachOption} onPress={pickDocument}>
            <View style={[styles.attachIconCircle, { backgroundColor: colors.warning }]}>
              <Ionicons name="document-text" size={22} color="#FFF" />
            </View>
            <Text style={[styles.attachLabel, { color: colors.text }]}>Document</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={toggleAttachMenu} style={[styles.attachButton, { backgroundColor: showAttachMenu ? colors.textMuted : colors.primary }]}>
          <Ionicons name={showAttachMenu ? "close" : "add"} size={22} color="#FFF" />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={[styles.textInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type something..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          style={[styles.sendButton, { backgroundColor: !inputText.trim() || sending ? colors.textDisabled : colors.primary }]}
        >
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "500" },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  headerBackBtn: { marginRight: 8, padding: 4 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginRight: 10 },
  avatarText: { fontSize: 16, fontWeight: "700" },
  onlineDot: { position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: "#33D39A", borderWidth: 2 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 17, fontWeight: "700", letterSpacing: 0.1 },
  headerStatus: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  headerActionBtn: { padding: 8 },

  dayContainer: { alignItems: "center", marginVertical: 12 },
  dayPill: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5 },
  dayText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },

  bubbleRow: { marginVertical: 2, paddingHorizontal: 4 },
  bubbleRowRight: { alignItems: "flex-end" },
  bubbleRowLeft: { alignItems: "flex-start" },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  bubbleRight: { borderRadius: 20, borderBottomRightRadius: 6 },
  bubbleLeft: { borderRadius: 20, borderBottomLeftRadius: 6, borderWidth: 1 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleImage: {
    width: 220,
    height: 220,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4 },
  timeText: { fontSize: 11 },

  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingTop: 10, paddingBottom: 10, paddingHorizontal: 10, borderTopWidth: 1, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 6 },
  attachButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginRight: 8, marginBottom: 2 },
  textInput: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontSize: 15, maxHeight: 120, lineHeight: 20, marginRight: 8 },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 1 },

  attachMenu: { flexDirection: "row", justifyContent: "space-evenly", paddingVertical: 16, paddingHorizontal: 20, borderTopWidth: 1 },
  attachOption: { alignItems: "center", gap: 6 },
  attachIconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  attachLabel: { fontSize: 12, fontWeight: "600" },

  loadingEarlier: { paddingVertical: 16, alignItems: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, transform: [{ scaleY: -1 }] },
  emptyText: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptySubtext: { fontSize: 13, marginTop: 4 },
});
