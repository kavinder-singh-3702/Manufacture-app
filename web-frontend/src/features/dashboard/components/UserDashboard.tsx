"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { userService } from "@/src/services/user";
import { companyService } from "@/src/services/company";
import { ApiError } from "@/src/lib/api-error";
import { BUSINESS_ACCOUNT_TYPES, BUSINESS_CATEGORIES } from "@/src/constants/business";
import type { Company } from "@/src/types/company";
import { DashboardTopbar } from "./user-dashboard/DashboardTopbar";
import { Sidebar } from "./user-dashboard/Navigation";
import { OverviewSection } from "./user-dashboard/OverviewSection";
import { ProfileSection, ProfileVerificationPrompt } from "./user-dashboard/ProfileSection";
import { ActivitySection } from "./user-dashboard/ActivitySection";
import { SettingsSection, defaultPreferences } from "./user-dashboard/SettingsSection";
import { CompanyVerificationSection } from "./user-dashboard/CompanyVerificationSection";
import { DashboardContext, useDashboardContext } from "./user-dashboard/context";
import {
  buildActivityTags,
  buildAddressPayload,
  buildSocialLinksPayload,
  createProfileFormState,
  normalizeProfileForm,
  resolveCompanyLabel,
  formatCategory,
  ProfileFormState,
  ProfileVerificationState,
} from "./user-dashboard/helpers";
import { ProfileInputField } from "./user-dashboard/shared";
import { countUnread, mockNotifications } from "./notifications/data";

export { useDashboardContext } from "./user-dashboard/context";

export const DashboardFrame = ({ children }: { children: ReactNode }) => {
  const { user, initializing, refreshUser, logout, switchCompany } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verificationModalSignal, setVerificationModalSignal] = useState(0);
  const openVerificationModal = useCallback(() => setVerificationModalSignal(Date.now()), []);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [switchingCompanyId, setSwitchingCompanyId] = useState<string | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);

  const reloadCompanies = useCallback(async () => {
    if (!user) return;
    try {
      const response = await companyService.list();
      setCompanies(response.companies);
      const activeId = user.activeCompany as string | undefined;
      const resolvedActive = response.companies.find((company) => company.id === activeId) ?? response.companies[0] ?? null;
      setActiveCompany(resolvedActive);
    } catch {
      setCompanies([]);
      setActiveCompany(null);
    }
  }, [user]);

  useEffect(() => {
    if (!initializing && !user) {
      router.replace("/signin");
    }
  }, [initializing, user, router]);

  useEffect(() => {
    if (user) {
      void reloadCompanies();
    }
  }, [user, reloadCompanies]);

  const notificationPreviewCount = useMemo(() => countUnread(mockNotifications), []);

  if (initializing || !user) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <p className="text-sm font-semibold text-[#5c4451]">
          {initializing ? "Loading your workspace…" : "Redirecting to sign in…"}
        </p>
      </div>
    );
  }

  return (
    <DashboardContext.Provider
      value={{ user, refreshUser, openVerificationModal, verificationModalSignal, companies, activeCompany, reloadCompanies }}
    >
      <div className="space-y-6">
        <DashboardTopbar
          user={user}
          activeCompany={activeCompany}
          companies={companies}
          switchingCompanyId={switchingCompanyId}
          onToggleSidebar={() => setSidebarOpen(true)}
          notificationCount={notificationPreviewCount}
          onOpenNotifications={() => router.push("/dashboard/notifications")}
          onProfile={() => router.push("/dashboard/profile")}
          onSettings={() => router.push("/dashboard/settings")}
          onLogout={async () => {
            await logout();
            router.push("/signin");
          }}
          onOpenCompanyCreate={() => setCompanyModalOpen(true)}
          onSwitchCompany={async (companyId) => {
            try {
              setSwitchingCompanyId(companyId);
              await switchCompany(companyId);
              await refreshUser();
              await reloadCompanies();
            } finally {
              setSwitchingCompanyId(null);
            }
          }}
        />
        <div className="flex flex-col gap-6 lg:flex-row">
          <Sidebar activePath={pathname} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-lg shadow-[#5a304218]">
            {children}
          </div>
        </div>
        <CreateCompanyModal
          open={companyModalOpen}
          onClose={() => setCompanyModalOpen(false)}
          onCreated={async () => {
            await refreshUser();
            await reloadCompanies();
            setCompanyModalOpen(false);
          }}
        />
      </div>
    </DashboardContext.Provider>
  );
};

