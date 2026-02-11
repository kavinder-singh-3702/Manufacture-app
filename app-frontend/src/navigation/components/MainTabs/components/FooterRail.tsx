import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { useTheme } from "../../../../hooks/useTheme";
import { useThemeMode } from "../../../../hooks/useThemeMode";
import { RouteName } from "../../../routes";
import { getNavigationTokens } from "./navigation.tokens";
import { FooterItemConfig } from "./navigation.types";

type FooterRailProps = {
  tabs: FooterItemConfig[];
  activeTab: RouteName;
  onTabPress: (route: RouteName) => void;
  onTabLongPress?: (route: RouteName) => void;
  unreadByRoute?: Partial<Record<RouteName, number>>;
  getSvgIconXml?: (route: RouteName, color: string) => string;
};

export const FooterRail: FC<FooterRailProps> = ({
  tabs,
  activeTab,
  onTabPress,
  onTabLongPress,
  unreadByRoute,
  getSvgIconXml,
}) => {
  const theme = useTheme();
  const { resolvedMode } = useThemeMode();
  const { width, fontScale } = useWindowDimensions();
  const tokens = getNavigationTokens(theme, resolvedMode, {
    viewportWidth: width,
    fontScale,
  });
  const isCompact = tokens.footer.density !== "regular";

  const unreadBadgeSize = isCompact ? 14 : 16;
  const unreadBadgeTop = isCompact ? -6 : -8;
  const unreadBadgeRight = isCompact ? -9 : -11;
  const unreadBadgeFontSize = isCompact ? 8 : 9;

  const renderIcon = (tab: FooterItemConfig, color: string, isActive: boolean) => {
    const svgXml = getSvgIconXml?.(tab.route, color) ?? "";
    if (svgXml.length) {
      return <SvgXml xml={svgXml} width={tokens.footer.iconSize} height={tokens.footer.iconSize} />;
    }

    const iconName = (isActive ? tab.activeIcon : tab.inactiveIcon) || tab.inactiveIcon || tab.activeIcon || "ellipse-outline";
    return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={tokens.footer.iconSize} color={color} />;
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: tokens.colors.footerBackground }}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: tokens.colors.footerBackground,
            borderTopColor: tokens.colors.footerBorder,
            paddingHorizontal: tokens.footer.horizontalPadding,
            paddingTop: tokens.footer.topPadding,
            paddingBottom: tokens.footer.bottomPadding,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.route;
          const unreadCount = unreadByRoute?.[tab.route] ?? 0;
          const iconColor = isActive ? tokens.colors.footerActive : tokens.colors.footerInactive;
          const label = tab.tabLabel ?? tab.label;

          return (
            <TouchableOpacity
              key={tab.route}
              activeOpacity={0.8}
              onPress={() => onTabPress(tab.route)}
              onLongPress={onTabLongPress ? () => onTabLongPress(tab.route) : undefined}
              delayLongPress={280}
              style={[
                styles.tab,
                {
                  minHeight: tokens.footer.tabMinHeight,
                  paddingHorizontal: isCompact ? 2 : 0,
                },
              ]}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <View style={styles.indicatorWrap}>
                <View
                  style={[
                    styles.indicator,
                    {
                      width: tokens.footer.indicatorWidth,
                      height: tokens.footer.indicatorHeight,
                      backgroundColor: tokens.colors.footerIndicator,
                      opacity: isActive ? 1 : 0,
                    },
                  ]}
                />
              </View>
              <View
                style={[
                  styles.iconWrap,
                  {
                    width: tokens.footer.iconWrapSize,
                    height: tokens.footer.iconWrapSize,
                  },
                ]}
              >
                {renderIcon(tab, iconColor, isActive)}
                {unreadCount > 0 ? (
                  <View
                    style={[
                      styles.unreadBadge,
                      {
                        backgroundColor: tokens.colors.unreadBadgeBackground,
                        minWidth: unreadBadgeSize,
                        height: unreadBadgeSize,
                        borderRadius: unreadBadgeSize / 2,
                        top: unreadBadgeTop,
                        right: unreadBadgeRight,
                        paddingHorizontal: isCompact ? 3 : 4,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.unreadBadgeText,
                        {
                          color: tokens.colors.unreadBadgeText,
                          fontSize: unreadBadgeFontSize,
                        },
                      ]}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                numberOfLines={tokens.footer.labelMaxLines}
                ellipsizeMode={tokens.footer.labelMaxLines === 1 ? "tail" : "clip"}
                allowFontScaling={false}
                style={[
                  styles.label,
                  {
                    color: iconColor,
                    fontSize: tokens.footer.labelSize,
                    lineHeight: tokens.footer.labelLineHeight,
                    fontWeight: isActive ? "700" : "600",
                    marginTop: tokens.footer.labelMarginTop,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorWrap: {
    height: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  indicator: {
    borderRadius: 999,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -8,
    right: -11,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  label: {
    marginTop: 4,
    letterSpacing: 0.15,
    textAlign: "center",
    width: "100%",
  },
});
