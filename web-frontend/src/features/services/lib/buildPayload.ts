/**
 * Pure form-state → API-payload transform, ported from the app's
 * `ServiceRequestScreen.tsx` (splitList / toNumber / parseDate /
 * buildAvailability / buildLocation / choose helpers) so the two clients
 * apply identical coercion rules. Kept side-effect-free and framework-free
 * so it's trivially unit-testable independent of the form component.
 */

import type { CreateServiceRequestInput, ServicePriority } from "@/src/types/service";
import { MACHINE_TYPE_IDS, TRANSPORT_MODES, WORKER_INDUSTRY_IDS, type ServiceType } from "@/src/constants/services";

export type ServiceFormValues = Record<string, string | boolean>;

/** Extra advertisement state that doesn't fit the flat form record — a real Product object and derived audience arrays. */
export type AdvertisementExtra = {
  productId: string;
  shopperCategories: string[];
  buyIntentCategories: string[];
  requireSameCategory: boolean;
};

const str = (form: ServiceFormValues, name: string) => {
  const v = form[name];
  return typeof v === "string" ? v.trim() : "";
};

const bool = (form: ServiceFormValues, name: string) => Boolean(form[name]);

const splitList = (value: string) =>
  value.split(",").map((item) => item.trim()).filter(Boolean);

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDate = (value: string) => {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/** Only sends an enum value the backend actually accepts — anything else (including free text) falls back to a safe default instead of a 422. */
const choose = (ids: readonly string[], value: string, fallback: string): string =>
  ids.includes(value) ? value : fallback;

const buildAvailability = (start: string, end: string, flexible: boolean, notes: string) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const trimmedNotes = notes.trim();
  if (!startDate && !endDate && !trimmedNotes && flexible === true) return undefined;
  return { startDate, endDate, isFlexible: flexible, notes: trimmedNotes || undefined };
};

const buildLocation = (form: ServiceFormValues) => {
  const payload = {
    line1: str(form, "locationLine1") || undefined,
    city: str(form, "locationCity") || undefined,
    state: str(form, "locationState") || undefined,
    country: str(form, "locationCountry") || undefined,
    postalCode: str(form, "locationPostal") || undefined,
  };
  return Object.values(payload).some(Boolean) ? payload : undefined;
};

const buildContact = (form: ServiceFormValues) => {
  const name = str(form, "contactName");
  const email = str(form, "contactEmail");
  const phone = str(form, "contactPhone");
  if (!name && !email && !phone) return undefined;
  const channel = str(form, "preferredChannel");
  return {
    name: name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    preferredChannel: (channel || undefined) as "phone" | "email" | "chat" | undefined,
  };
};

const buildBudget = (form: ServiceFormValues) => {
  const estimate = str(form, "budgetEstimate");
  const currency = str(form, "budgetCurrency");
  if (!estimate && !currency) return undefined;
  return { estimatedCost: toNumber(estimate), currency: currency.toUpperCase() || undefined };
};

