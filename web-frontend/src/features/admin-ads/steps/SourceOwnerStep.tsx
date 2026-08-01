"use client";

import { useEffect, useState } from "react";
import { adService } from "@/src/services/ad";
import { serviceRequestService } from "@/src/services/serviceRequest";
import { productService } from "@/src/services/product";
import type { ServiceRequest } from "@/src/types/service";
import type { CampaignWizardApi } from "../useCampaignWizard";
import { Field, Label, Reveal, Section, SegmentedControl, TextArea, TextInput, MediaDropzone, UserPicker } from "../adStudioShared";

// Statuses considered "approved enough to build a campaign from" — mirrors
// AdStudioScreen.tsx APPROVED_REQUEST_STATUSES.
const APPROVED_REQUEST_STATUSES = ["in_review", "scheduled", "in_progress", "completed"] as const;

export const SourceOwnerStep = ({ wizard, motionSafe }: { wizard: CampaignWizardApi; motionSafe: boolean }) => {
  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (wizard.isEdit || wizard.adSource !== "internal" || wizard.productSource !== "user_listings" || !wizard.ownerUserId) {
      setRequests([]);
      return;
    }
    let active = true;
    setRequestsLoading(true);
    // `createdBy` is a valid backend filter for GET /services (admin-only —
    // serviceRequest.service.js only honors it `if (filters.createdBy &&
    // isAdmin(user))`), but it isn't in serviceRequestService.list's shared
    // param type since only this admin-only screen needs it.
    serviceRequestService.list({
      serviceType: "advertisement",
      createdBy: wizard.ownerUserId,
      limit: 20,
      offset: 0,
      sort: "newest",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
      .then((res) => {
        if (!active) return;
        const approved = (res.services ?? []).filter((r) =>
          (APPROVED_REQUEST_STATUSES as readonly string[]).includes(r.status));
        setRequests(approved);
      })
      .catch(() => { if (active) setRequests([]); })
      .finally(() => { if (active) setRequestsLoading(false); });
    return () => { active = false; };
  }, [wizard.isEdit, wizard.adSource, wizard.productSource, wizard.ownerUserId]);

  const applyRequest = async (requestId: string) => {
    setApplyingId(requestId);
    try {
      const res = await adService.createFromRequest(requestId, { prefillOnly: true });
      wizard.applyPrefill(res.prefill);
      if (res.prefill.productId) {
        try {
          const product = await productService.get(res.prefill.productId, { scope: "marketplace" });
          wizard.applyProductOwnershipContext(product);
        } catch {
          // Best-effort — the prefill's other fields still applied.
        }
      }
      wizard.setSourceRequestId(requestId);
    } catch (err) {
      wizard.setError(err instanceof Error ? err.message : "Could not load prefill from that request.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <Section>
      <SegmentedControl
        layoutId="adstudio-source"
        value={wizard.adSource}
        onChange={wizard.setAdSource}
        options={[{ value: "internal", label: "Internal product" }, { value: "external", label: "External link" }]}
      />

      <Reveal show={wizard.adSource === "external"} motionSafe={motionSafe}>
        <div className="space-y-3">
          <Field label="Destination URL" required>
            <TextInput type="url" value={wizard.destinationUrl} onChange={(e) => wizard.setDestinationUrl(e.target.value)} placeholder="https://partner-site.com/offer" />
          </Field>
          <Field label="Advertiser name" required>
            <TextInput value={wizard.advertiserName} onChange={(e) => wizard.setAdvertiserName(e.target.value)} placeholder="e.g. Acme Tools Co" />
          </Field>
          <Field label="Advertiser logo (optional)">
            <MediaDropzone label="+ Upload logo" accept="image/*" preview={wizard.advertiserLogoPreview} height="h-16"
              onFile={wizard.handleAdvertiserLogo} onRemove={() => { wizard.setAdvertiserLogoPreview(null); wizard.setAdvertiserLogoBase64(null); }} />
          </Field>
        </div>
      </Reveal>

      <Reveal show={wizard.adSource === "internal"} motionSafe={motionSafe}>
        <div className="space-y-3">
          <div>
            <Label>Product source</Label>
            <SegmentedControl
              layoutId="adstudio-product-source"
              value={wizard.productSource}
              onChange={(v) => { wizard.setProductSource(v); wizard.setProduct(null); if (v === "admin_listings") { wizard.setOwnerUserId(""); wizard.setOwnerUserName(""); } }}
              options={[{ value: "user_listings", label: "User listings" }, { value: "admin_listings", label: "Admin listings" }]}
            />
          </div>

          <Reveal show={wizard.productSource === "user_listings"} motionSafe={motionSafe}>
            <div className="space-y-2">
              {wizard.ownerUserId ? (
                <div className="flex items-center gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
                    {(wizard.ownerUserName || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{wizard.ownerUserName || "Owner selected"}</p>
                    <p className="text-xs" style={{ color: "var(--medium-gray)" }}>Products will be pulled from this user&apos;s listings</p>
                  </div>
                  <button type="button" onClick={() => setOwnerPickerOpen(true)} className="text-xs font-bold" style={{ color: "var(--primary)" }}>Change</button>
                </div>
              ) : (
                <button type="button" onClick={() => setOwnerPickerOpen(true)}
                  className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
                  + Select owner
                </button>
              )}

              {requestsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
                </div>
              ) : requests.length > 0 ? (
                <div className="space-y-1.5 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                  <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Import from approved request</p>
                  <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Prefills product, audience, schedule and creative.</p>
                  {requests.slice(0, 6).map((r) => (
                    <button key={r._id} type="button" onClick={() => applyRequest(r._id)} disabled={applyingId === r._id}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left disabled:opacity-50"
                      style={{
                        backgroundColor: wizard.sourceRequestId === r._id ? "var(--primary-light)" : "var(--background)",
                        border: "1px solid var(--border)",
                      }}>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color: "var(--foreground)" }}>{r.title || "Advertisement request"}</span>
                      <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                        {applyingId === r._id ? "Loading…" : r.status.replace("_", " ")}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </Reveal>
        </div>
      </Reveal>

      <Field label="Campaign name" required>
        <TextInput value={wizard.name} onChange={(e) => wizard.setName(e.target.value)} placeholder="Internal name, e.g. Bearings push — June" />
      </Field>
      <Field label="Notes (internal)">
        <TextArea value={wizard.description} onChange={(e) => wizard.setDescription(e.target.value)} rows={2} placeholder="Optional — why this campaign exists" />
      </Field>

      {ownerPickerOpen && (
        <UserPicker
          single
          title="Select owner"
          selectedIds={wizard.ownerUserId ? [wizard.ownerUserId] : []}
          onToggle={(u) => { wizard.setOwnerUserId(u.id); wizard.setOwnerUserName(u.displayName || u.email); wizard.setProduct(null); }}
          onClose={() => setOwnerPickerOpen(false)}
        />
      )}
    </Section>
  );
};
