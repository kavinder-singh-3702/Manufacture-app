import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { AdaptiveSingleLineText } from "../../../../components/text/AdaptiveSingleLineText";
import { useAuth } from "../../../../hooks/useAuth";
import { useTheme } from "../../../../hooks/useTheme";
import { useThemeMode } from "../../../../hooks/useThemeMode";
import { Company } from "../../../../types/company";
import { CompanyAvatar } from "./ProfileAvatar";
import { LogoBadge } from "./LogoBadge";
import { SearchBar } from "./SearchBar";
import { TopBarMode } from "./navigation.types";
import { getNavigationTokens } from "./navigation.tokens";

type HomeToolbarProps = {
  mode?: TopBarMode;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  onMenuPress: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  notificationCount?: number;
  activeCompany?: Company | null;
  onAvatarLongPress?: () => void;
  onAvatarPress?: () => void;
};

export const HomeToolbar: FC<HomeToolbarProps> = ({
  mode = "two_row",
  title = "Home",
  subtitle,
  showSearch,
  onMenuPress,
  searchValue,
  onSearchChange,
  onSearchPress,
  onNotificationsPress,
  notificationCount = 0,
  activeCompany,
  onAvatarLongPress,
  onAvatarPress,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const { resolvedMode } = useThemeMode();
  const { width, fontScale } = useWindowDimensions();
  const tokens = getNavigationTokens(theme, resolvedMode, {
    viewportWidth: width,
    fontScale,
  });
  const { user } = useAuth();
  const avatarSize = tokens.topBar.density === "xCompact" ? 36 : tokens.topBar.density === "compact" ? 38 : 40;

  const buildInitials = () => {
    const segments = [user?.firstName, user?.lastName].filter(Boolean);
    const name = segments.length ? segments.join(" ") : user?.displayName ?? user?.email ?? "";
    const trimmed = name.trim();
    if (!trimmed.length) return "U";
    const chunks = trimmed.split(" ").filter(Boolean);
    if (chunks.length >= 2) {
      return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
    }
    const [first] = trimmed;
    const second = trimmed.length > 1 ? trimmed[1] : "";
    return `${first}${second}`.toUpperCase();
  };

  const avatarLabel = buildInitials();
  const avatarUri = typeof user?.avatarUrl === "string" && user.avatarUrl.trim().length ? user.avatarUrl : undefined;
  const isTwoRow = mode === "two_row" && showSearch !== false;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: tokens.colors.topBarBackground,
          borderBottomColor: tokens.colors.topBarBorder,
          minHeight: isTwoRow ? tokens.topBar.twoRowMinHeight : tokens.topBar.compactMinHeight,
          paddingHorizontal: tokens.spacing.md,
          paddingTop: tokens.spacing.sm,
          paddingBottom: isTwoRow ? tokens.spacing.sm : tokens.spacing.xs,
        },
      ]}
    >
      <View style={[styles.primaryRow, { marginBottom: isTwoRow ? tokens.spacing.sm : 0 }]}>
        <Pressable
          onPress={onMenuPress}
          style={[
            styles.iconButton,
            {
              width: tokens.topBar.iconButtonSize,
              height: tokens.topBar.iconButtonSize,
              borderColor: tokens.colors.topBarIconBorder,
              backgroundColor: tokens.colors.topBarIconBackground,
              borderRadius: tokens.topBar.iconButtonSize / 2.75,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu-outline" size={22} color={tokens.colors.topBarIcon} />
        </Pressable>

        <View style={styles.headingWrap}>
          <AdaptiveSingleLineText
            minimumFontScale={0.74}
            style={[
              styles.title,
              {
                color: tokens.colors.topBarTitle,
                fontSize: tokens.topBar.titleSize,
              },
            ]}
          >
            {title}
          </AdaptiveSingleLineText>
          {subtitle ? (
            <AdaptiveSingleLineText
              minimumFontScale={0.74}
              style={[
                styles.subtitle,
                {
                  color: tokens.colors.topBarSubtitle,
                  fontSize: tokens.topBar.subtitleSize,
                },
              ]}
            >
              {subtitle}
            </AdaptiveSingleLineText>
          ) : null}
        </View>

        <View style={styles.trailingActions}>
          <Pressable
            onPress={onNotificationsPress}
            style={[
              styles.iconButton,
              {
              width: tokens.topBar.iconButtonSize,
              height: tokens.topBar.iconButtonSize,
              borderColor: tokens.colors.topBarIconBorder,
              backgroundColor: tokens.colors.topBarIconBackground,
              borderRadius: tokens.topBar.iconButtonSize / 2.75,
            },
          ]}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={tokens.colors.topBarIcon} />
            {notificationCount > 0 ? (
              <View style={[styles.notificationBadge, { backgroundColor: tokens.colors.unreadBadgeBackground }]}>
                <Text style={[styles.notificationBadgeText, { color: tokens.colors.unreadBadgeText }]}>
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAvatarPress}
            onLongPress={onAvatarLongPress}
            delayLongPress={300}
            style={[styles.avatarButton, { marginLeft: tokens.topBar.density === "xCompact" ? 6 : 8 }]}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            {activeCompany ? (
              <CompanyAvatar company={activeCompany} size={avatarSize} style={{ borderWidth: 2, borderColor: colors.border }} />
            ) : (
              <LogoBadge label={avatarLabel} imageUri={avatarUri} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isTwoRow ? (
        <SearchBar
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder="Search products or SKUs"
          onPress={onSearchPress}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  primaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headingWrap: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 8,
  },
  title: {
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 2,
    fontWeight: "600",
  },
  trailingActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarButton: {
    borderRadius: 20,
    marginLeft: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
