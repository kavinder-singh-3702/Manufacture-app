import { Ionicons } from "@expo/vector-icons";
import { ServicePriority, ServiceStatus, ServiceType } from "../../services/serviceRequest.service";

export type ServiceMeta = {
  type: ServiceType;
  title: string;
  subtitle: string;
  quickHint: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const SERVICE_META: Record<ServiceType, ServiceMeta> = {
  machine_repair: {
    type: "machine_repair",
    title: "Machine Repair",
    subtitle: "Diagnostics, OEM-safe fixes, planned downtime",
    quickHint: "Machine type and issue summary required",
    icon: "construct-outline",
  },
  worker: {
    type: "worker",
    title: "Expert Workforce",
    subtitle: "Technicians, operators, supervisors",
    quickHint: "Industry and headcount required",
    icon: "people-outline",
  },
  transport: {
    type: "transport",
    title: "Transport & Fleet",
    subtitle: "Road, rail, air and sea coordination",
    quickHint: "Pickup and drop city required",
    icon: "car-outline",
  },
};

export type ServiceStatusTone = "neutral" | "warning" | "info" | "progress" | "success" | "danger";

export const SERVICE_STATUS_META: Record<
  ServiceStatus,
  { label: string; tone: ServiceStatusTone }
> = {
  pending: { label: "Pending", tone: "warning" },
  in_review: { label: "In Review", tone: "info" },
  scheduled: { label: "Scheduled", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "progress" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export const SERVICE_PRIORITY_META: Record<
  ServicePriority,
  { label: string; tone: ServiceStatusTone }
> = {
  low: { label: "Low", tone: "neutral" },
  normal: { label: "Normal", tone: "info" },
  high: { label: "High", tone: "warning" },
  urgent: { label: "Urgent", tone: "danger" },
};

export const QUICK_MACHINE_TYPES = [
  "cnc",
  "lathe",
  "press",
  "conveyor",
  "hydraulic",
  "boiler_generator",
  "packaging",
  "custom",
] as const;

export const QUICK_WORKER_INDUSTRIES = [
  "automotive",
  "textile",
  "packaging",
  "logistics",
  "electronics",
  "chemical",
  "fmcg",
  "heavy_machinery",
  "construction",
  "pharma",
  "general",
] as const;

export const QUICK_TRANSPORT_MODES = ["road", "rail", "air", "sea"] as const;
