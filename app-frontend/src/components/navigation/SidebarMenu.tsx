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
  const { colors, spacing, radius } = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.wrapper}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
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
              },
            ]}
          >
            <View style={{ marginBottom: spacing.lg }}>
              <Typography variant="subheading">{headerTitle}</Typography>
              {headerSubtitle ? (
                <Typography variant="body" color={colors.muted} style={{ marginTop: spacing.xs }}>
                  {headerSubtitle}
                </Typography>
              ) : null}
            </View>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                style={[
                  styles.menuItem,
                  {
                    borderBottomColor: colors.border,
                    paddingVertical: spacing.md,
                  },
                ]}
              >
                <Typography variant="body" color={item.tone === "danger" ? colors.critical : colors.text}>
                  {item.label}
                </Typography>
                {item.description ? (
                  <Typography variant="caption" color={colors.muted} style={{ marginTop: spacing.xs }}>
                    {item.description}
                  </Typography>
                ) : null}
              </TouchableOpacity>
            ))}
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
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  panel: {
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: -4, height: 0 },
    shadowRadius: 8,
    elevation: 10,
  },
  panelSafeArea: {
    width: "75%",
  },
  menuItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
