"use client";

import { Card } from "@/src/components/ui/Surface";
import { ProfilePhotoUploader } from "../../ProfilePhotoUploader";
import { useDashboardContext } from "../context";

/**
 * Avatar + identity + stat pills — mirrors the app's ProfileSummaryCard
 * exactly (app-frontend/src/screens/profile/components/ProfileSummaryCard.tsx):
 * name/email/bio are read-only here (editing happens in ProfileEditorSheet),
 * and the "Profile"/"Security" pills are static in the app too — kept
 * static here rather than faked into looking dynamic.
 */
export const ProfileSummaryCard = ({
  avatarValue,
  onAvatarChange,
  onAvatarUpload,
}: {
  avatarValue?: string;
  onAvatarChange: (src: string) => void;
  onAvatarUpload?: (file: File, base64: string) => Promise<void>;
}) => {
  const { user, activeCompany, companies } = useDashboardContext();
  const name = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <Card padding="lg" className="flex flex-col items-center gap-4 text-center">
      <ProfilePhotoUploader user={user} value={avatarValue} onChange={onAvatarChange} onUpload={onAvatarUpload} />

      <div>
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{name}</p>
        <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{user.email}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {user.role && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize"
            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
          >
            {user.role}
          </span>
        )}
        {(activeCompany?.type ?? user.accountType) && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize"
            style={{ backgroundColor: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }}
          >
            {activeCompany?.type ?? user.accountType}
          </span>
        )}
      </div>

      {user.bio ? (
        <p className="line-clamp-3 text-sm" style={{ color: "var(--foreground)" }}>{user.bio}</p>
      ) : null}

      <div className="grid w-full grid-cols-3" style={{ borderTop: "1px solid var(--border)" }}>
        {[
          { label: "Companies", value: String(companies.length) },
          { label: "Profile", value: "Ready" },
          { label: "Security", value: "Active" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-0.5 px-2 pt-3"
            style={{ borderLeft: i > 0 ? "1px solid var(--border)" : "none" }}
          >
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{stat.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
