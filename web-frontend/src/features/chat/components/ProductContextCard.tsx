"use client";

import Image from "next/image";
import Link from "next/link";
import type { ChatContextRef } from "@/src/types/chat";

/**
 * Pinned product reference above a thread — mirrors app-frontend/src/screens/
 * chat/components/ChatProductContextCard.tsx. Backed by the message's own
 * `contextRef` (stamped server-side on the first outbound message of a
 * product-scoped chat), so it works whether the thread was opened from the
 * product page (route-supplied) or from the inbox on a returning visit
 * (derived from message history) — same as the app.
 */
export const ProductContextCard = ({ contextRef }: { contextRef: ChatContextRef }) => {
  if (contextRef.type !== "product" || !contextRef.refId) return null;

  return (
    <Link
      href={`/dashboard/products/${contextRef.refId}`}
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:opacity-90"
      style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: "var(--background)" }}>
        {contextRef.imageUrl ? (
          <Image src={contextRef.imageUrl} alt={contextRef.label || "Product"} width={40} height={40} className="h-full w-full object-cover" unoptimized />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Chatting about</p>
        <p className="truncate text-xs font-bold" style={{ color: "var(--foreground)" }}>{contextRef.label || "Product"}</p>
      </div>
      <span className="flex-shrink-0 text-xs font-semibold" style={{ color: "var(--primary)" }}>View →</span>
    </Link>
  );
};
