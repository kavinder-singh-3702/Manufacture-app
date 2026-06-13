"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProductImage } from "@/src/types/product";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PendingImage = {
  id: string;       // local-only ID for keying
  file: File;
  dataUrl: string;  // base64 preview
};

type Props = {
  /** Existing images already saved on the product (show as uploaded) */
  existing?: ProductImage[];
  /** Pending images waiting to be uploaded (controlled from outside) */
  pending: PendingImage[];
  /** Called when user adds files */
  onAdd: (images: PendingImage[]) => void;
  /** Called when user removes a pending image */
  onRemovePending: (id: string) => void;
  /** Called when user removes an already-saved image (returns url/key to delete) */
  onRemoveExisting?: (img: ProductImage) => void;
  /** Max total images (existing + pending). Default 5 */
  maxImages?: number;
  disabled?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const isImageFile = (file: File) => file.type.startsWith("image/");
const MAX_SIZE_MB = 5;

// ── Component ─────────────────────────────────────────────────────────────────

export const ProductImageUploader = ({
  existing = [],
  pending,
  onAdd,
  onRemovePending,
  onRemoveExisting,
  maxImages = 5,
  disabled = false,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const totalCount = existing.length + pending.length;
  const canAdd = totalCount < maxImages && !disabled;

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setSizeError(null);
    const arr = Array.from(files).filter(isImageFile);
    if (arr.length === 0) return;

    const oversized = arr.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setSizeError(`${oversized.map((f) => f.name).join(", ")} exceeds ${MAX_SIZE_MB}MB.`);
      return;
    }

    const slots = maxImages - totalCount;
    const toProcess = arr.slice(0, slots);
    const results: PendingImage[] = await Promise.all(
      toProcess.map(async (file) => ({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        dataUrl: await fileToDataUrl(file),
      }))
    );
    onAdd(results);
  }, [maxImages, totalCount, onAdd]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (canAdd) processFiles(e.dataTransfer.files);
  }, [canAdd, processFiles]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  return (
    <div className="space-y-3">
      {/* Image grid: existing + pending + add slot */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {/* Existing images */}
        {existing.map((img, i) => (
          <div key={img.key ?? img.url ?? i} className="group relative aspect-square overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--border)" }}>
            {img.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl"
                style={{ backgroundColor: "var(--light-gray)" }}>🖼️</div>
            )}
            {onRemoveExisting && !disabled && (
              <button
                type="button"
                onClick={() => onRemoveExisting(img)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
                aria-label="Remove image">
                ✕
              </button>
            )}
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded px-1 py-0.5 text-[9px] font-bold text-white"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>Cover</span>
            )}
          </div>
        ))}

        {/* Pending images */}
        <AnimatePresence>
          {pending.map((img) => (
            <motion.div key={img.id}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative aspect-square overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--primary)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
              {/* Upload pending indicator */}
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: "rgba(20,141,178,0.15)" }}>
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ backgroundColor: "var(--primary)", color: "#fff" }}>New</span>
              </div>
              <button
                type="button"
                onClick={() => onRemovePending(img.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
                aria-label="Remove image">
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add slot */}
        {canAdd && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all"
            style={{
              borderColor: dragging ? "var(--primary)" : "var(--border)",
              backgroundColor: dragging ? "var(--primary-light)" : "var(--surface)",
            }}>
            <span className="text-xl" style={{ color: dragging ? "var(--primary)" : "var(--medium-gray)" }}>+</span>
            <span className="text-[9px] font-semibold text-center leading-tight px-1"
              style={{ color: "var(--medium-gray)" }}>
              Add photo
            </span>
          </motion.button>
        )}
      </div>

      {/* Drop zone — shown when no images and nothing pending */}
      {totalCount === 0 && (
        <motion.div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl py-8 text-center transition-all"
          style={{
            border: `2px dashed ${dragging ? "var(--primary)" : "var(--border)"}`,
            backgroundColor: dragging ? "var(--primary-light)" : "var(--surface)",
          }}>
          <span className="text-3xl">🖼️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Drag & drop photos here
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
              or click to browse · JPG, PNG, WebP · Max {MAX_SIZE_MB}MB each
            </p>
          </div>
        </motion.div>
      )}

      {/* Hint */}
      <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>
        {totalCount}/{maxImages} images · First image is the product cover
      </p>

      {/* Error */}
      <AnimatePresence>
        {sizeError && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
            ⚠️ {sizeError}
          </motion.p>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
};
