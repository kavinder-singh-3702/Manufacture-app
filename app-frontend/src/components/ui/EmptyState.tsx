import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, type ViewStyle } from "react-native";
import Svg, { Path, Rect, Circle, Polygon, Line } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";
import { AnimatedButton } from "./AnimatedButton";

// ============================================
// ANIMATED ILLUSTRATIONS
// ============================================

const EmptyBoxIllustration = () => {
  const { colors } = useTheme();
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
      <Svg width={100} height={100} viewBox="0 0 120 120">
        {/* Box body */}
        <Path
          d="M20 45L60 25L100 45L100 90L60 110L20 90L20 45Z"
          fill={`${colors.primary}30`}
        />
        {/* Box top */}
        <Path
          d="M20 45L60 65L100 45L60 25L20 45Z"
          fill={colors.surface}
          stroke={colors.primary}
          strokeWidth={2}
        />
        {/* Box left side */}
        <Path
          d="M20 45L20 90L60 110L60 65L20 45Z"
          fill={`${colors.accent}20`}
          stroke={colors.primary}
          strokeWidth={2}
        />
        {/* Box right side */}
        <Path
          d="M60 65L60 110L100 90L100 45L60 65Z"
          fill={colors.surface}
          stroke={colors.primary}
          strokeWidth={2}
        />
      </Svg>
    </Animated.View>
  );
};

const NoDataIllustration = () => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Svg width={100} height={100} viewBox="0 0 120 120">
        {/* Chart bars */}
        <Rect x="15" y="85" width="20" height="25" rx="4" fill={colors.surface} />
        <Rect x="40" y="65" width="20" height="45" rx="4" fill={colors.surface} />
        <Rect x="65" y="50" width="20" height="60" rx="4" fill={colors.surface} />
        <Rect x="90" y="70" width="20" height="40" rx="4" fill={colors.surface} />
        {/* Dotted line */}
        <Line
          x1="10"
          y1="60"
          x2="115"
          y2="60"
          stroke={colors.primary}
          strokeWidth={2}
          strokeDasharray="6 4"
        />
        {/* Magnifying glass */}
        <Circle cx="85" cy="30" r="15" fill={`${colors.accent}30`} stroke={colors.primary} strokeWidth={3} />
        <Line x1="96" y1="41" x2="108" y2="53" stroke={colors.primary} strokeWidth={4} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
};

const NoResultsIllustration = () => {
  const { colors } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    rotate.start();
    return () => rotate.stop();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Svg width={100} height={100} viewBox="0 0 120 120">
        {/* Document stack */}
        <Rect x="25" y="35" width="70" height="75" rx="8" fill={colors.surface} />
        <Rect x="30" y="30" width="70" height="75" rx="8" fill={`${colors.accent}20`} />
        <Rect
          x="35"
          y="25"
          width="70"
          height="75"
          rx="8"
          fill={colors.surface}
          stroke={colors.primary}
          strokeWidth={2}
        />
        {/* Lines on document */}
        <Rect x="45" y="45" width="50" height="6" rx="3" fill={colors.border} />
        <Rect x="45" y="60" width="40" height="6" rx="3" fill={colors.border} />
        <Rect x="45" y="75" width="30" height="6" rx="3" fill={colors.border} />
        {/* X mark */}
        <Circle cx="90" cy="85" r="14" fill={colors.surface} stroke={colors.error} strokeWidth={2} />
        <Path d="M84 79L96 91M96 79L84 91" stroke={colors.error} strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
};

const SuccessIllustration = () => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Svg width={100} height={100} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r="50" fill={`${colors.success}15`} />
        <Circle cx="60" cy="60" r="40" fill={`${colors.success}25`} />
        <Circle cx="60" cy="60" r="30" fill={colors.success} />
        <Path
          d="M45 60L55 70L75 50"
          stroke="white"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
};

// ============================================
// ILLUSTRATION MAP
// ============================================

const illustrations = {
  empty: EmptyBoxIllustration,
  noData: NoDataIllustration,
  noResults: NoResultsIllustration,
  success: SuccessIllustration,
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  type?: keyof typeof illustrations;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export const EmptyState = ({
  type = "empty",
  title,
  description,
  action,
  secondaryAction,
  style,
}: EmptyStateProps) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const Illustration = illustrations[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      <View style={styles.illustration}>
        <Illustration />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {description && (
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {description}
        </Text>
      )}

      {(action || secondaryAction) && (
        <View style={styles.actions}>
          {action && (
            <AnimatedButton
              label={action.label}
              onPress={action.onPress}
              variant="primary"
              size="md"
            />
          )}
          {secondaryAction && (
            <AnimatedButton
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant="ghost"
              size="md"
            />
          )}
        </View>
      )}
    </Animated.View>
  );
};

// ============================================
// LOADING EMPTY STATE
// ============================================

export const LoadingEmptyState = ({ message = "Loading..." }: { message?: string }) => {
  const { colors } = useTheme();
  const spinAnim = useRef(new Animated.Value(0)).current;

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
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.spinner,
          {
            borderColor: colors.surface,
            borderTopColor: colors.primary,
            transform: [{ rotate: rotation }],
          },
        ]}
      />
      <Text style={[styles.loadingText, { color: colors.textMuted }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  illustration: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 24,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
  },
});
