import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";

type CredentialMode = "email" | "phone";

type LoginScreenProps = {
  onBack: () => void;
  onSignup: () => void;
};

export const LoginScreen = ({ onBack, onSignup }: LoginScreenProps) => {
  const { login } = useAuth();
  const [credentialMode, setCredentialMode] = useState<CredentialMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const identifierValue = credentialMode === "email" ? email : phone;
  const identifierPlaceholder =
    credentialMode === "email" ? "Enter Email Id" : "Enter Mobile Number";

  const handleLogin = async () => {
    setError(null);
    const trimmedIdentifier = identifierValue.trim();
    const trimmedPassword = password.trim();
    if (!trimmedIdentifier || !trimmedPassword) {
      setError("Fill in your credentials to continue");
      return;
    }

    try {
      setLoading(true);
      if (credentialMode === "email") {
        await login({ email: trimmedIdentifier, password: trimmedPassword, remember: true });
      } else {
        await login({ phone: trimmedIdentifier, password: trimmedPassword, remember: true });
      }
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Unable to login";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderIdentifierToggle = () => (
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
              {mode === "email" ? "Email" : "Mobile"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderIdentifierInput = () => (
    <TextInput
      style={styles.input}
      placeholder={identifierPlaceholder}
      placeholderTextColor="#888"
      value={identifierValue}
      onChangeText={(value) => (credentialMode === "email" ? setEmail(value) : setPhone(value))}
      keyboardType={credentialMode === "email" ? "email-address" : "phone-pad"}
      autoCapitalize="none"
    />
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.slide}
    >
      <View style={styles.card}>
        <View style={[styles.blob, styles.blobPrimary]} />
        <View style={[styles.blob, styles.blobSecondary]} />

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <Text style={styles.heading}>Welcome Back!</Text>
          <Text style={styles.subheading}>Enter your email or mobile number to continue</Text>
        </View>

        {renderIdentifierToggle()}

        <View style={styles.form}>
          {renderIdentifierInput()}
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              accessibilityLabel={`${showPassword ? "Hide" : "Show"} password`}
            >
              <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>LOGIN</Text>}
          </TouchableOpacity>

          <Text style={styles.helperText}>Forgotten Password?</Text>
          <TouchableOpacity onPress={onSignup}>
            <Text style={styles.helperText}>Or Create a New Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  card: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
    position: "relative",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 200,
  },
  blobPrimary: {
    width: 320,
    height: 320,
    backgroundColor: "#E8F8E5",
    bottom: -60,
    right: -60,
  },
  blobSecondary: {
    width: 240,
    height: 240,
    backgroundColor: "#DAF5D4",
    bottom: 120,
    left: -80,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111",
  },
  headerBlock: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },
  subheading: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  toggleWrap: {
    flexDirection: "row",
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 28,
    paddingVertical: 12,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#111",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#111",
  },
  form: {
    flex: 1,
    marginTop: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#C4C4C4",
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
  },
  passwordWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeButton: {
    position: "absolute",
    right: 0,
    top: 8,
    padding: 8,
  },
  eyeText: {
    fontWeight: "600",
    color: "#111",
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#000",
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  helperText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 12,
    fontSize: 13,
  },
  errorText: {
    color: "#DC2626",
    marginBottom: 8,
    textAlign: "center",
  },
});
