import { httpClient, QueryParams } from "../lib/http-client";
import type { CreateServiceRequestInput, ServiceListResponse, ServiceRequest, ServiceStatus, ServiceType } from "../types/service";

const toQuery = (params?: Record<string, unknown>): QueryParams | undefined => {
  if (!params) return undefined;
  const out: QueryParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
  });
  return Object.keys(out).length ? out : undefined;
};

const create = async (payload: CreateServiceRequestInput) => {
  const res = await httpClient.post<{ request: ServiceRequest }>("/services", payload);
  return res.request;
};

const list = (params?: { type?: ServiceType; status?: ServiceStatus; limit?: number; offset?: number; sort?: string }) =>
  httpClient.get<ServiceListResponse>("/services", { params: toQuery(params) });

const getById = async (serviceId: string) => {
  const res = await httpClient.get<{ request: ServiceRequest }>(`/services/${serviceId}`);
  return res.request;
};

export const serviceRequestService = { create, list, getById };
