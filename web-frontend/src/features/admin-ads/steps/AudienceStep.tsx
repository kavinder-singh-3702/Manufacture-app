"use client";

import { useState } from "react";
import { AUDIENCE_PRESETS, type CampaignWizardApi } from "../useCampaignWizard";
import { CategoryMultiSelect } from "@/src/features/ads/components/CategoryMultiSelect";
import { Field, Label, Reveal, Section, SegmentedControl, TextInput, TagEditor, UserPicker } from "../adStudioShared";

export const AudienceStep = ({ wizard, motionSafe }: { wizard: CampaignWizardApi; motionSafe: boolean }) => {
  const [userPickerOpen, setUserPickerOpen] = useState(false);

  return (
    <Section>
      <div className="grid grid-cols-2 gap-2">
        {AUDIENCE_PRESETS.map((a) => {
          const active = wizard.audience === a.key;
          return (
            <button key={a.key} type="button" onClick={() => wizard.setAudience(a.key)}
              className="rounded-xl p-2.5 text-left transition-all"
              style={{
                border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                backgroundColor: active ? "var(--primary-light)" : "var(--surface)",
              }}>
              <p className="text-xs font-bold" style={{ color: active ? "var(--primary)" : "var(--foreground)" }}>{a.icon} {a.label}</p>
              <p className="mt-0.5 text-[10px] leading-tight" style={{ color: "var(--medium-gray)" }}>{a.hint}</p>
            </button>
          );
        })}
      </div>

      {wizard.audience === "specific_users" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Targeted users ({wizard.specificUserIds.length})</Label>
            <button type="button" onClick={() => setUserPickerOpen(true)} className="text-[11px] font-bold" style={{ color: "var(--primary)" }}>+ Add users</button>
          </div>
          {wizard.specificUserIds.length === 0 ? (
            <button type="button" onClick={() => setUserPickerOpen(true)}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
              + Pick users to target
            </button>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {wizard.specificUserIds.map((id) => {
                const u = wizard.specificUsers.find((x) => x.id === id);
                return (
                  <span key={id} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                    {u?.displayName || u?.email || id.slice(-6)}
                    <button type="button" onClick={() => wizard.setSpecificUserIds(wizard.specificUserIds.filter((x) => x !== id))} className="font-bold">✕</button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {wizard.audience === "shopper_category" && (
        <div className="space-y-3">
          <CategoryMultiSelect label="Shopper categories" selected={wizard.shopperCategories}
            onToggle={(id) => wizard.toggleInList(wizard.shopperCategories, wizard.setShopperCategories, id)} />
          <TagEditor label="Shopper sub-categories (optional)" values={wizard.shopperSubCategories}
            placeholder="e.g. Cotton yarn" onChange={wizard.setShopperSubCategories} />
        </div>
      )}
      {wizard.audience === "buy_intent" && (
        <div className="space-y-3">
          <CategoryMultiSelect label="Buying-signal categories" selected={wizard.buyIntentCategories}
            onToggle={(id) => wizard.toggleInList(wizard.buyIntentCategories, wizard.setBuyIntentCategories, id)} />
          <TagEditor label="Buying-signal sub-categories (optional)" values={wizard.buyIntentSubCategories}
            placeholder="e.g. Stainless fittings" onChange={wizard.setBuyIntentSubCategories} />
        </div>
      )}
      {wizard.audience === "same_category_listers" && (
        <div className="space-y-3">
          <p className="rounded-xl p-3 text-[11px]" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--medium-gray)" }}>
            Targets users who have active public listings in the promoted product&apos;s category.
          </p>
          <TagEditor label="Also require these listed-product sub-categories (optional)" values={wizard.listedProductSubCategories}
            placeholder="Type and press Enter" onChange={wizard.setListedProductSubCategories} />
        </div>
      )}

      {wizard.audience !== "everyone" && (
        <>
          <button type="button" onClick={() => wizard.setAdvancedOpen(!wizard.advancedOpen)} className="text-[11px] font-bold" style={{ color: "var(--primary)" }}>
            {wizard.advancedOpen ? "Hide advanced rules" : "Advanced rules"}
          </button>
          <Reveal show={wizard.advancedOpen} motionSafe={motionSafe}>
            <div className="space-y-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <div>
                <Label>Match mode</Label>
                <SegmentedControl layoutId="adstudio-match-mode" value={wizard.targetingMode} onChange={wizard.setTargetingMode}
                  options={[{ value: "any", label: "Match ANY rule" }, { value: "all", label: "Match ALL rules" }]} />
              </div>
              <Field label="Signal lookback (days)">
                <TextInput type="number" inputMode="numeric" enterKeyHint="done" min="1" max="365" value={wizard.lookbackDays}
                  onChange={(e) => wizard.setLookbackDays(e.target.value.replace(/[^0-9]/g, ""))} />
              </Field>
            </div>
          </Reveal>
        </>
      )}

      {userPickerOpen && (
        <UserPicker
          selectedIds={wizard.specificUserIds}
          onToggle={(u) => {
            wizard.setSpecificUsers(wizard.specificUsers.find((x) => x.id === u.id) ? wizard.specificUsers : [...wizard.specificUsers, u]);
            wizard.setSpecificUserIds(wizard.specificUserIds.includes(u.id) ? wizard.specificUserIds.filter((x) => x !== u.id) : [...wizard.specificUserIds, u.id]);
          }}
          onClose={() => setUserPickerOpen(false)}
        />
      )}
    </Section>
  );
};
