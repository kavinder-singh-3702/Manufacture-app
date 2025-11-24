"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { AuthUser } from "@/src/types/auth";

type ProfilePhotoUploaderProps = {
  user: AuthUser;
  value?: string;
  onChange: (src: string) => void;
  onUpload?: (file: File, base64: string) => Promise<void>;
};

export const ProfilePhotoUploader = ({ user, value, onChange, onUpload }: ProfilePhotoUploaderProps) => {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setError("Unable to read file.");
        return;
      }
      try {
        setUploading(true);
        if (onUpload) {
          await onUpload(file, result);
        } else {
          onChange(result);
        }
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setError(message);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => setError("Unable to read file.");
    reader.readAsDataURL(file);
  };

  const preview = value || user.avatarUrl || "";
  const initials = (user.displayName ?? user.email ?? "NA").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-white text-sm font-semibold text-[var(--color-plum)]">
          {preview ? <img src={preview} alt="Avatar preview" className="h-full w-full object-cover" /> : initials}
        </div>
        <div className="flex flex-1 flex-col gap-2 text-sm text-[#5c4451]">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 font-semibold text-[var(--color-plum)] shadow-sm hover:border-[var(--color-plum)]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleFileChange(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            Upload photo
          </label>
          <p className="text-xs text-[#b98b9e]">Upload a JPG/PNG. We will show a preview instantly.</p>
          {error ? <p className="text-xs font-semibold text-[#c53048]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
};
