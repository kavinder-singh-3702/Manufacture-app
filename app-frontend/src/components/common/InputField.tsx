import { useState, useCallback } from "react";
import { TextInput, TextInputProps, View, Text, StyleSheet } from "react-native";
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
  const { colors, spacing, radius } = useTheme();
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
      <View style={styles.inputWrapper}>
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
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
        />
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
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "500",
    minHeight: 44,
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "500",
  },
});
