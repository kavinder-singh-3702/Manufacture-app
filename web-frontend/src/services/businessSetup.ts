import { httpClient } from "../lib/http-client";
import type { BusinessSetupRequest, CreateBusinessSetupRequestInput } from "../types/businessSetup";

const create = async (payload: CreateBusinessSetupRequestInput) => {
  const res = await httpClient.post<{ request: BusinessSetupRequest; trackingReference: string }>(
    "/business-setup-requests",
    payload
  );
  return res;
};

const listMine = async () =>
  httpClient.get<{ requests: BusinessSetupRequest[] }>("/business-setup-requests/me");

export const businessSetupService = { create, listMine };
