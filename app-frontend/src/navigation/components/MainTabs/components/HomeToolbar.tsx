import { FC } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { useTheme } from "../../../../hooks/useTheme";
import { HamburgerButton } from "./HamburgerButton";
import { LogoBadge } from "./LogoBadge";
import { SearchBar } from "./SearchBar";

type HomeToolbarProps = {
  onMenuPress: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export const HomeToolbar: FC<HomeToolbarProps> = ({ onMenuPress, searchValue, onSearchChange }) => {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={[styles.content, { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }]}>
        <HamburgerButton onPress={onMenuPress} style={{ marginRight: spacing.md }} />
        <LogoBadge style={{ marginRight: spacing.md }} />
        <SearchBar value={searchValue} onChangeText={onSearchChange} placeholder="Search operations" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    width: "100%",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
});
