import { useQuery } from "@tanstack/react-query";

import { adminService, AdminCallLogDetail } from "../../services/admin.service";

export const ADMIN_CALL_LOG_KEY = ["admin", "call-log"] as const;

export const useAdminCallLog = (id: string | undefined) => {
  const query = useQuery({
    queryKey: id ? [...ADMIN_CALL_LOG_KEY, id] : [...ADMIN_CALL_LOG_KEY, "noop"],
    enabled: Boolean(id),
    queryFn: async (): Promise<AdminCallLogDetail> => {
      if (!id) throw new Error("id is required");
      return adminService.getAdminCallLog(id);
    },
  });
  return {
    callLog: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
  };
};
