"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { AuthUser } from "@/src/types/auth";
import { ProfileIcon } from "./user-dashboard/profile/ProfileIcons";

type ProfilePhotoUploaderProps = {
  user: AuthUser;
  value?: string;
  onChange: (src: string) => void;
  onUpload?: (file: File, base64: string) => Promise<void>;
};

/**
 * Circular tap-to-upload avatar with a small camera badge overlay — mirrors
 * the app's avatar interaction exactly: whole avatar is the tap target, the
 * badge swaps to a spinner while uploading (boolean only, no progress %),
 * base64 upload via FileReader, no crop step (app-frontend/src/screens/
 * profile/ProfileScreen.tsx#L124-168 uses the OS's own file picker too).
 */
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
    <div className="flex flex-col items-center gap-2">
      <label
        aria-disabled={uploading}
        className="group relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full text-xl font-bold aria-disabled:cursor-not-allowed"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            handleFileChange(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        {preview ? (
          <img loading="lazy" decoding="async" src={preview} alt="Avatar preview" className="h-full w-full rounded-full object-cover" />
        ) : (
          initials
        )}
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2"
          style={{ backgroundColor: "var(--primary)", borderColor: "var(--surface)", color: "#fff" }}
        >
          {uploading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <ProfileIcon name="camera" size={14} color="#fff" />
          )}
        </span>
      </label>
      {error ? <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{error}</p> : null}
    </div>
  );
};
