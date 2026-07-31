"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { serviceRequestService } from "@/src/services/serviceRequest";
import { ApiError } from "@/src/lib/api-error";
import type { CreateServiceRequestInput, ServicePriority, ServiceType } from "@/src/types/service";
import type { Product } from "@/src/types/product";
import type { AdTargetingMode } from "@/src/services/ad";
import { ServiceTypeCard, SERVICE_TYPES, getServiceTypeMeta } from "./ServiceTypeCard";
import { ServiceStatusBadge, ServicePriorityBadge } from "./ServiceStatusBadge";
import { ProductPicker } from "@/src/features/ads/components/ProductPicker";
import { CategoryMultiSelect } from "@/src/features/ads/components/CategoryMultiSelect";

type AdAudiencePreset = "everyone" | "shopper_category" | "buy_intent" | "same_category_listers";

const AD_AUDIENCE_PRESETS: { key: AdAudiencePreset; label: string; hint: string; icon: string }[] = [
  { key: "everyone",              label: "Everyone",              hint: "Show to all eligible shoppers",               icon: "🌐" },
  { key: "shopper_category",      label: "Browsed a category",    hint: "Users recently viewing chosen categories",    icon: "👀" },
  { key: "buy_intent",            label: "Buying signal",         hint: "Added-to-cart / accepted quotes in category", icon: "🛒" },
  { key: "same_category_listers", label: "Same-category sellers", hint: "Users who list in this product's category",  icon: "🏭" },
];

const PRIORITIES: { value: ServicePriority; label: string; color: string; bg: string }[] = [
  { value: "normal", label: "Normal", color: "#5B21B6", bg: "#EDE9FE" },
  { value: "high",   label: "High",   color: "#92400E", bg: "#FEF3C7" },
  { value: "urgent", label: "Urgent", color: "#991B1B", bg: "#FEE2E2" },
];

const baseInput: React.CSSProperties = {
  border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)",
};
const cls = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none";