export const DashboardOverview = () => {
  const { user, openVerificationModal, verificationModalSignal, activeCompany, companies } = useDashboardContext();
  const cards = useMemo(
    () => [
      {
        label: "Active company",
        value: activeCompany?.displayName ?? "Select a company",
        detail: `Type: ${activeCompany?.type ?? user.accountType ?? "normal"}`,
      },
      {
        label: "Linked companies",
        value: companies.length ? `${companies.length}` : "0",
        detail: "Switch between workspaces",
      },
      {
        label: "Compliance",
        value: activeCompany?.complianceStatus ?? "pending",
        detail: activeCompany ? "Verification state" : "Awaiting submission",
      },
    ],
    [activeCompany, companies, user.accountType]
  );

  const primaryCompanyName = activeCompany?.displayName ?? resolveCompanyLabel(user);
  const normalizedStatus = (activeCompany?.complianceStatus ?? user.status ?? "").toLowerCase();
  const isWorkspaceVerified = normalizedStatus === "verified" || normalizedStatus === "approved";

  return (
    <div className="space-y-6">
      <ProfileVerificationPrompt
        isVerified={isWorkspaceVerified}
        primaryCompany={primaryCompanyName}
        accountType={activeCompany?.type ?? user.accountType}
        onRequestVerification={openVerificationModal}
      />
      <OverviewSection cards={cards} />
      <CompanyVerificationSection hideInline openSignal={verificationModalSignal} onRequestVerification={openVerificationModal} />
    </div>
  );
};

