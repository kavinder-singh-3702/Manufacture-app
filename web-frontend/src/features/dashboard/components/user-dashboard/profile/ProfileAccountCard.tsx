"use client";

import { Card } from "@/src/components/ui/Surface";
import { ProfileInfoRow } from "./ProfileInfoRow";
import { useDashboardContext } from "../context";

const formatAddress = (user: ReturnType<typeof useDashboardContext>["user"]) => {
  const parts = [user.address?.line1, user.address?.line2, user.address?.city, user.address?.state, user.address?.postalCode, user.address?.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Not set";
};

/**
 * Display-only account info + one "Edit" button — mirrors the app's
 * ProfileAccountCard exactly. Phone is deliberately never editable here
 * (app-frontend/src/screens/profile/ProfileScreen.tsx#L97-100).
 */
export const ProfileAccountCard = ({ onEdit }: { onEdit: () => void }) => {
  const { user } = useDashboardContext();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Not set";

  return (
    <Card padding="md">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>Account information</p>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full px-3 py-1 text-xs font-bold transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
        >
          Edit
        </button>
      </div>
      <div className="divide-y divide-[var(--border)]">
        <ProfileInfoRow icon="person" label="Full name" value={fullName} />
        <ProfileInfoRow icon="at" label="Display name" value={user.displayName || "Not set"} />
        <ProfileInfoRow icon="mail" label="Email" value={user.email} />
        <ProfileInfoRow icon="call" label="Phone" value={user.phone || "Not set"} />
        <ProfileInfoRow icon="location" label="Address" value={formatAddress(user)} />
      </div>
    </Card>
  );
};
