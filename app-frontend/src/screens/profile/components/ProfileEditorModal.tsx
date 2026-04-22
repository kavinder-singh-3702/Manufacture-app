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
import { SafeAreaView } from "react-native-safe-area-context";
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
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: colors.background }]}>
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
        <View style={[styles.footer, { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderTopColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.primaryButton, { opacity: saving ? 0.7 : 1, backgroundColor: colors.primary }]}
            onPress={onSubmit}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save changes</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
