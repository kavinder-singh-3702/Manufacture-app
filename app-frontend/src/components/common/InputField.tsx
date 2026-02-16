import { useState, useCallback } from "react";
import { TextInput, TextInputProps, View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";

type InputFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
};

export const InputField = ({
  label,
  helperText,
  errorText,
  required = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputFieldProps) => {
  const { colors, spacing, radius, nativeGradients } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(errorText);

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const getBorderColor = () => {
    if (hasError) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  const getGlowColor = () => {
    if (hasError) return colors.errorBg;
    if (isFocused) return colors.badgePrimary;
    return "transparent";
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={[
          styles.label,
          {
            color: isFocused ? colors.primary : colors.textMuted,
          },
        ]}
      >
        {label}
        {required ? <Text style={{ color: colors.error }}> *</Text> : null}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          {
            borderRadius: radius.md,
            backgroundColor: getGlowColor(),
          },
        ]}
      >
        <TextInput
          {...rest}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              borderColor: getBorderColor(),
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              color: colors.text,
              shadowColor: isFocused ? colors.primary : colors.shadow,
              shadowOpacity: isFocused ? 0.24 : 0.1,
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
        />
        {isFocused && (
          <LinearGradient
            colors={[nativeGradients.ctaPrimary[0], nativeGradients.statusInfo[1], "transparent"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.focusGlow, { borderRadius: radius.md }]}
            pointerEvents="none"
          />
        )}
      </View>
      {helperText && !hasError ? (
        <Text style={[styles.helper, { color: colors.textTertiary }]}>{helperText}</Text>
      ) : null}
      {hasError ? (
        <Text style={[styles.helper, { color: colors.error }]}>{errorText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    borderWidth: 1.5,
    fontSize: 16,
    fontWeight: "500",
    minHeight: 44,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  focusGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "500",
  },
});
