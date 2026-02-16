import { FC } from "react";
import { StyleProp, StyleSheet, TextInput, TouchableOpacity, ViewStyle, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../hooks/useTheme";
import { useThemeMode } from "../../../../hooks/useThemeMode";
import { getNavigationTokens } from "./navigation.tokens";

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
  const theme = useTheme();
  const { colors, radius } = theme;
  const { resolvedMode } = useThemeMode();
  const { width, fontScale } = useWindowDimensions();
  const tokens = getNavigationTokens(theme, resolvedMode, {
    viewportWidth: width,
    fontScale,
  });
  const isTriggerMode = Boolean(onPress);

  return (
    <TouchableOpacity
      accessibilityRole={isTriggerMode ? "button" : undefined}
      accessibilityLabel="Search products"
      activeOpacity={isTriggerMode ? 0.8 : 1}
      onPress={onPress}
      style={[
        styles.container,
        {
          borderRadius: radius.pill,
          borderColor: tokens.colors.searchBorder,
          backgroundColor: tokens.colors.searchBackground,
          minHeight: tokens.topBar.searchHeight,
          paddingHorizontal: tokens.spacing.sm,
        },
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={tokens.topBar.density === "xCompact" ? 18 : 20}
        color={tokens.colors.searchPlaceholder}
        style={styles.leadingIcon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.searchPlaceholder}
        style={[
          styles.input,
          {
            color: tokens.colors.searchText,
            fontSize: tokens.topBar.searchFontSize,
          },
        ]}
        autoCorrect={false}
        returnKeyType="search"
        editable={!isTriggerMode}
        selectTextOnFocus={!isTriggerMode}
        onFocus={isTriggerMode ? onPress : undefined}
        pointerEvents={isTriggerMode ? "none" : "auto"}
        underlineColorAndroid="transparent"
      />
      <Ionicons
        name={isTriggerMode ? "arrow-forward-circle-outline" : "search"}
        size={tokens.topBar.density === "xCompact" ? 18 : 20}
        color={colors.primary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  leadingIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
  },
});
