import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
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
import { useTheme } from "../../hooks/useTheme";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { BrandLockup } from "../../components/brand/BrandLockup";

type CredentialMode = "email" | "phone";

type LoginScreenProps = {
  onBack: () => void;
  onSignup: () => void;
  onForgot: () => void;
};

export const LoginScreen = ({ onBack, onSignup, onForgot }: LoginScreenProps) => {
  const { login } = useAuth();
  const { colors } = useTheme();
  const { isCompact, isXCompact, contentPadding, clamp } = useResponsiveLayout();
  const [credentialMode, setCredentialMode] = useState<CredentialMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const headerIntro = useRef(new Animated.Value(0)).current;
  const formIntro = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  const identifierValue = credentialMode === "email" ? email : phone;
  const identifierPlaceholder =
    credentialMode === "email" ? "Enter Email Id" : "Enter Mobile Number";

  useEffect(() => {
    headerIntro.setValue(0);
    formIntro.setValue(0);
    Animated.stagger(90, [
      Animated.timing(headerIntro, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formIntro, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [formIntro, headerIntro]);

  const handleCtaPressIn = () => {
    Animated.spring(ctaScale, {
      toValue: 0.97,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handleCtaPressOut = () => {
    Animated.spring(ctaScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

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
    <View style={[styles.toggleWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
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
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.toggleButtonGradient}
              >
                <Text style={[styles.toggleTextActive, { color: colors.textOnPrimary }]}>
                  {mode === "email" ? "Email" : "Mobile"}
                </Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.toggleText, { color: colors.textMuted }]}>
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
      style={[styles.input, { borderColor: colors.border, color: colors.textOnDarkSurface, backgroundColor: colors.surfaceElevated }]}
      placeholder={identifierPlaceholder}
      placeholderTextColor={colors.textMuted}
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
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: contentPadding }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              paddingHorizontal: isXCompact ? 16 : isCompact ? 20 : 28,
              paddingTop: isCompact ? 22 : 32,
              paddingBottom: isCompact ? 28 : 40,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "2e", colors.primary + "0d", "transparent"]}
            style={[styles.blob, styles.blobPrimary]}
          />
          <LinearGradient
            colors={[colors.accent + "2e", colors.accent + "0d", "transparent"]}
            style={[styles.blob, styles.blobSecondary]}
          />

          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: colors.overlayLight,
                borderColor: colors.border,
                width: isCompact ? 42 : 48,
                height: isCompact ? 42 : 48,
                borderRadius: isCompact ? 21 : 24,
              },
            ]}
            onPress={onBack}
          >
            <Text style={[styles.backIcon, { color: colors.textOnDarkSurface }]}>‹</Text>
          </TouchableOpacity>

          <Animated.View
            style={{
              opacity: headerIntro,
              transform: [
                {
                  translateY: headerIntro.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            }}
          >
            <BrandLockup showSubtitle style={styles.brandStrip} textColor={colors.textOnDarkSurface} subtitleColor={colors.subtextOnDarkSurface} />
            <View style={styles.headerBlock}>
              <Text style={[styles.heading, { color: colors.textOnDarkSurface, fontSize: clamp(isXCompact ? 24 : 28, 22, 28) }]}>
                Welcome Back!
              </Text>
              <Text style={[styles.subheading, { color: colors.subtextOnDarkSurface }]}>
                Enter your email or mobile number to continue
              </Text>
            </View>
            {renderIdentifierToggle()}
          </Animated.View>

          <Animated.View
            style={[
              styles.form,
              {
                opacity: formIntro,
                transform: [
                  {
                    translateY: formIntro.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {renderIdentifierInput()}
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  {
                    borderColor: colors.border,
                    color: colors.textOnDarkSurface,
                    backgroundColor: colors.surfaceElevated,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
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
                <Text style={[styles.eyeText, { color: colors.primary }]}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Animated.View
              style={[
                styles.primaryButtonWrapper,
                {
                  shadowColor: colors.primary,
                  transform: [{ scale: ctaScale }],
                  opacity: loading ? 0.88 : 1,
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                onPressIn={handleCtaPressIn}
                onPressOut={handleCtaPressOut}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  {loading ? <ActivityIndicator color="#F4F7FF" /> : <Text style={styles.primaryButtonText}>LOGIN</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={onForgot} style={styles.helperLink}>
              <Text style={[styles.helperText, { color: colors.subtextOnDarkSurface }]}>Forgotten your password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSignup}>
              <Text style={[styles.helperText, styles.signupLink, { color: colors.primary }]}>Or Create a New Account</Text>
            </TouchableOpacity>
          </Animated.View>
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
    paddingHorizontal: 18,
  },
  card: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 28,
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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: "600",
  },
  brandStrip: {
    marginBottom: 12,
  },
  headerBlock: {
    marginBottom: 16,
    minWidth: 0,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
  },
  subheading: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    flexShrink: 1,
  },
  toggleWrap: {
    flexDirection: "row",
    borderRadius: 32,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  toggleButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
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
    paddingVertical: 12,
  },
  toggleTextActive: {
    fontSize: 14,
    fontWeight: "600",
  },
  form: {
    flex: 1,
    marginTop: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    right: 8,
    top: 8,
    padding: 8,
  },
  eyeText: {
    fontWeight: "600",
  },
  primaryButtonWrapper: {
    marginTop: 12,
    borderRadius: 32,
    overflow: "hidden",
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
    color: "#F4F7FF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1.5,
  },
  helperText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 13,
  },
  signupLink: {
    fontWeight: "600",
  },
  helperLink: {
    alignItems: "center",
  },
  errorText: {
    color: "#FF7B87",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
});
