import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  View,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface AnimatedButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 12 },
  md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 14 },
  lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 16 },
};

export const AnimatedButton = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  fullWidth = false,
  style,
}: AnimatedButtonProps) => {
  const { colors, radius } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;
  const sizeStyles = sizeConfig[size];

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        friction: 8,
        tension: 300,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 200,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case "primary":
        return ["#6C63FF", "#5248E6"];
      case "accent":
        return ["#FF8C3C", "#E87A30"];
      case "danger":
        return ["#FF6B6B", "#EF4444"];
      default:
        return ["#6C63FF", "#5248E6"];
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <>
          {icon && iconPosition === "left" && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.label,
              {
                fontSize: sizeStyles.fontSize,
                color: variant === "ghost" || variant === "outline" ? colors.primary : "#FFFFFF",
              },
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === "right" && <View style={styles.iconRight}>{icon}</View>}
        </>
      )}
    </View>
  );

  // Gradient buttons (primary, accent, danger)
  if (variant === "primary" || variant === "accent" || variant === "danger") {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnim }],
              opacity: isDisabled ? 0.5 : opacityAnim,
              width: fullWidth ? "100%" : undefined,
            },
            style,
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.button,
              {
                borderRadius: radius.md,
                paddingVertical: sizeStyles.paddingVertical,
                paddingHorizontal: sizeStyles.paddingHorizontal,
              },
            ]}
          >
            {renderContent()}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  // Outline button
  if (variant === "outline") {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale: scaleAnim }],
              opacity: isDisabled ? 0.5 : opacityAnim,
              borderRadius: radius.md,
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              backgroundColor: "transparent",
              borderWidth: 2,
              borderColor: colors.primary,
              width: fullWidth ? "100%" : undefined,
            },
            style,
          ]}
        >
          {renderContent()}
        </Animated.View>
      </Pressable>
    );
  }

  // Secondary and Ghost buttons
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      <Animated.View
        style={[
          styles.button,
          {
            transform: [{ scale: scaleAnim }],
            opacity: isDisabled ? 0.5 : opacityAnim,
            borderRadius: radius.md,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            backgroundColor: variant === "secondary" ? colors.surface : "transparent",
            borderWidth: variant === "secondary" ? 1 : 0,
            borderColor: colors.border,
            width: fullWidth ? "100%" : undefined,
          },
          style,
        ]}
      >
        {renderContent()}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
