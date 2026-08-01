"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { productService } from "@/src/services/product";
import type { ServicePriority } from "@/src/types/service";
import type { ServiceType } from "@/src/constants/services";
import { Field, FieldInput, FieldTextarea } from "@/src/components/ui/FormField";
import { fadeUp, useMotionSafe } from "@/src/components/ui/motion";
import { ProductPicker } from "@/src/features/ads/components/ProductPicker";
import { CategoryMultiSelect } from "@/src/features/ads/components/CategoryMultiSelect";
import { getServiceCatalogMeta, SERVICE_CATALOG_LIST } from "../content/catalog";
import { getQuickFields, getAdvancedFields } from "../content/fieldSchema";
import { useServiceRequestForm, type AdAudiencePreset } from "../hooks/useServiceRequestForm";
import { ServiceTypeCard } from "./ServiceTypeCard";
import { FieldRenderer } from "./FieldRenderer";
import { QuickAdvancedToggle } from "./QuickAdvancedToggle";

const PRIORITIES: { value: ServicePriority; label: string; anchor: string }[] = [
  { value: "low", label: "Low", anchor: "#6B7280" },
  { value: "normal", label: "Normal", anchor: "#2563EB" },
  { value: "high", label: "High", anchor: "#D97706" },
  { value: "urgent", label: "Urgent", anchor: "#DC2626" },
];

const AD_AUDIENCE_PRESETS: { key: AdAudiencePreset; label: string; hint: string; icon: string }[] = [
  { key: "everyone", label: "Everyone", hint: "Show to all eligible shoppers", icon: "🌐" },
  { key: "shopper_category", label: "Browsed a category", hint: "Users recently viewing chosen categories", icon: "👀" },
  { key: "buy_intent", label: "Buying signal", hint: "Added-to-cart / accepted quotes in category", icon: "🛒" },
  { key: "same_category_listers", label: "Same-category sellers", hint: "Users who list in this product's category", icon: "🏭" },
];

const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" };
const eyebrowStyle: React.CSSProperties = { color: "var(--medium-gray)" };

