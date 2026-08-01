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
  // Controller returns `{ service, message }` (backend/src/modules/services/
  // controllers/service.controller.js) — this used to read `res.request`,
  // which is always undefined. Harmless while the return value went unused,
  // but blocks anything (e.g. a success screen showing the created request)
  // from relying on it.
  const res = await httpClient.post<{ service: ServiceRequest }>("/services", payload);
  return res.service;
};

// Param is named `serviceType` (not `type`) to match what the backend's
// listServiceRequests actually reads off req.query (filters.serviceType) —
// the old `type` name silently no-op'd every server-side type filter since
// nothing on the backend ever looked at a `type` query param.
const list = (params?: { serviceType?: ServiceType; status?: ServiceStatus; limit?: number; offset?: number; sort?: string }) =>
  httpClient.get<ServiceListResponse>("/services", { params: toQuery(params) });

const getById = async (serviceId: string) => {
  // Same `{ service }` shape as create() — was reading `res.request` and
  // always resolving `undefined`, which is why the detail page showed
  // "Request not found" for every valid service request.
  const res = await httpClient.get<{ service: ServiceRequest }>(`/services/${serviceId}`);
  return res.service;
};

export const serviceRequestService = { create, list, getById };
