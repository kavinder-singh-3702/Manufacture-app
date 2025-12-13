/**
 * ChatInput Component
 *
 * A text input field with a send button for composing messages.
 *
 * HOW IT WORKS:
 * - User types a message in the text input
 * - When they press the send button, onSend is called with the message
 * - The input is cleared after sending
 * - Send button is disabled when input is empty or when loading
 */

import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";

type ChatInputProps = {
  onSend: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
};

export const ChatInput = ({ onSend, loading = false, placeholder = "Type a message..." }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { colors, spacing, radius } = useTheme();

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !loading) {
      onSend(trimmedMessage);
      setMessage(""); // Clear input after sending
    }
  };

  const canSend = message.trim().length > 0 && !loading;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      {/* Text Input */}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.background,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={1000}
          editable={!loading}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.8}
        style={styles.sendButton}
      >
        <LinearGradient
          colors={canSend ? ["#6C63FF", "#5248E6"] : ["#3A3D4A", "#2E3138"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.sendButtonGradient,
            { borderRadius: radius.md },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    marginBottom: 2,
  },
  sendButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
