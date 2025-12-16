import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";
import { BrandMark } from "./BrandMark";

type AnimatedSplashScreenProps = {
  onFinish: () => void;
};

/**
 * AnimatedSplashScreen - Netflix-inspired launch experience.
 *
 * The native splash covers load time; this screen handles the branded moment
 * before handing off to the app navigator.
 */
export const AnimatedSplashScreen = ({ onFinish }: AnimatedSplashScreenProps) => {
  const { colors } = useTheme();
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const beamProgress = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const beamTranslate = useMemo(
    () =>
      beamProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-220, 220],
      }),
    [beamProgress]
  );

  const glowScale = useMemo(
    () =>
      glowPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1.18],
      }),
    [glowPulse]
  );

  const glowOpacity = useMemo(
    () =>
      glowPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.28, 0.6],
      }),
    [glowPulse]
  );

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const beamAnimation = Animated.loop(
      Animated.timing(beamProgress, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    beamAnimation.start();

    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 10,
          mass: 0.8,
          stiffness: 140,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(950),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => {
      pulseAnimation.stop();
      beamAnimation.stop();
    };
  }, [beamProgress, glowPulse, logoOpacity, logoScale, onFinish, screenOpacity]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: "#000000",
          opacity: screenOpacity,
        },
      ]}
    >
      <LinearGradient
        colors={["rgba(108,99,255,0.2)", "rgba(0,0,0,0.2)", "rgba(255,140,60,0.2)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.noiseLayer, { borderColor: colors.border }]} />

      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: colors.primaryGlow,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.lightBeam,
          {
            transform: [{ translateX: beamTranslate }, { rotate: "-18deg" }],
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(255,140,60,0)", "rgba(255,140,60,0.3)", "rgba(255,140,60,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.logoWrapper,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
      >
        <BrandMark />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    shadowColor: "#6C63FF",
    shadowOpacity: 0.35,
    shadowRadius: 46,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },
  lightBeam: {
    position: "absolute",
    width: 320,
    height: 520,
    opacity: 0.3,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  noiseLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    borderWidth: 1,
  },
});
