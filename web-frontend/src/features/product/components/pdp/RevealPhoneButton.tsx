"use client";

import { useState } from "react";
import { maskPhone } from "../../utils/seller";

type Props = {
  phone: string;
  /** Whether the current visitor is signed in. Auth *policy* stays in the orchestrator — this only decides what to render. */
  isAuthed: boolean;
  /** Called instead of revealing when a guest clicks — orchestrator shows the sign-in toast. */
  onRequireAuth: () => void;
};

/**
 * Masked phone number → "View Mobile Number" → revealed on click. Mirrors
 * IndiaMART's reveal-as-conversion pattern; the guard against unauthenticated
 * reveal is the same auth-gate the rest of the page already uses for chat/call.
 */
export const RevealPhoneButton = ({ phone, isAuthed, onRequireAuth }: Props) => {
  const [revealed, setRevealed] = useState(false);

  const handleClick = () => {
    if (!isAuthed) { onRequireAuth(); return; }
    setRevealed(true);
  };

  return (
    <div className="rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>Phone</p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <p className="font-mono text-sm font-bold tabular-nums" style={{ color: "var(--foreground)" }} aria-live="polite">
          {revealed ? phone : maskPhone(phone)}
        </p>
        {!revealed && (
          <button type="button" onClick={handleClick}
            className="flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: "var(--primary)" }}>
            View Mobile Number
          </button>
        )}
        {revealed && (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: "var(--success)" }}>
            📞 Call
          </a>
        )}
      </div>
    </div>
  );
};
