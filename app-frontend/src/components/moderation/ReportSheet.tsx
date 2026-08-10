import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../ui/Toast";
import { ApiError } from "../../services/http";
import {
  moderationService,
  REPORT_REASON_LABELS,
  type ReportReason,
  type ReportTargetType,
} from "../../services/moderation.service";

const REASON_ORDER: ReportReason[] = [
  "spam",
  "scam_or_fraud",
  "counterfeit_or_misleading",
  "inappropriate",
  "harassment",
  "other",
];

/**
 * Shared report bottom sheet used from every surface that hosts
 * user-generated content (product listings, chat messages, user
 * profiles). Backs Apple App Store Guideline 1.2.
 */
export const ReportSheet = ({
  visible,
  targetType,
  targetId,
  targetLabel,
  onClose,
  onSubmitted,
}: {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string | null;
  /** Short human label shown in the header, e.g. the product name. */
  targetLabel?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { success: toastSuccess, error: toastError } = useToast();

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReason(null);
    setDetails("");
    setSubmitting(false);
  }, [visible]);

  const handleSubmit = useCallback(async () => {
    if (!reason || !targetId || submitting) return;
    setSubmitting(true);
    try {
      await moderationService.submitReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      toastSuccess("Report submitted", "Our team will review this shortly.");
      onClose();
      onSubmitted?.();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Could not submit report.";
      toastError("Report failed", message);
    } finally {
      setSubmitting(false);
    }
  }, [details, onClose, onSubmitted, reason, submitting, targetId, targetType, toastError, toastSuccess]);

  const targetNoun =
    targetType === "product" ? "listing" : targetType === "message" ? "message" : "user";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.modalBackdrop }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: Math.max(insets.bottom, 12) + 8,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                },
              ]}
            >
              <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: spacing.lg }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.title, { color: colors.text }]}>Report {targetNoun}</Text>
                  {targetLabel ? (
                    <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                      {targetLabel}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 420 }}
                contentContainerStyle={{ padding: spacing.lg }}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.label, { color: colors.text }]}>Why are you reporting this?</Text>
                <View style={{ gap: 8, marginTop: 10 }}>
                  {REASON_ORDER.map((value) => {
                    const active = reason === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => setReason(value)}
                        activeOpacity={0.85}
                        style={[
                          styles.reasonRow,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? colors.primary + "12" : colors.surface,
                            borderRadius: radius.md,
                          },
                        ]}
                      >
                        <Ionicons
                          name={active ? "radio-button-on" : "radio-button-off"}
                          size={18}
                          color={active ? colors.primary : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.reasonText,
                            { color: active ? colors.primary : colors.text, fontWeight: active ? "800" : "600" },
                          ]}
                        >
                          {REPORT_REASON_LABELS[value]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.label, { color: colors.text, marginTop: spacing.lg }]}>
                  Additional details (optional)
                </Text>
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Anything that helps us review this faster"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  maxLength={2000}
                  style={[
                    styles.detailsInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceElevated,
                      borderRadius: radius.md,
                    },
                  ]}
                />
              </ScrollView>

              <View style={{ paddingHorizontal: spacing.lg, paddingTop: 4 }}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!reason || submitting}
                  activeOpacity={0.85}
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: reason ? colors.error : colors.error + "55",
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit report</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: { width: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: "800" },
  subtitle: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  label: { fontSize: 13, fontWeight: "700" },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reasonText: { fontSize: 14, flex: 1 },
  detailsInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginTop: 10,
    minHeight: 90,
    textAlignVertical: "top",
  },
  submitBtn: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
});
