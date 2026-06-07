import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth.service";
import { RootStackParamList } from "../../navigation/types";

export const AddMobileNumberScreen = () => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();

  const [phone, setPhone] = useState(user?.phone || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = phone.trim();
    if (!/^[0-9+]{7,15}$/.test(trimmed)) {
      setError("Use 7-15 digits, optionally starting with +");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const updated = await authService.updatePhone(trimmed);
      setUser(updated);
      Alert.alert(
        "Saved",
        "Mobile number added to your account.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setError(err?.message || "Could not save mobile number. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Mobile Number</Text>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.iconCircle}>
                <Ionicons name="call" size={28} color={colors.primary} />
              </View>

              <Text style={styles.title}>Help us reach you</Text>
              <Text style={styles.subtitle}>
                Add a mobile number for order coordination, account recovery, and support. Our team may
                call this number to follow up on requests.
              </Text>

              <Text style={styles.label}>Mobile number *</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  setError(null);
                }}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={16}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : (
                <Text style={styles.helperText}>7-15 digits, optionally starting with +</Text>
              )}

              <TouchableOpacity
                style={[styles.submitButtonWrapper, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButton}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.textOnPrimary} />
                  ) : (
                    <Text style={styles.submitButtonText}>Save mobile number</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.skipButton}
                activeOpacity={0.7}
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 15,
    },
    headerBackButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backIcon: { fontSize: 26, fontWeight: "700", color: colors.text, marginLeft: -2 },
    headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text, letterSpacing: -0.5 },
    keyboardAvoid: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    content: { padding: 20 },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary + "18",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
      marginTop: 8,
    },
    title: { fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.3, marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },
    label: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 },
    input: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      backgroundColor: isDark ? "rgba(22, 24, 29, 0.9)" : colors.surface,
      marginBottom: 8,
    },
    inputError: { borderColor: colors.error },
    errorText: { fontSize: 12, fontWeight: "700", color: colors.error, marginBottom: 16 },
    helperText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 16 },
    submitButtonWrapper: {
      borderRadius: 14,
      overflow: "hidden",
      marginTop: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButton: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
    submitButtonText: {
      color: colors.textOnPrimary,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    skipButton: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
    skipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  });
