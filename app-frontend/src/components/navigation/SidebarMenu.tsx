import { Modal, View, TouchableWithoutFeedback, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";

type MenuItem = {
  label: string;
  description?: string;
  onPress: () => void;
  tone?: "default" | "danger";
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
          <View style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.45)" }]} />
        </TouchableWithoutFeedback>
        <SafeAreaView style={styles.panelSafeArea}>
          <View
            style={[
              styles.panel,
              {
                backgroundColor: colors.surface,
                padding: spacing.lg,
                borderTopRightRadius: radius.lg,
                borderBottomRightRadius: radius.lg,
                shadowColor: colors.text,
              },
            ]}
          >
            {/* Header Section with Brand Colors */}
            <View style={[styles.header, {
              backgroundColor: colors.secondary,
              padding: spacing.lg,
              borderRadius: radius.md,
              marginBottom: spacing.lg,
            }]}>
              <Typography variant="subheading" color={colors.textOnSecondary} style={styles.headerTitle}>
                {headerTitle}
              </Typography>
              {headerSubtitle ? (
                <Typography variant="body" color={colors.primary} style={{ marginTop: spacing.xs, fontSize: 13 }}>
                  {headerSubtitle}
                </Typography>
              ) : null}
            </View>

            {/* Menu Items */}
            {menuItems.map((item, index) => {
              const isDanger = item.tone === "danger";
              const isLastItem = index === menuItems.length - 1;

              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  style={[
                    styles.menuItem,
                    {
                      backgroundColor: isDanger ? colors.errorBg : colors.surfaceElevated,
                      borderLeftWidth: 3,
                      borderLeftColor: isDanger ? colors.error : colors.primary,
                      borderRadius: radius.md,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.md,
                      marginBottom: isLastItem ? 0 : spacing.sm,
                      shadowColor: colors.text,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Typography
                    variant="body"
                    color={isDanger ? colors.error : colors.text}
                    style={styles.menuLabel}
                  >
                    {item.label}
                  </Typography>
                  {item.description ? (
                    <Typography
                      variant="caption"
                      color={isDanger ? colors.errorLight : colors.textMuted}
                      style={{ marginTop: spacing.xs, fontSize: 12 }}
                    >
                      {item.description}
                    </Typography>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
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
