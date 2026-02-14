import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./LoginScreen";
import { SignupScreen } from "./SignupScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { ResetPasswordScreen } from "./ResetPasswordScreen";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { AuthView } from "../../types/auth";
import { BrandLockup } from "../../components/brand/BrandLockup";
import { APP_NAME, BRAND_IMAGES, GUEST_EMAIL } from "../../constants/brand";

export const AuthScreen = () => {
  const { bootstrapError, bootstrapWarning, setUser, authView, clearAuthView } = useAuth();
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const [view, setView] = useState<AuthView>(authView ?? "intro");
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryTranslate = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (authView) {
      setView(authView);
      clearAuthView();
    }
  }, [authView, clearAuthView]);

  useEffect(() => {
    entryOpacity.setValue(0);
    entryTranslate.setValue(18);
    Animated.parallel([
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entryTranslate, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [entryOpacity, entryTranslate, view]);

  const handleGuestAccess = () => {
    setUser({
      id: "guest",
      email: GUEST_EMAIL,
      displayName: "Guest Explorer",
      role: "guest",
    });
  };

  const backgroundGradient = useMemo(
    () => [colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd] as const,
    [colors.surfaceCanvasEnd, colors.surfaceCanvasMid, colors.surfaceCanvasStart]
  );

  return (
    <LinearGradient colors={backgroundGradient} locations={[0, 0.5, 1]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.surfaceOverlayPrimary, colors.surfaceOverlayPrimary.replace("0.1", "0.04").replace("0.12", "0.04"), "transparent"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", colors.surfaceOverlayAccent, "transparent"]}
        locations={[0, 0.6, 1]}
        start={{ x: 0.3, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />

        <View style={styles.brandRail}>
          <BrandLockup compact textColor={colors.textOnDarkSurface} subtitleColor={colors.subtextOnDarkSurface} />
        </View>

        <Animated.View
          style={[
            styles.slideWrapper,
            {
              opacity: entryOpacity,
              transform: [{ translateY: entryTranslate }],
            },
          ]}
        >
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
        </Animated.View>

        {bootstrapWarning && !bootstrapError ? (
          <View style={[styles.warningBanner, { borderColor: colors.warning + "4d", backgroundColor: colors.warningBg }]}>
            <Text style={[styles.warningText, { color: colors.warningLight }]}>{bootstrapWarning}</Text>
          </View>
        ) : null}

        {bootstrapError ? (
          <View style={[styles.errorBanner, { borderColor: colors.error + "66", backgroundColor: colors.error + "1a" }]}>
            <Text style={[styles.errorTitle, { color: colors.error }]}>Environment issue</Text>
            <Text style={[styles.errorText, { color: colors.errorLight }]}>{bootstrapError}</Text>
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
  const { colors } = useTheme();
  const { isCompact, isXCompact, clamp } = useResponsiveLayout();

  return (
    <View
      style={[
        styles.slideCard,
        {
          paddingHorizontal: isXCompact ? 18 : isCompact ? 22 : 32,
          paddingVertical: isCompact ? 22 : 32,
          justifyContent: isCompact ? "flex-start" : "center",
        },
      ]}
    >
      <View style={styles.illustrationArea}>
        <LinearGradient
          colors={[colors.primary + "66", colors.primary + "1a"]}
          style={[
            styles.blob,
            styles.blueBlob,
            {
              width: isCompact ? 180 : 220,
              height: isCompact ? 180 : 220,
            },
          ]}
        />
        <View
          style={[
            styles.logoTile,
            styles.imageShadow,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.primary + "4d",
              width: isXCompact ? 120 : isCompact ? 132 : 146,
              height: isXCompact ? 120 : isCompact ? 132 : 146,
            },
          ]}
        >
          <Image source={BRAND_IMAGES.logo} style={styles.logoTileImage} />
        </View>
        <View
          style={[
            styles.wordmarkTile,
            styles.imageShadow,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.accent + "55",
              width: isXCompact ? 156 : isCompact ? 170 : 182,
              height: isXCompact ? 54 : isCompact ? 58 : 62,
            },
          ]}
        >
          <Image source={BRAND_IMAGES.wordmark} style={styles.wordmarkImage} />
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={[styles.introHeading, { color: colors.textOnDarkSurface, fontSize: clamp(isXCompact ? 24 : 30, 22, 30) }]}>
          Welcome to {APP_NAME}
        </Text>
        <Text style={[styles.introSubheading, { color: colors.subtextOnDarkSurface }]}>Built for industrial trade and operations</Text>
      </View>

      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.primaryButton, { shadowColor: colors.primary }]}
        >
          <TouchableOpacity onPress={onJoin} style={styles.primaryButtonInner}>
            <Text style={[styles.primaryButtonText, { color: colors.textOnPrimary }]}>JOIN NOW</Text>
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity style={[styles.skipButton, { backgroundColor: colors.overlayLight }]} onPress={onSkip}>
          <Text style={[styles.skipText, { color: colors.textOnDarkSurface }]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  brandRail: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
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
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    marginTop: 40,
    alignItems: "center",
    width: "100%",
  },
  skipButton: {
    padding: 10,
    borderRadius: 20,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.85,
  },
  illustrationArea: {
    width: "100%",
    height: 220,
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
  logoTile: {
    width: 146,
    height: 146,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    padding: 16,
  },
  logoTileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  wordmarkTile: {
    width: 182,
    height: 62,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 18,
    right: 24,
    borderWidth: 2,
    paddingHorizontal: 12,
  },
  wordmarkImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  imageShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  introHeading: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  introSubheading: {
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },
  primaryButton: {
    borderRadius: 40,
    overflow: "hidden",
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
    padding: 16,
    alignSelf: "center",
  },
  errorTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  errorText: {
    lineHeight: 18,
  },
  warningBanner: {
    marginTop: 16,
    marginHorizontal: 24,
    width: "85%",
    maxWidth: 380,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "center",
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
