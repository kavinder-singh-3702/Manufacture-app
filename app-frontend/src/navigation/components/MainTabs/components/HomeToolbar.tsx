import { FC } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
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
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={[styles.content, {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }]}>
        <HamburgerButton onPress={onMenuPress} style={{ marginRight: spacing.xs }} />
        <LogoBadge style={{ marginRight: spacing.xs  }} />
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder="Search"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    elevation: 4,
    zIndex: 10,
    paddingTop: StatusBar.currentHeight || 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    minWidth: 0,
    borderRadius: 1,
  },
});
