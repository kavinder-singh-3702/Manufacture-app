import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { userService } from "../../services/user.service";
import { ApiError } from "../../services/http";
import { RootStackParamList } from "../../navigation/types";

/**
 * Apple App Store Guideline 5.1.1(v): the account-deletion flow must be
 * initiated from inside the app and must actually delete the account
 * (and associated personal data that isn't legally required to be
 * retained). This screen is that flow.
 *
 * Guardrails: user must type "DELETE" AND re-enter their password (if the
 * account has one). Apple-signin-only accounts skip the password step
 * because the app never sees an Apple password.
 */
export const DeleteAccountScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Apple-signin-only accounts have appleUserId but no verified email —
  // they never set a password, so we can't ask for one. Skip the field.
  const isAppleOnly = Boolean(user?.appleUserId) && !user?.emailVerifiedAt;

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (confirmText !== "DELETE") return false;
    if (!isAppleOnly && password.length < 1) return false;
    return true;
  }, [confirmText, isAppleOnly, password, submitting]);

  const handleDelete = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await userService.deleteAccount({
        confirm: "DELETE",
        password: isAppleOnly ? undefined : password,
      });
      toastSuccess("Account deleted", "Your account and personal data have been removed.");
      // Tear down local session so the app returns to the auth screen
      // cleanly. logout() also revokes server session + clears token.
      await logout();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Could not delete account. Please try again.";
      toastError("Deletion failed", message);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, isAppleOnly, logout, password, toastError, toastSuccess]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Delete Account</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.iconRing, { backgroundColor: colors.error + "18", borderColor: colors.error + "55" }]}>
            <Ionicons name="warning-outline" size={30} color={colors.error} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Delete your ARVANN account?</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            This is permanent. Your account will be signed out on all devices and cannot be recovered.
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>What gets deleted</Text>
            <BulletRow color={colors.textSecondary} label="Your name, email, phone, avatar, bio, and address" />
            <BulletRow color={colors.textSecondary} label="Your saved favorites, browsing history, and preferences" />
            <BulletRow color={colors.textSecondary} label="Push notifications registered to your devices" />
            <BulletRow color={colors.textSecondary} label="Your product listings are unpublished from the marketplace" />
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>What's retained (as required by law)</Text>
            <BulletRow color={colors.textSecondary} label="Past orders and invoices — kept for tax and audit compliance" />
            <BulletRow color={colors.textSecondary} label="Chat threads with other users — the other party retains their copy" />
            <BulletRow color={colors.textSecondary} label="Any company you own is not automatically deleted — remove or transfer it before deleting your account if you want it gone too" />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <Text style={[styles.label, { color: colors.text }]}>
              Type <Text style={{ fontWeight: "800", color: colors.error }}>DELETE</Text> to confirm
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="DELETE"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: confirmText === "DELETE" ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                },
              ]}
            />
          </View>

          {!isAppleOnly ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.label, { color: colors.text }]}>Re-enter your password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your current password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                  },
                ]}
              />
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Signed in with Apple</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                You signed in with Apple, so no password is required. Typing DELETE above is enough to confirm.
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleDelete}
            disabled={!canSubmit}
            activeOpacity={0.85}
            style={[
              styles.deleteBtn,
              {
                backgroundColor: canSubmit ? colors.error : colors.error + "55",
                borderRadius: radius.md,
                marginTop: spacing.xl,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <Text style={styles.deleteBtnText}>Delete my account</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={submitting}
            activeOpacity={0.85}
            style={[styles.cancelBtn, { borderColor: colors.border, borderRadius: radius.md, marginTop: spacing.md }]}
          >
            <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel — keep my account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const BulletRow = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.bulletRow}>
    <Text style={[styles.bulletDot, { color }]}>•</Text>
    <Text style={[styles.bulletText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  backHit: { flexDirection: "row", alignItems: "center", gap: 2, width: 60 },
  backText: { fontSize: 15, fontWeight: "700" },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  iconRing: {
    alignSelf: "flex-start",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "800", marginTop: 12 },
  subtitle: { fontSize: 14, fontWeight: "600", lineHeight: 20, marginTop: 6 },
  card: { borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  cardText: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 4 },
  bulletDot: { fontSize: 14, lineHeight: 18 },
  bulletText: { fontSize: 13, fontWeight: "600", lineHeight: 18, flex: 1 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  deleteBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  cancelBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700" },
});
