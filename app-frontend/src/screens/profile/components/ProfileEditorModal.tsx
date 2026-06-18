import { ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../hooks/useTheme";

type Props = {
  title: string;
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  children: ReactNode;
  error?: string | null;
};

export const ProfileEditorModal = ({ title, visible, onClose, onSubmit, saving, children, error }: Props) => {
  const { colors, spacing } = useTheme();
  // react-native-safe-area-context's <SafeAreaView> can't read insets from
  // inside a React Native <Modal> (the Modal opens in a separate native
  // window without access to the SafeAreaProvider's native bindings). The
  // useSafeAreaInsets hook still works because it reads from JS context,
  // so we apply paddingTop/paddingBottom manually. Without this the
  // header sat under the notch/status bar on every profile edit screen.
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalSafeArea, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalClose} activeOpacity={0.7}>
            <Text style={[styles.modalCloseText, { color: colors.textMuted }]}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          {children}
          {error ? <Text style={[styles.errorText, { marginTop: spacing.md, color: colors.error }]}>{error}</Text> : null}
        </ScrollView>
        <View style={[styles.footer, { paddingHorizontal: spacing.lg, paddingBottom: Math.max(spacing.md, insets.bottom + 8), borderTopColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.primaryButton, { opacity: saving ? 0.7 : 1, backgroundColor: colors.primary }]}
            onPress={onSubmit}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save changes</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalClose: {
    marginRight: 12,
  },
  modalCloseText: {
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  primaryButton: {
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  errorText: {
    marginBottom: 8,
  },
});
