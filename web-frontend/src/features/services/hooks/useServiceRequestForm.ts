"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { serviceRequestService } from "@/src/services/serviceRequest";
import { ApiError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import type { ServicePriority } from "@/src/types/service";
import type { ServiceType } from "@/src/constants/services";
import { defaultsForType } from "../content/fieldSchema";
import { buildServiceRequestPayload, type ServiceFormValues } from "../lib/buildPayload";
import { validateServiceRequest } from "../lib/validate";

export type AdAudiencePreset = "everyone" | "shopper_category" | "buy_intent" | "same_category_listers";

// Translates the backend's dotted express-validator paths
// (service.validators.js) onto the flat field name our form actually
// renders, so a 422 highlights the real input instead of only showing a
// toast. Paths with no entry here just fall back to the banner message.
const BACKEND_FIELD_MAP: Record<string, string> = {
  title: "title",
  serviceType: "serviceType",
  "machineRepairDetails.machineType": "machineType",
  "machineRepairDetails.issueSummary": "issueSummary",
  "workerDetails.industry": "workerIndustry",
  "workerDetails.headcount": "headcount",
  "workerDetails.contractType": "contractType",
  "transportDetails.mode": "transportMode",
  "advertisementDetails.product": "adProduct",
  "advertisementDetails.priceOverride.amount": "adPriceOverrideAmount",
};

const mapBackendFieldErrors = (fieldErrors: Record<string, string>): Record<string, string> => {
  const mapped: Record<string, string> = {};
  for (const [path, message] of Object.entries(fieldErrors)) {
    const name = BACKEND_FIELD_MAP[path];
    if (name) mapped[name] = message;
  }
  return mapped;
};

/**
 * Owns all state for the "New request" screen: the selected type, the
 * flat quick/advanced field record (driven by content/fieldSchema.ts), the
 * advertisement-specific product/audience state, validation, and submit.
 * `ServiceRequestForm` is a schema-driven renderer over this hook rather
 * than owning ~40 individual `useState` calls itself.
 */
export const useServiceRequestForm = (initialType: ServiceType | "") => {
  const router = useRouter();

  const [serviceType, setServiceType] = useState<ServiceType | "">(initialType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ServicePriority>("normal");
  const [form, setForm] = useState<ServiceFormValues>(() => (initialType ? defaultsForType(initialType) : {}));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [adProduct, setAdProduct] = useState<Product | null>(null);
  const [adAudience, setAdAudience] = useState<AdAudiencePreset>("everyone");
  const [adShopperCategories, setAdShopperCategories] = useState<string[]>([]);
  const [adBuyIntentCategories, setAdBuyIntentCategories] = useState<string[]>([]);

  /** Switches the active service type, reseeding the field record with that type's declared defaults. Pass `defaultTitle` to fill the title only while it's still untouched. */
  const selectServiceType = useCallback((type: ServiceType, defaultTitle?: string) => {
    setServiceType(type);
    setForm(defaultsForType(type));
    setAdvancedOpen(false);
    setErrors({});
    if (defaultTitle) setTitle((prev) => (prev.trim() ? prev : defaultTitle));
  }, []);

  const setField = useCallback((name: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const clone = { ...prev };
      delete clone[name];
      return clone;
    });
  }, []);

  const toggleAudienceCategory = useCallback((list: "shopper" | "buyIntent", id: string) => {
    const setter = list === "shopper" ? setAdShopperCategories : setAdBuyIntentCategories;
    setter((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }, []);

  const adExtra = useMemo(
    () => ({
      productId: adProduct?._id ?? "",
      shopperCategories: adAudience === "shopper_category" ? adShopperCategories : [],
      buyIntentCategories: adAudience === "buy_intent" ? adBuyIntentCategories : [],
      requireSameCategory: adAudience === "same_category_listers",
    }),
    [adProduct, adAudience, adShopperCategories, adBuyIntentCategories]
  );

  const submit = useCallback(async () => {
    const nextErrors = validateServiceRequest({ type: serviceType, title, form, adExtra });
    setErrors(nextErrors);
    if (!serviceType || Object.keys(nextErrors).length > 0) return false;

    const payload = buildServiceRequestPayload({ type: serviceType, title, description, priority, form, adExtra });

    try {
      setSubmitting(true);
      setSubmitError(null);
      await serviceRequestService.create(payload);
      router.push("/dashboard/services");
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...mapBackendFieldErrors(err.fieldErrors!) }));
      }
      setSubmitError(err instanceof ApiError || err instanceof Error ? err.message : "Submission failed");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [serviceType, title, description, priority, form, adExtra, router]);

  return {
    serviceType,
    selectServiceType,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    form,
    setField,
    advancedOpen,
    setAdvancedOpen,
    errors,
    submitting,
    submitError,
    adProduct,
    setAdProduct,
    adAudience,
    setAdAudience,
    adShopperCategories,
    adBuyIntentCategories,
    toggleAudienceCategory,
    submit,
  };
};
