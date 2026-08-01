"use client";

/** Expands/collapses the Advanced Details section. Ported from the app's `QuickAdvancedToggle`. */
export const QuickAdvancedToggle = ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-colors hover:opacity-80"
    style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
  >
    <span className="flex items-center gap-2">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: "var(--medium-gray)" }}>
        {open ? (
          <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        )}
      </svg>
      <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>
        {open ? "Advanced mode" : "Quick mode"}
      </span>
    </span>
    <span className="text-[11px] font-semibold" style={{ color: "var(--medium-gray)" }}>
      {open ? "Show less" : "Show more"}
    </span>
  </button>
);
