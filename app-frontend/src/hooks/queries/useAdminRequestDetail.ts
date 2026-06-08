import { useQuery } from "@tanstack/react-query";

import {
  adminService,
  AdminBusinessSetupRequest,
  AdminServiceRequest,
} from "../../services/admin.service";
import { RequestKind } from "../../constants/requestStatusTransitions";

import { queryKeys } from "./queryKeys";

export type AdminRequestDetail =
  | (AdminServiceRequest & { kind: "service" })
  | (AdminBusinessSetupRequest & { kind: "business_setup" });

/**
 * Fetch the full detail of a single admin ops request. The exact endpoint
 * depends on the kind — service vs business_setup — so the hook switches
 * automatically based on the discriminator passed in.
 *
 * Query key is shared with the list (`queryKeys.adminOpsRequests`) so a
 * mutation invalidating the parent prefix refreshes both the list rows
 * and the open detail screen in one shot.
 */
export const useAdminRequestDetail = (kind: RequestKind, id: string | undefined) => {
  const query = useQuery({
    queryKey: id ? queryKeys.adminOpsRequests.detail(kind, id) : ["admin", "ops-requests", "detail", "noop"],
    enabled: Boolean(id),
    queryFn: async (): Promise<AdminRequestDetail> => {
      if (!id) throw new Error("id is required");
      if (kind === "service") {
        const request = await adminService.getServiceRequestById(id);
        return { ...request, kind: "service" };
      }
      const request = await adminService.getBusinessSetupRequestById(id);
      return { ...request, kind: "business_setup" };
    },
  });

  return {
    detail: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    error: query.error,
  };
};
