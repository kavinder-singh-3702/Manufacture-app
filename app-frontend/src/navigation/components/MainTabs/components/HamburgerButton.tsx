import { FC } from "react";
import { StyleSheet, TouchableOpacity, View, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../../../hooks/useTheme";

type HamburgerButtonProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const HamburgerButton: FC<HamburgerButtonProps> = ({ onPress, style }) => {
  const { colors, spacing } = useTheme();

  return (
    <TouchableOpacity
      accessibilityLabel="Open menu"
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { padding: spacing.sm }, style]}
    >
      <View style={[styles.line, { backgroundColor: colors.text }]} />
      <View style={[styles.line, { backgroundColor: colors.text, marginVertical: 4 }]} />
      <View style={[styles.line, { backgroundColor: colors.text }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
  line: {
    width: 22,
    height: 2,
    borderRadius: 1,
  },
});
