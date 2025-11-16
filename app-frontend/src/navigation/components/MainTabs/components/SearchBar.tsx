import { FC } from "react";
import { StyleProp, StyleSheet, TextInput, View, ViewStyle } from "react-native";
import { useTheme } from "../../../../hooks/useTheme";

type SearchBarProps = {
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

export const SearchBar: FC<SearchBarProps> = ({ value, placeholder = "Search", onChangeText, style }) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radius.pill,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text }]}
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
  },
});
