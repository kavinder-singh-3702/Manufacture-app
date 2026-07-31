"use client";

import { useState } from "react";
import type { SpecRow } from "../../utils/specs";

type Props = {
  rows: SpecRow[];
  /** 1 column <768px, 2 columns ≥768px by default. Set false to force a single column (buy-box context). */
  twoColumn?: boolean;
  /** Collapse behind "View more" past this many rows. 0 disables collapsing. */
  collapseAfter?: number;
};

/**
 * Zebra key/value table — the single spec-rendering primitive reused by the
 * buy-box spec table, "Additional Information" and "Company Details". A real
 * <table> (not divs) so it reads correctly to assistive tech and prints cleanly.
 */
export const SpecTable = ({ rows, twoColumn = true, collapseAfter = 0 }: Props) => {
  const [expanded, setExpanded] = useState(false);
  if (rows.length === 0) return null;

  const collapsible = collapseAfter > 0 && rows.length > collapseAfter;
  const visibleRows = collapsible && !expanded ? rows.slice(0, collapseAfter) : rows;
  // Split into two column-balanced halves only when the layout is active — CSS
  // handles the actual responsive switch, this just decides row grouping.
  const half = Math.ceil(visibleRows.length / 2);
  const columns = twoColumn ? [visibleRows.slice(0, half), visibleRows.slice(half)] : [visibleRows];

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <div className={twoColumn ? "grid sm:grid-cols-2" : "grid"}>
          {columns.map((col, colIdx) => (
            <table key={colIdx} className="w-full border-collapse text-sm">
              <tbody>
                {col.map((row, i) => (
                  <tr key={row.label} style={{ backgroundColor: i % 2 === 0 ? "var(--card)" : "var(--background)" }}>
                    <th scope="row"
                      className="w-[42%] whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold"
                      style={{ color: "var(--medium-gray)" }}>
                      {row.label}
                    </th>
                    <td className="px-3 py-2.5 font-medium" style={{ color: "var(--foreground)" }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      </div>

      {collapsible && (
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className="text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: "var(--primary)" }}>
          {expanded ? "Show less ▴" : `View more specifications (${rows.length - collapseAfter} more) ▾`}
        </button>
      )}
    </div>
  );
};