export const DashboardProfile = () => {
  const { user, refreshUser, openVerificationModal, verificationModalSignal, activeCompany } = useDashboardContext();
  const [editForm, setEditForm] = useState<ProfileFormState>(() => createProfileFormState(user));
  const [saveState, setSaveState] = useState<{ status: "idle" | "saving" | "success" | "error"; message?: string }>({
    status: "idle",
  });
  const [activeCompanyName, setActiveCompanyName] = useState<string | undefined>(activeCompany?.displayName);
  const primaryCompanyName = activeCompany?.displayName ?? resolveCompanyLabel(user, activeCompanyName);
  const normalizedStatus = (activeCompany?.complianceStatus ?? user.status ?? "").toLowerCase();
  const isWorkspaceVerified = normalizedStatus === "verified" || normalizedStatus === "approved";
  const verificationVariant: ProfileVerificationState["variant"] =
    isWorkspaceVerified ? "verified" : normalizedStatus === "pending" ? "pending" : "warning";
  const verificationState: ProfileVerificationState = {
    label: isWorkspaceVerified ? "Verified badge active" : "Unverified workspace",
    variant: verificationVariant,
  };

  useEffect(() => {
    setActiveCompanyName(activeCompany?.displayName);
  }, [user.activeCompany, activeCompany]);

  useEffect(() => {
    setEditForm(createProfileFormState(user));
  }, [user]);

  const handleSaveProfile = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const normalizedForm = normalizeProfileForm(editForm);
    if (!normalizedForm.displayName) {
      setSaveState({ status: "error", message: "Display name is required." });
      return;
    }
    const addressPayload = buildAddressPayload(normalizedForm);
    const socialLinksPayload = buildSocialLinksPayload(normalizedForm);
    const tagsPayload = buildActivityTags(normalizedForm.activityTags);

    try {
      setSaveState({ status: "saving" });
      await userService.updateCurrentUser({
        firstName: normalizedForm.firstName || undefined,
        lastName: normalizedForm.lastName || undefined,
        displayName: normalizedForm.displayName,
        phone: normalizedForm.phone || undefined,
        bio: normalizedForm.bio || undefined,
        avatarUrl: normalizedForm.avatarUrl || undefined,
        address: addressPayload,
        socialLinks: socialLinksPayload,
        activityTags: tagsPayload,
      });
      await refreshUser();
      setSaveState({ status: "success" });
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Unable to update profile.";
      setSaveState({ status: "error", message });
    }
  };

  const handleAvatarUpload = async (file: File, base64: string) => {
    try {
      setSaveState({ status: "saving" });
      const content = base64.includes(",") ? base64.split(",")[1] ?? "" : base64;
      const response = await userService.uploadUserFile({
        fileName: file.name,
        mimeType: file.type || "image/png",
        content,
        purpose: "avatar",
      });
      const url = response.file?.url ?? editForm.avatarUrl ?? "";
      if (url) {
        setEditForm((prev) => ({ ...prev, avatarUrl: url }));
      }
      await refreshUser();
      setSaveState({ status: "success" });
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Unable to upload avatar.";
      setSaveState({ status: "error", message });
    }
  };

  return (
    <>
      <ProfileVerificationPrompt
        isVerified={isWorkspaceVerified}
        primaryCompany={primaryCompanyName}
        accountType={activeCompany?.type ?? user.accountType}
        onRequestVerification={openVerificationModal}
      />
      <ProfileSection
        user={user}
        editForm={editForm}
        onChange={setEditForm}
        onSubmit={handleSaveProfile}
        saveState={saveState}
        verificationState={verificationState}
        onUpload={handleAvatarUpload}
      />
      <CompanyVerificationSection
        hideInline
        onCompanyNameResolved={setActiveCompanyName}
        openSignal={verificationModalSignal}
        onRequestVerification={openVerificationModal}
      />
    </>
  );
};

export const DashboardActivity = () => <ActivitySection />;

