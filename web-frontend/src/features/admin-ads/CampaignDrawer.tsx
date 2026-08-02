"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdCampaign } from "@/src/services/ad";
import { useMotionSafe } from "@/src/components/ui/motion";
import { useChoose } from "@/src/components/ui/ConfirmDialog";
import { Sheet } from "@/src/components/ui/Sheet";
import { STEPS, useCampaignWizard, type CampaignWizardApi } from "./useCampaignWizard";
import { DrawerTitle, EASE } from "./adStudioShared";
import { SourceOwnerStep } from "./steps/SourceOwnerStep";
import { ProductStep } from "./steps/ProductStep";
import { AudienceStep } from "./steps/AudienceStep";
import { CreativeStep } from "./steps/CreativeStep";
import { ScheduleStep } from "./steps/ScheduleStep";

const StepRail = ({ steps, current, maxReached, onJump, motionSafe }: {
  steps: readonly string[]; current: number; maxReached: number; onJump: (i: number) => void; motionSafe: boolean;
}) => (
  <div className="flex items-center gap-1.5 px-5 py-3" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
    {steps.map((label, i) => {
      const active = i === current;
      const done = i < current;
      const reachable = i <= maxReached;
      return (
        <button key={label} type="button" disabled={!reachable} onClick={() => reachable && onJump(i)}
          style={{ touchAction: "manipulation" }}
          className="flex flex-1 flex-col items-start gap-1 disabled:cursor-default">
          <span className="relative h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
            {active ? (
              <motion.span layoutId={motionSafe ? "adstudio-step-fill" : undefined} className="absolute inset-0 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
                transition={motionSafe ? { type: "spring", stiffness: 420, damping: 34 } : { duration: 0 }} />
            ) : done ? (
              <span className="absolute inset-0 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
            ) : null}
          </span>
          <span className="hidden text-[10px] font-bold uppercase tracking-wide sm:block"
            style={{ color: active ? "var(--primary)" : done ? "var(--foreground)" : "var(--medium-gray)" }}>
            {label}
          </span>
        </button>
      );
    })}
  </div>
);

// The wizard's primary footer actions, isolated so the "reused DOM node"
// bug that let this drawer save a campaign before the admin ever reached
// Publish can't recur: Continue and Publish/Save-changes are *both*
// `type="button"` (the form itself has no submit control at all) and each
// carries a distinct `key` — the historical bug was these two branches
// sharing one reconciliation slot with no key, so React reused the live
// DOM node and merely retyped it from "button" to "submit" mid-interaction;
// a slow double-tap on iOS (no `touch-action: manipulation` previously) then
// landed its first tap on Continue and its second on the freshly-retyped
// submit button. Distinct keys force a fresh node instead.
const WizardFooter = ({ wizard, onRequestClose }: { wizard: CampaignWizardApi; onRequestClose: () => void }) => (
  <div className="flex items-center gap-3 px-5 py-4" style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}>
    <button type="button" onClick={() => (wizard.step === 0 ? void onRequestClose() : wizard.goBack())}
      style={{ border: "1px solid var(--border)", color: "var(--foreground)", touchAction: "manipulation" }}
      className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70">
      {wizard.step === 0 ? "Cancel" : "Back"}
    </button>
    {wizard.step < STEPS.length - 1 ? (
      // Not disabled by validation — a disabled button can't tell the admin
      // *why* it's stuck. Clicking always runs the check; goNext() surfaces
      // the real error banner on failure.
      <button key="continue" type="button" onClick={wizard.goNext}
        style={{ backgroundColor: "var(--primary)", touchAction: "manipulation" }}
        className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80">
        Continue
      </button>
    ) : (
      <button key="submit" type="button" disabled={wizard.saving} onClick={() => void wizard.submit()}
        style={{ backgroundColor: "var(--primary)", touchAction: "manipulation" }}
        className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-60">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={wizard.saving ? "saving" : "idle"}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="inline-flex items-center justify-center gap-2">
            {wizard.saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40" style={{ borderTopColor: "#fff" }} />}
            {wizard.saving
              ? (wizard.isEdit ? "Saving…" : "Creating…")
              : (wizard.isEdit ? "Save changes" : wizard.publish ? "Publish campaign" : "Save as draft")}
          </motion.span>
        </AnimatePresence>
      </button>
    )}
  </div>
);

const DraftResumeBanner = ({ wizard }: { wizard: CampaignWizardApi }) => (
  <div className="mx-5 mt-4 flex items-center gap-3 rounded-xl p-3" style={{ border: "1px solid var(--primary)", backgroundColor: "var(--primary-light)" }}>
    <span className="text-lg">📝</span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Resume your unsaved campaign?</p>
      <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Found a draft from your last session. Uploaded creative isn&apos;t restored.</p>
    </div>
    <button type="button" onClick={wizard.dismissDraft} style={{ color: "var(--medium-gray)", touchAction: "manipulation" }}
      className="flex-shrink-0 text-xs font-bold hover:opacity-70">Discard</button>
    <button type="button" onClick={wizard.resumeDraft} style={{ backgroundColor: "var(--primary)", touchAction: "manipulation" }}
      className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">Resume</button>
  </div>
);

type CloseAction = "keep" | "draft" | "discard";

