import { TextInput, TextInputProps, View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type InputFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
  errorText?: string;
};

export const InputField = ({ label, helperText, errorText, style, ...rest }: InputFieldProps) => {
  const { colors, spacing, radius } = useTheme();
  const hasError = Boolean(errorText);

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        {...rest}
        style={[
          styles.input,
          {
            borderColor: hasError ? colors.critical : colors.border,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.muted}
      />
      {helperText && !hasError ? (
        <Text style={[styles.helper, { color: colors.muted }]}>{helperText}</Text>
      ) : null}
      {hasError ? <Text style={[styles.helper, { color: colors.critical }]}>{errorText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
  },
  helper: {
    marginTop: 4,
    fontSize: 13,
  },
});
