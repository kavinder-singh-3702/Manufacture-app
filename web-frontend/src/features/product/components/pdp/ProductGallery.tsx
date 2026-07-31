"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductImage } from "@/src/types/product";
import type { CategoryMeta } from "../../utils/categories";

type StockBadge = { label: string; bg: string; text: string };

type Props = {
  images: ProductImage[];
  productName: string;
  categoryMeta?: CategoryMeta;
  stockBadge?: StockBadge | null;
};

const useCanHover = () => {
  // Lazy initializer covers the initial read; the effect only subscribes to
  // later changes, so setState never fires synchronously from an effect body.
  const [canHover, setCanHover] = useState(() => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const handler = () => setCanHover(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return canHover;
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
};

/**
 * Gallery — main viewer, thumb rail, hover zoom, swipe, lightbox. Layout
 * switches purely via CSS breakpoints; the same scroll-snap track powers
 * both mobile swipe and desktop thumb-driven navigation, so there's one
 * image-index source of truth instead of separate mobile/desktop code paths.
 */
export const ProductGallery = ({ images, productName, categoryMeta, stockBadge }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const canHover = useCanHover();
  const reducedMotion = usePrefersReducedMotion();

  const count = images.length;
  const cover = images[activeIndex]?.url;
  const fallbackBg = categoryMeta ? `linear-gradient(135deg, ${categoryMeta.bg} 0%, ${categoryMeta.bg}cc 100%)` : "var(--light-gray)";

  const goTo = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const clamped = Math.max(0, Math.min(count - 1, index));
    setActiveIndex(clamped);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: clamped * track.clientWidth, behavior: reducedMotion ? "auto" : behavior });
  }, [count, reducedMotion]);

  // Sync activeIndex when the user swipes the track directly (mobile).
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTrackScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const index = Math.round(track.scrollLeft / track.clientWidth);
      setActiveIndex(Math.max(0, Math.min(count - 1, index)));
    }, 80);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(activeIndex - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(activeIndex + 1); }
  };

  // Lightbox keyboard nav
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goTo(activeIndex - 1);
      if (e.key === "ArrowRight") goTo(activeIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, activeIndex, goTo]);

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl text-8xl lg:aspect-auto lg:h-full"
        style={{ background: fallbackBg, border: "1px solid var(--border)" }}>
        {categoryMeta?.icon ?? "📦"}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl lg:flex lg:h-full lg:flex-col" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
      <div className="xl:flex xl:gap-3 xl:p-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col xl:flex-row">
        {/* Vertical thumb rail — xl+ only */}
        {count > 1 && (
          <div role="tablist" aria-label="Product images" className="order-1 hidden max-h-[440px] flex-col gap-2 overflow-y-auto xl:flex xl:w-20 xl:flex-shrink-0"
            style={{ scrollbarWidth: "thin" }}>
            {images.map((img, i) => (
              <button key={img.url ?? i} type="button" role="tab" aria-selected={i === activeIndex}
                onClick={() => goTo(i)}
                className="aspect-square flex-shrink-0 overflow-hidden rounded-xl transition-all"
                style={{ border: i === activeIndex ? "2px solid var(--primary)" : "1px solid var(--border)" }}>
                {img.url && <img loading="lazy" decoding="async" src={img.url} alt="" className="h-full w-full object-cover" />}
              </button>
            ))}
          </div>
        )}

        <div className="order-2 min-w-0 flex-1 lg:flex lg:min-h-0 lg:flex-col">
          {/* Main viewer — scroll-snap track doubles as mobile swipe + desktop single-frame view */}
          <div ref={trackRef} onScroll={handleTrackScroll} tabIndex={0} onKeyDown={handleKeyDown}
            role="group" aria-label={`${productName} images`}
            className="relative flex overflow-x-auto outline-none lg:min-h-0 lg:flex-1"
            style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
            {images.map((img, i) => (
              <div key={img.url ?? i} className="relative aspect-[4/3] w-full flex-shrink-0 lg:aspect-auto lg:h-full"
                style={{ scrollSnapAlign: "start", background: fallbackBg }}
                onMouseMove={i === activeIndex ? handleZoomMove : undefined}
                onMouseLeave={() => setZoomPos(null)}>
                {img.url ? (
                  <button type="button" onClick={() => setLightboxOpen(true)} className="block h-full w-full cursor-zoom-in" aria-label="Open full-size image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img loading={i === 0 ? "eager" : "lazy"} decoding="async" src={img.url} alt={i === 0 ? productName : ""} className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-7xl">{categoryMeta?.icon ?? "📦"}</div>
                )}
                {/* Hover zoom lens — desktop only, active frame only */}
                {canHover && i === activeIndex && zoomPos && img.url && (
                  <div className="pointer-events-none absolute inset-0 hidden xl:block"
                    style={{ backgroundImage: `url(${img.url})`, backgroundSize: "220%", backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`, backgroundRepeat: "no-repeat" }} />
                )}
              </div>
            ))}

            {stockBadge && (
              <div className="pointer-events-none absolute bottom-4 right-4">
                <span className="rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm" style={{ backgroundColor: stockBadge.bg, color: stockBadge.text }}>
                  {stockBadge.label}
                </span>
              </div>
            )}
            {count > 1 && (
              <div className="pointer-events-none absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                {activeIndex + 1}/{count}
              </div>
            )}
          </div>

          {/* Dots — mobile only */}
          {count > 1 && (
            <div className="flex justify-center gap-1.5 py-3 md:hidden">
              {images.map((_, i) => (
                <button key={i} type="button" aria-label={`Go to image ${i + 1}`} onClick={() => goTo(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === activeIndex ? 16 : 6, backgroundColor: i === activeIndex ? "var(--primary)" : "var(--border)" }} />
              ))}
            </div>
          )}

          {/* Horizontal thumb strip — md to lg only */}
          {count > 1 && (
            <div role="tablist" aria-label="Product images" className="hidden gap-2 overflow-x-auto p-3 md:flex xl:hidden" style={{ scrollbarWidth: "thin" }}>
              {images.map((img, i) => (
                <button key={img.url ?? i} type="button" role="tab" aria-selected={i === activeIndex}
                  onClick={() => goTo(i)}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl transition-all"
                  style={{ border: i === activeIndex ? "2px solid var(--primary)" : "1px solid var(--border)" }}>
                  {img.url && <img loading="lazy" decoding="async" src={img.url} alt="" className="h-full w-full object-cover" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && cover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`${productName} — full-size image`}
          onClick={() => setLightboxOpen(false)}>
          <button type="button" onClick={() => setLightboxOpen(false)} aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-white hover:opacity-75" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            ✕
          </button>
          {count > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1); }} aria-label="Previous image"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-xl text-white hover:opacity-75" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                ←
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1); }} aria-label="Next image"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-xl text-white hover:opacity-75" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                →
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={productName} className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          {count > 1 && (
            <div className="absolute bottom-4 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              {activeIndex + 1} / {count}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
