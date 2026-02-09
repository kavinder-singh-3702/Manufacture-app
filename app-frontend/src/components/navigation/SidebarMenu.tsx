import { Modal, View, TouchableWithoutFeedback, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";

type MenuItem = {
  label: string;
  description?: string;
  onPress: () => void;
  tone?: "default" | "danger";
  isActive?: boolean;
};

type SidebarMenuProps = {
  visible: boolean;
  onClose: () => void;
  headerTitle?: string;
  headerSubtitle?: string;
  menuItems: MenuItem[];
};

export const SidebarMenu = ({ visible, onClose, headerTitle, headerSubtitle, menuItems }: SidebarMenuProps) => {
  const { spacing, radius, colors } = useTheme();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.wrapper}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={[styles.backdrop, { backgroundColor: colors.modalBackdrop }]} />
        </TouchableWithoutFeedback>
        <SafeAreaView style={styles.panelSafeArea}>
          <LinearGradient
            colors={[colors.sidebarGradientStart, colors.sidebarGradientMid, colors.sidebarGradientEnd]}
            locations={[0, 0.5, 1]}
            style={[
              styles.panel,
              {
                padding: spacing.lg,
                borderTopRightRadius: radius.lg,
                borderBottomRightRadius: radius.lg,
              },
            ]}
          >
            <LinearGradient
              colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlayAccent]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderTopRightRadius: radius.lg, borderBottomRightRadius: radius.lg }]}
            />
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.header,
                {
                  padding: spacing.lg,
                  borderRadius: radius.md,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.1)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
              />
              <Typography variant="subheading" color="#FFFFFF" style={styles.headerTitle}>
                {headerTitle}
              </Typography>
              {headerSubtitle ? (
                <Typography variant="body" color="rgba(255,255,255,0.8)" style={{ marginTop: spacing.xs, fontSize: 13 }}>
                  {headerSubtitle}
                </Typography>
              ) : null}
            </LinearGradient>

            {menuItems.map((item, index) => {
              const isDanger = item.tone === "danger";
              const isActive = item.isActive || false;
              const isLastItem = index === menuItems.length - 1;

              const getItemStyles = () => {
                if (isDanger) {
                  return {
                    bg: colors.error + "1a",
                    border: colors.error,
                    shadowColor: colors.error,
                  };
                }
                if (isActive) {
                  return {
                    bg: colors.primary + "24",
                    border: colors.primary,
                    shadowColor: colors.primary,
                  };
                }
                return {
                  bg: colors.surfaceElevated,
                  border: "transparent",
                  shadowColor: "#000",
                };
              };

              const itemStyles = getItemStyles();

              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  style={[
                    styles.menuItem,
                    {
                      backgroundColor: itemStyles.bg,
                      borderLeftWidth: 3,
                      borderLeftColor: itemStyles.border,
                      borderRadius: radius.md,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.md,
                      marginBottom: isLastItem ? 0 : spacing.sm,
                      shadowColor: itemStyles.shadowColor,
                      shadowOffset: { width: 0, height: isActive ? 4 : 2 },
                      shadowOpacity: isActive ? 0.25 : 0.1,
                      shadowRadius: isActive ? 8 : 4,
                      elevation: isActive ? 6 : 2,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Typography variant="body" color={isDanger ? colors.error : colors.text} style={styles.menuLabel}>
                    {item.label}
                  </Typography>
                  {item.description ? (
                    <Typography variant="caption" color={isDanger ? colors.errorLight : colors.textMuted} style={{ marginTop: spacing.xs, fontSize: 12 }}>
                      {item.description}
                    </Typography>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </LinearGradient>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    flex: 1,
    shadowOpacity: 0.18,
    shadowOffset: { width: -4, height: 0 },
    shadowRadius: 12,
    elevation: 15,
  },
  panelSafeArea: {
    width: "80%",
    maxWidth: 340,
  },
  header: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  menuItem: {
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
