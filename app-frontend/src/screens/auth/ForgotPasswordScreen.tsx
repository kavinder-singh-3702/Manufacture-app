import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { ResponsiveScreen } from "../../components/layout";
import { authService } from "../../services/auth.service";
import { ApiError } from "../../services/http";

type CredentialMode = "email" | "phone";

type ForgotPasswordScreenProps = {
  onBack: () => void;
  onReset: (token?: string) => void;
  onLogin: () => void;
};

export const ForgotPasswordScreen = ({ onBack, onReset, onLogin }: ForgotPasswordScreenProps) => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const { isCompact, isXCompact, contentPadding, clamp } = useResponsiveLayout();
  const isDark = resolvedMode === "dark";
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [credentialMode, setCredentialMode] = useState<CredentialMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const identifierValue = credentialMode === "email" ? email : phone;
  const identifierPlaceholder =
    credentialMode === "email" ? "Enter your account email" : "Enter your mobile number";

  const tokenHint = useMemo(() => {
    if (!devToken) return null;
    const expires = expiresAt ? new Date(expiresAt).toLocaleTimeString() : null;
    return expires ? `${devToken} (expires at ${expires})` : devToken;
  }, [devToken, expiresAt]);

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setDevToken(null);
    setExpiresAt(null);
    const trimmedIdentifier = identifierValue.trim();

    if (!trimmedIdentifier) {
      setError("Enter your email or phone first.");
      return;
    }

    try {
      setLoading(true);
      const payload =
        credentialMode === "email" ? { email: trimmedIdentifier } : { phone: trimmedIdentifier };
      const response = await authService.requestPasswordReset(payload);
      setMessage(response.message);
      if (response.resetToken) {
        setDevToken(response.resetToken);
      }
      if (response.expiresAt) {
        setExpiresAt(response.expiresAt);
      }
    } catch (requestError) {
      const messageText =
        requestError instanceof ApiError
          ? requestError.message
          : requestError instanceof Error
          ? requestError.message
          : "Unable to request a reset code.";
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
        <View style={[styles.blob, styles.blobIndigo]} />
        <View style={[styles.blob, styles.blobMint]} />

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
          <Text style={[styles.heading, { fontSize: clamp(isXCompact ? 24 : 28, 22, 28) }]}>Forgot Password?</Text>
          <Text style={styles.subheading}>
            We will send a reset code to your email or phone. In dev builds you will see the code
            here directly.
          </Text>
        </View>

        <View style={styles.toggleWrap}>
          {(["email", "phone"] as CredentialMode[]).map((mode) => {
            const isActive = credentialMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.toggleButton, isActive ? styles.toggleButtonActive : null]}
                onPress={() => setCredentialMode(mode)}
              >
                <Text style={[styles.toggleText, isActive ? styles.toggleTextActive : null]}>
                  {mode === "email" ? "Use email" : "Use mobile"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.input}
          placeholder={identifierPlaceholder}
          placeholderTextColor={colors.textTertiary}
          value={identifierValue}
          onChangeText={(value) => (credentialMode === "email" ? setEmail(value) : setPhone(value))}
          keyboardType={credentialMode === "email" ? "email-address" : "phone-pad"}
          autoCapitalize="none"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? (
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>Check your inbox</Text>
            <Text style={styles.calloutText}>{message}</Text>
            {tokenHint ? (
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenLabel}>Dev reset token</Text>
                <Text selectable style={styles.tokenValue}>
                  {tokenHint}
                </Text>
                <TouchableOpacity style={styles.resetButton} onPress={() => onReset(devToken ?? "")}>
                  <Text style={styles.resetButtonText}>Use this token to reset</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onLogin} style={styles.helperLink}>
          <Text style={styles.helperText}>Remembered it? Back to login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onReset(devToken ?? undefined)} style={styles.helperLink}>
          <Text style={styles.helperText}>Already have a token? Reset now</Text>
        </TouchableOpacity>
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
    borderRadius: 300,
  },
  blobIndigo: {
    width: 320,
    height: 320,
    backgroundColor: isDark ? colors.badgePrimary : "#EEF2FF",
    top: -80,
    right: -120,
  },
  blobMint: {
    width: 220,
    height: 220,
    backgroundColor: isDark ? colors.badgeSuccess : "#E0F7EF",
    bottom: -60,
    left: -90,
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
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 28,
    padding: 4,
    marginBottom: 18,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 24,
  },
  toggleButtonActive: {
    backgroundColor: colors.text,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.textInverse,
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
    marginTop: 18,
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
    marginTop: 12,
    alignItems: "center",
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: colors.error,
    marginTop: 8,
    marginBottom: 4,
  },
  callout: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + "33",
    backgroundColor: colors.badgePrimary,
    padding: 14,
  },
  calloutTitle: {
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  calloutText: {
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tokenBadge: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  tokenLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  tokenValue: {
    color: colors.text,
    fontSize: 14,
    marginTop: 4,
  },
  resetButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: "center",
  },
  resetButtonText: {
    color: colors.textOnAccent,
    fontWeight: "700",
  },
  });