export const ServiceRequestForm = () => {
  const params = useSearchParams();
  const initType = (params.get("type") ?? "") as ServiceType | "";
  const motionSafe = useMotionSafe();
  const f = useServiceRequestForm(initType);
  const [adPickerOpen, setAdPickerOpen] = useState(false);

  // Deep-link from a product's own page ("Promote this product") — prefill
  // the product picker instead of making the seller search for the product
  // they just came from. Only for the initial deep-link, not every param change.
  useEffect(() => {
    const productId = params.get("productId");
    if (!productId || initType !== "advertisement") return;
    productService.get(productId, { scope: "company" }).then(f.setAdProduct).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMeta = f.serviceType ? getServiceCatalogMeta(f.serviceType) : null;
  const accent = selectedMeta?.accent ?? "var(--primary)";

  const handleSelectType = (type: ServiceType) => {
    f.selectServiceType(type, `${getServiceCatalogMeta(type).title} request`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await f.submit();
  };

  const requiredChecklist = useMemo(() => {
    if (!f.serviceType) return [];
    const items: { label: string; done: boolean }[] = [{ label: "Title", done: f.title.trim().length > 0 }];
    for (const field of getQuickFields(f.serviceType)) {
      if (!field.required) continue;
      const value = f.form[field.name];
      items.push({ label: field.label, done: typeof value === "string" ? value.trim().length > 0 : Boolean(value) });
    }
    if (f.serviceType === "advertisement") items.push({ label: "Product to promote", done: Boolean(f.adProduct) });
    return items;
  }, [f.serviceType, f.title, f.form, f.adProduct]);

  return (
    <div className="space-y-6">
      <motion.div {...(motionSafe ? fadeUp(0) : {})}>
        <div className="flex items-center gap-2 text-sm" style={eyebrowStyle}>
          <Link href="/dashboard/services" className="transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
            Services
          </Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)" }}>New request</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          {selectedMeta ? `${selectedMeta.emoji} ${selectedMeta.title}` : "New Service Request"}
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!f.serviceType ? (
          <motion.section {...(motionSafe ? fadeUp(0.08) : {})} className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={eyebrowStyle}>
              Select service type
            </p>
            {f.errors.serviceType && (
              <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                {f.errors.serviceType}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {SERVICE_CATALOG_LIST.map((meta) => (
                <ServiceTypeCard key={meta.type} meta={meta} onStart={() => handleSelectType(meta.type)} />
              ))}
            </div>
          </motion.section>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={eyebrowStyle}>
                Service type:
              </p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATALOG_LIST.map((meta) => (
                  <ServiceTypeCard key={meta.type} meta={meta} compact selected={f.serviceType === meta.type} onClick={() => handleSelectType(meta.type)} />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={f.serviceType}
                initial={motionSafe ? { opacity: 0, x: 16 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={motionSafe ? { opacity: 0, x: -16 } : undefined}
                transition={{ duration: 0.2 }}
              >
                <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                  {/* ── Left: fields ─────────────────────────────────── */}
                  <div className="space-y-6">
                    <div className="space-y-4 rounded-3xl p-6" style={cardStyle}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={eyebrowStyle}>
                        Quick Request · {selectedMeta?.quickHint}
                      </p>

                      <Field label="Title" required error={f.errors.title}>
                        <FieldInput value={f.title} error={f.errors.title} onChange={(e) => f.setTitle(e.target.value)} />
                      </Field>

                      <Field label="Description">
                        <FieldTextarea rows={3} placeholder="Describe what you need in detail…" value={f.description} onChange={(e) => f.setDescription(e.target.value)} />
                      </Field>

                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                          Priority
                        </p>
                        <div className="flex gap-2">
                          {PRIORITIES.map((p) => {
                            const active = f.priority === p.value;
                            return (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => f.setPriority(p.value)}
                                className="flex-1 rounded-xl py-2 text-xs font-semibold transition-all"
                                style={{
                                  backgroundColor: active ? p.anchor : "var(--surface)",
                                  color: active ? "#fff" : p.anchor,
                                  border: active ? "none" : `1px solid ${p.anchor}33`,
                                }}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {f.serviceType === "advertisement" ? (
                        <div className="space-y-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                          <Field label="Product to promote" required error={f.errors.adProduct}>
                            {f.adProduct ? (
                              <button
                                type="button"
                                onClick={() => setAdPickerOpen(true)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
                              >
                                {f.adProduct.images?.[0]?.url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img loading="lazy" decoding="async" src={f.adProduct.images[0].url} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                                ) : (
                                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--background)" }}>
                                    📦
                                  </div>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                    {f.adProduct.name}
                                  </span>
                                  <span className="block text-xs" style={{ color: "var(--medium-gray)" }}>
                                    ₹{f.adProduct.price.amount.toLocaleString("en-IN")}
                                  </span>
                                </span>
                                <span className="flex-shrink-0 text-xs font-bold" style={{ color: "var(--primary)" }}>
                                  Change
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAdPickerOpen(true)}
                                className="w-full rounded-xl px-3.5 py-2.5 text-left text-sm"
                                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--medium-gray)" }}
                              >
                                Select a product to promote…
                              </button>
                            )}
                          </Field>

                          {getQuickFields("advertisement").map((field) => (
                            <FieldRenderer key={field.name} field={field} value={f.form[field.name]} onChange={f.setField} error={f.errors[field.name]} accent={accent} />
                          ))}

                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                              Audience
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {AD_AUDIENCE_PRESETS.map((preset) => (
                                <button
                                  key={preset.key}
                                  type="button"
                                  onClick={() => f.setAdAudience(preset.key)}
                                  className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                                  style={{
                                    backgroundColor: f.adAudience === preset.key ? "var(--primary-light)" : "var(--surface)",
                                    border: f.adAudience === preset.key ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                                  }}
                                >
                                  <span className="text-base leading-none">{preset.icon}</span>
                                  <span className="min-w-0">
                                    <span className="block text-xs font-bold" style={{ color: "var(--foreground)" }}>
                                      {preset.label}
                                    </span>
                                    <span className="block text-[11px]" style={{ color: "var(--medium-gray)" }}>
                                      {preset.hint}
                                    </span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {f.adAudience === "shopper_category" && (
                            <CategoryMultiSelect label="Shopper categories" selected={f.adShopperCategories} onToggle={(id) => f.toggleAudienceCategory("shopper", id)} />
                          )}
                          {f.adAudience === "buy_intent" && (
                            <CategoryMultiSelect label="Buying-signal categories" selected={f.adBuyIntentCategories} onToggle={(id) => f.toggleAudienceCategory("buyIntent", id)} />
                          )}

                          <AnimatePresence>
                            {adPickerOpen && (
                              <ProductPicker
                                scope="company"
                                onSelect={(p) => {
                                  f.setAdProduct(p);
                                  setAdPickerOpen(false);
                                }}
                                onClose={() => setAdPickerOpen(false)}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2" style={{ borderColor: "var(--border)" }}>
                          {getQuickFields(f.serviceType).map((field) => (
                            <div key={field.name} className={field.colSpan === 2 ? "sm:col-span-2" : undefined}>
                              <FieldRenderer field={field} value={f.form[field.name]} onChange={f.setField} error={f.errors[field.name]} accent={accent} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <QuickAdvancedToggle open={f.advancedOpen} onToggle={() => f.setAdvancedOpen((v) => !v)} />

                    <AnimatePresence>
                      {f.advancedOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-4 rounded-3xl p-6" style={cardStyle}>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={eyebrowStyle}>
                              Advanced Details · optional fields for better assignment
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                              {getAdvancedFields(f.serviceType).map((field) => (
                                <div key={field.name} className={field.colSpan === 2 ? "sm:col-span-2" : undefined}>
                                  <FieldRenderer field={field} value={f.form[field.name]} onChange={f.setField} error={f.errors[field.name]} accent={accent} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {f.submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl px-4 py-3 text-sm font-medium"
                        style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                      >
                        {f.submitError}
                      </motion.div>
                    )}
                  </div>

                  {/* ── Right: sticky summary rail (desktop) ────────────── */}
                  <div className="space-y-4 lg:sticky lg:top-6">
                    <div className="space-y-3 rounded-3xl p-5" style={cardStyle}>
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-xl"
                          style={{ backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)` }}
                        >
                          {selectedMeta?.emoji}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>
                            {selectedMeta?.title}
                          </p>
                          <p className="truncate text-xs" style={{ color: "var(--medium-gray)" }}>
                            {selectedMeta?.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                        {requiredChecklist.map((item) => (
                          <div key={item.label} className="flex items-center gap-2 text-xs">
                            <span
                              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                              style={{ backgroundColor: item.done ? accent : "var(--border)", color: item.done ? "#fff" : "transparent" }}
                            >
                              ✓
                            </span>
                            <span style={{ color: item.done ? "var(--foreground)" : "var(--medium-gray)" }}>{item.label}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={f.submitting}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                        style={{ backgroundColor: accent, boxShadow: `0 4px 14px color-mix(in srgb, ${accent} 30%, transparent)` }}
                      >
                        {f.submitting ? "Submitting…" : "Submit request"}
                      </button>
                      <Link
                        href="/dashboard/services"
                        className="block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-70"
                        style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                      >
                        Cancel
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </form>
    </div>
  );
};
