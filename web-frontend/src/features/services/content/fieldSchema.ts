/**
 * Declarative field registry for the service request form — one FieldDef
 * array per service type, for Quick and Advanced mode each. Adding a new
 * field (or a whole new service type) means editing this file; it should
 * never require touching `ServiceRequestForm.tsx` or `FieldRenderer.tsx`.
 *
 * Advertisement is the one exception: its product picker and audience
 * preset selector need bespoke UI (an async product search modal, a
 * category multi-select) that doesn't fit a generic field kind, so those
 * stay hand-built in `ServiceRequestForm`. Everything else about
 * advertisement (headline, dates, frequency cap, ...) is schema-driven like
 * the other three types.
 */

import {
  CONTACT_CHANNELS,
  CONTRACT_TYPES,
  MACHINE_REPAIR_TYPES,
  MACHINE_SEVERITIES,
  SHIFT_TYPES,
  TRANSPORT_MODES,
  WARRANTY_STATUSES,
  WORKER_EXPERIENCE_LEVELS,
  WORKER_INDUSTRIES,
  type IdOption,
  type ServiceType,
} from "@/src/constants/services";

export type FieldKind = "text" | "textarea" | "number" | "select" | "chips" | "date" | "toggle";

export type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  /** Backing id list for "select"/"chips" kinds. */
  options?: readonly IdOption[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Desktop grid span — most fields are 1 of a 2-column row. */
  colSpan?: 1 | 2;
  defaultValue?: string | boolean;
};

// ── Per-type quick fields (required-first, matches the app's Quick mode) ──

const QUICK_FIELDS: Record<ServiceType, FieldDef[]> = {
  machine_repair: [
    { name: "machineType", label: "Machine type", kind: "select", options: MACHINE_REPAIR_TYPES, required: true, defaultValue: "cnc" },
    { name: "issueSummary", label: "Issue summary", kind: "textarea", required: true, placeholder: "What is failing right now?", colSpan: 2 },
  ],
  worker: [
    { name: "workerIndustry", label: "Industry", kind: "select", options: WORKER_INDUSTRIES, required: true, defaultValue: "general" },
    { name: "headcount", label: "Headcount required", kind: "number", required: true, placeholder: "1", defaultValue: "1" },
  ],
  transport: [
    { name: "pickupCity", label: "Pickup city", kind: "text", required: true, placeholder: "Where from?" },
    { name: "dropCity", label: "Drop city", kind: "text", required: true, placeholder: "Where to?" },
  ],
  // Product + audience are rendered separately (see ServiceRequestForm); only
  // the free-text objective is schema-driven here.
  advertisement: [
    { name: "adObjective", label: "Campaign objective", kind: "text", placeholder: "e.g. Increase product inquiries", hint: "What do you want to achieve?", colSpan: 2 },
  ],
};

// ── Per-type advanced fields ────────────────────────────────────────────

