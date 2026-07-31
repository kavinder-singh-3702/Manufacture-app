"use client";

import { ReactNode, useRef } from "react";

type Props<T> = {
  items: T[];
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  ariaLabel: string;
};

/**
 * Snap-scroll carousel with desktop arrow buttons. Generic over item type so
 * it serves "More from this seller", "Similar products" and "Explore More
 * Products" from one implementation instead of three copies.
 */
export const ProductCarousel = <T,>({ items, itemKey, renderItem, ariaLabel }: Props<T>) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div ref={trackRef} role="group" aria-label={ariaLabel}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: "thin", scrollSnapType: "x mandatory" }}>
        {items.map((item) => (
          <div key={itemKey(item)} style={{ scrollSnapAlign: "start" }}>
            {renderItem(item)}
          </div>
        ))}
      </div>

      {items.length > 3 && (
        <div className="pointer-events-none absolute inset-y-0 -left-3 -right-3 hidden items-center justify-between lg:flex">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll left"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-md transition-opacity hover:opacity-85"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
            ←
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll right"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-md transition-opacity hover:opacity-85"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
            →
          </button>
        </div>
      )}
    </div>
  );
};
