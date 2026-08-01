/**
 * Client-side validation for the service request form, ported from the
 * app's `ServiceRequestScreen.tsx` `validate()`. Runs before submit so the
 * user sees an inline error instead of waiting on a round trip — the
 * backend re-validates independently (service.validators.js) regardless.
 */

import type { ServiceType } from "@/src/constants/services";
import type { AdvertisementExtra, ServiceFormValues } from "./buildPayload";

export const validateServiceRequest = ({
  type,
  title,
  form,
  adExtra,
}: {
  type: ServiceType | "";
  title: string;
  form: ServiceFormValues;
  adExtra?: AdvertisementExtra;
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!type) errors.serviceType = "Select a service type";
  if (!title.trim()) errors.title = "Title is required";

  if (type === "machine_repair") {
    if (!String(form.machineType ?? "").trim()) errors.machineType = "Machine type is required";
    if (!String(form.issueSummary ?? "").trim()) errors.issueSummary = "Issue summary is required";
  }

  if (type === "worker") {
    if (!String(form.workerIndustry ?? "").trim()) errors.workerIndustry = "Industry is required";
    const count = Number(form.headcount);
    if (!Number.isFinite(count) || count < 1) errors.headcount = "Headcount must be at least 1";
  }

  if (type === "transport") {
    if (!String(form.pickupCity ?? "").trim()) errors.pickupCity = "Pickup city is required";
    if (!String(form.dropCity ?? "").trim()) errors.dropCity = "Drop city is required";
  }

  if (type === "advertisement") {
    if (!adExtra?.productId) errors.adProduct = "Pick a product to promote";
    const priceOverride = String(form.adPriceOverrideAmount ?? "").trim();
    if (priceOverride) {
      const parsed = Number(priceOverride);
      if (!Number.isFinite(parsed) || parsed <= 0) errors.adPriceOverrideAmount = "Discounted ad price must be greater than 0";
    }
  }

  return errors;
};
