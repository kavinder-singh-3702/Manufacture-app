import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { APP_NAME } from "../../constants/brand";
import { BrandMark } from "./BrandMark";

type AnimatedSplashScreenProps = {
  onFinish: () => void;
};

/**
 * Custom branded splash shown right after native splash hand-off.
 * Sequence: ambient reveal -> logo reveal -> wordmark hold -> fade out.
 */
export const AnimatedSplashScreen = ({ onFinish }: AnimatedSplashScreenProps) => {
  const ambientOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkLift = useRef(new Animated.Value(12)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const glowScale = useMemo(
    () =>
      glowPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.92, 1.14],
      }),
    [glowPulse]
  );

  const glowOpacity = useMemo(
    () =>
      glowPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.08, 0.18],
      }),
    [glowPulse]
  );

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1000,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    Animated.sequence([
      Animated.timing(ambientOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
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
      Animated.parallel([
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkLift, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(880),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
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
    };
  }, [ambientOpacity, glowPulse, logoOpacity, logoScale, onFinish, screenOpacity, wordmarkLift, wordmarkOpacity]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: ambientOpacity }]}>
        <LinearGradient
          colors={["#FFFFFF", "#F8F9FC", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(100,130,220,0.06)", "transparent", "rgba(200,80,70,0.05)"]}
          locations={[0, 0.52, 1]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.95, y: 0.95 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: "rgba(100,140,230,0.12)",
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.redGlow,
          {
            backgroundColor: "rgba(230,90,90,0.10)",
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.logoWrapper,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
      >
        <BrandMark size={240} />
      </Animated.View>

      <Animated.View
        style={[
          styles.wordmarkWrap,
          {
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkLift }],
          },
        ]}
      >
        <Text style={styles.wordmarkSubtext}>Industrial Commerce Platform</Text>
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
    backgroundColor: "#FFFFFF",
  },
  glow: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    left: "14%",
    top: "26%",
  },
  redGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    right: "13%",
    bottom: "25%",
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  wordmarkWrap: {
    marginTop: 18,
    alignItems: "center",
  },
  wordmarkText: {
    color: "#1A2138",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 3.2,
    textTransform: "uppercase",
  },
  wordmarkSubtext: {
    marginTop: 5,
    color: "rgba(26,33,56,0.55)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
  },
});
