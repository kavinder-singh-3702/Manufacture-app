"use client";

import { useEffect, useRef, useState } from "react";

type NavItem = { id: string; label: string };

type Props = { items: NavItem[] };

/**
 * Sticky anchor tabs for the long-form sections (Product Details, Company
 * Details, Reviews…). Links are real `<a href="#id">` anchors — navigable
 * with JS disabled — with `IntersectionObserver` scroll-spy layered on top
 * as progressive enhancement.
 */
export const SectionNav = ({ items }: Props) => {
  const [active, setActive] = useState(items[0]?.id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );
    elements.forEach((el) => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Product sections"
      className="sticky top-16 z-20 -mx-1 overflow-x-auto px-1 py-2 backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in srgb, var(--background) 88%, transparent)", borderBottom: "1px solid var(--border)", scrollbarWidth: "none" }}>
      <div className="flex gap-1.5 sm:gap-2">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <a key={item.id} href={`#${item.id}`}
              className="flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all"
              style={{
                backgroundColor: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#fff" : "var(--medium-gray)",
                border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
              }}>
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
};
