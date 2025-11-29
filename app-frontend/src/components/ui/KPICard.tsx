import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";
import { HoverScale } from "./AnimatedCard";

// ============================================
// ANIMATED COUNTER HOOK
// ============================================

const useAnimatedCounter = (value: number, duration: number = 1000) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => animatedValue.removeListener(listener);
  }, [value, duration]);

  return displayValue;
};

// ============================================
// TREND INDICATOR
// ============================================

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
}

const TrendIndicator = ({ value, suffix = "%" }: TrendIndicatorProps) => {
  const { colors } = useTheme();
  const isPositive = value >= 0;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isPositive ? 10 : -10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.trendContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Svg width={12} height={12} viewBox="0 0 24 24">
        <Path
          d={isPositive ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}
          stroke={isPositive ? colors.success : colors.error}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        style={[
          styles.trendText,
          { color: isPositive ? colors.success : colors.error },
        ]}
      >
        {isPositive ? "+" : ""}
        {value}
        {suffix}
      </Text>
    </Animated.View>
  );
};

// ============================================
// PROGRESS RING
// ============================================

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const ProgressRing = ({
  value,
  max = 100,
  size = 60,
  strokeWidth = 6,
  color,
}: ProgressRingProps) => {
  const { colors } = useTheme();
  const ringColor = color || colors.primary;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colors.surface}
        strokeWidth={strokeWidth}
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
      />
    </Svg>
  );
};

// ============================================
// KPI CARD COMPONENT
// ============================================

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendSuffix?: string;
  icon?: React.ReactNode;
  target?: { value: number; label: string };
  onPress?: () => void;
  style?: ViewStyle;
}

export const KPICard = ({
  title,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendSuffix = "%",
  icon,
  target,
  onPress,
  style,
}: KPICardProps) => {
  const { colors, radius, shadows } = useTheme();
  const animatedValue = useAnimatedCounter(value);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.medium,
        },
        style,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textMuted }]}>
          {title}
        </Text>
        {icon && (
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            {icon}
          </Animated.View>
        )}
      </View>

      {/* Value */}
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: colors.text }]}>
          {prefix}
          {animatedValue.toLocaleString()}
          {suffix}
        </Text>
        {trend !== undefined && (
          <TrendIndicator value={trend} suffix={trendSuffix} />
        )}
      </View>

      {/* Target Progress */}
      {target && (
        <View style={styles.targetContainer}>
          <ProgressRing
            value={value}
            max={target.value}
            size={40}
            strokeWidth={4}
          />
          <View style={styles.targetInfo}>
            <Text style={[styles.targetLabel, { color: colors.textMuted }]}>
              {target.label}
            </Text>
            <Text style={[styles.targetValue, { color: colors.text }]}>
              {Math.round((value / target.value) * 100)}% of{" "}
              {target.value.toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );

  if (onPress) {
    return <HoverScale onPress={onPress}>{cardContent}</HoverScale>;
  }

  return cardContent;
};

// ============================================
// KPI CARD GRID
// ============================================

interface KPICardGridProps {
  children: React.ReactNode;
  columns?: 2;
  style?: ViewStyle;
}

export const KPICardGrid = ({
  children,
  columns = 2,
  style,
}: KPICardGridProps) => {
  return (
    <View style={[styles.grid, { gap: 12 }, style]}>
      {React.Children.map(children, (child, index) => (
        <View style={styles.gridItem}>{child}</View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  targetContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  targetInfo: {
    flex: 1,
  },
  targetLabel: {
    fontSize: 10,
  },
  targetValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "48%",
  },
});
