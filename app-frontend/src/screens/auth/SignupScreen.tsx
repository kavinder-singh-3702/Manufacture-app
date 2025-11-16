import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

type SignupScreenProps = {
  onBack: () => void;
  onLogin: () => void;
};

export const SignupScreen = ({ onBack, onLogin }: SignupScreenProps) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSignup = () => {
    setError(null);
    setStatus(null);
    if (!email.trim() || !username.trim() || !password.trim()) {
      setError("Please fill every field.");
      return;
    }

    setStatus("Placeholder submission. Wire this button to your signup logic.");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.slide}
      keyboardVerticalOffset={32}
    >
      <View style={styles.card}>
        <View style={[styles.blob, styles.pinkBlobLarge]} />
        <View style={[styles.blob, styles.pinkBlobSmall]} />

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Create Account :)</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter Email Id"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Create Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Create Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {status ? <Text style={styles.statusText}>{status}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onLogin}>
          <Text style={styles.loginLink}>Already have an account? Login</Text>
        </TouchableOpacity>
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
  pinkBlobLarge: {
    width: 250,
    height: 250,
    backgroundColor: "#FFE0EB",
    top: -60,
    right: -30,
  },
  pinkBlobSmall: {
    width: 200,
    height: 200,
    backgroundColor: "#FFD1E1",
    bottom: -40,
    left: -50,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    marginBottom: 24,
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
  loginLink: {
    marginTop: 24,
    textAlign: "center",
    color: "#6B7280",
  },
  errorText: {
    color: "#DC2626",
    marginBottom: 8,
    textAlign: "center",
  },
  statusText: {
    color: "#10B981",
    marginBottom: 8,
    textAlign: "center",
  },
});
