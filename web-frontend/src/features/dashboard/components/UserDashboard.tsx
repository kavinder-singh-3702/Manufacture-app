"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import { userService } from "@/src/services/user";
import { companyService } from "@/src/services/company";
import { ApiError } from "@/src/lib/api-error";
import type { Company } from "@/src/types/company";
import { motion } from "framer-motion";
import { AnimatedPage } from "@/src/components/ui/PageTransition";
import { useMotionSafe } from "@/src/components/ui/motion";
import { DashboardTopbar } from "./user-dashboard/DashboardTopbar";
import { SidebarWithLogout } from "./user-dashboard/Navigation";
import { MobileTabRail } from "./user-dashboard/MobileTabRail";
import { OverviewSection } from "./user-dashboard/OverviewSection";
import { ProfileSummaryCard } from "./user-dashboard/profile/ProfileSummaryCard";
import { ProfileQuickActionsCard } from "./user-dashboard/profile/ProfileQuickActionsCard";
import { ProfileAccountCard } from "./user-dashboard/profile/ProfileAccountCard";
import { ProfileProfessionalCard } from "./user-dashboard/profile/ProfileProfessionalCard";
import { ProfilePreferencesCard } from "./user-dashboard/profile/ProfilePreferencesCard";
import { ProfileEditorSheet, type ProfileEditorType } from "./user-dashboard/profile/ProfileEditorSheet";
import { ActivitySection } from "./user-dashboard/ActivitySection";
import { SettingsSection } from "./user-dashboard/SettingsSection";
import { DashboardContext, useDashboardContext } from "./user-dashboard/context";
import { CompanyCreateDrawer } from "@/src/features/company/components/CompanyCreateDrawer";
import { PhoneGate } from "@/src/features/auth/components/PhoneGate";
import { CartProvider } from "@/src/providers/CartProvider";
import {
  buildActivityTags,
  buildAddressPayload,
  createProfileFormState,
  normalizeProfileForm,
  ProfileFormState,
} from "./user-dashboard/helpers";
import { notificationService } from "@/src/services/notification";

export { useDashboardContext } from "./user-dashboard/context";

const GUEST_ALLOWED_PREFIXES = ["/dashboard/products"];

const isGuestAllowedPath = (path: string) =>
  GUEST_ALLOWED_PREFIXES.some((p) => path.startsWith(p));

const GuestTopbar = () => (
  <header
    className="flex h-14 flex-shrink-0 items-center justify-between px-5"
    style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
  >
    <Link href="/" className="flex items-center gap-2">
      <span className="text-lg font-black tracking-tight" style={{ color: "var(--primary)" }}>ARVANN</span>
    </Link>
    <div className="flex items-center gap-2">
      <Link
        href="/signin"
        className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
        style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--primary)" }}
      >
        Get started
      </Link>
    </div>
  </header>
);

