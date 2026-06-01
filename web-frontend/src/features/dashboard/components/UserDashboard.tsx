"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { userService } from "@/src/services/user";
import { companyService } from "@/src/services/company";
import { ApiError } from "@/src/lib/api-error";
import type { Company } from "@/src/types/company";
import { motion } from "framer-motion";
import { DashboardTopbar } from "./user-dashboard/DashboardTopbar";
import { Sidebar } from "./user-dashboard/Navigation";
import { OverviewSection } from "./user-dashboard/OverviewSection";
import { ProfileSection, ProfileVerificationPrompt } from "./user-dashboard/ProfileSection";
import { ActivitySection } from "./user-dashboard/ActivitySection";
import { SettingsSection, defaultPreferences } from "./user-dashboard/SettingsSection";
import { CompanyVerificationSection } from "./user-dashboard/CompanyVerificationSection";
import { DashboardContext, useDashboardContext } from "./user-dashboard/context";
import { CompanyCreateDrawer } from "@/src/features/company/components/CompanyCreateDrawer";
import { CartProvider } from "@/src/providers/CartProvider";
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
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
          />
          <p className="text-sm font-semibold" style={{ color: "var(--medium-gray)" }}>
            {initializing ? "Loading your workspace…" : "Redirecting to sign in…"}
          </p>
        </div>
      </div>
    );
  }

  const handleSwitchCompany = async (companyId: string) => {
    try {
      setSwitchingCompanyId(companyId);
      await switchCompany(companyId);
      await refreshUser();
      await reloadCompanies();
    } finally {
      setSwitchingCompanyId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/signin");
  };

  return (
    <CartProvider>
    <DashboardContext.Provider
      value={{ user, refreshUser, openVerificationModal, verificationModalSignal, companies, activeCompany, reloadCompanies }}
    >
      <div className="flex overflow-hidden" style={{ height: "100vh", backgroundColor: "var(--background)" }}>
        {/* Sidebar */}
        <Sidebar
          activePath={pathname}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenCompanyCreate={() => setCompanyModalOpen(true)}
          onSwitchCompany={handleSwitchCompany}
          switchingCompanyId={switchingCompanyId}
          onLogout={handleLogout}
        />

        {/* Main column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardTopbar
            onToggleSidebar={() => setSidebarOpen(true)}
            notificationCount={notificationPreviewCount}
            onOpenNotifications={() => router.push("/dashboard/notifications")}
            onProfile={() => router.push("/dashboard/profile")}
          />
          <motion.main
            className="flex-1 overflow-y-auto p-6"
            style={{ backgroundColor: "var(--background)", overscrollBehavior: "none" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.main>
        </div>
      </div>

      <CompanyCreateDrawer
        open={companyModalOpen}
        defaultType={user.accountType}
        onClose={() => setCompanyModalOpen(false)}
        onCreated={async () => {
          await refreshUser();
          await reloadCompanies();
          setCompanyModalOpen(false);
        }}
      />
    </DashboardContext.Provider>
    </CartProvider>
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

