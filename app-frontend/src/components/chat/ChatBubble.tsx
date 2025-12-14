/**
 * ChatBubble Component
 *
 * Displays a single chat message as a bubble.
 *
 * HOW IT WORKS:
 * - Takes a message and whether it's from "me" (the current user)
 * - If isMe=true: bubble is on the RIGHT side with a colored background
 * - If isMe=false: bubble is on the LEFT side with a gray background
 * - Shows the sender name (for group chats or clarity)
 * - Shows the timestamp in a readable format
 */

import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";
import type { ChatMessage } from "../../types/chat";

type ChatBubbleProps = {
  message: ChatMessage;
  isMe: boolean; // Is this message from the current user?
};

// Helper to format timestamp nicely
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  // For older messages, show the date
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

export const ChatBubble = ({ message, isMe }: ChatBubbleProps) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={[styles.container, isMe ? styles.containerMe : styles.containerOther]}>
      {/* Sender name (shown for messages from others) */}
      {!isMe && (
        <Text style={[styles.senderName, { color: colors.primary }]}>
          {message.senderName}
        </Text>
      )}

      {/* Message bubble */}
      {isMe ? (
        // My message - gradient background
        <LinearGradient
          colors={["#6C63FF", "#5248E6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.bubble,
            styles.bubbleMe,
            { borderRadius: radius.md },
          ]}
        >
          <Text style={[styles.messageText, styles.messageTextMe]}>
            {message.content}
          </Text>
        </LinearGradient>
      ) : (
        // Other's message - dark background
        <View
          style={[
            styles.bubble,
            styles.bubbleOther,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.messageText, { color: colors.text }]}>
            {message.content}
          </Text>
        </View>
      )}

      {/* Timestamp */}
      <Text
        style={[
          styles.timestamp,
          isMe ? styles.timestampMe : styles.timestampOther,
          { color: colors.textMuted },
        ]}
      >
        {formatTime(message.timestamp)}
        {message.read && isMe && " ✓"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  containerMe: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  containerOther: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  bubbleMe: {
    borderTopRightRadius: 4,
  },
  bubbleOther: {
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: "#FFFFFF",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  timestampMe: {
    marginRight: 4,
  },
  timestampOther: {
    marginLeft: 8,
  },
});
