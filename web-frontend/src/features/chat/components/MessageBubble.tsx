"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/src/types/chat";

const isImageAttachment = (type?: string, url?: string) =>
  Boolean(type?.startsWith("image/")) || /\.(png|jpe?g|webp|gif)$/i.test(url || "");

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const h = date.getHours() % 12 || 12;
  const m = date.getMinutes();
  const ampm = date.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m < 10 ? "0" + m : m} ${ampm}`;
};

/**
 * Full-screen lightbox for a tapped image bubble. Self-contained (no
 * external lib) — dims the page and centers the image at natural aspect
 * ratio, closes on backdrop tap or Escape.
 */
const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 z-[200] flex items-center justify-center p-6"
    style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
    <button
      onClick={onClose}
      aria-label="Close"
      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-white"
      style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
    >
      ✕
    </button>
  </motion.div>
);

export const MessageBubble = ({
  message,
  isMe,
  showTail,
}: {
  message: ChatMessage;
  isMe: boolean;
  /** False for the 2nd+ bubble in a consecutive run from the same sender — tightens vertical rhythm and drops the corner tail. */
  showTail: boolean;
}) => {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const imageAttachment = message.attachments?.find((a) => isImageAttachment(a.type, a.url));
  const hasTextBeyondCaption = message.content && message.content !== "Sent a photo";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`} style={{ marginTop: showTail ? 10 : 2 }}>
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="max-w-[78%] sm:max-w-[65%]"
      >
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor: isMe ? "var(--primary)" : "var(--surface)",
            border: isMe ? "none" : "1px solid var(--border)",
            borderBottomRightRadius: isMe && showTail ? 6 : undefined,
            borderBottomLeftRadius: !isMe && showTail ? 6 : undefined,
          }}
        >
          {imageAttachment && (
            <button
              type="button"
              onClick={() => setLightboxSrc(imageAttachment.url)}
              className="block w-full"
            >
              <Image
                src={imageAttachment.url}
                alt={hasTextBeyondCaption ? message.content : "Photo"}
                width={320}
                height={240}
                unoptimized
                className="h-auto max-h-72 w-full object-cover"
              />
            </button>
          )}
          {(!imageAttachment || hasTextBeyondCaption) && (
            <p
              className="whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed"
              style={{ color: isMe ? "#fff" : "var(--foreground)" }}
            >
              {message.content}
            </p>
          )}
          <p
            className="px-4 pb-2 text-right text-[10px]"
            style={{ color: isMe ? "rgba(255,255,255,0.65)" : "var(--medium-gray)" }}
          >
            {formatTime(message.timestamp)}
            {isMe && <span className="ml-1">{message.read ? "✓✓" : "✓"}</span>}
          </p>
        </div>
      </motion.div>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
};