const ADVANCED_FIELDS: Record<ServiceType, FieldDef[]> = {
  machine_repair: [
    { name: "machineName", label: "Machine name / model", kind: "text", placeholder: "e.g. DMG MORI CTX 500" },
    { name: "machineManufacturer", label: "Manufacturer", kind: "text" },
    { name: "machineModel", label: "Model number", kind: "text" },
    { name: "issueDetails", label: "Additional issue details", kind: "textarea", colSpan: 2 },
    { name: "severity", label: "Severity", kind: "chips", options: MACHINE_SEVERITIES, defaultValue: "medium" },
    { name: "warrantyStatus", label: "Warranty status", kind: "chips", options: WARRANTY_STATUSES, defaultValue: "unknown" },
    { name: "requiresDowntime", label: "Requires planned downtime", kind: "toggle", defaultValue: true },
  ],
  worker: [
    { name: "workerRoles", label: "Roles needed", kind: "text", hint: "Comma-separated: Welder, Machinist, Helper", colSpan: 2 },
    { name: "experienceLevel", label: "Experience level", kind: "chips", options: WORKER_EXPERIENCE_LEVELS, defaultValue: "mid" },
    { name: "shiftType", label: "Shift type", kind: "chips", options: SHIFT_TYPES, defaultValue: "day" },
    { name: "contractType", label: "Contract type", kind: "chips", options: CONTRACT_TYPES, defaultValue: "one_time" },
    { name: "workerStart", label: "Start date", kind: "date" },
    { name: "durationWeeks", label: "Duration (weeks)", kind: "number" },
    { name: "workerSkills", label: "Skills", kind: "text", hint: "Comma-separated" },
    { name: "workerCertifications", label: "Certifications", kind: "text", hint: "Comma-separated" },
    { name: "workerLanguages", label: "Language preferences", kind: "text", hint: "Comma-separated" },
    { name: "workerSafety", label: "Safety clearances", kind: "text", hint: "Comma-separated" },
    { name: "perWorkerBudget", label: "Budget per worker", kind: "number" },
    { name: "perWorkerCurrency", label: "Currency", kind: "text", placeholder: "USD", defaultValue: "USD" },
  ],
  transport: [
    { name: "transportMode", label: "Mode", kind: "chips", options: TRANSPORT_MODES, defaultValue: "road" },
    { name: "pickupState", label: "Pickup state", kind: "text" },
    { name: "dropState", label: "Drop state", kind: "text" },
    { name: "loadType", label: "Load type", kind: "text", placeholder: "general, heavy, fragile, hazardous…" },
    { name: "loadWeightTons", label: "Load weight (tons)", kind: "number" },
    { name: "vehicleType", label: "Vehicle type", kind: "text", placeholder: "truck, container, flatbed…" },
    { name: "requiresReturnTrip", label: "Requires return trip", kind: "toggle" },
    { name: "insuranceNeeded", label: "Insurance needed", kind: "toggle" },
    { name: "specialHandling", label: "Special handling notes", kind: "textarea", colSpan: 2 },
    // No separate transport-availability date fields here — the shared
    // "Preferred start/end date" in COMMON_ADVANCED_FIELDS below answers the
    // same "when" question, and buildPayload.ts mirrors it into both the
    // top-level `schedule` and `transportDetails.availability` rather than
    // asking for the same dates twice.
  ],
  advertisement: [
    { name: "adHeadline", label: "Ad headline", kind: "text", placeholder: "e.g. Premium Cotton Yarn — Direct from Mill" },
    { name: "adSubtitle", label: "Subtitle", kind: "text", placeholder: "e.g. Direct from mill · Bulk pricing" },
    { name: "adCtaLabel", label: "CTA label", kind: "text", hint: "Defaults to “View product”" },
    { name: "adBadge", label: "Badge", kind: "text", placeholder: "e.g. Bestseller" },
    { name: "adPriceOverrideAmount", label: "Discounted ad price (₹)", kind: "number", hint: "Shown as a strike-through deal against the listed price" },
    { name: "adStartAt", label: "Start date", kind: "date" },
    { name: "adEndAt", label: "End date", kind: "date" },
    { name: "adTargetUserIds", label: "Target user IDs", kind: "text", hint: "Comma-separated, optional", colSpan: 2 },
    { name: "adLookbackDays", label: "Lookback window (days)", kind: "number", placeholder: "60" },
    { name: "adFrequencyCap", label: "Frequency cap / day", kind: "number", placeholder: "3" },
    { name: "adPopupCooldown", label: "Popup cooldown (minutes)", kind: "number", placeholder: "60" },
    { name: "adPriority", label: "Priority (1–100)", kind: "number", placeholder: "50" },
  ],
};

// ── Shared across every type — contact, location, schedule, budget ────────
// Matches the app's Advanced Details section, which offers these fields
// identically regardless of service type.

export const COMMON_ADVANCED_FIELDS: FieldDef[] = [
  { name: "contactName", label: "Your name", kind: "text" },
  { name: "contactEmail", label: "Email", kind: "text" },
  { name: "contactPhone", label: "Phone", kind: "text", placeholder: "+91 98765 43210" },
  { name: "preferredChannel", label: "Preferred contact channel", kind: "chips", options: CONTACT_CHANNELS, defaultValue: "phone" },
  { name: "locationLine1", label: "Address line 1", kind: "text", colSpan: 2 },
  { name: "locationCity", label: "City", kind: "text" },
  { name: "locationState", label: "State", kind: "text" },
  { name: "locationCountry", label: "Country", kind: "text" },
  { name: "locationPostal", label: "Postal code", kind: "text" },
  { name: "scheduleStart", label: "Preferred start date", kind: "date" },
  { name: "scheduleEnd", label: "Preferred end date", kind: "date" },
  { name: "scheduleFlexible", label: "Flexible schedule", kind: "toggle", defaultValue: true },
  { name: "scheduleNotes", label: "Schedule notes", kind: "textarea", colSpan: 2 },
  { name: "budgetEstimate", label: "Budget estimate", kind: "number" },
  { name: "budgetCurrency", label: "Currency", kind: "text", placeholder: "INR", defaultValue: "INR" },
];

const NOTES_FIELD: FieldDef = { name: "notes", label: "Notes", kind: "textarea", colSpan: 2, hint: "Any additional context for the service team" };

export const getQuickFields = (type: ServiceType): FieldDef[] => QUICK_FIELDS[type];

/** Per-type advanced fields, followed by the fields shared by every type, followed by Notes — matches the app's field order. */
export const getAdvancedFields = (type: ServiceType): FieldDef[] => [...ADVANCED_FIELDS[type], ...COMMON_ADVANCED_FIELDS, NOTES_FIELD];

/** Seeds a fresh form record with every field's declared default for the given type (quick + advanced, both modes). */
export const defaultsForType = (type: ServiceType): Record<string, string | boolean> => {
  const defaults: Record<string, string | boolean> = {};
  for (const field of [...getQuickFields(type), ...getAdvancedFields(type)]) {
    if (field.defaultValue !== undefined) defaults[field.name] = field.defaultValue;
    else defaults[field.name] = field.kind === "toggle" ? false : "";
  }
  return defaults;
};
