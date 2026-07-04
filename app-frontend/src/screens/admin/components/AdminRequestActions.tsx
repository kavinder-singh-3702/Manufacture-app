import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../hooks/useTheme";
import { useAuth } from "../../../hooks/useAuth";
import { ReasonInputModal } from "../../../components/admin";
import { AdminRequestDetail } from "../../../hooks/queries/useAdminRequestDetail";
import { useUpdateRequestWorkflow } from "../../../hooks/queries/useUpdateRequestWorkflow";
import {
  AllowedTransition,
  allowedTransitionsFor,
  toStatusLabel,
} from "../../../constants/requestStatusTransitions";

type Props = {
  detail: AdminRequestDetail;
  onAdvanced?: () => void;
};

/**
 * Action bar for the admin request detail screen.
 *
 * This is where the audit's CRITICAL "Advance no-op" bug is fixed. The old
 * AdminOpsConsoleScreen rendered ReasonInputModal nested INSIDE the detail
 * Modal, so tapping Advance from the list returned null for the whole subtree
 * and silently did nothing. Here, the modal lives at screen root and is
 * mounted whenever `pendingTarget` is non-null — independent of whether a
 * parent modal is visible.
 *
 * The PATCH includes `expectedUpdatedAt` (optimistic concurrency token) so
 * the backend rejects with 409 if someone else moved the request between when
 * we loaded it and when the admin tapped Advance. We surface that specifically.
 */
export const AdminRequestActions = ({ detail, onAdvanced }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const mutation = useUpdateRequestWorkflow(detail.kind, detail.id);

  const [pendingTarget, setPendingTarget] = useState<AllowedTransition | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Prefer the server-provided transitions (phase 3). Fall back to the
  // hardcoded constants if the field is missing — happens during the rollout
  // window before the new backend ships, or on older API caches.
  const serverTransitions = (detail as { allowedTransitions?: { status: string; isPrimary: boolean }[] })
    .allowedTransitions;
  const transitions: AllowedTransition[] =
    serverTransitions && serverTransitions.length > 0
      ? serverTransitions.map((t) => ({
          status: t.status,
          label: toStatusLabel(t.status),
          isPrimary: t.isPrimary,
        }))
      : allowedTransitionsFor(detail.kind, detail.status);
  const primary = transitions.find((t) => t.isPrimary);
  const secondary = transitions.filter((t) => !t.isPrimary);

  const startAdvance = (target: AllowedTransition) => {
    setPendingTarget(target);
    setReason("");
    setError(null);
  };

  const cancelAdvance = () => {
    if (mutation.isPending) return;
    setPendingTarget(null);
    setReason("");
    setError(null);
  };

  const confirmAdvance = async () => {
    if (!pendingTarget) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please add a reason — it's recorded in the audit trail.");
      return;
    }

    try {
      // Backend requires contextCompanyId for any non-super-admin actor
      // (permissions.js validateMutationContext). When the request has
      // no company attached (e.g. a service request from a normal user),
      // detail.company?.id is undefined and the PATCH 400s with
      // "contextCompanyId is required for admin mutations". Fall back
      // to the admin's own activeCompany so the mutation proceeds.
      // The backend's "must match target" check only fires when
      // targetCompanyId is also set, so this is safe for company-less
      // requests.
      const contextCompanyId =
        detail.company?.id ||
        (typeof user?.activeCompany === "string" ? user.activeCompany : undefined);
      await mutation.mutateAsync({
        status: pendingTarget.status,
        reason: trimmed,
        contextCompanyId,
        expectedUpdatedAt: detail.updatedAt,
      });
      setPendingTarget(null);
      setReason("");
      setError(null);
      onAdvanced?.();
    } catch (err: any) {
      // Surface specific error shapes.
      const status = err?.response?.status ?? err?.status;
      if (status === 409) {
        setError("Someone else updated this request. Pull down to refresh and try again.");
      } else if (status === 400) {
        setError(err?.message || "That status change isn't allowed from the current state.");
      } else {
        setError(err?.message || "Could not update the request. Try again.");
      }
    }
  };

  // Nothing to do — the request is in a terminal state.
  if (transitions.length === 0) {
    return (
      <View style={[styles.terminalCard, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginHorizontal: spacing.lg }]}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.terminalTitle, { color: colors.text }]}>
            No further actions
          </Text>
          <Text style={[styles.terminalHint, { color: colors.textMuted }]}>
            This request is {toStatusLabel(detail.status)}. The workflow is closed.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Workflow actions</Text>

      {primary ? (
        <TouchableOpacity
          activeOpacity={0.88}
          disabled={mutation.isPending}
          onPress={() => startAdvance(primary)}
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.lg,
              opacity: mutation.isPending ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-forward-circle" size={20} color={colors.textOnPrimary} />
          <Text style={[styles.primaryButtonText, { color: colors.textOnPrimary }]}>
            Advance to {primary.label}
          </Text>
        </TouchableOpacity>
      ) : null}

      {secondary.length > 0 ? (
        <View style={[styles.secondaryRow, { gap: spacing.sm }]}>
          {secondary.map((t) => (
            <TouchableOpacity
              key={t.status}
              activeOpacity={0.85}
              disabled={mutation.isPending}
              onPress={() => startAdvance(t)}
              style={[
                styles.secondaryButton,
                {
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                  opacity: mutation.isPending ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Set {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <ReasonInputModal
        visible={Boolean(pendingTarget)}
        title={pendingTarget ? `Move to ${pendingTarget.label}` : ""}
        subtitle={
          pendingTarget
            ? `From ${toStatusLabel(detail.status)} → ${pendingTarget.label}. This is recorded in the audit log.`
            : undefined
        }
        value={reason}
        onChangeValue={(v) => {
          setReason(v);
          if (error) setError(null);
        }}
        onClose={cancelAdvance}
        onSubmit={confirmAdvance}
        loading={mutation.isPending}
        error={error}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  secondaryRow: { flexDirection: "row", flexWrap: "wrap" },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  secondaryButtonText: { fontSize: 13, fontWeight: "700" },
  terminalCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  terminalTitle: { fontSize: 14, fontWeight: "800" },
  terminalHint: { fontSize: 12, fontWeight: "600", marginTop: 2 },
});
