import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { ResponsiveScreen } from "../../components/layout";
import { authService } from "../../services/auth.service";
import { ApiError } from "../../services/http";

type ResetPasswordScreenProps = {
  onBack: () => void;
  onLogin: () => void;
  onSuccess?: () => void;
  defaultToken?: string;
};

export const ResetPasswordScreen = ({
  onBack,
  onLogin,
  onSuccess,
  defaultToken,
}: ResetPasswordScreenProps) => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const { isCompact, isXCompact, contentPadding, clamp } = useResponsiveLayout();
  const isDark = resolvedMode === "dark";
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { setUser } = useAuth();
  const [token, setToken] = useState(defaultToken ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReset = async () => {
    setError(null);
    setSuccess(null);
    const trimmedToken = token.trim();
    const trimmedPassword = password.trim();

    if (!trimmedToken || !trimmedPassword) {
      setError("Enter the reset token and a new password.");
      return;
    }

    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { user } = await authService.resetPassword({
        token: trimmedToken,
        password: trimmedPassword,
      });
      setUser(user);
      setSuccess("Password updated. You are now signed in.");
      onSuccess?.();
    } catch (resetError) {
      const messageText =
        resetError instanceof ApiError
          ? resetError.message
          : resetError instanceof Error
          ? resetError.message
          : "Unable to reset password.";
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveScreen
      scroll
      keyboardAware
      safeAreaEdges={["left", "right", "bottom"]}
      paddingHorizontal={contentPadding}
      contentContainerStyle={{ paddingTop: isCompact ? 12 : 20 }}
    >
      <View style={styles.slide}>
        <View style={[styles.card, { paddingHorizontal: isXCompact ? 18 : isCompact ? 22 : 28 }]}>
        <View style={[styles.blob, styles.blobAmber]} />
        <View style={[styles.blob, styles.blobCyan]} />

        <TouchableOpacity
          style={[
            styles.backButton,
            {
              width: isCompact ? 42 : 46,
              height: isCompact ? 42 : 46,
              borderRadius: isCompact ? 21 : 23,
            },
          ]}
          onPress={onBack}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <Text style={[styles.heading, { fontSize: clamp(isXCompact ? 24 : 28, 22, 28) }]}>Reset Password</Text>
          <Text style={styles.subheading}>
            Paste the reset token you received and choose a new password to get back in.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Reset token</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9fa2...b71"
            placeholderTextColor={colors.textTertiary}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 8 characters"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleReset} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.helperLink} onPress={onLogin}>
            <Text style={styles.helperText}>Back to login</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </ResponsiveScreen>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
  slide: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    backgroundColor: colors.surface,
    position: "relative",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 340,
  },
  blobAmber: {
    width: 300,
    height: 300,
    backgroundColor: isDark ? colors.badgeWarning : "#FEF3C7",
    top: -80,
    left: -120,
  },
  blobCyan: {
    width: 220,
    height: 220,
    backgroundColor: isDark ? colors.badgeInfo : "#ECFEFF",
    bottom: -80,
    right: -90,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  headerBlock: {
    marginBottom: 18,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  form: {
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  helperLink: {
    marginTop: 14,
    alignItems: "center",
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: colors.error,
    marginTop: 10,
  },
  successText: {
    color: colors.success,
    marginTop: 10,
  },
  });
