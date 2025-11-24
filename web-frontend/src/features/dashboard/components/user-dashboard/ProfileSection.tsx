import { FormEvent } from "react";
import { ProfilePhotoUploader } from "../ProfilePhotoUploader";
import { COMPANY_VERIFICATION_ACCOUNT_TYPES, CompanyVerificationAccountType } from "@/src/constants/business";
import { buildActivityTags } from "./helpers";
import { ProfileInputField, SectionHeader } from "./shared";
import type { AuthUser } from "@/src/types/auth";
import type { ProfileFormState, ProfileVerificationState } from "./helpers";

export const ProfileVerificationPrompt = ({
  isVerified,
  primaryCompany,
  accountType,
  onRequestVerification,
}: {
  isVerified: boolean;
  primaryCompany?: string;
  accountType?: string;
  onRequestVerification?: () => void;
}) => {
  if (isVerified) return null;
  const normalizedAccountType = (accountType ?? "").toLowerCase() as CompanyVerificationAccountType | "";
  const eligibleAccountType =
    !normalizedAccountType || COMPANY_VERIFICATION_ACCOUNT_TYPES.includes(normalizedAccountType as CompanyVerificationAccountType);
  const handleRequestVerification = () => {
    if (onRequestVerification) {
      onRequestVerification();
      return;
    }
    if (typeof window === "undefined") return;
    document.getElementById("company-verification")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const companyLabel = primaryCompany ?? "Your workspace";

  return (
    <div className="mb-6 rounded-3xl border border-[#fed7aa] bg-gradient-to-r from-[#fffaf0] via-[#fffdf5] to-white p-5 shadow-sm shadow-[#ffefd533]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="inline-flex items-center rounded-full border border-[#fb923c] bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#b45309]">
            Unverified
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#7c2d12]">{companyLabel} isn&apos;t verified yet.</p>
            <p className="text-xs text-[#9a4a2a]">
              Claim the badge to boost trust, unlock private RFQs, and surface higher in buyer searches.
            </p>
          </div>
        </div>
        {eligibleAccountType ? (
          <button
            type="button"
            onClick={handleRequestVerification}
            className="inline-flex items-center justify-center rounded-full bg-[#0d9f6e] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#0d9f6e33] transition hover:scale-[1.01]"
          >
            Get verified
          </button>
        ) : (
          <p className="text-xs font-semibold text-[#b45309]">
            Set your company type to trader or manufacturer to become eligible.
          </p>
        )}
      </div>
    </div>
  );
};

export const ProfileSection = ({
  user,
  editForm,
  onChange,
  onSubmit,
  saveState,
  verificationState,
  onUpload,
}: {
  user: AuthUser;
  editForm: ProfileFormState;
  onChange: (value: ProfileFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saveState: { status: "idle" | "saving" | "success" | "error"; message?: string };
  verificationState?: ProfileVerificationState;
  onUpload?: (file: File, base64: string) => Promise<void>;
}) => {
  const updateField = (key: keyof ProfileFormState, value: string) => {
    onChange({ ...editForm, [key]: value });
  };
  const currentTagPreview = buildActivityTags(editForm.activityTags) ?? [];
  const companyList =
    user.companies && user.companies.length ? user.companies : ["Add a company from admin console"];

  const verificationBadge = verificationState ? (
    <span
      className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide ${
        verificationState.variant === "verified"
          ? "border-[#bbf7d0] bg-[#ecfdf5] text-[#065f46]"
          : verificationState.variant === "pending"
          ? "border-[#fed7aa] bg-[#fff7ed] text-[#b45309]"
          : "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
      }`}
    >
      {verificationState.label}
    </span>
  ) : null;

  const savedBadge =
    saveState.status === "success" ? (
      <span className="rounded-full bg-[var(--color-peach)] px-4 py-1 text-xs font-semibold text-[var(--color-plum)]">Saved</span>
    ) : null;

  const headerAction = verificationBadge || savedBadge ? (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {verificationBadge}
      {savedBadge}
    </div>
  ) : undefined;

  return (
    <div className="space-y-6">
      <SectionHeader title="Profile & identity" subtitle="Profile" action={headerAction} />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#2e1f2c]">Profile photo</h3>
            <ProfilePhotoUploader
              user={user}
              onChange={(src) => updateField("avatarUrl", src)}
              onUpload={onUpload}
              value={editForm.avatarUrl}
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#2e1f2c]">Identity</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInputField
                label="First name"
                value={editForm.firstName}
                onChange={(value) => updateField("firstName", value)}
              />
              <ProfileInputField
                label="Last name"
                value={editForm.lastName}
                onChange={(value) => updateField("lastName", value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInputField
                label="Display name"
                value={editForm.displayName}
                onChange={(value) => updateField("displayName", value)}
                helperText="Shown to teammates across the workspace."
              />
              <ProfileInputField
                label="Username"
                value={user.username ?? "Not set"}
                disabled
                helperText="Unique handle shared across Manufacture."
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#2e1f2c]">Contact</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInputField
                label="Phone"
                value={editForm.phone || user.phone || ""}
                disabled
                helperText="Manage phone number via support."
              />
              <ProfileInputField label="Email" value={user.email} disabled helperText="Primary login email." />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#2e1f2c]">Address</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInputField
                label="Address line 1"
                value={editForm.line1}
                onChange={(value) => updateField("line1", value)}
              />
              <ProfileInputField
                label="Address line 2"
                value={editForm.line2}
                onChange={(value) => updateField("line2", value)}
                helperText="Apartment, suite, etc."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInputField label="City" value={editForm.city} onChange={(value) => updateField("city", value)} />
              <ProfileInputField label="State" value={editForm.state} onChange={(value) => updateField("state", value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInputField
                label="Postal code"
                value={editForm.postalCode}
                onChange={(value) => updateField("postalCode", value)}
              />
              <ProfileInputField
                label="Country"
                value={editForm.country}
                onChange={(value) => updateField("country", value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#2e1f2c]">Professional profile</h3>
            <ProfileInputField
              label="Bio"
              value={editForm.bio}
              onChange={(value) => updateField("bio", value)}
              multiline
              rows={4}
              placeholder="Share more about your sourcing responsibilities."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInputField
                label="Website"
                value={editForm.website}
                onChange={(value) => updateField("website", value)}
              />
              <ProfileInputField
                label="LinkedIn"
                value={editForm.linkedin}
                onChange={(value) => updateField("linkedin", value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInputField
                label="Twitter"
                value={editForm.twitter}
                onChange={(value) => updateField("twitter", value)}
              />
              <ProfileInputField
                label="GitHub"
                value={editForm.github}
                onChange={(value) => updateField("github", value)}
              />
            </div>
            <ProfileInputField
              label="Activity tags"
              value={editForm.activityTags}
              onChange={(value) => updateField("activityTags", value)}
              helperText="Separate tags with commas (e.g., procurement, compliance)."
            />
            {currentTagPreview.length ? (
              <div className="flex flex-wrap gap-2">
                {currentTagPreview.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[#5a3042]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#b98b9e]">No tags yet. Use commas to add your focus areas.</p>
            )}
          </div>
          {saveState.status === "error" ? (
            <p className="text-sm font-semibold text-[#c53048]">{saveState.message}</p>
          ) : null}
          <button
            type="submit"
            className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: "var(--color-plum)", boxShadow: "0 15px 30px rgba(90, 48, 66, 0.2)" }}
            disabled={saveState.status === "saving"}
          >
            {saveState.status === "saving" ? "Saving…" : "Update profile"}
          </button>
        </form>
        <div className="space-y-4">
          <div className="rounded-3xl border border-[var(--border-soft)] bg-white/85 p-5">
            <h3 className="text-lg font-semibold text-[#2e1f2c]">Linked companies</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {companyList.map((company) => (
                <span
                  key={company}
                  className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold text-[#5a3042]"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--border-soft)] bg-white/85 p-5">
            <h3 className="text-lg font-semibold text-[#2e1f2c]">Activity tags</h3>
            {currentTagPreview.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {currentTagPreview.map((tag) => (
                  <span
                    key={`${tag}-preview`}
                    className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[#5a3042]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#5c4451]">Add tags to surface your expertise in search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
