import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

export type OtpInputChangeMeta = {
  typed: boolean;
  bulk: boolean;
};

type OtpCodeInputProps = {
  value: string;
  onChange: (value: string, meta: OtpInputChangeMeta) => void;
  length?: number;
  disabled?: boolean;
  errorText?: string;
  onFocusChange?: (focused: boolean) => void;
  onSubmitEditing?: () => void;
};

const sanitizeOtp = (value: string, length: number) => value.replace(/[^0-9]/g, "").slice(0, length);

export const OtpCodeInput = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  errorText,
  onFocusChange,
  onSubmitEditing,
}: OtpCodeInputProps) => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const { fs } = useResponsiveLayout();
  const isDark = resolvedMode === "dark";
  const styles = useMemo(() => createStyles(colors, isDark, fs), [colors, isDark, fs]);
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const normalizedValue = sanitizeOtp(value || "", length);
  const hasError = Boolean(errorText);

  const handleTextChange = (text: string) => {
    const nextValue = sanitizeOtp(text, length);
    const bulk = Math.abs(nextValue.length - normalizedValue.length) > 1;
    onChange(nextValue, { typed: !bulk, bulk });
  };

  const focusInput = () => {
    if (disabled) return;
    inputRef.current?.focus();
  };

  return (
    <View>
      <Pressable
        onPress={focusInput}
        style={[styles.boxRow, disabled ? styles.boxRowDisabled : null]}
        accessibilityRole="button"
        accessibilityLabel="Verification code input"
      >
        {Array.from({ length }, (_, index) => {
          const char = normalizedValue[index] || "";
          const isFilled = Boolean(char);
          const activeIndex = Math.min(normalizedValue.length, length - 1);
          const isCurrent = isFocused && index === activeIndex;

          return (
            <View
              key={`otp-box-${index + 1}`}
              style={[
                styles.box,
                isFilled ? styles.boxFilled : null,
                isCurrent ? styles.boxFocused : null,
                hasError ? styles.boxError : null,
              ]}
            >
              <Text style={[styles.boxText, isFilled ? styles.boxTextFilled : null]}>{char}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={normalizedValue}
        onChangeText={handleTextChange}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        returnKeyType="done"
        maxLength={length}
        style={styles.hiddenInput}
        onFocus={() => {
          setIsFocused(true);
          onFocusChange?.(true);
        }}
        onBlur={() => {
          setIsFocused(false);
          onFocusChange?.(false);
        }}
        onSubmitEditing={onSubmitEditing}
      />

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean, fs: (size: number) => number) =>
  StyleSheet.create({
    boxRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
    },
    boxRowDisabled: {
      opacity: 0.75,
    },
    box: {
      flex: 1,
      minHeight: 56,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
      alignItems: "center",
      justifyContent: "center",
    },
    boxFilled: {
      borderColor: colors.primary + "80",
      backgroundColor: isDark ? "rgba(25,184,230,0.1)" : "rgba(20,141,178,0.1)",
    },
    boxFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 3,
    },
    boxError: {
      borderColor: colors.error,
      backgroundColor: colors.errorBg,
    },
    boxText: {
      fontSize: fs(22),
      fontWeight: "800",
      color: colors.textMuted,
    },
    boxTextFilled: {
      color: colors.text,
    },
    hiddenInput: {
      position: "absolute",
      width: 1,
      height: 1,
      opacity: 0,
      left: -9999,
      top: 0,
    },
    errorText: {
      marginTop: 8,
      fontSize: fs(12),
      fontWeight: "700",
      color: colors.error,
    },
  });
