import { httpClient } from "../lib/http-client";
import type { ActivityListResponse } from "../types/activity";

export type ActivityQuery = {
  limit?: number;
  companyId?: string;
  action?: string;
};

const list = (params?: ActivityQuery) =>
  httpClient.get<ActivityListResponse>("/activity", {
    params,
  });

export const activityService = {
  list,
};