const CampaignDrawerSession = ({ open, campaign, onClose, onSaved }: {
  open: boolean; campaign?: AdCampaign | null; onClose: () => void; onSaved: (c: AdCampaign) => void;
}) => {
  const motionSafe = useMotionSafe();
  const choose = useChoose();
  const wizard = useCampaignWizard({ campaign, onSaved });
  const bodyRef = useRef<HTMLDivElement>(null);

  // Each step should open scrolled to top — without this, a step reached
  // after scrolling through a long one (Creative) renders mid-scroll.
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [wizard.step]);

  // Backdrop/✕/Escape/swipe-down all *request* a close rather than closing
  // directly — Sheet's `onClose` routes here. Offers three ways out instead
  // of a lose-everything binary: keep editing (default), save as a real
  // draft (when the campaign has enough to be saved at all — Source & Owner
  // and Select Product), or discard.
  const requestClose = async () => {
    if (wizard.saving) return;
    if (!wizard.isDirty) { onClose(); return; }
    const action = await choose<CloseAction>({
      title: "Unsaved changes",
      message: wizard.canSaveAsDraft
        ? "Save this campaign as a draft, keep editing, or discard your changes — including any uploaded creative."
        : "This campaign isn't far enough along to save as a draft yet. Keep editing, or discard — your typed fields are also kept locally so closing the tab isn't destructive either way.",
      dismissValue: "keep",
      actions: [
        { value: "keep", label: "Keep editing", variant: "ghost" },
        ...(wizard.canSaveAsDraft ? [{ value: "draft" as const, label: "Save as draft", variant: "primary" as const }] : []),
        { value: "discard", label: "Discard", variant: "danger" },
      ],
    });
    if (action === "keep") return;
    if (action === "discard") { onClose(); return; }
    await wizard.submit({ statusOverride: "draft" });
  };

  const stepBody = (() => {
    switch (wizard.step) {
      case 0: return <SourceOwnerStep wizard={wizard} motionSafe={motionSafe} />;
      case 1: return <ProductStep wizard={wizard} />;
      case 2: return <AudienceStep wizard={wizard} motionSafe={motionSafe} />;
      case 3: return <CreativeStep wizard={wizard} motionSafe={motionSafe} />;
      default: return <ScheduleStep wizard={wizard} motionSafe={motionSafe} />;
    }
  })();

  return (
    <Sheet
      open={open}
      onClose={() => void requestClose()}
      dismissible={!wizard.saving}
      bodyRef={bodyRef}
      width={480}
      title={<DrawerTitle title={wizard.isEdit ? "Edit campaign" : "New campaign"} subtitle={`Step ${wizard.step + 1} of ${STEPS.length} · ${STEPS[wizard.step]}`} />}
      subHeader={<StepRail steps={STEPS} current={wizard.step} maxReached={wizard.maxStep} onJump={wizard.jumpToStep} motionSafe={motionSafe} />}
      footer={<WizardFooter wizard={wizard} onRequestClose={requestClose} />}
    >
      {wizard.draftAvailable && <DraftResumeBanner wizard={wizard} />}
      <form
        onSubmit={wizard.handleFormSubmit}
        onKeyDown={(e) => {
          // Defense in depth — the form has no submit button to trigger
          // implicit submission anymore, but a keyboard's Enter/Go/Done key
          // firing a synthetic submit is one browser quirk away.
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") e.preventDefault();
        }}
        className="flex flex-col gap-4 p-5"
      >
        {/*
          Deliberately NOT `<AnimatePresence mode="wait">` — that variant
          withholds the incoming step until the outgoing one finishes its exit
          animation, so interrupting that window (double-clicking Continue,
          tapping a StepRail dot mid-transition) can leave nothing mounted: a
          blank body under a header that still reads "Step 2 of 5". Keying a
          plain motion.div by `step` instead (no exit) remounts and replays
          initial->animate in one commit, so a step body is always present.
          Same fix already applied to page navigation — see the writeup at
          src/components/ui/PageTransition.tsx (AnimatedPage).
        */}
        <motion.div
          key={wizard.step}
          initial={motionSafe ? { opacity: 0, x: wizard.direction >= 0 ? 16 : -16 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: motionSafe ? 0.18 : 0, ease: EASE }}
          className="flex flex-col gap-4">
          {stepBody}
        </motion.div>

        <AnimatePresence>
          {wizard.error && (
            <motion.div
              initial={motionSafe ? { opacity: 0, y: -4 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: motionSafe ? 0.15 : 0 }}
              className="rounded-xl px-3 py-2.5 text-xs font-semibold"
              style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger-strong)" }}>
              {wizard.error}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Sheet>
  );
};

export type CampaignDrawerProps = {
  open: boolean;
  /** Bumped by the caller every time the drawer opens for a new session (create or edit) — forces a fresh wizard/draft state instead of reusing whatever the previous session left behind, while `Sheet` itself stays mounted across the whole open/close cycle so its slide animation still plays. */
  sessionKey: number;
  campaign?: AdCampaign | null;
  onClose: () => void;
  onSaved: (campaign: AdCampaign) => void;
};

export const CampaignDrawer = ({ open, sessionKey, campaign, onClose, onSaved }: CampaignDrawerProps) => (
  <CampaignDrawerSession key={sessionKey} open={open} campaign={campaign} onClose={onClose} onSaved={onSaved} />
);
