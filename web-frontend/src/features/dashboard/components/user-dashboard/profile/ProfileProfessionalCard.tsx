"use client";

import { Card } from "@/src/components/ui/Surface";
import { ProfileInfoRow } from "./ProfileInfoRow";
import { useDashboardContext } from "../context";

/**
 * Display-only professional info + one "Edit" button — mirrors the app's
 * ProfileProfessionalCard. "Company About" edits the same
 * `activeCompany.description` field the Company page already edits — a
 * second, convenient entry point to the same data, exactly like the app.
 */
export const ProfileProfessionalCard = ({ onEdit }: { onEdit: () => void }) => {
  const { user, activeCompany } = useDashboardContext();
  const tags = Array.isArray(user.activityTags) ? user.activityTags : [];

  return (
    <Card padding="md">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>Professional</p>
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
        <ProfileInfoRow
          icon="building"
          label="Company about"
          value={
            activeCompany
              ? activeCompany.description?.length
                ? <span className="line-clamp-4">{activeCompany.description}</span>
                : "Add your company overview to build trust with buyers."
              : "Create a company to add an overview."
          }
        />
        <ProfileInfoRow
          icon="person"
          label="Bio"
          value={user.bio?.length ? <span className="line-clamp-4">{user.bio}</span> : "Add a short personal bio to highlight your role and expertise."}
        />
        <ProfileInfoRow
          icon="sliders"
          label="Skills & interests"
          value={
            tags.length ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-dark)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              "No tags added yet."
            )
          }
        />
      </div>
    </Card>
  );
};
