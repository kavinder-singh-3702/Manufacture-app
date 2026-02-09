import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { APP_NAME, BRAND_COLORS } from "../../constants/brand";
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
  const beamProgress = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkLift = useRef(new Animated.Value(12)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const beamTranslate = useMemo(
    () =>
      beamProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-260, 260],
      }),
    [beamProgress]
  );

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
        outputRange: [0.22, 0.52],
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

    const beamAnimation = Animated.loop(
      Animated.timing(beamProgress, {
        toValue: 1,
        duration: 1450,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    beamAnimation.start();

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
      beamAnimation.stop();
    };
  }, [ambientOpacity, beamProgress, glowPulse, logoOpacity, logoScale, onFinish, screenOpacity, wordmarkLift, wordmarkOpacity]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: ambientOpacity }]}>
        <LinearGradient
          colors={["#09090B", BRAND_COLORS.charcoalDeep, "#09090B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(140,165,239,0.16)", "transparent", "rgba(227,72,62,0.14)"]}
          locations={[0, 0.52, 1]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.95, y: 0.95 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.noiseLayer} />

      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: BRAND_COLORS.glowBlue,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.redGlow,
          {
            backgroundColor: BRAND_COLORS.glowRed,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.lightBeam,
          {
            transform: [{ translateX: beamTranslate }, { rotate: "-16deg" }],
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(227,72,62,0)", "rgba(227,72,62,0.22)", "rgba(227,72,62,0)"]}
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
        <BrandMark size={188} />
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
        <Text style={styles.wordmarkText}>{APP_NAME}</Text>
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
    backgroundColor: BRAND_COLORS.charcoalDeep,
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
  lightBeam: {
    position: "absolute",
    width: 320,
    height: 560,
    opacity: 0.26,
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
    color: "#EAF0FF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 3.2,
    textTransform: "uppercase",
  },
  wordmarkSubtext: {
    marginTop: 5,
    color: "rgba(234,240,255,0.70)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
  },
  noiseLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
});
