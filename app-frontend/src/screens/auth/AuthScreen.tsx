import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { motion } from "../../theme/motion";

export const AuthScreen = () => {
  const { bootstrapError, bootstrapWarning, setUser, authView, clearAuthView } = useAuth();
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const [view, setView] = useState<AuthView>(authView ?? "intro");
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (authView) {
      setView(authView);
      clearAuthView();
    }
  }, [authView, clearAuthView]);

  useEffect(() => {
    entryOpacity.setValue(0);
    entryTranslate.setValue(16);
    Animated.parallel([
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: motion.duration.medium,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entryTranslate, {
        toValue: 0,
        duration: motion.duration.medium,
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
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left", "right"]}>
        <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />

        {view !== "intro" ? (
          <View style={styles.brandRail}>
            <BrandLockup
              compact
              textColor={resolvedMode === "dark" ? colors.textOnDarkSurface : colors.textPrimary}
              subtitleColor={resolvedMode === "dark" ? colors.subtextOnDarkSurface : colors.subtextOnLightSurface}
            />
          </View>
        ) : null}

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
  const { resolvedMode } = useThemeMode();
  const { isCompact, isXCompact, clamp, fs, sp } = useResponsiveLayout();
  const isDark = resolvedMode === "dark";
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const orbAPulse = useRef(new Animated.Value(0)).current;
  const orbBPulse = useRef(new Animated.Value(0.35)).current;
  const beamProgress = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const ctaSheen = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const copyReveal = useRef(new Animated.Value(0)).current;
  const actionReveal = useRef(new Animated.Value(0)).current;

  const heroHeight = sp(isXCompact ? 200 : isCompact ? 220 : 250);
  const cardPaddingHorizontal = sp(isXCompact ? 18 : isCompact ? 22 : 28);

  const orbAScale = useMemo(
    () =>
      orbAPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.94, 1.08],
      }),
    [orbAPulse]
  );

  const orbBScale = useMemo(
    () =>
      orbBPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.96, 1.06],
      }),
    [orbBPulse]
  );

  const orbBOpacity = useMemo(
    () =>
      orbBPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [isDark ? 0.24 : 0.2, isDark ? 0.54 : 0.4],
      }),
    [isDark, orbBPulse]
  );

  const beamTranslate = useMemo(
    () =>
      beamProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-240, 260],
      }),
    [beamProgress]
  );

  const logoTranslate = useMemo(
    () =>
      logoFloat.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -6],
      }),
    [logoFloat]
  );

  const sheenTranslate = useMemo(
    () =>
      ctaSheen.interpolate({
        inputRange: [0, 1],
        outputRange: [-220, 220],
      }),
    [ctaSheen]
  );

  const copyTranslate = useMemo(
    () =>
      copyReveal.interpolate({
        inputRange: [0, 1],
        outputRange: [motion.distance.medium, 0],
      }),
    [copyReveal]
  );

  const actionTranslate = useMemo(
    () =>
      actionReveal.interpolate({
        inputRange: [0, 1],
        outputRange: [motion.distance.small, 0],
      }),
    [actionReveal]
  );

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotionEnabled(enabled);
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotionEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotionEnabled) {
      orbAPulse.setValue(0.45);
      orbBPulse.setValue(0.45);
      beamProgress.setValue(0);
      logoFloat.setValue(0);
      ctaSheen.setValue(0);
      copyReveal.setValue(1);
      actionReveal.setValue(1);
      return;
    }

    orbAPulse.setValue(0);
    orbBPulse.setValue(0.35);
    beamProgress.setValue(0);
    logoFloat.setValue(0);
    ctaSheen.setValue(0);
    copyReveal.setValue(0);
    actionReveal.setValue(0);

    const orbAAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(orbAPulse, {
          toValue: 1,
          duration: motion.duration.ambient,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(orbAPulse, {
          toValue: 0,
          duration: motion.duration.ambient,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const orbBAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(420),
        Animated.timing(orbBPulse, {
          toValue: 1,
          duration: motion.duration.ambientLong,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(orbBPulse, {
          toValue: 0,
          duration: motion.duration.ambientLong,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const beamAnimation = Animated.loop(
      Animated.timing(beamProgress, {
        toValue: 1,
        duration: motion.duration.ambient,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const logoAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const sheenAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaSheen, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(motion.delay.long + 980),
        Animated.timing(ctaSheen, {
          toValue: 0,
          duration: 1,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.sequence([
      Animated.timing(copyReveal, {
        toValue: 1,
        duration: motion.duration.medium,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(actionReveal, {
        toValue: 1,
        duration: motion.duration.normal,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    orbAAnimation.start();
    orbBAnimation.start();
    beamAnimation.start();
    logoAnimation.start();
    sheenAnimation.start();

    return () => {
      orbAAnimation.stop();
      orbBAnimation.stop();
      beamAnimation.stop();
      logoAnimation.stop();
      sheenAnimation.stop();
    };
  }, [actionReveal, beamProgress, copyReveal, ctaSheen, logoFloat, orbAPulse, orbBPulse, reduceMotionEnabled]);

  const handleJoinPressIn = () => {
    Animated.spring(ctaScale, {
      toValue: 0.97,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleJoinPressOut = () => {
    Animated.spring(ctaScale, {
      toValue: 1,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const headingColor = isDark ? colors.textOnDarkSurface : colors.textPrimary;
  const subheadingColor = isDark ? colors.subtextOnDarkSurface : colors.textSecondary;
  const glassCardBackground = isDark ? "rgba(18,25,35,0.58)" : "rgba(255,255,255,0.78)";
  const glassCardBorder = isDark ? "rgba(244,247,255,0.14)" : "rgba(15,23,36,0.12)";
  const ctaSheenTint = isDark ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.55)";
  const skipBackground = isDark ? "rgba(5,7,12,0.34)" : "rgba(255,255,255,0.52)";
  const skipBorder = isDark ? "rgba(244,247,255,0.16)" : "rgba(15,23,36,0.12)";
  const skipTextColor = isDark ? colors.textOnDarkSurface : colors.textPrimary;

  return (
    <View
      style={[
        styles.slideCard,
        {
          paddingHorizontal: cardPaddingHorizontal,
          paddingVertical: sp(isCompact ? 18 : 24),
        },
      ]}
    >
      <View pointerEvents="none" style={styles.ambientLayer}>
        <Animated.View
          style={[
            styles.ambientOrb,
            styles.ambientPrimary,
            {
              backgroundColor: colors.primary + (isDark ? "2f" : "22"),
              transform: [{ scale: reduceMotionEnabled ? 1 : orbAScale }],
              opacity: isDark ? 0.82 : 0.62,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ambientOrb,
            styles.ambientAccent,
            {
              backgroundColor: colors.accent + (isDark ? "2b" : "20"),
              transform: [{ scale: reduceMotionEnabled ? 1 : orbBScale }],
              opacity: reduceMotionEnabled ? (isDark ? 0.36 : 0.28) : orbBOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.beamSweep,
            {
              transform: [{ translateX: reduceMotionEnabled ? 0 : beamTranslate }, { rotate: "-17deg" }],
              opacity: isDark ? 0.42 : 0.3,
            },
          ]}
        >
          <LinearGradient
            colors={["transparent", colors.primary + (isDark ? "7a" : "4d"), "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      <View
        style={[
          styles.glassCard,
          {
            backgroundColor: glassCardBackground,
            borderColor: glassCardBorder,
            shadowColor: isDark ? colors.primary : "#0f1724",
            paddingHorizontal: cardPaddingHorizontal,
            paddingVertical: sp(isCompact ? 20 : 26),
          },
        ]}
      >
        <View style={[styles.illustrationArea, { height: heroHeight }]}>
          <LinearGradient
            colors={[colors.primary + (isDark ? "4d" : "38"), "transparent"]}
            style={[
              styles.heroHalo,
              {
                width: sp(isCompact ? 188 : 230),
                height: sp(isCompact ? 188 : 230),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.logoTile,
              styles.imageShadow,
              {
                backgroundColor: isDark ? "rgba(18,25,35,0.84)" : "rgba(245,249,255,0.92)",
                borderColor: colors.primary + (isDark ? "52" : "45"),
                width: sp(isXCompact ? 118 : isCompact ? 130 : 144),
                height: sp(isXCompact ? 118 : isCompact ? 130 : 144),
                transform: [{ translateY: reduceMotionEnabled ? 0 : logoTranslate }],
              },
            ]}
          >
            <Image source={BRAND_IMAGES.logo} style={styles.logoTileImage} />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.introCopy,
            { opacity: copyReveal, transform: [{ translateY: copyTranslate }] },
          ]}
        >
          <Text style={[styles.introHeading, { color: headingColor, fontSize: fs(isXCompact ? 25 : 32), lineHeight: fs(isXCompact ? 30 : 38) }]}>
            Welcome to {APP_NAME}
          </Text>
          <Text style={[styles.introSubheading, { color: subheadingColor, fontSize: fs(15), lineHeight: fs(21) }]}>Built for industrial trade and operations</Text>
          <View style={[styles.introAccentBar, { backgroundColor: colors.primary + (isDark ? "66" : "3f") }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonContainer,
            { opacity: actionReveal, transform: [{ translateY: actionTranslate }] },
          ]}
        >
          <Animated.View style={[styles.primaryButtonWrap, { transform: [{ scale: ctaScale }] }]}>
            <Pressable onPress={onJoin} onPressIn={handleJoinPressIn} onPressOut={handleJoinPressOut} style={styles.primaryButtonPressable}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.primaryButton, { shadowColor: colors.primary }]}
              >
                {reduceMotionEnabled ? null : (
                  <Animated.View pointerEvents="none" style={[styles.ctaSheen, { transform: [{ translateX: sheenTranslate }] }]}>
                    <LinearGradient
                      colors={["transparent", ctaSheenTint, "transparent"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                )}
                <Text style={[styles.primaryButtonText, { color: colors.textOnPrimary, fontSize: fs(16) }]}>JOIN NOW</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Pressable
            style={({ pressed }) => [
              styles.skipButton,
              {
                backgroundColor: skipBackground,
                borderColor: skipBorder,
              },
              pressed ? styles.skipButtonPressed : null,
            ]}
            onPress={onSkip}
          >
            <Text style={[styles.skipText, { color: skipTextColor, fontSize: fs(14) }]}>Skip</Text>
          </Pressable>
        </Animated.View>
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
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientOrb: {
    position: "absolute",
    borderRadius: 320,
  },
  ambientPrimary: {
    width: 320,
    height: 320,
    top: -80,
    left: -124,
  },
  ambientAccent: {
    width: 280,
    height: 280,
    bottom: -118,
    right: -94,
  },
  beamSweep: {
    position: "absolute",
    width: 170,
    height: 560,
    top: -130,
    left: -130,
  },
  glassCard: {
    width: "92%",
    maxWidth: 480,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 14,
  },
  illustrationArea: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  heroHalo: {
    position: "absolute",
    borderRadius: 230,
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
  imageShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  introHeading: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  introSubheading: {
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 21,
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  introCopy: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  introAccentBar: {
    marginTop: 14,
    width: 86,
    height: 4,
    borderRadius: 999,
  },
  buttonContainer: {
    marginTop: 28,
    alignItems: "center",
    width: "100%",
  },
  primaryButtonWrap: {
    width: "85%",
    maxWidth: 320,
  },
  primaryButtonPressable: {
    width: "100%",
  },
  primaryButton: {
    borderRadius: 40,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 10,
  },
  ctaSheen: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 120,
  },
  primaryButtonText: {
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1.6,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 22,
    borderWidth: 1,
  },
  skipButtonPressed: {
    opacity: 0.82,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
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
