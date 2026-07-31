import { useEffect, useMemo, useState } from "react";
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
import { OtpCodeInput } from "../../components/auth/OtpCodeInput";
import { authService } from "../../services/auth.service";
import { ApiError } from "../../services/http";

const CODE_LENGTH = 6;

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

type ResetPasswordScreenProps = {
  onBack: () => void;
  onLogin: () => void;
  onSuccess?: () => void;
  defaultEmail?: string;
  // Dev/staging only (or, once universal links ship, a real emailed link) —
  // when present, the screen skips the code UI entirely.
  defaultToken?: string;
};

export const ResetPasswordScreen = ({
  onBack,
  onLogin,
  onSuccess,
  defaultEmail,
  defaultToken,
}: ResetPasswordScreenProps) => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const { isCompact, isXCompact, contentPadding, clamp } = useResponsiveLayout();
  const isDark = resolvedMode === "dark";
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { setUser } = useAuth();

  const [token, setToken] = useState(defaultToken ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCountdownMs, setResendCountdownMs] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // defaultToken/defaultEmail are read at mount by useState above, but a
  // deep link arriving while this screen is already mounted (once universal
  // links are wired up) would otherwise be silently ignored — sync it in.
  useEffect(() => {
    if (defaultToken) setToken(defaultToken);
  }, [defaultToken]);
  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (resendCountdownMs <= 0) return undefined;
    const timeout = setTimeout(() => setResendCountdownMs((current) => Math.max(0, current - 1000)), 1000);
    return () => clearTimeout(timeout);
  }, [resendCountdownMs]);

  const isLinkMode = Boolean(token);
  const canResend = resendCountdownMs <= 0 && !resendLoading;

  const handleResend = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your account email to resend a code.");
      return;
    }
    try {
      setResendLoading(true);
      setError(null);
      const response = await authService.requestPasswordReset({ email: trimmedEmail });
      setSuccess("A fresh code is on its way to your inbox.");
      setResendCountdownMs(response.resendAvailableInMs ?? 0);
      setCode("");
      setCodeError(null);
    } catch (resendError) {
      const messageText =
        resendError instanceof ApiError
          ? resendError.message
          : resendError instanceof Error
          ? resendError.message
          : "Unable to resend the code.";
      setError(messageText);
    } finally {
      setResendLoading(false);
    }
  };

  const handleReset = async () => {
    setError(null);
    setSuccess(null);
    setCodeError(null);
    const trimmedPassword = password.trim();

    if (!trimmedPassword) {
      setError("Enter a new password.");
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

    if (!isLinkMode) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError("Enter your account email.");
        return;
      }
      if (code.length < CODE_LENGTH) {
        setError(`Enter the ${CODE_LENGTH}-digit code.`);
        return;
      }
    }

    try {
      setLoading(true);
      const { user } = isLinkMode
        ? await authService.resetPassword({ token: token.trim(), password: trimmedPassword })
        : await authService.resetPassword({ email: email.trim(), code, password: trimmedPassword });
      setUser(user);
      setSuccess("Password updated. You are now signed in.");
      onSuccess?.();
    } catch (resetError) {
      const status = resetError instanceof ApiError ? resetError.status : null;
      if (status === 410) {
        setCode("");
        setCodeError("That code expired. Request a fresh one below.");
      } else if (status === 429) {
        setCode("");
        setCodeError("Too many incorrect attempts. Request a fresh code below.");
      } else {
        const messageText =
          resetError instanceof ApiError
            ? resetError.message
            : resetError instanceof Error
            ? resetError.message
            : "Unable to reset password.";
        setError(messageText);
      }
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
            {isLinkMode
              ? "You're resetting via your emailed link — just choose a new password."
              : "Enter the code we emailed you, then choose a new password."}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLinkMode ? (
            <>
              <Text style={styles.label}>Account email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
              />

              <View style={styles.codeHeaderRow}>
                <Text style={styles.label}>Reset code</Text>
                <TouchableOpacity onPress={handleResend} disabled={!canResend}>
                  <Text style={[styles.resendText, !canResend ? styles.resendTextDisabled : null]}>
                    {canResend ? (resendLoading ? "Sending…" : "Resend code") : `Resend in ${formatCountdown(resendCountdownMs)}`}
                  </Text>
                </TouchableOpacity>
              </View>
              <OtpCodeInput
                value={code}
                onChange={(nextValue) => {
                  setCode(nextValue);
                  setCodeError(null);
                }}
                length={CODE_LENGTH}
                errorText={codeError || undefined}
                disabled={loading}
              />
            </>
          ) : null}

          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 8 characters"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
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
            autoComplete="new-password"
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
    // flexGrow (not flex:1) — see LoginScreen note. Prevents the card
    // from being compressed to viewport height so the ScrollView can
    // actually scroll in iPad landscape.
    flexGrow: 1,
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
  codeHeaderRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resendText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  resendTextDisabled: {
    color: colors.textTertiary,
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