export const buildServiceRequestPayload = ({
  type,
  title,
  description,
  priority,
  form,
  adExtra,
}: {
  type: ServiceType;
  title: string;
  description: string;
  priority: ServicePriority;
  form: ServiceFormValues;
  adExtra?: AdvertisementExtra;
}): CreateServiceRequestInput => {
  const schedule = buildAvailability(
    str(form, "scheduleStart"),
    str(form, "scheduleEnd"),
    bool(form, "scheduleFlexible"),
    str(form, "scheduleNotes")
  );

  const payload: CreateServiceRequestInput = {
    serviceType: type,
    title: title.trim(),
    description: description.trim() || undefined,
    priority,
    contact: buildContact(form),
    location: buildLocation(form),
    schedule,
    budget: buildBudget(form),
    notes: str(form, "notes") || undefined,
  };

  if (type === "machine_repair") {
    payload.machineRepairDetails = {
      machineType: choose(MACHINE_TYPE_IDS, str(form, "machineType"), "custom"),
      machineName: str(form, "machineName") || undefined,
      manufacturer: str(form, "machineManufacturer") || undefined,
      model: str(form, "machineModel") || undefined,
      issueSummary: str(form, "issueSummary"),
      issueDetails: str(form, "issueDetails") || undefined,
      severity: (str(form, "severity") || "medium") as "low" | "medium" | "high" | "critical",
      requiresDowntime: bool(form, "requiresDowntime"),
      warrantyStatus: (str(form, "warrantyStatus") || "unknown") as "in_warranty" | "out_of_warranty" | "unknown",
      // Mirrors the shared "preferred schedule" answer instead of asking the
      // same when-do-you-need-this question twice — see fieldSchema.ts.
      preferredSchedule: schedule,
    };
  }

  if (type === "worker") {
    payload.workerDetails = {
      industry: choose(WORKER_INDUSTRY_IDS, str(form, "workerIndustry"), "general"),
      headcount: Math.max(1, Number(str(form, "headcount")) || 1),
      roles: splitList(str(form, "workerRoles")),
      experienceLevel: (str(form, "experienceLevel") || "mid") as "entry" | "mid" | "senior" | "expert",
      shiftType: (str(form, "shiftType") || "day") as "day" | "night" | "rotational" | "flexible",
      contractType: (str(form, "contractType") || "one_time") as "one_time" | "short_term" | "long_term",
      startDate: parseDate(str(form, "workerStart")),
      durationWeeks: toNumber(str(form, "durationWeeks")),
      skills: splitList(str(form, "workerSkills")),
      certifications: splitList(str(form, "workerCertifications")),
      languagePreferences: splitList(str(form, "workerLanguages")),
      safetyClearances: splitList(str(form, "workerSafety")),
      budgetPerWorker:
        str(form, "perWorkerBudget") || str(form, "perWorkerCurrency")
          ? { amount: toNumber(str(form, "perWorkerBudget")), currency: str(form, "perWorkerCurrency").toUpperCase() || undefined }
          : undefined,
    };
  }

  if (type === "transport") {
    payload.transportDetails = {
      mode: choose(TRANSPORT_MODES.map((m) => m.id), str(form, "transportMode"), "road") as "road" | "rail" | "air" | "sea",
      pickupLocation: { city: str(form, "pickupCity") || undefined, state: str(form, "pickupState") || undefined },
      dropLocation: { city: str(form, "dropCity") || undefined, state: str(form, "dropState") || undefined },
      loadType: str(form, "loadType") || undefined,
      loadWeightTons: toNumber(str(form, "loadWeightTons")),
      vehicleType: str(form, "vehicleType") || undefined,
      requiresReturnTrip: bool(form, "requiresReturnTrip"),
      availability: schedule,
      specialHandling: str(form, "specialHandling") || undefined,
      insuranceNeeded: bool(form, "insuranceNeeded"),
    };
  }

  if (type === "advertisement" && adExtra?.productId) {
    const priceAmount = Number(str(form, "adPriceOverrideAmount"));
    const hasPriceOverride = str(form, "adPriceOverrideAmount").length > 0 && Number.isFinite(priceAmount) && priceAmount > 0;

    payload.advertisementDetails = {
      product: adExtra.productId,
      priceOverride: hasPriceOverride ? { amount: Number(priceAmount.toFixed(2)), currency: "INR" } : undefined,
      objective: str(form, "adObjective") || undefined,
      targetingMode: "any",
      targetUserIds: splitList(str(form, "adTargetUserIds")),
      shopperCategories: adExtra.shopperCategories.length ? adExtra.shopperCategories : undefined,
      buyIntentCategories: adExtra.buyIntentCategories.length ? adExtra.buyIntentCategories : undefined,
      requireListedProductInSameCategory: adExtra.requireSameCategory || undefined,
      lookbackDays: Math.max(1, Math.min(365, Number(str(form, "adLookbackDays")) || 60)),
      startAt: parseDate(str(form, "adStartAt")),
      endAt: parseDate(str(form, "adEndAt")),
      headline: str(form, "adHeadline") || undefined,
      subtitle: str(form, "adSubtitle") || undefined,
      ctaLabel: str(form, "adCtaLabel") || undefined,
      badge: str(form, "adBadge") || undefined,
      frequencyCapPerDay: Math.max(1, Math.min(50, Number(str(form, "adFrequencyCap")) || 3)),
      popupCooldownMinutes: Math.max(5, Math.min(1440, Number(str(form, "adPopupCooldown")) || 60)),
      priority: Math.max(1, Math.min(100, Number(str(form, "adPriority")) || 50)),
    };
  }

  return payload;
};
