/**
 * Service-request vocabulary — mirrors `backend/src/constants/services.js`
 * field-for-field. This is the single place the web client is allowed to
 * declare a machine type, industry, contract type, etc.
 *
 * Before this file existed, `ServiceRequestForm` collected several of these
 * as free text (e.g. "e.g. CNC Lathe, Hydraulic Press" for machine type,
 * "e.g. Textiles, Metal Fabrication" for industry) while the backend
 * validator only accepts a fixed id (`isIn(MACHINE_TYPE_IDS)` /
 * `isIn(WORKER_INDUSTRY_IDS)`). Every one of those submissions failed with
 * HTTP 422. Routing every select/chip field in the request form through the
 * id lists below makes an invalid value structurally impossible to send.
 */

export const SERVICE_TYPES = ["machine_repair", "worker", "transport", "advertisement"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_STATUSES = [
  "pending",
  "in_review",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const SERVICE_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type ServicePriority = (typeof SERVICE_PRIORITIES)[number];

export type IdOption<T extends string = string> = { id: T; label: string };

export const MACHINE_REPAIR_TYPES: IdOption[] = [
  { id: "cnc", label: "CNC / Precision Machines" },
  { id: "lathe", label: "Lathe / Turning Machines" },
  { id: "press", label: "Presses / Forming Machines" },
  { id: "conveyor", label: "Conveyors / Material Handling" },
  { id: "hydraulic", label: "Hydraulic & Pneumatic Systems" },
  { id: "boiler_generator", label: "Boilers / Generators" },
  { id: "packaging", label: "Packaging Lines" },
  { id: "custom", label: "Custom / Other" },
];
export const MACHINE_TYPE_IDS = MACHINE_REPAIR_TYPES.map((t) => t.id);

export const WORKER_INDUSTRIES: IdOption[] = [
  { id: "automotive", label: "Automotive & Auto Components" },
  { id: "textile", label: "Textile & Apparel" },
  { id: "packaging", label: "Packaging & Printing" },
  { id: "logistics", label: "Logistics & Warehousing" },
  { id: "electronics", label: "Electronics & Electrical" },
  { id: "chemical", label: "Chemical & Process" },
  { id: "fmcg", label: "FMCG / Consumer Goods" },
  { id: "heavy_machinery", label: "Heavy Machinery & Fabrication" },
  { id: "construction", label: "Construction Materials" },
  { id: "pharma", label: "Pharma & Medical" },
  { id: "general", label: "General Manufacturing" },
];
export const WORKER_INDUSTRY_IDS = WORKER_INDUSTRIES.map((t) => t.id);

export const WORKER_EXPERIENCE_LEVELS: IdOption[] = [
  { id: "entry", label: "Entry level" },
  { id: "mid", label: "Mid level" },
  { id: "senior", label: "Senior" },
  { id: "expert", label: "Expert" },
];

export const SHIFT_TYPES: IdOption[] = [
  { id: "day", label: "Day shift" },
  { id: "night", label: "Night shift" },
  { id: "rotational", label: "Rotational" },
  { id: "flexible", label: "Flexible" },
];

export const CONTRACT_TYPES: IdOption[] = [
  { id: "one_time", label: "One-time" },
  { id: "short_term", label: "Short-term" },
  { id: "long_term", label: "Long-term" },
];

export const TRANSPORT_MODES: IdOption[] = [
  { id: "road", label: "Road" },
  { id: "rail", label: "Rail" },
  { id: "air", label: "Air" },
  { id: "sea", label: "Sea" },
];

export const MACHINE_SEVERITIES: IdOption[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "critical", label: "Critical" },
];

export const WARRANTY_STATUSES: IdOption[] = [
  { id: "in_warranty", label: "In warranty" },
  { id: "out_of_warranty", label: "Out of warranty" },
  { id: "unknown", label: "Unknown" },
];

export const CONTACT_CHANNELS: IdOption[] = [
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "chat", label: "Chat" },
];
