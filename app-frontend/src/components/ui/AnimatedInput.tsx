import React, { useRef, useState, forwardRef } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";

// ============================================
// ANIMATED INPUT COMPONENT
// ============================================

interface AnimatedInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  containerStyle?: ViewStyle;
}

export const AnimatedInput = forwardRef<TextInput, AnimatedInputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      icon,
      iconPosition = "left",
      containerStyle,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const { colors, radius } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = useRef(new Animated.Value(0)).current;
    const labelColor = useRef(new Animated.Value(0)).current;
    const shadowOpacity = useRef(new Animated.Value(0)).current;

    const handleFocus = (e: any) => {
      setIsFocused(true);
      Animated.parallel([
        Animated.timing(borderColor, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(labelColor, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(shadowOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      Animated.parallel([
        Animated.timing(borderColor, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(labelColor, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(shadowOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
      onBlur?.(e);
    };

    const animatedBorderColor = borderColor.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.border, error ? colors.error : success ? colors.success : colors.primary],
    });

    const animatedLabelColor = labelColor.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textMuted, colors.primary],
    });

    const animatedShadowOpacity = shadowOpacity.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.15],
    });

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Animated.Text
            style={[
              styles.label,
              { color: error ? colors.error : animatedLabelColor },
            ]}
          >
            {label}
          </Animated.Text>
        )}

        <Animated.View
          style={[
            styles.inputContainer,
            {
              borderColor: error ? colors.error : success ? colors.success : animatedBorderColor,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              shadowColor: colors.primary,
              shadowOpacity: animatedShadowOpacity,
            },
          ]}
        >
          {icon && iconPosition === "left" && (
            <Animated.View style={[styles.iconLeft, { opacity: isFocused ? 1 : 0.6 }]}>
              {icon}
            </Animated.View>
          )}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              { color: colors.text },
              icon && iconPosition === "left" && { paddingLeft: 0 },
            ]}
            placeholderTextColor={colors.textMuted}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* Validation icons */}
          {error && (
            <Animated.View style={styles.validationIcon}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Circle cx={12} cy={12} r={10} stroke={colors.error} strokeWidth={2} fill="none" />
                <Path d="M15 9l-6 6M9 9l6 6" stroke={colors.error} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          )}

          {success && !error && (
            <Animated.View style={styles.validationIcon}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M20 6L9 17l-5-5"
                  stroke={colors.success}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          )}

          {icon && iconPosition === "right" && !error && !success && (
            <Animated.View style={[styles.iconRight, { opacity: isFocused ? 1 : 0.6 }]}>
              {icon}
            </Animated.View>
          )}
        </Animated.View>

        {/* Error or helper text */}
        {error && (
          <Animated.Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Animated.Text>
        )}
        {helperText && !error && (
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            {helperText}
          </Text>
        )}
      </View>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

// ============================================
// FLOATING LABEL INPUT
// ============================================

interface FloatingLabelInputProps extends Omit<TextInputProps, "style" | "placeholder"> {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const FloatingLabelInput = forwardRef<TextInput, FloatingLabelInputProps>(
  ({ label, error, value, containerStyle, onFocus, onBlur, ...props }, ref) => {
    const { colors, radius } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const labelPosition = useRef(new Animated.Value(value ? 1 : 0)).current;

    const handleFocus = (e: any) => {
      setIsFocused(true);
      Animated.timing(labelPosition, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      if (!value) {
        Animated.timing(labelPosition, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      onBlur?.(e);
    };

    const labelTop = labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 6],
    });

    const labelFontSize = labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 11],
    });

    const labelOpacity = labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    });

    return (
      <View style={[styles.floatingContainer, containerStyle]}>
        <View
          style={[
            styles.floatingInputContainer,
            {
              borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                top: labelTop,
                fontSize: labelFontSize,
                opacity: labelOpacity,
                color: isFocused ? colors.primary : colors.textMuted,
              },
            ]}
          >
            {label}
          </Animated.Text>

          <TextInput
            ref={ref}
            value={value}
            style={[styles.floatingInput, { color: colors.text }]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </View>

        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";

// ============================================
// SEARCH INPUT
// ============================================

interface SearchInputProps extends Omit<TextInputProps, "style"> {
  onSearch?: (value: string) => void;
  loading?: boolean;
  containerStyle?: ViewStyle;
}

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
  ({ onSearch, loading, value, containerStyle, ...props }, ref) => {
    const { colors, radius } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      if (loading) {
        const spin = Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        );
        spin.start();
        return () => spin.stop();
      }
    }, [loading]);

    const handleFocus = () => {
      setIsFocused(true);
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        friction: 8,
        useNativeDriver: true,
      }).start();
    };

    const handleBlur = () => {
      setIsFocused(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }).start();
    };

    const rotation = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return (
      <Animated.View
        style={[
          styles.searchContainer,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.border,
            borderRadius: radius.full,
          },
          containerStyle,
        ]}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.searchIcon}>
          <Circle cx={11} cy={11} r={8} stroke={isFocused ? colors.primary : colors.textMuted} strokeWidth={2} fill="none" />
          <Path d="M21 21l-4.35-4.35" stroke={isFocused ? colors.primary : colors.textMuted} strokeWidth={2} strokeLinecap="round" />
        </Svg>

        <TextInput
          ref={ref}
          value={value}
          style={[styles.searchInput, { color: colors.text }]}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          onSubmitEditing={() => onSearch?.(String(value || ""))}
          {...props}
        />

        {loading && (
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Circle
                cx={12}
                cy={12}
                r={10}
                stroke={colors.primary}
                strokeWidth={2}
                fill="none"
                strokeDasharray="32"
                strokeDashoffset="16"
              />
            </Svg>
          </Animated.View>
        )}
      </Animated.View>
    );
  }
);

SearchInput.displayName = "SearchInput";

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 0,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  iconLeft: {
    marginRight: 12,
  },
  iconRight: {
    marginLeft: 12,
  },
  validationIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  floatingContainer: {
    marginBottom: 16,
  },
  floatingInputContainer: {
    borderWidth: 1.5,
    position: "relative",
  },
  floatingLabel: {
    position: "absolute",
    left: 16,
    fontWeight: "500",
  },
  floatingInput: {
    paddingTop: 24,
    paddingBottom: 10,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
});
