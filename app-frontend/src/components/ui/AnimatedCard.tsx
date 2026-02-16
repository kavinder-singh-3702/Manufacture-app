import React, { useRef, useEffect } from "react";
import {
  Animated,
  View,
  StyleSheet,
  Pressable,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  delay?: number;
  variant?: "default" | "elevated" | "gradient";
  style?: ViewStyle;
}

export const AnimatedCard = ({
  children,
  onPress,
  delay = 0,
  variant = "default",
  style,
}: AnimatedCardProps) => {
  const { colors, radius, nativeGradients } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, translateY]);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  };

  if (variant === "gradient") {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
      >
        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY }, { scale: scaleAnim }],
            },
            style,
          ]}
        >
          <LinearGradient
            colors={[colors.surfaceOverlayPrimary, colors.surfaceOverlayAccent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, cardStyle]}
          >
            <LinearGradient
              colors={nativeGradients.statusInfo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {children}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  const content = (
    <Animated.View
      style={[
        styles.card,
        cardStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateY }, { scale: scaleAnim }],
        },
        variant === "elevated" && {
          shadowOpacity: 0.28,
          shadowRadius: 14,
          elevation: 9,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

interface StaggeredCardListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
}

export const StaggeredCardList = ({
  children,
  staggerDelay = 100,
}: StaggeredCardListProps) => {
  return (
    <View style={styles.list}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ delay?: number }>, {
            delay: index * staggerDelay,
          });
        }
        return child;
      })}
    </View>
  );
};

interface HoverScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  scale?: number;
  style?: ViewStyle;
}

export const HoverScale = ({
  children,
  onPress,
  scale = 1.02,
  style,
}: HoverScaleProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

interface PulseAnimationProps {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

export const PulseAnimation = ({
  children,
  duration = 1500,
  style,
}: PulseAnimationProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [duration, pulseAnim]);

  return (
    <Animated.View style={[{ transform: [{ scale: pulseAnim }] }, style]}>
      {children}
    </Animated.View>
  );
};

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export const FadeInView = ({
  children,
  delay = 0,
  duration = 400,
  style,
}: FadeInViewProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, duration, fadeAnim]);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
};

interface SlideInViewProps {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

const getInitialOffset = (direction: SlideInViewProps["direction"]) => {
  switch (direction) {
    case "left":
      return -30;
    case "right":
      return 30;
    case "down":
      return 30;
    case "up":
    default:
      return -30;
  }
};

export const SlideInView = ({
  children,
  direction = "up",
  delay = 0,
  duration = 400,
  style,
}: SlideInViewProps) => {
  const translateAnim = useRef(new Animated.Value(getInitialOffset(direction))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, fadeAnim, translateAnim]);

  const transform =
    direction === "left" || direction === "right"
      ? [{ translateX: translateAnim }]
      : [{ translateY: translateAnim }];

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform }, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  list: {
    gap: 12,
  },
});