const Field = ({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
      {label}{required && <span style={{ color: "var(--accent)" }}> *</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>{hint}</p>}
    {error && <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{error}</p>}
  </div>
);

type ServiceSpecificForm = {
  machineType: string; machineName: string; issueSummary: string; severity: string;
  workerIndustry: string; headcount: string; workerRoles: string; contractType: string;
  pickupCity: string; dropCity: string; pickupState: string; dropState: string; loadType: string; vehicleType: string;
};

export const ServiceRequestForm = () => {
  const router = useRouter();
  const params = useSearchParams();
  const initType = (params.get("type") ?? "") as ServiceType | "";

  const [serviceType, setServiceType] = useState<ServiceType | "">(initType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ServicePriority>("normal");
  const [specific, setSpecific] = useState<ServiceSpecificForm>({
    machineType: "", machineName: "", issueSummary: "", severity: "medium",
    workerIndustry: "", headcount: "1", workerRoles: "", contractType: "temporary",
    pickupCity: "", dropCity: "", pickupState: "", dropState: "", loadType: "general", vehicleType: "truck",
  });

  // Advertisement request — kept in dedicated state rather than crammed into
  // ServiceSpecificForm's flat-string shape, since it needs a full Product
  // object and category arrays. Mirrors the fields the admin Ad Studio wizard
  // (AdStudioPanel) already collects, so a request converted via
  // POST /api/ads/admin/campaigns/from-request/:id prefills cleanly.
  const [adProduct, setAdProduct] = useState<Product | null>(null);
  const [adPickerOpen, setAdPickerOpen] = useState(false);
  const [adObjective, setAdObjective] = useState("");
  const [adHeadline, setAdHeadline] = useState("");
  const [adSubtitle, setAdSubtitle] = useState("");
  const [adCtaLabel, setAdCtaLabel] = useState("");
  const [adBadge, setAdBadge] = useState("");
  const [adPriceOverride, setAdPriceOverride] = useState("");
  const [adStartAt, setAdStartAt] = useState("");
  const [adEndAt, setAdEndAt] = useState("");
  const [adAudience, setAdAudience] = useState<AdAudiencePreset>("everyone");
  const [adShopperCategories, setAdShopperCategories] = useState<string[]>([]);
  const [adBuyIntentCategories, setAdBuyIntentCategories] = useState<string[]>([]);

  // Deep-link from a product's own page ("Promote this product" on
  // ProductDetailContainer) — prefill the product picker instead of making
  // the seller search for the product they just came from.
  useEffect(() => {
    const productId = params.get("productId");
    if (!productId || initType !== "advertisement") return;
    productService.get(productId, { scope: "company" }).then(setAdProduct).catch(() => {});
    // Only ever run for the initial deep-link — not on every param change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setS = <K extends keyof ServiceSpecificForm>(k: K, v: string) =>
    setSpecific((p) => ({ ...p, [k]: v }));

  const selectedMeta = serviceType ? getServiceTypeMeta(serviceType) : null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!serviceType) errs.serviceType = "Select a service type";
    if (!title.trim()) errs.title = "Title is required";
    if (serviceType === "machine_repair") {
      if (!specific.machineType.trim()) errs.machineType = "Required";
      if (!specific.issueSummary.trim()) errs.issueSummary = "Required";
    }
    if (serviceType === "worker") {
      if (!specific.workerIndustry.trim()) errs.workerIndustry = "Required";
      if (!specific.headcount || parseInt(specific.headcount) < 1) errs.headcount = "At least 1 worker";
    }
    if (serviceType === "transport") {
      if (!specific.pickupCity.trim()) errs.pickupCity = "Required";
      if (!specific.dropCity.trim()) errs.dropCity = "Required";
    }
    if (serviceType === "advertisement") {
      // The backend requires advertisementDetails.product — submitting without
      // one always 400'd silently before this check existed.
      if (!adProduct) errs.adProduct = "Select the product to promote";
      if (adAudience === "shopper_category" && !adShopperCategories.length) errs.adAudience = "Choose at least one shopper category";
      if (adAudience === "buy_intent" && !adBuyIntentCategories.length) errs.adAudience = "Choose at least one buying-signal category";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true); setSubmitError(null);
      const payload: CreateServiceRequestInput = {
        serviceType: serviceType as ServiceType,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        contact: contactName || contactEmail || contactPhone ? {
          name: contactName.trim() || undefined,
          email: contactEmail.trim() || undefined,
          phone: contactPhone.trim() || undefined,
        } : undefined,
        notes: notes.trim() || undefined,
      };

      if (serviceType === "machine_repair") {
        payload.machineRepairDetails = {
          machineType: specific.machineType.trim() || undefined,
          machineName: specific.machineName.trim() || undefined,
          issueSummary: specific.issueSummary.trim() || undefined,
          severity: specific.severity || undefined,
        };
      }
      if (serviceType === "worker") {
        payload.workerDetails = {
          industry: specific.workerIndustry.trim() || undefined,
          headcount: parseInt(specific.headcount) || 1,
          roles: specific.workerRoles ? specific.workerRoles.split(",").map((r) => r.trim()).filter(Boolean) : undefined,
          contractType: specific.contractType || undefined,
        };
      }
      if (serviceType === "transport") {
        payload.transportDetails = {
          pickupCity: specific.pickupCity.trim() || undefined,
          dropCity: specific.dropCity.trim() || undefined,
          loadType: specific.loadType || undefined,
          vehicleType: specific.vehicleType || undefined,
        };
      }
      if (serviceType === "advertisement" && adProduct) {
        const targetingMode: AdTargetingMode = "any";
        payload.advertisementDetails = {
          product: adProduct._id,
          priceOverride: adPriceOverride ? { amount: parseFloat(adPriceOverride), currency: "INR" } : undefined,
          objective: adObjective.trim() || undefined,
          targetingMode,
          shopperCategories: adAudience === "shopper_category" ? adShopperCategories : undefined,
          buyIntentCategories: adAudience === "buy_intent" ? adBuyIntentCategories : undefined,
          requireListedProductInSameCategory: adAudience === "same_category_listers" || undefined,
          startAt: adStartAt || undefined,
          endAt: adEndAt || undefined,
          headline: adHeadline.trim() || undefined,
          subtitle: adSubtitle.trim() || undefined,
          ctaLabel: adCtaLabel.trim() || undefined,
          badge: adBadge.trim() || undefined,
        };
      }

      await serviceRequestService.create(payload);
      router.push("/dashboard/services");
    } catch (err) {
      setSubmitError(err instanceof ApiError || err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--medium-gray)" }}>
          <Link href="/dashboard/services" className="transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
            Services
          </Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)" }}>New request</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          {selectedMeta ? `${selectedMeta.icon} ${selectedMeta.label}` : "New Service Request"}
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service type selection */}
        {!serviceType ? (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
              Select service type
            </p>
            {errors.serviceType && (
              <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{errors.serviceType}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {SERVICE_TYPES.map((meta) => (
                <ServiceTypeCard key={meta.type} meta={meta}
                  onStart={() => setServiceType(meta.type)} />
              ))}
            </div>
          </motion.section>
        ) : (
          <>
            {/* Selected type chip */}
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
                Service type:
              </p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((meta) => (
                  <ServiceTypeCard key={meta.type} meta={meta} compact
                    selected={serviceType === meta.type}
                    onClick={() => setServiceType(meta.type)} />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={serviceType}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Core form */}
                <div className="space-y-4 rounded-3xl p-6"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Request details
                  </p>
                  <Field label="Title" required error={errors.title}>
                    <input className={cls} style={baseInput} placeholder={`e.g. ${selectedMeta?.hint.split(".")[0]}`}
                      value={title} onChange={(e) => setTitle(e.target.value)} />
                  </Field>
                  <Field label="Description">
                    <textarea rows={3} className={cls} style={baseInput}
                      placeholder="Describe what you need in detail…"
                      value={description} onChange={(e) => setDescription(e.target.value)} />
                  </Field>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>Priority</p>
                    <div className="flex gap-2">
                      {PRIORITIES.map((p) => (
                        <button key={p.value} type="button"
                          onClick={() => setPriority(p.value)}
                          className="flex-1 rounded-xl py-2 text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: priority === p.value ? p.color : p.bg,
                            color: priority === p.value ? "#fff" : p.color,
                            border: priority === p.value ? "none" : `1px solid ${p.color}33`,
                          }}>{p.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Service-specific fields */}
                  {serviceType === "machine_repair" && (
                    <div className="space-y-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                        Machine details
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Machine type" required error={errors.machineType}>
                          <input className={cls} style={baseInput} placeholder="e.g. CNC Lathe, Hydraulic Press"
                            value={specific.machineType} onChange={(e) => setS("machineType", e.target.value)} />
                        </Field>
                        <Field label="Machine name / model">
                          <input className={cls} style={baseInput} placeholder="e.g. DMG MORI CTX 500"
                            value={specific.machineName} onChange={(e) => setS("machineName", e.target.value)} />
                        </Field>
                      </div>
                      <Field label="Issue summary" required error={errors.issueSummary}>
                        <textarea rows={2} className={cls} style={baseInput}
                          placeholder="Describe the malfunction or maintenance needed"
                          value={specific.issueSummary} onChange={(e) => setS("issueSummary", e.target.value)} />
                      </Field>
                      <Field label="Severity">
                        <div className="flex gap-2">
                          {["low", "medium", "high", "critical"].map((s) => (
                            <button key={s} type="button"
                              onClick={() => setS("severity", s)}
                              className="flex-1 rounded-xl py-1.5 text-xs font-semibold capitalize transition-all"
                              style={{
                                backgroundColor: specific.severity === s ? "var(--primary)" : "var(--surface)",
                                color: specific.severity === s ? "#fff" : "var(--foreground)",
                                border: specific.severity === s ? "none" : "1px solid var(--border)",
                              }}>{s}</button>
                          ))}
                        </div>
                      </Field>
                    </div>
                  )}

                  {serviceType === "worker" && (
                    <div className="space-y-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                        Workforce details
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Industry" required error={errors.workerIndustry}>
                          <input className={cls} style={baseInput} placeholder="e.g. Textiles, Metal Fabrication"
                            value={specific.workerIndustry} onChange={(e) => setS("workerIndustry", e.target.value)} />
                        </Field>
                        <Field label="Headcount required" required error={errors.headcount}>
                          <input type="number" min="1" className={cls} style={baseInput}
                            value={specific.headcount} onChange={(e) => setS("headcount", e.target.value)} />
                        </Field>
                      </div>
                      <Field label="Roles needed" hint="Comma-separated: Welder, Machinist, Helper">
                        <input className={cls} style={baseInput} placeholder="e.g. Welder, Machine Operator"
                          value={specific.workerRoles} onChange={(e) => setS("workerRoles", e.target.value)} />
                      </Field>
                      <Field label="Contract type">
                        <div className="flex gap-2">
                          {["temporary", "contract", "permanent"].map((t) => (
                            <button key={t} type="button"
                              onClick={() => setS("contractType", t)}
                              className="flex-1 rounded-xl py-1.5 text-xs font-semibold capitalize transition-all"
                              style={{
                                backgroundColor: specific.contractType === t ? "var(--primary)" : "var(--surface)",
                                color: specific.contractType === t ? "#fff" : "var(--foreground)",
                                border: specific.contractType === t ? "none" : "1px solid var(--border)",
                              }}>{t}</button>
                          ))}
                        </div>
                      </Field>
                    </div>
                  )}

                  {serviceType === "transport" && (
                    <div className="space-y-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                        Route details
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Pickup city" required error={errors.pickupCity}>
                          <input className={cls} style={baseInput} placeholder="Mumbai"
                            value={specific.pickupCity} onChange={(e) => setS("pickupCity", e.target.value)} />
                        </Field>
                        <Field label="Drop city" required error={errors.dropCity}>
                          <input className={cls} style={baseInput} placeholder="Pune"
                            value={specific.dropCity} onChange={(e) => setS("dropCity", e.target.value)} />
                        </Field>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Load type">
                          <select className={cls} style={baseInput}
                            value={specific.loadType} onChange={(e) => setS("loadType", e.target.value)}>
                            {["general", "heavy", "fragile", "hazardous", "refrigerated"].map((t) => (
                              <option key={t} value={t} className="capitalize">{t}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Vehicle type">
                          <select className={cls} style={baseInput}
                            value={specific.vehicleType} onChange={(e) => setS("vehicleType", e.target.value)}>
                            {["truck", "container", "flatbed", "tanker", "mini_truck"].map((t) => (
                              <option key={t} value={t}>{t.replace("_", " ")}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </div>
                  )}

                  {serviceType === "advertisement" && (
                    <div className="space-y-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                        Campaign details
                      </p>

                      <Field label="Product to promote" required error={errors.adProduct}>
                        {adProduct ? (
                          <button type="button" onClick={() => setAdPickerOpen(true)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                            style={baseInput}>
                            {adProduct.images?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img loading="lazy" decoding="async" src={adProduct.images[0].url} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                            ) : (
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--background)" }}>📦</div>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>{adProduct.name}</span>
                              <span className="block text-xs" style={{ color: "var(--medium-gray)" }}>₹{adProduct.price.amount.toLocaleString("en-IN")}</span>
                            </span>
                            <span className="flex-shrink-0 text-xs font-bold" style={{ color: "var(--primary)" }}>Change</span>
                          </button>
                        ) : (
                          <button type="button" onClick={() => setAdPickerOpen(true)} className={cls} style={baseInput}>
                            Select a product to promote…
                          </button>
                        )}
                      </Field>

                      <Field label="Campaign objective" hint="What do you want to achieve?">
                        <input className={cls} style={baseInput} placeholder="e.g. Increase product inquiries"
                          value={adObjective} onChange={(e) => setAdObjective(e.target.value)} />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Ad headline">
                          <input className={cls} style={baseInput} placeholder="e.g. Premium Cotton Yarn — Direct from Mill"
                            value={adHeadline} onChange={(e) => setAdHeadline(e.target.value)} />
                        </Field>
                        <Field label="Subtitle">
                          <input className={cls} style={baseInput} placeholder="e.g. Direct from mill · Bulk pricing"
                            value={adSubtitle} onChange={(e) => setAdSubtitle(e.target.value)} />
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="CTA label" hint="Defaults to “View product”">
                          <input className={cls} style={baseInput} placeholder="View product"
                            value={adCtaLabel} onChange={(e) => setAdCtaLabel(e.target.value)} />
                        </Field>
                        <Field label="Badge">
                          <input className={cls} style={baseInput} placeholder="e.g. Bestseller"
                            value={adBadge} onChange={(e) => setAdBadge(e.target.value)} />
                        </Field>
                      </div>

                      <Field label="Discounted ad price (₹)" hint="Shown as a strike-through deal against the listed price">
                        <input type="number" min="0" className={cls} style={baseInput} placeholder="Leave blank to advertise at the listed price"
                          value={adPriceOverride} onChange={(e) => setAdPriceOverride(e.target.value)} />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Start date">
                          <input type="date" className={cls} style={baseInput}
                            value={adStartAt} onChange={(e) => setAdStartAt(e.target.value)} />
                        </Field>
                        <Field label="End date">
                          <input type="date" className={cls} style={baseInput}
                            value={adEndAt} onChange={(e) => setAdEndAt(e.target.value)} />
                        </Field>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>Audience</p>
                        {errors.adAudience && <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{errors.adAudience}</p>}
                        <div className="grid gap-2 sm:grid-cols-2">
                          {AD_AUDIENCE_PRESETS.map((preset) => (
                            <button key={preset.key} type="button" onClick={() => setAdAudience(preset.key)}
                              className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                              style={{
                                backgroundColor: adAudience === preset.key ? "var(--primary-light)" : "var(--surface)",
                                border: adAudience === preset.key ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                              }}>
                              <span className="text-base leading-none">{preset.icon}</span>
                              <span className="min-w-0">
                                <span className="block text-xs font-bold" style={{ color: "var(--foreground)" }}>{preset.label}</span>
                                <span className="block text-[11px]" style={{ color: "var(--medium-gray)" }}>{preset.hint}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {adAudience === "shopper_category" && (
                        <CategoryMultiSelect label="Shopper categories" selected={adShopperCategories}
                          onToggle={(id) => setAdShopperCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])} />
                      )}
                      {adAudience === "buy_intent" && (
                        <CategoryMultiSelect label="Buying-signal categories" selected={adBuyIntentCategories}
                          onToggle={(id) => setAdBuyIntentCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])} />
                      )}

                      <AnimatePresence>
                        {adPickerOpen && (
                          // "company" scope — a seller can only promote products
                          // their own company has listed, not the full marketplace.
                          <ProductPicker scope="company" onSelect={(p) => { setAdProduct(p); setAdPickerOpen(false); }} onClose={() => setAdPickerOpen(false)} />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Optional: Contact info */}
                <div className="rounded-3xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <button type="button"
                    onClick={() => setShowContact((v) => !v)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                      Contact & notes <span className="ml-1 text-xs font-normal" style={{ color: "var(--medium-gray)" }}>(optional)</span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      className={`transition-transform ${showContact ? "rotate-180" : ""}`}
                      style={{ color: "var(--medium-gray)" }}>
                      <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {showContact && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden px-5 pb-5 space-y-4"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <div className="grid gap-4 pt-4 sm:grid-cols-3">
                          <Field label="Your name">
                            <input className={cls} style={baseInput} placeholder="Contact person"
                              value={contactName} onChange={(e) => setContactName(e.target.value)} />
                          </Field>
                          <Field label="Phone">
                            <input type="tel" className={cls} style={baseInput} placeholder="+91 98765 43210"
                              value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                          </Field>
                          <Field label="Email">
                            <input type="email" className={cls} style={baseInput} placeholder="you@company.com"
                              value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                          </Field>
                        </div>
                        <Field label="Notes">
                          <textarea rows={2} className={cls} style={baseInput}
                            placeholder="Any additional context for the service team…"
                            value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {submitError && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                    {submitError}
                  </motion.div>
                )}

                {/* Submit */}
                <div className="flex items-center justify-between gap-3">
                  <Link href="/dashboard/services"
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    Cancel
                  </Link>
                  <button type="submit" disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ backgroundColor: selectedMeta?.accent ?? "var(--primary)", boxShadow: `0 4px 14px ${selectedMeta?.accent ?? "var(--primary)"}33` }}>
                    {submitting ? "Submitting…" : "Submit request"}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </form>
    </div>
  );
};
