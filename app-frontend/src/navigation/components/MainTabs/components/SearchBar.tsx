import { FC } from "react";
import { StyleProp, StyleSheet, TextInput, TouchableOpacity, View, ViewStyle } from "react-native";
import { useTheme } from "../../../../hooks/useTheme";

type SearchBarProps = {
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export const SearchBar: FC<SearchBarProps> = ({
  value,
  placeholder = "Search",
  onChangeText,
  style,
  onPress,
}) => {
  const { colors, spacing, radius } = useTheme();
  const isTriggerMode = Boolean(onPress);

  return (
    <TouchableOpacity
      activeOpacity={isTriggerMode ? 0.8 : 1}
      onPress={onPress}
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
        editable={!isTriggerMode}
        selectTextOnFocus={!isTriggerMode}
        onFocus={isTriggerMode ? onPress : undefined}
        pointerEvents={isTriggerMode ? "none" : "auto"}
      />
    </TouchableOpacity>
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
