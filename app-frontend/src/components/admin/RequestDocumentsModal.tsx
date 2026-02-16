import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { adminService, AdminCompany } from "../../services/admin.service";

// ============================================================
// PROPS TYPE
// ============================================================
type RequestDocumentsModalProps = {
  visible: boolean;
  company: AdminCompany | null;
  onClose: () => void;
  onSuccess: () => void;
};

// ============================================================
// REQUEST DOCUMENTS MODAL
// ============================================================
// Modal for admins to request verification documents from pending companies
// Allows adding a custom message and choosing notification methods

export const RequestDocumentsModal = ({
  visible,
  company,
  onClose,
  onSuccess,
}: RequestDocumentsModalProps) => {
  // ------------------------------------------------------------
  // HOOKS & THEME
  // ------------------------------------------------------------
  const { colors, spacing } = useTheme();

  // ------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------
  // RESET STATE ON CLOSE
  // ------------------------------------------------------------
  const handleClose = () => {
    setMessage("");
    setSendEmail(true);
    setSendNotification(true);
    setError(null);
    onClose();
  };

  // ------------------------------------------------------------
  // SUBMIT REQUEST
  // ------------------------------------------------------------
  const handleSubmit = async () => {
    if (!company) {
      setError("Select a company before sending the request.");
      return;
    }

    // Validate at least one notification method is selected
    if (!sendEmail && !sendNotification) {
      setError("Please select at least one notification method");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await adminService.requestDocuments(company.id, {
        message: message.trim() || undefined,
        sendEmail,
        sendNotification,
        contextCompanyId: company.id,
      });

      // Success - close modal and notify parent
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error("Failed to request documents:", err);
      setError(err.message || "Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderRadius: 16,
              margin: spacing.lg,
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={{ padding: spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            {/* ========== HEADER ========== */}
            <Text style={[styles.title, { color: colors.text }]}>
              Request Documents
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.textSecondary, marginTop: spacing.xs },
              ]}
            >
              {company ? (
                <>
                  Send a request to{" "}
                  <Text style={{ fontWeight: "600", color: colors.text }}>
                    {company.displayName}
                  </Text>{" "}
                  to submit their verification documents
                </>
              ) : (
                "No company selected. Close this sheet and try again."
              )}
            </Text>

            {/* ========== OWNER INFO ========== */}
            {company?.owner && (
              <View
                style={[
                  styles.ownerCard,
                  {
                    backgroundColor: colors.background,
                    padding: spacing.md,
                    borderRadius: 8,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Text style={[styles.ownerLabel, { color: colors.textMuted }]}>
                  Owner Details
                </Text>
                <Text style={[styles.ownerName, { color: colors.text }]}>
                  {company.owner.displayName}
                </Text>
                <Text style={[styles.ownerEmail, { color: colors.textSecondary }]}>
                  {company.owner.email}
                </Text>
              </View>
            )}

            {/* ========== NOTIFICATION OPTIONS ========== */}
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: spacing.lg },
              ]}
            >
              Notification Method
            </Text>

            <View
              style={[
                styles.switchRow,
                {
                  backgroundColor: colors.background,
                  padding: spacing.md,
                  borderRadius: 8,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <View style={styles.switchInfo}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  Send Email
                </Text>
                <Text style={[styles.switchDesc, { color: colors.textMuted }]}>
                  Email will be sent to {company?.owner?.email || "owner"}
                </Text>
              </View>
              <Switch
                value={sendEmail}
                onValueChange={setSendEmail}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={sendEmail ? colors.primary : colors.textMuted}
                disabled={!company}
              />
            </View>

            <View
              style={[
                styles.switchRow,
                {
                  backgroundColor: colors.background,
                  padding: spacing.md,
                  borderRadius: 8,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <View style={styles.switchInfo}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  Send In-App Notification
                </Text>
                <Text style={[styles.switchDesc, { color: colors.textMuted }]}>
                  Notification will appear in their app
                </Text>
              </View>
              <Switch
                value={sendNotification}
                onValueChange={setSendNotification}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={sendNotification ? colors.primary : colors.textMuted}
                disabled={!company}
              />
            </View>

            {/* ========== CUSTOM MESSAGE ========== */}
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: spacing.lg },
              ]}
            >
              Custom Message (Optional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                  padding: spacing.md,
                  borderRadius: 8,
                  marginTop: spacing.sm,
                },
              ]}
              placeholder="Add a personalized message to include in the request..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              editable={!loading && !!company}
            />
            <Text
              style={[
                styles.charCount,
                { color: colors.textMuted, marginTop: spacing.xs },
              ]}
            >
              {message.length}/500 characters
            </Text>

            {/* ========== ERROR MESSAGE ========== */}
            {error && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.error + "15",
                    padding: spacing.md,
                    borderRadius: 8,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* ========== ACTION BUTTONS ========== */}
            <View style={[styles.buttonRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: 8,
                  },
                ]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  {
                    backgroundColor: colors.primary,
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: 8,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={loading || !company}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownerCard: {},
  ownerLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  ownerEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  switchDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  textArea: {
    borderWidth: 1,
    minHeight: 100,
    fontSize: 14,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
  },
  errorBox: {},
  errorText: {
    fontSize: 13,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 130,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {},
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
