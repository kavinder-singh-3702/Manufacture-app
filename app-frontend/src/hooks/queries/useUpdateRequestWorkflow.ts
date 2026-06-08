import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  adminService,
  AdminBusinessSetupRequest,
  AdminServiceRequest,
} from "../../services/admin.service";
import { RequestKind } from "../../constants/requestStatusTransitions";

import { queryKeys } from "./queryKeys";

export type WorkflowUpdatePayload = {
  status?: string;
  priority?: string;
  assignedTo?: string | null;
  slaDueAt?: string | null;
  note?: string;
  reason: string;
  contextCompanyId?: string;
  /** Optimistic-concurrency token from the detail. Backend rejects with 409 if stale. */
  expectedUpdatedAt?: string;
};

export type WorkflowUpdateResult = {
  request: AdminServiceRequest | AdminBusinessSetupRequest;
  message: string;
};

/**
 * Mutation hook for the per-kind workflow PATCH endpoint.
 *
 * On success the hook invalidates BOTH the open detail key and the prefix for
 * the list, so the rows in RequestsTab also refresh. The mutation surfaces
 * a typed error object so the screen can render specific UX for:
 *   - 409 Conflict (someone else moved the request, refetch + retry)
 *   - 400 Bad Transition (UI is stale relative to backend allowed transitions)
 *   - generic network / 5xx failures
 *
 * This is the wiring that **fixes the CRITICAL audit bug** — the Advance action
 * in AdminOpsConsoleScreen was rendered inside a nested unmounted Modal and
 * never actually called this endpoint. AdminRequestDetailScreen uses this hook
 * directly, no nested Modal.
 */
export const useUpdateRequestWorkflow = (kind: RequestKind, id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: WorkflowUpdatePayload): Promise<WorkflowUpdateResult> => {
      if (kind === "service") {
        return adminService.updateServiceRequestWorkflow(id, payload);
      }
      return adminService.updateBusinessSetupRequestWorkflow(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOpsRequests.detail(kind, id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOpsRequests.all });
    },
  });
};
