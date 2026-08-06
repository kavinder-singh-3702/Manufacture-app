import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../hooks/useTheme";
import { AdminOpsCounts } from "../../services/admin.service";
import {
  KIND_LABELS,
  PRIORITY_LABELS,
  RequestsFilters,
  RequestsKindFilter,
  RequestsPriority,
  RequestsSort,
  RequestsStatusBucket,
  SORT_LABELS,
  STATUS_BUCKET_LABELS,
} from "../../types/requestsFilters";

type Props = {
  visible: boolean;
  initial: RequestsFilters;
  /** Bucket/kind-independent summary counts (GET /admin/ops-requests `counts`).
   * When present, appended to the Kind and Status chip labels so the admin can
   * see how many requests each option contains before switching to it. */
  counts?: AdminOpsCounts;
  onClose: () => void;
  onApply: (next: RequestsFilters) => void;
};

const KIND_COUNT_KEY: Partial<Record<RequestsKindFilter, keyof AdminOpsCounts>> = {
  all: "total",
  service: "service",
  business_setup: "business_setup",
};

const STATUS_COUNT_KEY: Partial<Record<RequestsStatusBucket, keyof AdminOpsCounts>> = {
  all: "total",
  open: "open",
  closed: "closed",
  rejected: "rejected",
};

const KIND_OPTIONS: RequestsKindFilter[] = ["all", "service", "business_setup"];
const STATUS_OPTIONS: RequestsStatusBucket[] = ["all", "open", "closed", "rejected"];
const PRIORITY_OPTIONS: RequestsPriority[] = ["all", "urgent", "high", "normal", "low"];
const SORT_OPTIONS: RequestsSort[] = [
  "updatedAt:desc",
  "createdAt:desc",
  "priority:desc",
  "updatedAt:asc",
  "createdAt:asc",
];

/**
 * Full-screen pageSheet Modal — matches the existing ReasonInputModal pattern
 * so we don't pull in @gorhom/bottom-sheet (deferred per the rebuild plan).
 * Local pending state stays inside the sheet so the admin can revise and tap
 * Apply once; Cancel discards.
 */
export const RequestsFilterSheet = ({ visible, initial, counts, onClose, onApply }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const [pending, setPending] = useState<RequestsFilters>(initial);

  // Re-sync pending → initial every time the sheet opens. Without this an
  // admin who opens, closes without applying, then re-opens would see stale
  // draft values from the previous editing session.
  useEffect(() => {
    if (visible) setPending(initial);
  }, [visible, initial]);

  const apply = () => {
    onApply(pending);
    onClose();
  };

  const cancel = () => {
    setPending(initial);
    onClose();
  };

  const resetAll = () => {
    setPending({
      kind: "all",
      statusBucket: "open",
      priority: "all",
      sort: "updatedAt:desc",
    });
  };

  const renderChipRow = <T extends string>(
    title: string,
    options: readonly T[],
    selected: T,
    onChange: (next: T) => void,
    labels: Readonly<Record<T, string>>,
    countKeys?: Partial<Record<T, keyof AdminOpsCounts>>
  ) => (
    <View style={{ gap: spacing.xs }}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.chipRow, { gap: spacing.xs }]}>
        {options.map((opt) => {
          const isActive = selected === opt;
          const countKey = countKeys?.[opt];
          const count = counts && countKey ? counts[countKey] : undefined;
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.85}
              onPress={() => onChange(opt)}
              style={[
                styles.chip,
                {
                  borderRadius: radius.pill,
                  borderColor: isActive ? colors.primary : colors.border,
                  backgroundColor: isActive ? colors.primary + "1a" : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? colors.primary : colors.text },
                ]}
              >
                {labels[opt]}{count !== undefined ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={cancel}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={cancel} hitSlop={12}>
            <Text style={[styles.headerAction, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={resetAll} hitSlop={12}>
            <Text style={[styles.headerAction, { color: colors.primary }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{
              padding: spacing.lg,
              gap: spacing.lg,
              paddingBottom: spacing.xxl,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {renderChipRow<RequestsKindFilter>(
              "Kind",
              KIND_OPTIONS,
              pending.kind,
              (next) => setPending((p) => ({ ...p, kind: next })),
              KIND_LABELS,
              KIND_COUNT_KEY
            )}

            {renderChipRow<RequestsStatusBucket>(
              "Status",
              STATUS_OPTIONS,
              pending.statusBucket,
              (next) => setPending((p) => ({ ...p, statusBucket: next })),
              STATUS_BUCKET_LABELS,
              STATUS_COUNT_KEY
            )}

            {renderChipRow<RequestsPriority>(
              "Priority",
              PRIORITY_OPTIONS,
              pending.priority,
              (next) => setPending((p) => ({ ...p, priority: next })),
              PRIORITY_LABELS
            )}

            {renderChipRow<RequestsSort>(
              "Sort by",
              SORT_OPTIONS,
              pending.sort,
              (next) => setPending((p) => ({ ...p, sort: next })),
              SORT_LABELS
            )}

            <View style={{ gap: spacing.xs }}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Date range</Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                ISO format YYYY-MM-DD. Leave blank for any date.
              </Text>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>From</Text>
                  <TextInput
                    placeholder="2026-01-01"
                    placeholderTextColor={colors.textTertiary}
                    value={pending.from || ""}
                    onChangeText={(v) => setPending((p) => ({ ...p, from: v || undefined }))}
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, borderRadius: radius.md },
                    ]}
                    autoCorrect={false}
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>To</Text>
                  <TextInput
                    placeholder="2026-12-31"
                    placeholderTextColor={colors.textTertiary}
                    value={pending.to || ""}
                    onChangeText={(v) => setPending((p) => ({ ...p, to: v || undefined }))}
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, borderRadius: radius.md },
                    ]}
                    autoCorrect={false}
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={apply}
            activeOpacity={0.88}
            style={[
              styles.applyButton,
              { backgroundColor: colors.primary, borderRadius: radius.lg },
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimary} />
            <Text style={[styles.applyButtonText, { color: colors.textOnPrimary }]}>
              Apply filters
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerAction: { fontSize: 14, fontWeight: "700" },
  headerTitle: { fontSize: 16, fontWeight: "900", letterSpacing: -0.2 },
  sectionTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase" },
  hint: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "700" },
  inputLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  applyButtonText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
});
