import { useEffect, useState } from "react";
import { SafeAreaView, View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./LoginScreen";
import { SignupScreen } from "./SignupScreen";
import { useAuth } from "../../hooks/useAuth";
import { AuthView } from "../../types/auth";

export const AuthScreen = () => {
  const { bootstrapError, setUser, authView, clearAuthView } = useAuth();
  const [view, setView] = useState<AuthView>(authView ?? "intro");

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.slideWrapper}>
        {view === "intro" ? (
          <IntroPanel onJoin={() => setView("signup")} onSkip={handleGuestAccess} />
        ) : null}
        {view === "login" ? (
          <LoginScreen onBack={() => setView("intro")} onSignup={() => setView("signup")} />
        ) : null}
        {view === "signup" ? (
          <SignupScreen onBack={() => setView("login")} onLogin={() => setView("login")} />
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
        <View style={[styles.blob, styles.blueBlob]} />
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

      <TouchableOpacity style={[styles.primaryButton, { marginTop: 40 }]} onPress={onJoin}>
        <Text style={styles.primaryButtonText}>JOIN NOW</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  slideWrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
    alignItems: "stretch",
  },
  slideCard: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
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
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3C3C43",
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
    backgroundColor: "#E7ECFF",
    top: 0,
    left: -20,
  },
  imagePlaceholderLarge: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  imagePlaceholderSmall: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 16,
    right: 30,
    borderWidth: 4,
    borderColor: "#fff",
  },
  imageShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  imageLabelSmall: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  introHeading: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#0C0C0C",
  },
  introSubheading: {
    fontSize: 16,
    color: "#4B5563",
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#000",
    borderRadius: 40,
    paddingVertical: 14,
    paddingHorizontal: 50,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  errorBanner: {
    marginTop: 24,
    width: "85%",
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(214, 69, 80, 0.4)",
    backgroundColor: "rgba(214, 69, 80, 0.1)",
    padding: 16,
  },
  errorTitle: {
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: 4,
  },
  errorText: {
    color: "#7F1D1D",
    lineHeight: 18,
  },
});
