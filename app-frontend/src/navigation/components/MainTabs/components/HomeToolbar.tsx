import { FC, useEffect, useMemo, useRef } from "react";
import { Animated, Image, StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../../hooks/useTheme";
import { useAuth } from "../../../../hooks/useAuth";
import { HamburgerButton } from "./HamburgerButton";
import { LogoBadge } from "./LogoBadge";
import { SearchBar } from "./SearchBar";
import { Company } from "../../../../types/company";
import { CompanyAvatar } from "./ProfileAvatar";
import { APP_NAME, BRAND_IMAGES } from "../../../../constants/brand";

type HomeToolbarProps = {
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
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const notificationPulse = useRef(new Animated.Value(1)).current;

  const buildInitials = () => {
    const segments = [user?.firstName, user?.lastName].filter(Boolean);
    const name = segments.length ? segments.join(" ") : user?.displayName ?? user?.email ?? "";
    const trimmed = name.trim();
    if (!trimmed.length) return "U";
    const tokens = trimmed.split(" ").filter(Boolean);
    if (tokens.length >= 2) {
      return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
    }
    const [first] = trimmed;
    const second = trimmed.length > 1 ? trimmed[1] : "";
    return `${first}${second}`.toUpperCase();
  };

  const avatarLabel = buildInitials();
  const avatarUri = typeof user?.avatarUrl === "string" && user.avatarUrl.trim().length ? user.avatarUrl : undefined;

  const avatarNode = useMemo(() => {
    if (activeCompany) {
      return (
        <CompanyAvatar
          company={activeCompany}
          size={42}
          style={{ borderWidth: 2, borderColor: colors.border }}
        />
      );
    }
    return <LogoBadge label={avatarLabel} imageUri={avatarUri} />;
  }, [activeCompany, avatarLabel, avatarUri, colors.border]);

  useEffect(() => {
    if (notificationCount <= 0) {
      return;
    }
    Animated.sequence([
      Animated.timing(notificationPulse, {
        toValue: 1.16,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(notificationPulse, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start();
  }, [notificationCount, notificationPulse]);

  return (
    <View style={[styles.wrapper, { backgroundColor: "transparent" }]}>
      {/* Glassmorphism background */}
      <LinearGradient
        colors={[
          colors.overlay,
          colors.overlayLight,
        ]}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle accent glow */}
      <LinearGradient
        colors={[
          colors.surfaceOverlayPrimary,
          "transparent",
          colors.surfaceOverlaySecondary,
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }]}>
        <HamburgerButton onPress={onMenuPress} style={{ marginRight: spacing.xs }} />
        <View
          style={[
            styles.brandChip,
            {
              marginRight: spacing.xs,
              borderColor: colors.border,
              backgroundColor: colors.surfaceElevated,
            },
          ]}
        >
          <Image source={BRAND_IMAGES.logo} style={styles.brandLogo} />
          <Text numberOfLines={1} style={[styles.brandText, { color: colors.text }]}>
            {APP_NAME}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            console.log("[HomeToolbar] Avatar pressed");
            onAvatarPress?.();
          }}
          onLongPress={() => {
            console.log("[HomeToolbar] Avatar LONG pressed - opening company switcher");
            onAvatarLongPress?.();
          }}
          delayLongPress={300}
          style={[
            styles.avatarButton,
            { marginRight: spacing.xs, borderColor: onAvatarLongPress ? colors.primary + "50" : "transparent" }
          ]}
        >
          {avatarNode}
          {onAvatarLongPress && (
            <View style={[styles.longPressHint, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Text style={styles.longPressHintText}>⇅</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder="Search"
            onPress={onSearchPress}
          />
        </View>
        <Animated.View
          style={{
            transform: [{ scale: notificationPulse }],
          }}
        >
          <TouchableOpacity
            onPress={onNotificationsPress}
            style={[
              styles.notificationButton,
              {
                marginLeft: spacing.sm,
                borderColor: colors.borderPrimary,
                backgroundColor: colors.surfaceElevated,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Text style={{ fontSize: 18, color: colors.text }}>🔔</Text>
            {notificationCount > 0 ? (
              <LinearGradient
                colors={["#E3483E", "#C93B33"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.notificationBadge}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>
                  {notificationCount}
                </Text>
              </LinearGradient>
            ) : null}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    elevation: 4,
    zIndex: 10,
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
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 96,
    maxWidth: 120,
  },
  brandLogo: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    borderRadius: 4,
  },
  brandText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  avatarButton: {
    position: "relative",
    borderRadius: 24,
    borderWidth: 2,
  },
  longPressHint: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  longPressHintText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