export const DashboardFrame = ({ children }: { children: ReactNode }) => {
  const { user, initializing, refreshUser, switchCompany } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const motionSafe = useMotionSafe();
  // Verification lives on its own page now (see /dashboard/verification) —
  // this used to open a modal via a signal; navigating is the whole job now.
  const openVerificationModal = useCallback(() => router.push("/dashboard/verification"), [router]);
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
    if (!initializing && !user && !isGuestAllowedPath(pathname)) {
      router.replace("/signin");
    }
  }, [initializing, user, router, pathname]);

  useEffect(() => {
    if (user) {
      void reloadCompanies();
    }
  }, [user, reloadCompanies]);

  // Real unread count for the topbar bell badge — this used to be hardcoded to
  // 0 via countUnread([]). Refetched on navigation so mark-all-read on the
  // notifications page is reflected the moment the user leaves that page.
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    let active = true;
    notificationService
      .getUnreadCount()
      .then((count) => {
        if (active) setNotificationUnreadCount(count);
      })
      .catch(() => {
        // Non-fatal — the badge just won't update this navigation.
      });
    return () => {
      active = false;
    };
  }, [user, pathname]);

  if (initializing) {
    return (
      <div className="h-screen-safe flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--medium-gray)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  // Guest on a product browsing path — show lightweight layout, no auth required
  if (!user && isGuestAllowedPath(pathname)) {
    return (
      <CartProvider>
        <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
          <GuestTopbar />
          <motion.main
            className="flex-1 overflow-y-auto p-4 sm:p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.main>
        </div>
      </CartProvider>
    );
  }

  if (!user) {
    return (
      <div className="h-screen-safe flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--medium-gray)" }}>Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  // Hard phone gate — mirrors the app. Any authenticated non-guest user
  // without a phone is locked here until they enter one (email signup already
  // captures it; this catches social sign-in and legacy accounts).
  if (user.role !== "guest" && !user.phone) {
    return <PhoneGate />;
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

  return (
    <CartProvider>
    <DashboardContext.Provider
      value={{ user, refreshUser, openVerificationModal, companies, activeCompany, reloadCompanies }}
    >
      <div className="h-screen-safe flex overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
        {/* Sidebar — desktop only; MobileTabRail below replaces it on mobile */}
        <SidebarWithLogout
          activePath={pathname}
          onOpenCompanyCreate={() => setCompanyModalOpen(true)}
          onSwitchCompany={handleSwitchCompany}
          switchingCompanyId={switchingCompanyId}
        />

        {/* Main column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardTopbar
            notificationCount={notificationUnreadCount}
            onOpenNotifications={() => router.push("/dashboard/notifications")}
            onProfile={() => router.push("/dashboard/profile")}
          />
          <main className="dashboard-main flex-1 overflow-y-auto" style={{ backgroundColor: "var(--background)", overscrollBehavior: "contain" }}>
            {motionSafe ? (
              <AnimatedPage pageKey={pathname} variant="fade">
                {children}
              </AnimatedPage>
            ) : (
              children
            )}
          </main>
        </div>

        <MobileTabRail activePath={pathname} />
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

// Kept as a named wrapper (rather than inlining OverviewSection directly in
// app/dashboard/page.tsx) so the route file stays a plain metadata + render
// shell, matching every other dashboard route.
export const DashboardOverview = () => <OverviewSection />;

export const DashboardProfile = () => {
  const { user, refreshUser, activeCompany, reloadCompanies } = useDashboardContext();
  const [editForm, setEditForm] = useState<ProfileFormState>(() => createProfileFormState(user));
  const [companyDescription, setCompanyDescription] = useState(activeCompany?.description ?? "");
  const [activeEditor, setActiveEditor] = useState<ProfileEditorType>(null);
  const [saveState, setSaveState] = useState<{ status: "idle" | "saving" | "success" | "error"; message?: string }>({
    status: "idle",
  });

  useEffect(() => {
    setEditForm(createProfileFormState(user));
  }, [user]);

  useEffect(() => {
    setCompanyDescription(activeCompany?.description ?? "");
  }, [activeCompany]);

  const updateField = (key: keyof ProfileFormState, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveIdentity = async () => {
    const normalizedForm = normalizeProfileForm(editForm);
    if (!normalizedForm.displayName) {
      setSaveState({ status: "error", message: "Display name is required." });
      return;
    }
    try {
      setSaveState({ status: "saving" });
      await userService.updateCurrentUser({
        firstName: normalizedForm.firstName || undefined,
        lastName: normalizedForm.lastName || undefined,
        displayName: normalizedForm.displayName,
        address: buildAddressPayload(normalizedForm),
      });
      await refreshUser();
      setSaveState({ status: "success" });
      setActiveEditor(null);
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Unable to update profile.";
      setSaveState({ status: "error", message });
    }
  };

  const handleSaveProfessional = async () => {
    const normalizedForm = normalizeProfileForm(editForm);
    try {
      setSaveState({ status: "saving" });
      await userService.updateCurrentUser({
        bio: normalizedForm.bio || undefined,
        activityTags: buildActivityTags(normalizedForm.activityTags),
      });
      if (activeCompany) {
        await companyService.update(activeCompany.id, { description: companyDescription.trim() || undefined });
        await reloadCompanies();
      }
      await refreshUser();
      setSaveState({ status: "success" });
      setActiveEditor(null);
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
    <div className="mx-auto max-w-2xl space-y-4">
      <ProfileSummaryCard
        avatarValue={editForm.avatarUrl}
        onAvatarChange={(src) => updateField("avatarUrl", src)}
        onAvatarUpload={handleAvatarUpload}
      />
      <ProfileQuickActionsCard onEditIdentity={() => setActiveEditor("identity")} onEditProfessional={() => setActiveEditor("professional")} />
      <ProfileAccountCard onEdit={() => setActiveEditor("identity")} />
      <ProfileProfessionalCard onEdit={() => setActiveEditor("professional")} />
      <ProfilePreferencesCard />

      <ProfileEditorSheet
        editorType={activeEditor}
        onClose={() => setActiveEditor(null)}
        form={editForm}
        onFieldChange={updateField}
        companyDescription={companyDescription}
        onCompanyDescriptionChange={setCompanyDescription}
        hasActiveCompany={!!activeCompany}
        onSave={activeEditor === "identity" ? handleSaveIdentity : handleSaveProfessional}
        saving={saveState.status === "saving"}
        error={saveState.status === "error" ? saveState.message : undefined}
      />
    </div>
  );
};

export const DashboardActivity = () => <ActivitySection />;

export const DashboardSettings = () => <SettingsSection />;

