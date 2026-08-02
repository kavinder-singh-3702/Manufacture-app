"use client";

import type { CampaignWizardApi } from "../useCampaignWizard";
import { Field, Label, Reveal, Section, SegmentedControl, TextInput } from "../adStudioShared";

// Module-level helper (not inline in the component body) so the impure
// Date.now() read isn't attributed to render purity — same pattern the other
// admin-ads files use for their relativeDate() helpers.
const isInFuture = (localDateTimeValue: string) => Boolean(localDateTimeValue) && new Date(localDateTimeValue).getTime() > Date.now();

export const ScheduleStep = ({ wizard, motionSafe }: { wizard: CampaignWizardApi; motionSafe: boolean }) => {
  const priorityLabel = wizard.priority >= 75 ? "High" : wizard.priority >= 40 ? "Medium" : "Low";
  const startsInFuture = isInFuture(wizard.startAt);

  return (
    <Section>
      <div>
        <div className="flex items-center justify-between">
          <Label>Priority</Label>
          <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{priorityLabel} · {wizard.priority}</span>
        </div>
        <input type="range" min={1} max={100} value={wizard.priority} onChange={(e) => wizard.setPriority(Number(e.target.value))}
          className="w-full accent-[var(--primary)]" />
        <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Higher priority wins when several ads compete for the same slot.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Frequency cap / day">
          <TextInput type="number" inputMode="numeric" enterKeyHint="done" min="1" max="50" value={wizard.freqCap} onChange={(e) => wizard.setFreqCap(e.target.value)} />
          <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>Max impressions per visitor, per day, across all placements.</p>
        </Field>
        <Field label="Popup cadence (min)">
          <TextInput type="number" inputMode="numeric" enterKeyHint="done" min="5" max="1440" value={wizard.popupCooldown} onChange={(e) => wizard.setPopupCooldown(e.target.value)} />
          <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>Minutes between interstitial popup showings.</p>
        </Field>
      </div>
      <div className="flex items-center justify-between">
        <Label>Schedule</Label>
        {(wizard.startAt || wizard.endAt) && (
          <button type="button" onClick={() => { wizard.setStartAt(""); wizard.setEndAt(""); }}
            className="text-[11px] font-bold" style={{ color: "var(--medium-gray)" }}>Clear</button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Starts">
          <TextInput type="datetime-local" value={wizard.startAt} onChange={(e) => wizard.setStartAt(e.target.value)} />
        </Field>
        <Field label="Ends">
          <TextInput type="datetime-local" value={wizard.endAt} onChange={(e) => wizard.setEndAt(e.target.value)} />
        </Field>
      </div>
      <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Leave blank to run indefinitely once activated.</p>

      {/* Explicit publish choice — replaces a toggle that used to sit buried at
          the very bottom of the last step, defaulting OFF. A campaign an admin
          just built and never noticed the toggle would silently save as an
          invisible draft; this makes the choice itself the control, defaulting
          to Publish. Only shown when this wizard is allowed to change status —
          a paused/completed/archived campaign's lifecycle stays owned by the
          Activate/Pause/Archive buttons on its card. */}
      <Reveal show={wizard.editableStatus} motionSafe={motionSafe}>
        <div>
          <Label>Publish</Label>
          <SegmentedControl
            layoutId="adstudio-publish"
            value={wizard.publish ? "publish" : "draft"}
            onChange={(v) => wizard.setPublish(v === "publish")}
            options={[{ value: "publish", label: "Publish now" }, { value: "draft", label: "Save as draft" }]}
          />
          <p className="mt-1.5 text-[11px]" style={{ color: "var(--medium-gray)" }}>
            {wizard.publish
              ? startsInFuture
                ? `Goes live and starts serving from ${new Date(wizard.startAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.`
                : "Goes live and starts serving right away."
              : "Saved as a draft — nothing is shown to users until you activate it from the campaign card."}
          </p>
        </div>
      </Reveal>
    </Section>
  );
};
