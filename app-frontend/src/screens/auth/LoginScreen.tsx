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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../hooks/useAuth";

type CredentialMode = "email" | "phone";

type LoginScreenProps = {
  onBack: () => void;
  onSignup: () => void;
  onForgot: () => void;
};

export const LoginScreen = ({ onBack, onSignup, onForgot }: LoginScreenProps) => {
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
            {isActive ? (
              <LinearGradient
                colors={["#6C63FF", "#5248E6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.toggleButtonGradient}
              >
                <Text style={styles.toggleTextActive}>
                  {mode === "email" ? "Email" : "Mobile"}
                </Text>
              </LinearGradient>
            ) : (
              <Text style={styles.toggleText}>
                {mode === "email" ? "Email" : "Mobile"}
              </Text>
            )}
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Indigo glow blob */}
          <LinearGradient
            colors={["rgba(108, 99, 255, 0.25)", "rgba(108, 99, 255, 0.05)", "transparent"]}
            style={[styles.blob, styles.blobPrimary]}
          />
          {/* Salmon glow blob */}
          <LinearGradient
            colors={["rgba(255, 140, 60, 0.2)", "rgba(255, 140, 60, 0.05)", "transparent"]}
            style={[styles.blob, styles.blobSecondary]}
          />

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
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
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

            <TouchableOpacity style={styles.primaryButtonWrapper} onPress={handleLogin} disabled={loading}>
              <LinearGradient
                colors={["#6C63FF", "#5248E6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>LOGIN</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onForgot} style={styles.helperLink}>
              <Text style={styles.helperText}>Forgotten your password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSignup}>
              <Text style={[styles.helperText, styles.signupLink]}>Or Create a New Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
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
    bottom: -60,
    right: -60,
  },
  blobSecondary: {
    width: 240,
    height: 240,
    bottom: 120,
    left: -80,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerBlock: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subheading: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  toggleWrap: {
    flexDirection: "row",
    borderRadius: 32,
    backgroundColor: "rgba(30, 33, 39, 0.8)",
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  toggleButton: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  toggleButtonActive: {
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButtonGradient: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 28,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    paddingVertical: 12,
  },
  toggleTextActive: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  form: {
    flex: 1,
    marginTop: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 18,
    color: "#FFFFFF",
    backgroundColor: "rgba(22, 24, 29, 0.9)",
  },
  passwordWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeButton: {
    position: "absolute",
    right: 8,
    top: 8,
    padding: 8,
  },
  eyeText: {
    fontWeight: "600",
    color: "#6C63FF",
  },
  primaryButtonWrapper: {
    marginTop: 12,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButton: {
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1.5,
  },
  helperText: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 16,
    fontSize: 13,
  },
  signupLink: {
    color: "#6C63FF",
    fontWeight: "600",
  },
  helperLink: {
    alignItems: "center",
  },
  errorText: {
    color: "#FF6B6B",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
});
