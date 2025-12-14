import { useEffect, useState } from "react";
import { SafeAreaView, View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./LoginScreen";
import { SignupScreen } from "./SignupScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { ResetPasswordScreen } from "./ResetPasswordScreen";
import { useAuth } from "../../hooks/useAuth";
import { AuthView } from "../../types/auth";

export const AuthScreen = () => {
  const { bootstrapError, setUser, authView, clearAuthView } = useAuth();
  const [view, setView] = useState<AuthView>(authView ?? "intro");
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (authView) {
      setView(authView);
      clearAuthView();
    }
  }, [authView, clearAuthView]);

  const handleGuestAccess = () => {
    setUser({
      id: "guest",
      email: "guest@manufacture.app",
      displayName: "Guest Explorer",
      role: "guest",
    });
  };

  return (
    <LinearGradient
      colors={["#0F1115", "#101318", "#0F1115"]}
      locations={[0, 0.5, 1]}
      style={styles.safeArea}
    >
      {/* Royal Indigo glow - top left */}
      <LinearGradient
        colors={["rgba(108, 99, 255, 0.15)", "rgba(108, 99, 255, 0.05)", "transparent"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Muted Salmon glow - bottom right */}
      <LinearGradient
        colors={["transparent", "rgba(255, 140, 60, 0.08)", "rgba(255, 140, 60, 0.12)"]}
        locations={[0, 0.6, 1]}
        start={{ x: 0.3, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <View style={styles.slideWrapper}>
          {view === "intro" ? (
            <IntroPanel onJoin={() => setView("signup")} onSkip={handleGuestAccess} />
          ) : null}
          {view === "login" ? (
            <LoginScreen
              onBack={() => setView("intro")}
              onSignup={() => setView("signup")}
              onForgot={() => setView("forgot")}
            />
          ) : null}
          {view === "signup" ? (
            <SignupScreen onBack={() => setView("login")} onLogin={() => setView("login")} />
          ) : null}
          {view === "forgot" ? (
            <ForgotPasswordScreen
              onBack={() => setView("login")}
              onReset={(token) => {
                if (token) {
                  setResetToken(token);
                }
                setView("reset");
              }}
              onLogin={() => setView("login")}
            />
          ) : null}
          {view === "reset" ? (
            <ResetPasswordScreen
              onBack={() => setView("forgot")}
              onLogin={() => setView("login")}
              defaultToken={resetToken}
              onSuccess={() => setView("intro")}
            />
          ) : null}
        </View>

        {bootstrapError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Environment issue</Text>
            <Text style={styles.errorText}>
              {bootstrapError}. Ensure EXPO_PUBLIC_API_URL points to your backend (e.g., http://192.168.x.x:4000/api).
            </Text>
          </View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
};

type IntroPanelProps = {
  onJoin: () => void;
  onSkip: () => void;
};

const IntroPanel = ({ onJoin, onSkip }: IntroPanelProps) => {
  return (
    <View style={styles.slideCard}>
      <View style={styles.cardTopRow}>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.illustrationArea}>
        {/* Indigo gradient blob */}
        <LinearGradient
          colors={["rgba(108, 99, 255, 0.4)", "rgba(108, 99, 255, 0.1)"]}
          style={[styles.blob, styles.blueBlob]}
        />
        <View style={[styles.imagePlaceholderLarge, styles.imageShadow]}>
          <Text style={styles.imageLabel}>IMAGE</Text>
        </View>
        <View style={[styles.imagePlaceholderSmall, styles.imageShadow]}>
          <Text style={styles.imageLabelSmall}>IMG</Text>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.introHeading}>Let&apos;s Get Started</Text>
        <Text style={styles.introSubheading}>Grow Together</Text>
      </View>

      <LinearGradient
        colors={["#6C63FF", "#5248E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primaryButton, { marginTop: 40 }]}
      >
        <TouchableOpacity onPress={onJoin} style={styles.primaryButtonInner}>
          <Text style={styles.primaryButtonText}>JOIN NOW</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1115",
  },
  slideWrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
    alignItems: "stretch",
  },
  slideCard: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 32,
    paddingVertical: 32,
    position: "relative",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  skipButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  illustrationArea: {
    width: "100%",
    height: 260,
    justifyContent: "center",
    alignItems: "center",
  },
  blob: {
    position: "absolute",
    borderRadius: 200,
  },
  blueBlob: {
    width: 220,
    height: 220,
    top: 0,
    left: -20,
  },
  imagePlaceholderLarge: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(30, 33, 39, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(108, 99, 255, 0.3)",
  },
  imagePlaceholderSmall: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(30, 33, 39, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 16,
    right: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 140, 60, 0.3)",
  },
  imageShadow: {
    shadowColor: "#6C63FF",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
  },
  imageLabelSmall: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
  },
  introHeading: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#FFFFFF",
  },
  introSubheading: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 8,
    textAlign: "center",
  },
  primaryButton: {
    borderRadius: 40,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 50,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1.5,
  },
  errorBanner: {
    marginTop: 24,
    marginHorizontal: 24,
    width: "85%",
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.4)",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 16,
    alignSelf: "center",
  },
  errorTitle: {
    fontWeight: "700",
    color: "#FF6B6B",
    marginBottom: 4,
  },
  errorText: {
    color: "rgba(255, 107, 107, 0.8)",
    lineHeight: 18,
  },
});
