import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Keyboard,
  FlatList,
  TextInput,
  LayoutAnimation,
  UIManager,
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
import { getChatSocket, ChatMessageEvent } from "../../services/chatSocket";
import { useUnreadMessages } from "../../providers/UnreadMessagesProvider";
import type { RootStackParamList } from "../../navigation/types";
import type { ChatMessage } from "../../types/chat";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const { colors } = useTheme();
  const { user } = useAuth();
  const { refresh: refreshUnread } = useUnreadMessages();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChatScreenNavProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const { conversationId, recipientName, recipientPhone } = route.params;
  const currentUserId = useMemo(() => user?.id || "user-guest", [user]);

  // ─── Keyboard tracking ───
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      if (Platform.OS === "ios") {
        LayoutAnimation.configureNext(
          LayoutAnimation.create(e.duration || 250, LayoutAnimation.Types.keyboard, LayoutAnimation.Properties.opacity)
        );
      }
      setKeyboardHeight(e.endCoordinates.height);
    };

    const onHide = (e: any) => {
      if (Platform.OS === "ios") {
        LayoutAnimation.configureNext(
          LayoutAnimation.create(e?.duration || 250, LayoutAnimation.Types.keyboard, LayoutAnimation.Properties.opacity)
        );
      }
      setKeyboardHeight(0);
    };

    const sub1 = Keyboard.addListener(showEvent, onShow);
    const sub2 = Keyboard.addListener(hideEvent, onHide);
    return () => { sub1.remove(); sub2.remove(); };
  }, []);

  // When keyboard is open: bottom space = keyboard height
  // When keyboard is closed: bottom space = safe area bottom inset
  const bottomSpace = keyboardHeight > 0 ? keyboardHeight : insets.bottom;

  useEffect(() => {
    if (recipientPhone) setUserPhone(recipientPhone);
  }, [recipientPhone]);

  const toMessageItem = useCallback(
    (msg: ChatMessage): MessageItem => ({
      id: msg.id, text: msg.content, createdAt: new Date(msg.timestamp),
      senderId: msg.senderId, senderName: getSenderName(msg.senderRole),
      isMe: msg.senderId === currentUserId,
    }),
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
    const handle = (payload: ChatMessageEvent) => {
      if (payload.conversationId !== conversationId || payload.message.senderId === currentUserId) return;
      const incoming = toMessageItem(payload.message);
      setMessages((prev) => prev.some((m) => m.id === incoming.id) ? prev : dedupe([incoming, ...prev]));
      chatService.markRead(conversationId).then(() => refreshUnread()).catch(() => {});
    };
    (async () => {
      try { const s = await getChatSocket(); if (!isMounted) return; s.on("chat:message", handle); cleanup = () => s.off("chat:message", handle); }
      catch (e: any) { console.warn("Chat socket failed", e?.message); }
    })();
    return () => { isMounted = false; cleanup?.(); };
  }, [conversationId, currentUserId, toMessageItem]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    const oid = `opt-${Date.now()}`;
    setMessages((prev) => [{ id: oid, text, createdAt: new Date(), senderId: currentUserId, senderName: "User", isMe: true }, ...prev]);
    setInputText("");
    try {
      setSending(true);
      const res = await chatService.sendMessage(conversationId, text);
      const delivered = res?.message ? toMessageItem(res.message) : null;
      setMessages((prev) => { const f = prev.filter((m) => m.id !== oid); return delivered ? dedupe([delivered, ...f]) : f; });
      chatService.markRead(conversationId).then(() => refreshUnread()).catch(() => {});
    } catch { Alert.alert("Error", "Failed to send message."); setMessages((prev) => prev.filter((m) => m.id !== oid)); }
    finally { setSending(false); }
  }, [inputText, sending, conversationId, currentUserId, toMessageItem]);

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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName || asset.uri.split("/").pop() || "photo";
      // TODO: Upload file to server when API is ready
      Alert.alert("Photo Selected", `${name}\n\nFile upload will be available soon.`);
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
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName || "camera-photo";
      // TODO: Upload file to server when API is ready
      Alert.alert("Photo Captured", `${name}\n\nFile upload will be available soon.`);
    }
  };

  const pickDocument = async () => {
    setShowAttachMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // TODO: Upload file to server when API is ready
        Alert.alert("Document Selected", `${asset.name}\n\nFile upload will be available soon.`);
      }
    } catch {
      Alert.alert("Error", "Failed to pick document.");
    }
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
        <View style={[styles.bubble, item.isMe ? [styles.bubbleRight, { backgroundColor: colors.primary }] : [styles.bubbleLeft, { backgroundColor: colors.surface, borderColor: colors.border }]]}>
          <Text style={[styles.bubbleText, { color: item.isMe ? "#FFF" : colors.text }]}>{item.text}</Text>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: item.isMe ? "rgba(255,255,255,0.6)" : colors.textMuted }]}>{formatTime(item.createdAt)}</Text>
            {item.isMe && <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />}
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
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: bottomSpace }]}>
      {/* Status bar */}
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(recipientName || "U")}</Text>
          <View style={[styles.onlineDot, { borderColor: colors.surface }]} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>{recipientName}</Text>
          <Text style={[styles.headerStatus, { color: colors.success }]}>Active now</Text>
        </View>
        <TouchableOpacity onPress={handleCallUser} style={styles.headerActionBtn}>
          <Ionicons name="call-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerActionBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

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
