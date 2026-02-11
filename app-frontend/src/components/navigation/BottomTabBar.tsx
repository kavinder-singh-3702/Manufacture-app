// Legacy tab bar component retained for older screens. Active bottom rail is FooterRail in src/navigation/MainTabs.tsx.
import { FC } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, ImageSourcePropType, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { RouteName } from "../../navigation/routes";

type IoniconName = keyof typeof Ionicons.glyphMap;

type TabItem = {
  route: RouteName;
  label: string;
  icon: IoniconName | ImageSourcePropType;
};

type BottomTabBarProps = {
  activeRoute: RouteName;
  onTabPress: (route: RouteName) => void;
  tabs: TabItem[];
};

export const BottomTabBar: FC<BottomTabBarProps> = ({
  activeRoute,
  onTabPress,
  tabs
}) => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const { width, fontScale } = useWindowDimensions();
  const tabBackground = resolvedMode === "dark" ? colors.backgroundSecondary : colors.background;
  const tabBorder = resolvedMode === "dark" ? "rgba(255,255,255,0.12)" : colors.borderDark;
  const isXCompact = width <= 330 || fontScale > 1.25;
  const isCompact = !isXCompact && (width <= 360 || fontScale > 1.1);

  const iconSize = isXCompact ? 20 : isCompact ? 22 : 24;
  const imageSize = isXCompact ? 22 : isCompact ? 24 : 26;
  const labelFontSize = isXCompact ? 9.5 : isCompact ? 10.5 : 13;
  const labelLineHeight = isXCompact ? 11 : isCompact ? 12 : 15;
  const labelLines = isCompact || isXCompact ? 2 : 1;
  const containerVerticalPadding = isXCompact ? 5 : isCompact ? 7 : 10;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tabBackground,
          borderTopColor: tabBorder,
          paddingVertical: containerVerticalPadding,
          paddingHorizontal: isCompact || isXCompact ? 2 : 0,
        }
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeRoute === tab.route;

        return (
          <TouchableOpacity
            key={tab.route}
            style={[
              styles.tab,
              {
                minHeight: isXCompact ? 46 : isCompact ? 48 : 52,
                paddingHorizontal: isCompact || isXCompact ? 2 : 0,
              },
            ]}
            onPress={() => onTabPress(tab.route)}
            activeOpacity={0.7}
          >
            {typeof tab.icon === "string" ? (
              <Ionicons
                name={tab.icon}
                size={iconSize}
                color={isActive ? colors.textSecondary : colors.textMuted}
              />
            ) : (
              <Image
                source={tab.icon}
                style={{
                  width: imageSize,
                  height: imageSize,
                  tintColor: isActive ? colors.textSecondary : colors.textMuted,
                  resizeMode: "contain"
                }}
              />
            )}
            <Text
              numberOfLines={labelLines}
              ellipsizeMode={labelLines === 1 ? "tail" : "clip"}
              allowFontScaling={false}
              style={[
                styles.label,
                {
                  color: isActive ? colors.textSecondary : colors.textMuted,
                  fontSize: labelFontSize,
                  lineHeight: labelLineHeight,
                  marginTop: isCompact || isXCompact ? 2 : 4,
                }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 10,
    borderTopWidth: 1,
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  }
});
