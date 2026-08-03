"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/src/providers/ChatProvider";

const MAX_TEXTAREA_HEIGHT = 120;
const TYPING_STOP_DELAY_MS = 2500;

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Auto-growing composer with image attach + live typing signal. Replaces the
 * old fixed `rows={1}` textarea (U5) and gives web the image-send capability
 * the app has always had (X8).
 */
export const Composer = ({
  conversationId,
  onSend,
  onSendImage,
  disabled,
}: {
  conversationId: string;
  onSend: (text: string) => Promise<void> | void;
  onSendImage: (payload: { base64: string; fileName: string; mimeType: string }) => Promise<void> | void;
  disabled?: boolean;
}) => {
  const { sendTyping } = useChat();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  // Reset composer + typing state whenever the open thread changes.
  useEffect(() => {
    setValue("");
    isTypingRef.current = false;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (isTypingRef.current) sendTyping(conversationId, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleChange = (text: string) => {
    setValue(text);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);

    if (text.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        sendTyping(conversationId, true);
      }
      stopTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        sendTyping(conversationId, false);
      }, TYPING_STOP_DELAY_MS);
    } else if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(conversationId, false);
    }
  };

  const handleSend = async () => {
    const text = value.trim();
    if (!text || sending) return;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(conversationId, false);
    }
    setValue("");
    setSending(true);
    try {
      await onSend(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await onSendImage({ base64: dataUrl, fileName: file.name, mimeType: file.type });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-end gap-2 p-3" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFileSelected(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        aria-label="Attach image"
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--background)" }}
      >
        {uploading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
          }
        }}
        placeholder="Type a message…"
        rows={1}
        maxLength={2000}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-60"
        style={{
          backgroundColor: "var(--background)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          maxHeight: MAX_TEXTAREA_HEIGHT,
        }}
      />

      <button
        onClick={() => void handleSend()}
        disabled={!value.trim() || sending || disabled}
        aria-label="Send message"
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ backgroundColor: "var(--primary)", color: "#fff" }}
      >
        {sending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
};
