"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { AdCampaign } from "@/src/services/ad";
import { useMotionSafe } from "@/src/components/ui/motion";
import { useConfirm } from "@/src/components/ui/ConfirmDialog";
import { STEPS, useCampaignWizard } from "./useCampaignWizard";
import { Drawer, DrawerHeader, EASE } from "./adStudioShared";
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

export const CampaignDrawer = ({ campaign, onClose, onSaved }: { campaign?: AdCampaign | null; onClose: () => void; onSaved: () => void }) => {
  const motionSafe = useMotionSafe();
  const confirm = useConfirm();
  const wizard = useCampaignWizard({ campaign, onSaved: () => onSaved() });

  // Backdrop/✕/Cancel/Escape all *request* a close rather than closing
  // directly — a bare `onClose` used to sit straight on the backdrop's
  // onClick, so a single stray click outside the ~448px panel silently
  // discarded the whole wizard (including an uploaded banner) with no
  // confirmation and no guard against closing mid-save.
  const requestClose = async () => {
    if (wizard.saving) return;
    if (!wizard.isDirty) { onClose(); return; }
    const ok = await confirm({
      title: "Discard this campaign?",
      message: "Your changes, including any uploaded creative, will be lost.",
      confirmLabel: "Discard",
      destructive: true,
    });
    if (ok) onClose();
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
    <Drawer onRequestClose={() => void requestClose()}>
      <DrawerHeader
        title={wizard.isEdit ? "Edit campaign" : "New campaign"}
        subtitle={`Step ${wizard.step + 1} of ${STEPS.length} · ${STEPS[wizard.step]}`}
        onClose={() => void requestClose()}
      />
      <StepRail steps={STEPS} current={wizard.step} maxReached={wizard.maxStep} onJump={wizard.jumpToStep} motionSafe={motionSafe} />
      <form onSubmit={wizard.handleSubmit} className="flex flex-col gap-4 p-5">
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

        <div className="sticky bottom-0 -mx-5 flex items-center gap-3 px-5 py-4" style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={() => (wizard.step === 0 ? void requestClose() : wizard.goBack())}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
            {wizard.step === 0 ? "Cancel" : "Back"}
          </button>
          {wizard.step < STEPS.length - 1 ? (
            // Not disabled by validation — a disabled button can't tell the
            // admin *why* it's stuck (the only signal used to be a native
            // `title` tooltip mouse users never see). Clicking always runs the
            // check; goNext() surfaces the real error banner on failure.
            <button type="button" onClick={wizard.goNext}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80">
              Continue
            </button>
          ) : (
            <button type="submit" disabled={wizard.saving}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-60">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={wizard.saving ? "saving" : "idle"}
                  initial={motionSafe ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: motionSafe ? 0.15 : 0 }}
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
      </form>
    </Drawer>
  );
};
