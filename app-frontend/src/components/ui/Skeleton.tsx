import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";

// ============================================
// BASE SKELETON COMPONENT
// ============================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surface,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(108,99,255,0.1)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

// ============================================
// SKELETON TEXT
// ============================================

interface SkeletonTextProps {
  lines?: number;
  style?: ViewStyle;
}

export const SkeletonText = ({ lines = 3, style }: SkeletonTextProps) => {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? "60%" : "100%"}
          borderRadius={4}
          style={i > 0 ? { marginTop: 8 } : undefined}
        />
      ))}
    </View>
  );
};

// ============================================
// SKELETON AVATAR
// ============================================

interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const SkeletonAvatar = ({ size = 48, style }: SkeletonAvatarProps) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

// ============================================
// SKELETON CARD
// ============================================

interface SkeletonCardProps {
  style?: ViewStyle;
}

export const SkeletonCard = ({ style }: SkeletonCardProps) => {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={48} />
        <View style={styles.cardHeaderText}>
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" style={{ marginTop: 8 }} />
        </View>
      </View>
      <SkeletonText lines={2} style={{ marginTop: 16 }} />
      <View style={styles.cardActions}>
        <Skeleton height={36} width={100} borderRadius={18} />
        <Skeleton height={36} width={80} borderRadius={18} />
      </View>
    </View>
  );
};

// ============================================
// SKELETON KPI CARD
// ============================================

export const SkeletonKPICard = ({ style }: { style?: ViewStyle }) => {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.kpiCard,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.kpiHeader}>
        <Skeleton height={12} width="50%" borderRadius={4} />
        <Skeleton height={24} width={24} borderRadius={12} />
      </View>
      <Skeleton height={32} width="40%" borderRadius={6} style={{ marginTop: 12 }} />
      <Skeleton height={10} width="70%" borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  );
};

// ============================================
// SKELETON LIST ITEM
// ============================================

export const SkeletonListItem = ({ style }: { style?: ViewStyle }) => {
  return (
    <View style={[styles.listItem, style]}>
      <SkeletonAvatar size={40} />
      <View style={styles.listItemContent}>
        <Skeleton height={14} width="60%" />
        <Skeleton height={12} width="40%" style={{ marginTop: 4 }} />
      </View>
      <Skeleton height={28} width={60} borderRadius={14} />
    </View>
  );
};

// ============================================
// SKELETON LIST
// ============================================

interface SkeletonListProps {
  count?: number;
  style?: ViewStyle;
}

export const SkeletonList = ({ count = 5, style }: SkeletonListProps) => {
  const { colors } = useTheme();

  return (
    <View style={[{ backgroundColor: colors.surface }, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          <SkeletonListItem />
          {i < count - 1 && (
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
          )}
        </View>
      ))}
    </View>
  );
};

// ============================================
// SKELETON WRAPPER
// ============================================

interface SkeletonWrapperProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export const SkeletonWrapper = ({
  loading,
  skeleton,
  children,
}: SkeletonWrapperProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  if (loading) {
    return <>{skeleton}</>;
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    width: "100%",
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardActions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },
  kpiCard: {
    padding: 16,
  },
  kpiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
});