export const DashboardSettings = () => {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const togglePreference = (key: keyof typeof defaultPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  return <SettingsSection preferences={preferences} onToggle={togglePreference} />;
};

const CreateCompanyModal = ({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    type: user?.accountType ?? "normal",
    categories: [] as string[],
    logoUrl: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    city: "",
    country: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        displayName: "",
        type: user?.accountType ?? "normal",
        categories: [],
        logoUrl: "",
        contactEmail: "",
        contactPhone: "",
        website: "",
        city: "",
        country: "",
        description: "",
      });
      setError(null);
      setLogoError(null);
      setLogoUploading(false);
    }
  }, [open, user?.accountType]);

  const handleLogoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setLogoError("Unable to read file.");
        return;
      }
      const content = result.includes(",") ? result.split(",")[1] ?? "" : result;
      try {
        setLogoUploading(true);
        const response = await userService.uploadUserFile({
          fileName: file.name,
          mimeType: file.type || "image/png",
          content,
          purpose: "company-logo",
        });
        const url = response.file?.url;
        if (url) {
          setForm((prev) => ({ ...prev, logoUrl: url }));
          setLogoError(null);
        }
      } catch (err) {
        const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to upload logo.";
        setLogoError(message);
      } finally {
        setLogoUploading(false);
      }
    };
    reader.onerror = () => setLogoError("Unable to read file.");
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  const toggleCategory = (category: string) => {
    setForm((prev) => {
      const exists = prev.categories.includes(category);
      return { ...prev, categories: exists ? prev.categories.filter((item) => item !== category) : [...prev.categories, category] };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.displayName.trim();
    if (!name) {
      setError("Enter a company display name.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await companyService.create({
        displayName: name,
        type: form.type,
        categories: form.categories,
        logoUrl: form.logoUrl?.trim() || undefined,
        description: form.description.trim() || undefined,
        contact: {
          email: form.contactEmail.trim() || undefined,
          phone: form.contactPhone.trim() || undefined,
          website: form.website.trim() || undefined,
        },
        headquarters: {
          city: form.city.trim() || undefined,
          country: form.country.trim() || undefined,
        },
      });
      await onCreated();
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to create company.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur">
      <div
        className="w-full max-w-lg rounded-3xl border border-[var(--border-soft)] bg-white p-6 shadow-2xl shadow-[#5a304233]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
              New company
            </p>
            <h3 className="text-xl font-semibold text-[#2e1f2c]">Create a workspace</h3>
            <p className="text-sm text-[#5c4451]">Add another company under your login to switch seamlessly.</p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-2xl border border-[var(--border-soft)] text-[#5c4451]"
            aria-label="Close create company"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="mt-3 rounded-2xl border border-[#ff9aa2] bg-[#ffeef1] px-4 py-3 text-sm font-semibold text-[#b23a48]">
            {error}
          </div>
        ) : null}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <ProfileInputField
            label="Display name"
            value={form.displayName}
            onChange={(value) => setForm((prev) => ({ ...prev, displayName: value }))}
            placeholder="Acme Textiles"
          />
          <ProfileInputField
            label="Description"
            value={form.description}
            onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
            placeholder="What does this company do?"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-[#2e1f2c]">
              Type
              <select
                className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-white px-3 py-2 text-sm text-[#2e1f2c] focus:outline-none"
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                {BUSINESS_ACCOUNT_TYPES.map((type) => (
                  <option value={type} key={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#2e1f2c]">Logo</p>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-white text-sm font-semibold text-[var(--color-plum)]">
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoUrl} alt="Logo preview" className="h-full w-full object-cover" />
                  ) : (
                    (form.displayName || "Co").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 text-sm text-[#5c4451]">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 font-semibold text-[var(--color-plum)] shadow-sm hover:border-[var(--color-plum)]">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        handleLogoUpload(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                    {logoUploading ? "Uploading…" : "Upload logo"}
                  </label>
                  <p className="text-xs text-[#b98b9e]">
                    Upload a JPG/PNG. A preview appears instantly.
                  </p>
                  {logoError ? <p className="text-xs font-semibold text-[#c53048]">{logoError}</p> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <ProfileInputField
              label="Contact email"
              value={form.contactEmail}
              onChange={(value) => setForm((prev) => ({ ...prev, contactEmail: value }))}
              placeholder="ops@company.com"
            />
            <ProfileInputField
              label="Contact phone"
              value={form.contactPhone}
              onChange={(value) => setForm((prev) => ({ ...prev, contactPhone: value }))}
              placeholder="+91 99889 11111"
            />
          </div>
          <ProfileInputField
            label="Website"
            value={form.website}
            onChange={(value) => setForm((prev) => ({ ...prev, website: value }))}
            placeholder="https://example.com"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <ProfileInputField
              label="City"
              value={form.city}
              onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
              placeholder="Mumbai"
            />
            <ProfileInputField
              label="Country"
              value={form.country}
              onChange={(value) => setForm((prev) => ({ ...prev, country: value }))}
              placeholder="India"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-plum)" }}>
              Categories
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BUSINESS_CATEGORIES.map((category) => {
                const active = form.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="rounded-full border px-3 py-1 text-xs font-semibold transition"
                    style={{
                      borderColor: active ? "rgba(246, 184, 168, 0.9)" : "var(--border-soft)",
                      backgroundColor: active ? "var(--color-peach)" : "transparent",
                      color: active ? "var(--color-plum)" : "#5c4451",
                    }}
                  >
                    {formatCategory(category)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[#5c4451]"
              disabled={loading || logoUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || logoUploading}
              className="rounded-full bg-[var(--color-plum)] px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#5a304225] disabled:opacity-60"
            >
              {logoUploading ? "Uploading logo…" : loading ? "Creating…" : "Create company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
