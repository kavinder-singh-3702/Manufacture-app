import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, type ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";

// ============================================
// SPINNER LOADER
// ============================================

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  style?: ViewStyle;
}

const spinnerSizes = {
  sm: 16,
  md: 24,
  lg: 40,
};

export const Spinner = ({ size = "md", color, style }: SpinnerProps) => {
  const { colors } = useTheme();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinnerColor = color || colors.primary;
  const sizeValue = spinnerSizes[size];

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, []);

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={[{ transform: [{ rotate: rotation }] }, style]}>
      <Svg width={sizeValue} height={sizeValue} viewBox="0 0 24 24">
        <Circle
          cx={12}
          cy={12}
          r={10}
          stroke={spinnerColor}
          strokeWidth={3}
          fill="none"
          opacity={0.2}
        />
        <Circle
          cx={12}
          cy={12}
          r={10}
          stroke={spinnerColor}
          strokeWidth={3}
          fill="none"
          strokeDasharray="32"
          strokeDashoffset="16"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

// ============================================
// DOTS LOADER
// ============================================

interface DotsLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  style?: ViewStyle;
}

const dotSizes = {
  sm: 6,
  md: 8,
  lg: 12,
};

export const DotsLoader = ({ size = "md", color, style }: DotsLoaderProps) => {
  const { colors } = useTheme();
  const dotColor = color || colors.primary;
  const dotSize = dotSizes[size];

  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      createDotAnimation(dot1Anim, 0),
      createDotAnimation(dot2Anim, 150),
      createDotAnimation(dot3Anim, 300),
    ];

    animations.forEach((anim) => anim.start());
    return () => animations.forEach((anim) => anim.stop());
  }, []);

  const getDotStyle = (anim: Animated.Value) => ({
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: dotColor,
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  });

  return (
    <View style={[styles.dotsContainer, style]}>
      <Animated.View style={getDotStyle(dot1Anim)} />
      <Animated.View style={getDotStyle(dot2Anim)} />
      <Animated.View style={getDotStyle(dot3Anim)} />
    </View>
  );
};

// ============================================
// PULSE LOADER
// ============================================

interface PulseLoaderProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const PulseLoader = ({ size = 40, color, style }: PulseLoaderProps) => {
  const { colors } = useTheme();
  const pulseColor = color || colors.primary;

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulseAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      createPulseAnimation(pulse1, 0),
      createPulseAnimation(pulse2, 500),
      createPulseAnimation(pulse3, 1000),
    ];

    animations.forEach((anim) => anim.start());
    return () => animations.forEach((anim) => anim.stop());
  }, []);

  const getPulseStyle = (anim: Animated.Value) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: pulseColor,
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2],
        }),
      },
    ],
  });

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Animated.View style={getPulseStyle(pulse1)} />
      <Animated.View style={getPulseStyle(pulse2)} />
      <Animated.View style={getPulseStyle(pulse3)} />
      <View
        style={{
          position: "absolute",
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: pulseColor,
          left: size * 0.25,
          top: size * 0.25,
        }}
      />
    </View>
  );
};

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
  animated?: boolean;
  style?: ViewStyle;
}

const progressSizes = {
  sm: 4,
  md: 8,
  lg: 12,
};

export const ProgressBar = ({
  value,
  max = 100,
  showLabel = false,
  size = "md",
  color,
  animated = true,
  style,
}: ProgressBarProps) => {
  const { colors, radius } = useTheme();
  const progressColor = color || colors.primary;
  const height = progressSizes[size];
  const percentage = Math.min((value / max) * 100, 100);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: percentage,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(percentage);
    }
  }, [percentage, animated]);

  useEffect(() => {
    if (animated) {
      const shimmer = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      shimmer.start();
      return () => shimmer.stop();
    }
  }, [animated]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 200],
  });

  return (
    <View style={style}>
      <View
        style={[
          styles.progressContainer,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: animatedWidth,
              height,
              borderRadius: height / 2,
              backgroundColor: progressColor,
              overflow: "hidden",
            },
          ]}
        >
          {animated && (
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            />
          )}
        </Animated.View>
      </View>
      {showLabel && (
        <View style={styles.progressLabels}>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {value} / {max}
          </Text>
          <Text style={[styles.progressPercentage, { color: colors.text }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================
// FULL PAGE LOADER
// ============================================

interface FullPageLoaderProps {
  message?: string;
  visible: boolean;
}

export const FullPageLoader = ({
  message = "Loading...",
  visible,
}: FullPageLoaderProps) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.fullPageContainer,
        {
          backgroundColor: colors.background,
          opacity: fadeAnim,
        },
      ]}
    >
      <PulseLoader size={60} />
      <Text style={[styles.fullPageText, { color: colors.textMuted }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

// ============================================
// INLINE LOADER
// ============================================

interface InlineLoaderProps {
  text?: string;
  style?: ViewStyle;
}

export const InlineLoader = ({ text = "Loading", style }: InlineLoaderProps) => {
  const { colors } = useTheme();
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = Animated.loop(
      Animated.timing(dotsAnim, {
        toValue: 3,
        duration: 1500,
        useNativeDriver: false,
      })
    );
    animate.start();
    return () => animate.stop();
  }, []);

  return (
    <View style={[styles.inlineContainer, style]}>
      <Spinner size="sm" />
      <Text style={[styles.inlineText, { color: colors.textMuted }]}>
        {text}...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    width: "100%",
    overflow: "hidden",
  },
  progressFill: {
    position: "relative",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: "600",
  },
  fullPageContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  fullPageText: {
    marginTop: 16,
    fontSize: 14,
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineText: {
    fontSize: 14,
  },
});
