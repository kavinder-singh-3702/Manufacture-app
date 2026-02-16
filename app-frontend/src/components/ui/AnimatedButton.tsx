import React, { useRef } from "react";
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  View,
  Pressable,
  type ViewStyle,
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
  const { colors, radius, nativeGradients } = useTheme();
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

  const getGradientColors = (): [string, string] | [string, string, string] => {
    switch (variant) {
      case "primary":
        return nativeGradients.ctaPrimary;
      case "accent":
        return nativeGradients.heroCoral;
      case "danger":
        return [colors.error, colors.errorStrong];
      default:
        return nativeGradients.ctaPrimary;
    }
  };

  const getShadowColor = () => {
    switch (variant) {
      case "accent":
        return colors.accent;
      case "danger":
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const contentTextColor =
    variant === "ghost" || variant === "outline" ? colors.primary : variant === "accent" ? colors.textOnAccent : colors.textOnPrimary;

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={contentTextColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === "left" ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text
            style={[
              styles.label,
              {
                fontSize: sizeStyles.fontSize,
                color: contentTextColor,
              },
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === "right" ? <View style={styles.iconRight}>{icon}</View> : null}
        </>
      )}
    </View>
  );

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
                shadowColor: getShadowColor(),
                shadowOpacity: 0.28,
              },
            ]}
          >
            {renderContent()}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

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
    minHeight: 44,
    shadowOffset: { width: 0, height: 4 },
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
