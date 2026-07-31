"use client";

import { type ReactNode } from "react";
import { ProfileIcon, type ProfileIconName } from "./ProfileIcons";

/** Icon + label + value row shared by ProfileAccountCard and ProfileProfessionalCard. */
export const ProfileInfoRow = ({ icon, label, value }: { icon: ProfileIconName; label: string; value: ReactNode }) => (
  <div className="flex items-start gap-3 py-2.5">
    <span
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: "var(--background)", color: "var(--medium-gray)" }}
    >
      <ProfileIcon name={icon} size={15} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>{label}</p>
      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{value}</div>
    </div>
  </div>
);
