import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
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
    <View style={styles.slide}>
      <View style={styles.card}>
        <View style={[styles.blob, styles.blobAmber]} />
        <View style={[styles.blob, styles.blobCyan]} />

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.subheading}>
            Paste the reset token you received and choose a new password to get back in.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Reset token</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9fa2...b71"
            placeholderTextColor="#7C7C7C"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 8 characters"
            placeholderTextColor="#7C7C7C"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor="#7C7C7C"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleReset} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
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
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  card: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
    position: "relative",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 340,
  },
  blobAmber: {
    width: 360,
    height: 360,
    backgroundColor: "#FEF3C7",
    top: -100,
    left: -140,
  },
  blobCyan: {
    width: 300,
    height: 300,
    backgroundColor: "#ECFEFF",
    bottom: -120,
    right: -120,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: "600",
    color: "#0F172A",
  },
  headerBlock: {
    marginBottom: 18,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  subheading: {
    fontSize: 14,
    color: "#475569",
    marginTop: 6,
    lineHeight: 20,
  },
  form: {
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#0F172A",
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  helperLink: {
    marginTop: 14,
    alignItems: "center",
  },
  helperText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: "#DC2626",
    marginTop: 10,
  },
  successText: {
    color: "#047857",
    marginTop: 10,
  },
});
