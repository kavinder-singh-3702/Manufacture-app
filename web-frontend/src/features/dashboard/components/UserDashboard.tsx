"use client";
import {
  FormEvent,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { userService } from "@/src/services/user";
import { companyVerificationService } from "@/src/services/companyVerification";
import { companyService } from "@/src/services/company";
import { activityService } from "@/src/services/activity";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";
import { COMPANY_VERIFICATION_ACCOUNT_TYPES, CompanyVerificationAccountType } from "@/src/constants/business";
import { ApiError } from "@/src/lib/api-error";
import type {
  CompanyVerificationDocumentUpload,
  CompanyVerificationLatestResponse,
  CompanyVerificationRequest,
  CompanyVerificationStatus,
} from "@/src/types/company";
import type { AuthUser } from "@/src/types/auth";
import type { Company } from "@/src/types/company";
import type { ActivityEvent } from "@/src/types/activity";

const navItems = [
  { id: "overview", label: "Overview", description: "Workspace snapshot", href: "/dashboard" },
  { id: "company", label: "Company", description: "Profile & details", href: "/dashboard/company" },
  { id: "activity", label: "Activity", description: "Recent timeline", href: "/dashboard/activity" },
  { id: "settings", label: "Preferences", description: "Notifications & sharing", href: "/dashboard/settings" },
] as const;

const upcomingSchedules = [
  { title: "Weekly ops standup", time: "Today · 15:30 IST", location: "Circuit HQ" },
  { title: "Customs documentation review", time: "Tomorrow · 11:00 IST", location: "Secure video room" },
  { title: "Supplier credit check", time: "Fri · 14:00 IST", location: "Shared notebook" },
];

const workspaceShortcuts = [
  { title: "RFQ tracker", hint: "6 open threads" },
  { title: "Compliance vault", hint: "Updated 3 hrs ago" },
  { title: "Team roster", hint: "12 members" },
  { title: "Document signatures", hint: "2 pending" },
];

const verificationSpotlightBenefits = [
  "Unlock priority placement across buyer searches",
  "Signal compliance and unlock private RFQs",
  "Share a trust badge on proposals & chat",
] as const;

const initialPreferences = {
  alerts: true,
  weeklyDigest: false,
  autoReports: true,
};

const isLikelyObjectId = (value?: string | null) => !!value && /^[a-f0-9]{24}$/i.test(value);
const resolveCompanyLabel = (user: AuthUser, resolvedActiveName?: string) => {
  if (resolvedActiveName) return resolvedActiveName;
  if (user.activeCompany && !isLikelyObjectId(user.activeCompany)) return user.activeCompany;
  const namedCompany = user.companies?.find((company) => company && !isLikelyObjectId(company));
  return namedCompany ?? user.displayName ?? user.email ?? "Your workspace";
};

const buildInitials = (value?: string) => {
  if (!value) return "MC";
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "MC";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

const formatCategory = (category: string) => category.charAt(0).toUpperCase() + category.slice(1);

const activityBadgeStyles: Record<string, string> = {
  auth: "bg-[var(--color-peach)] text-[var(--color-plum)]",
  user: "bg-[#eef2ff] text-[#4338ca]",
  company: "bg-[#ecfdf3] text-[#166534]",
  verification: "bg-[#fff4e5] text-[#b45309]",
};

const formatRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";
  const deltaMs = Date.now() - timestamp;
  const seconds = Math.round(deltaMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const buildActivityMetaLine = (activity: ActivityEvent) => {
  const parts: string[] = [];
  const relative = formatRelativeTime(activity.createdAt);
  if (relative) parts.push(relative);
  if (activity.companyName) parts.push(activity.companyName);
  const method = typeof activity.meta?.method === "string" ? (activity.meta.method as string) : undefined;
  if (method) parts.push(method);
  return parts.join(" • ");
};

type ProfileFormState = ReturnType<typeof createProfileFormState>;
type VerificationPillVariant = "verified" | "pending" | "warning";
type ProfileVerificationState = { label: string; variant: VerificationPillVariant };

type DashboardContextValue = {
  user: AuthUser;
  refreshUser: () => Promise<void>;
  openVerificationModal: () => void;
  verificationModalSignal: number;
  companies: Company[];
  activeCompany: Company | null;
  reloadCompanies: () => Promise<void>;
};

const iconStroke = (active: boolean) => (active ? "var(--color-plum)" : "rgba(67,52,61,0.6)");

const NavIcon = ({ id, active }: { id: (typeof navItems)[number]["id"]; active: boolean }) => {
  const stroke = iconStroke(active);
  switch (id) {
    case "overview":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 13h4v7H4zM10 4h4v16h-4zM16 9h4v11h-4z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "activity":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 12h3l2-6 4 12 2-6h5"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "company":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4M7 17h1M16 17h1"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6h12v12H6zM10 6V4M14 6V4M10 20v-2M14 20v-2M20 10h2M20 14h-2M4 10H2M4 14h2"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
        {subtitle ?? "Workspace"}
      </p>
      <h2 className="text-2xl font-semibold text-[#2e1f2c]">{title}</h2>
    </div>
    {action}
  </div>
);

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within DashboardFrame");
  }
  return context;
};

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
          onProfile={() => router.push("/dashboard/profile")}
          onSettings={() => router.push("/dashboard/settings")}
          onLogout={async () => {
            await logout();
            router.push("/signin");
          }}
          onOpenCompanyCreate={() => {
            setCompanyModalOpen(true);
          }}
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
      <CompanyVerificationSection
        hideInline
        openSignal={verificationModalSignal}
        onRequestVerification={openVerificationModal}
      />
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
  const verificationVariant: VerificationPillVariant = isWorkspaceVerified
    ? "verified"
    : normalizedStatus === "pending"
    ? "pending"
    : "warning";
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
        onUploadComplete={refreshUser}
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
  const [preferences, setPreferences] = useState(initialPreferences);
  const togglePreference = (key: keyof typeof initialPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  return <SettingsSection preferences={preferences} onToggle={togglePreference} />;
};

const DashboardTopbar = ({
  user,
  activeCompany,
  companies,
  switchingCompanyId,
  onToggleSidebar,
  onProfile,
  onSettings,
  onLogout,
  onOpenCompanyCreate,
  onSwitchCompany,
}: {
  user: AuthUser;
  activeCompany: Company | null;
  companies: Company[];
  switchingCompanyId: string | null;
  onToggleSidebar: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onOpenCompanyCreate: () => void;
  onSwitchCompany: (companyId: string) => Promise<void>;
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const companyLabel = activeCompany?.displayName ?? resolveCompanyLabel(user);
  const companyMeta = activeCompany?.type ?? "normal";
  const complianceLabel = activeCompany?.complianceStatus ?? user.status ?? "pending";
  const companyLogo = activeCompany?.logoUrl;
  const companyInitials = buildInitials(companyLabel);
  const userAvatar = typeof user.avatarUrl === "string" ? user.avatarUrl : undefined;
  const userInitials = buildInitials(user.displayName ?? user.email);

  const handleUserMenuSelect = async (action: () => void | Promise<void>) => {
    await action();
    setUserMenuOpen(false);
  };

  return (
    <motion.header
      className="relative flex flex-col gap-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-lg shadow-[#5a304212] lg:flex-row lg:items-center lg:justify-between"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] text-[#5a3042] lg:hidden"
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Dashboard
          </p>
          <p className="text-lg font-semibold text-[#2e1f2c]">{companyLabel}</p>
          <p className="text-xs text-[#7a5d6b]">Type: {companyMeta} • Compliance: {complianceLabel}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 7.5-7.5 7.5 7.5 0 0 1-7.5 7.5z"
              stroke="#b98b9e"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            placeholder="Search companies and workspace"
            className="w-full bg-transparent text-sm text-[#2e1f2c] placeholder:text-[#b98b9e] focus:outline-none"
          />
        </div>
        <motion.div
          className="relative flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompanyMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-2 text-sm font-semibold text-[#2e1f2c] shadow-sm hover:shadow-md"
            >
              {companyLogo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={companyLogo}
                    alt={companyLabel}
                    className="h-8 w-8 rounded-full border border-[var(--border-soft)] object-cover"
                  />
                </>
              ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-peach)] text-xs font-semibold text-[var(--color-plum)]">
                  {companyInitials}
                </span>
              )}
              <span className="text-left leading-tight">
                <span className="block text-[13px]">{companyLabel}</span>
                <span className="block text-[11px] text-[#7a5d6b] capitalize">
                  {companyMeta} • {complianceLabel}
                </span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#7a5d6b]">
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-peach)] text-sm font-semibold text-[var(--color-plum)]"
              aria-label="Open profile menu"
            >
              {userAvatar ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={userAvatar} alt={user.displayName ?? user.email ?? "User"} className="h-11 w-11 rounded-2xl object-cover" />
                </>
              ) : (
                userInitials
              )}
            </button>
          </div>
          {userMenuOpen ? (
            <div className="absolute right-0 top-14 z-10 w-48 rounded-2xl border border-[var(--border-soft)] bg-white p-2 shadow-lg shadow-[#5a304222]">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-plum)" }}>
                Workspace
              </p>
              <button
                onClick={() => handleUserMenuSelect(onProfile)}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#2e1f2c] hover:bg-[var(--color-peach)]/60"
              >
                Profile
              </button>
              <button
                onClick={() => handleUserMenuSelect(onSettings)}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#2e1f2c] hover:bg-[var(--color-peach)]/60"
              >
                Settings
              </button>
              <button
                onClick={() => handleUserMenuSelect(onLogout)}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#b23a48] hover:bg-[#ffeef1]"
              >
                Logout
              </button>
            </div>
          ) : null}
        </motion.div>
      </div>
      {companyMenuOpen ? (
        <div className="absolute right-24 top-24 z-20 w-full max-w-md rounded-3xl border border-[var(--border-soft)] bg-white p-3 shadow-2xl shadow-[#5a304228]">
          <div className="flex items-center justify-between px-2 pb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                Switch company
              </p>
              <p className="text-[12px] text-[#7a5d6b]">Select or create a workspace linked to your login.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCompanyMenuOpen(false);
                  onOpenCompanyCreate();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-2xl border border-[var(--border-soft)] text-[#5c4451] hover:border-[var(--color-plum)]"
                aria-label="Create company"
              >
                +
              </button>
              <button
                onClick={() => setCompanyMenuOpen(false)}
                className="h-8 w-8 rounded-2xl border border-[var(--border-soft)] text-[#5c4451]"
                aria-label="Close company switcher"
              >
                ×
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {companies.map((company) => {
              const isActive = company.id === activeCompany?.id;
              return (
                <button
                  key={company.id}
                  onClick={async () => {
                    setCompanyMenuOpen(false);
                    await onSwitchCompany(company.id);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-soft)] px-3 py-2 text-left transition hover:border-[var(--color-plum)] hover:shadow-lg"
                  style={{
                    background: isActive ? "linear-gradient(135deg, #fff6ef, #ffe9f2)" : "white",
                  }}
                  disabled={switchingCompanyId === company.id}
                >
                  <div className="flex items-center gap-3">
                    {company.logoUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={company.logoUrl}
                          alt={company.displayName}
                          className="h-9 w-9 rounded-full border border-[var(--border-soft)] object-cover"
                        />
                      </>
                    ) : (
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-peach)] text-xs font-semibold text-[var(--color-plum)]">
                        {buildInitials(company.displayName)}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[#2e1f2c]">{company.displayName}</p>
                      <p className="text-[11px] text-[#7a5d6b] capitalize">
                        {company.type ?? "normal"} • {company.complianceStatus ?? "pending"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      isActive ? "bg-[var(--color-peach)] text-[var(--color-plum)]" : "bg-[var(--surface-muted)] text-[#5c4451]"
                    }`}
                  >
                    {switchingCompanyId === company.id ? "Switching…" : isActive ? "Active" : "Switch"}
                  </span>
                </button>
              );
            })}
            {!companies.length ? (
              <p className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[#5c4451]">
                No companies linked yet. Create one in the workspace section below.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.header>
  );
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
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        displayName: "",
        type: user?.accountType ?? "normal",
        categories: [],
        logoUrl: "",
      });
      setError(null);
    }
  }, [open, user?.accountType]);

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
            <ProfileInputField
              label="Logo URL"
              value={form.logoUrl}
              onChange={(value) => setForm((prev) => ({ ...prev, logoUrl: value }))}
              placeholder="https://"
              helperText="Optional"
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
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[var(--color-plum)] px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#5a304225] disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Sidebar = ({
  activePath,
  isOpen,
  onClose,
}: {
  activePath: string;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <>
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-black/35 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-6 left-4 z-40 w-72 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-2xl lg:hidden"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
          >
            <SidebarContent activePath={activePath} onNavigate={onClose} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
    <div className="hidden w-full max-w-xs flex-shrink-0 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-lg shadow-[#5a304218] lg:block">
      <SidebarContent activePath={activePath} onNavigate={onClose} />
    </div>
  </>
);

const SidebarContent = ({ activePath, onNavigate }: { activePath: string; onNavigate: () => void }) => (
  <div className="space-y-4">
    <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
        Navigate
      </p>
      <p className="mt-1 text-sm text-[#5c4451]">Switch between your workspace tools</p>
    </div>
    <div className="space-y-2">
      {navItems.map((item) => {
        const isActive = activePath === item.href || (item.href === "/dashboard" && activePath === "/dashboard");
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left"
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-highlight"
                className="absolute inset-0 rounded-2xl border border-[var(--color-plum)] bg-white shadow-xl shadow-[#5a304233]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border ${
                isActive
                  ? "border-[var(--color-plum)] bg-[var(--color-peach)] text-[var(--color-plum)]"
                  : "border-[var(--border-soft)] bg-white/70"
              }`}
            >
              <NavIcon id={item.id} active={isActive} />
            </span>
            <span className="relative z-10">
              <p className={`text-sm font-semibold ${isActive ? "text-[var(--color-plum)]" : "text-[#5c4451]"}`}>
                {item.label}
              </p>
              <p className={`text-xs ${isActive ? "text-[var(--color-plum)]/70" : "text-[#b98b9e]"}`}>{item.description}</p>
            </span>
          </Link>
        );
      })}
    </div>
  </div>
);

const OverviewSection = ({ cards }: { cards: { label: string; value: string; detail: string }[] }) => (
  <div className="space-y-6">
    <SectionHeader title="Today&apos;s overview" subtitle="Snapshot" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <motion.div
          key={card.label}
          className="rounded-3xl border border-[var(--border-soft)] bg-white/85 p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
            {card.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-[#2e1f2c]">{card.value}</p>
          <p className="text-sm text-[#7a5d6b]">{card.detail}</p>
        </motion.div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <motion.div
        className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SectionHeader title="Workspace shortcuts" subtitle="Navigate" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {workspaceShortcuts.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-[#2e1f2c]">{item.title}</p>
              <p className="text-xs text-[#7a5d6b]">{item.hint}</p>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <SectionHeader title="Upcoming" subtitle="Schedule" />
        <div className="mt-4 space-y-3">
          {upcomingSchedules.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--border-soft)] p-3">
              <p className="text-sm font-semibold text-[#2e1f2c]">{item.title}</p>
              <p className="text-xs text-[#7a5d6b]">{item.time}</p>
              <p className="text-xs text-[#b98b9e]">{item.location}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
);

const ProfileVerificationPrompt = ({
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

const ProfileSection = ({
  user,
  editForm,
  onChange,
  onSubmit,
  saveState,
  verificationState,
}: {
  user: AuthUser;
  editForm: ProfileFormState;
  onChange: (value: ProfileFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saveState: { status: "idle" | "saving" | "success" | "error"; message?: string };
  verificationState?: ProfileVerificationState;
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
              onUpload={handleAvatarUpload}
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

const ActivitySection = () => {
  const { user } = useDashboardContext();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const response = await activityService.list({ limit: 30 });
        setActivities(response.activities);
        setError(null);
      } catch (err) {
        const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to load activity.";
        setError(message);
        setActivities([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const isEmpty = !loading && !activities.length && !error;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Recent activity"
        subtitle="Timeline"
        action={
          <button
            type="button"
            onClick={() => fetchActivities(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-2 text-xs font-semibold text-[#5a3042] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">↻</span>
            {refreshing || loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />
      {error ? (
        <div className="rounded-3xl border border-[#f5d0dc] bg-[#fff1f4] px-4 py-3 text-sm text-[#7a3a4a]">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => fetchActivities(true)}
              className="text-xs font-semibold underline decoration-[var(--color-plum)]"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`activity-skeleton-${index}`}
                className="animate-pulse rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4"
              >
                <div className="mb-2 h-4 w-20 rounded-full bg-[var(--surface-muted)]" />
                <div className="mb-1 h-4 w-56 rounded-full bg-[var(--surface-muted)]" />
                <div className="h-3 w-40 rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="rounded-3xl border border-dashed border-[var(--border-soft)] bg-white/70 px-5 py-6">
            <p className="text-base font-semibold text-[#2e1f2c]">No activity yet</p>
            <p className="mt-1 text-sm text-[#5c4451]">
              We will track logins, profile updates, company edits, and verification steps here as you work.
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const categoryKey = (activity.category || activity.action.split(".")[0] || "activity").toLowerCase();
            const badgeClass = activityBadgeStyles[categoryKey] ?? "bg-[var(--surface-muted)] text-[#4b3040]";
            const metaLine = buildActivityMetaLine(activity);
            return (
              <motion.div
                key={activity.id}
                className="flex items-start gap-4 rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span
                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                >
                  {formatCategory(categoryKey)}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2e1f2c]">{activity.label}</p>
                  {activity.description ? (
                    <p className="text-xs text-[#5c4451]">{activity.description}</p>
                  ) : null}
                  <p className="text-xs text-[#7a5d6b]">{metaLine}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

const SettingsSection = ({
  preferences,
  onToggle,
}: {
  preferences: typeof initialPreferences;
  onToggle: (key: keyof typeof initialPreferences) => void;
}) => (
  <div className="space-y-6">
    <SectionHeader title="Workspace preferences" subtitle="Settings" />
    <div className="space-y-3">
      {Object.entries(preferences).map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-3xl border border-[var(--border-soft)] bg-white/90 px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-[#2e1f2c]">
              {key === "alerts" ? "Critical alerts" : key === "weeklyDigest" ? "Weekly digest" : "Auto reports"}
            </p>
            <p className="text-xs text-[#7a5d6b]">
              {key === "alerts"
                ? "Get notified when compliance states change."
                : key === "weeklyDigest"
                  ? "Snapshot sent every Monday."
                  : "Share weekly metrics with partners."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggle(key as keyof typeof preferences)}
            className={`relative h-6 w-12 rounded-full transition ${
              value ? "bg-[var(--color-plum)]" : "bg-[#d9c5cd]"
            }`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? "left-6" : "left-0.5"}`} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const createProfileFormState = (user: AuthUser): ProfileFormState => ({
  firstName: (user.firstName as string | undefined) ?? "",
  lastName: (user.lastName as string | undefined) ?? "",
  displayName: (user.displayName as string | undefined) ?? "",
  phone: (user.phone as string | undefined) ?? "",
  bio: (user.bio as string | undefined) ?? "",
  avatarUrl: (user.avatarUrl as string | undefined) ?? "",
  line1: (user.address?.line1 as string | undefined) ?? "",
  line2: (user.address?.line2 as string | undefined) ?? "",
  city: (user.address?.city as string | undefined) ?? "",
  state: (user.address?.state as string | undefined) ?? "",
  postalCode: (user.address?.postalCode as string | undefined) ?? "",
  country: (user.address?.country as string | undefined) ?? "",
  website: (user.socialLinks?.website as string | undefined) ?? "",
  linkedin: (user.socialLinks?.linkedin as string | undefined) ?? "",
  twitter: (user.socialLinks?.twitter as string | undefined) ?? "",
  github: (user.socialLinks?.github as string | undefined) ?? "",
  activityTags: Array.isArray(user.activityTags) ? user.activityTags.join(", ") : "",
});

const normalizeProfileForm = (form: ProfileFormState): ProfileFormState => {
  const trim = (value: string) => value.trim();
  const normalizedTags = form.activityTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ");

  return {
    firstName: trim(form.firstName),
    lastName: trim(form.lastName),
    displayName: trim(form.displayName),
    phone: trim(form.phone),
    bio: trim(form.bio),
    avatarUrl: trim(form.avatarUrl),
    line1: trim(form.line1),
    line2: trim(form.line2),
    city: trim(form.city),
    state: trim(form.state),
    postalCode: trim(form.postalCode),
    country: trim(form.country),
    website: trim(form.website),
    linkedin: trim(form.linkedin),
    twitter: trim(form.twitter),
    github: trim(form.github),
    activityTags: normalizedTags,
  };
};

const buildAddressPayload = (form: ProfileFormState) => {
  const payload = cleanObject({
    line1: form.line1 || undefined,
    line2: form.line2 || undefined,
    city: form.city || undefined,
    state: form.state || undefined,
    postalCode: form.postalCode || undefined,
    country: form.country || undefined,
  });
  return Object.keys(payload).length ? payload : undefined;
};

const buildSocialLinksPayload = (form: ProfileFormState) => {
  const payload = cleanObject({
    website: form.website || undefined,
    linkedin: form.linkedin || undefined,
    twitter: form.twitter || undefined,
    github: form.github || undefined,
  });
  return Object.keys(payload).length ? payload : undefined;
};

const buildActivityTags = (value: string) => {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
};

const cleanObject = <T extends Record<string, unknown>>(obj: T) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as Partial<T>);
};

type ProfileInputFieldProps = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
};

const ProfileInputField = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  disabled = false,
  multiline = false,
  rows = 1,
}: ProfileInputFieldProps) => {
  const baseClasses = "mt-2 w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none";
  const enabledClasses = "border-[var(--border-soft)] bg-white text-[#2e1f2c]";
  const disabledClasses = "border-dashed border-[var(--border-soft)] bg-white/70 text-[#7a5d6b]";
  const className = `${baseClasses} ${disabled ? disabledClasses : enabledClasses}`;

  return (
    <label className="text-sm font-semibold text-[#2e1f2c]">
      {label}
      {multiline ? (
        <textarea
          className={className}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
        />
      ) : (
        <input
          className={className}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
      {helperText ? <span className="mt-1 block text-xs text-[#b98b9e]">{helperText}</span> : null}
    </label>
  );
};

type UploadEntry = {
  payload: CompanyVerificationDocumentUpload;
  fileName: string;
  sizeLabel: string;
};

type CompanyVerificationSectionProps = {
  onCompanyNameResolved?: (name?: string) => void;
  onRequestVerification?: () => void;
  openSignal?: number;
  hideInline?: boolean;
};

const CompanyVerificationSection = ({
  onCompanyNameResolved,
  onRequestVerification,
  openSignal,
  hideInline = false,
}: CompanyVerificationSectionProps) => {
  const { user, activeCompany } = useDashboardContext();
  const activeCompanyId = (activeCompany?.id ?? (user.activeCompany as string | undefined)) as string | undefined;
  const [latest, setLatest] = useState<CompanyVerificationLatestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gstDocument, setGstDocument] = useState<UploadEntry | null>(null);
  const [aadhaarDocument, setAadhaarDocument] = useState<UploadEntry | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const lastOpenSignal = useRef<number | undefined>(undefined);
  const companyType = latest?.company?.type as CompanyVerificationAccountType | string | undefined;
  const isCompanyTypeEligible =
    !companyType || COMPANY_VERIFICATION_ACCOUNT_TYPES.includes(companyType as CompanyVerificationAccountType);

  const loadLatest = useCallback(async () => {
    if (!activeCompanyId) return;
    try {
      setLoading(true);
      setFetchError(null);
      const response = await companyVerificationService.getLatest(activeCompanyId);
      setLatest(response);
      onCompanyNameResolved?.(response.company?.displayName);
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : "Unable to load verification status";
      setFetchError(message);
      onCompanyNameResolved?.(undefined);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, onCompanyNameResolved]);

  useEffect(() => {
    if (activeCompanyId) {
      loadLatest();
    } else {
      setLatest(null);
      onCompanyNameResolved?.(undefined);
    }
  }, [activeCompanyId, loadLatest, onCompanyNameResolved]);

  const request = latest?.request ?? null;
  const complianceStatus = latest?.company?.complianceStatus ?? "pending";
  const statusMeta = getVerificationStatusMeta(request?.status ?? complianceStatus);
  const hasPendingRequest = request?.status === "pending";

  useEffect(() => {
    if (!request) {
      setHistoryOpen(false);
    }
  }, [request]);

  useEffect(() => {
    if (!openSignal || openSignal === lastOpenSignal.current) return;
    lastOpenSignal.current = openSignal;
    setFormError(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  }, [openSignal]);

  const handleDocumentSelect = async (files: FileList | null, setter: (entry: UploadEntry | null) => void) => {
    if (!files || !files.length) return;
    const file = files[0];
    try {
      const payload = await fileToDocumentPayload(file);
      setter({
        payload,
        fileName: file.name,
        sizeLabel: formatFileSize(file.size),
      });
      setFormError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to read selected file.";
      setter(null);
      setFormError(message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeCompanyId) {
      setFormError("Select an active company before submitting for verification.");
      return;
    }
    if (!gstDocument?.payload || !aadhaarDocument?.payload) {
      setFormError("Upload both GST certificate and Aadhaar card scans before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      setSuccessMessage(null);
      await companyVerificationService.submit(activeCompanyId, {
        gstCertificate: gstDocument.payload,
        aadhaarCard: aadhaarDocument.payload,
        notes: notes.trim() || undefined,
      });
      setSuccessMessage("Verification request submitted. Compliance team will review it shortly.");
      setNotes("");
      setGstDocument(null);
      setAadhaarDocument(null);
      loadLatest();
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : "Unable to submit verification request.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const ctaDisabled = !activeCompanyId || loading || !isCompanyTypeEligible || hasPendingRequest;

  const handleOpenModal = () => {
    if (ctaDisabled) return;
    setFormError(null);
    setSuccessMessage(null);
    if (onRequestVerification) {
      onRequestVerification();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  return (
    <>
      {!hideInline ? (
        <section id="company-verification" className="rounded-3xl border border-[var(--border-soft)] bg-gradient-to-br from-white to-[#fff8fd] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
                Compliance
              </p>
              <h2 className="text-2xl font-semibold text-[#1f1422]">Company verification</h2>
              <p className="text-sm text-[#5f3c4c]">
                Active company:{" "}
                <span className="font-semibold text-[#2e1f2c]">{latest?.company?.displayName ?? "Not selected"}</span> ·{" "}
                {latest?.company?.type ?? "Type not set"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
              <button
                type="button"
                onClick={loadLatest}
                className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[#5a3042] transition hover:border-[var(--color-plum)] hover:text-[var(--color-plum)] disabled:opacity-60"
                disabled={!activeCompanyId || loading}
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
          {fetchError ? (
            <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#7f1d1d]">
              {fetchError}{" "}
              <button type="button" onClick={loadLatest} className="font-semibold underline">
                Try again
              </button>
            </div>
          ) : null}
          {activeCompanyId ? (
            <>
              <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm shadow-[#e7ddea]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#2e1f2c]">Latest status</p>
                      <p className="text-xs text-[#7a5d6b]">
                        {request
                          ? `Updated ${formatDateTime(request.updatedAt ?? request.createdAt)}`
                          : "No verification requests yet"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen((prev) => !prev)}
                      disabled={!request}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold text-[var(--color-plum)] transition hover:border-[var(--color-plum)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {historyOpen ? "Hide history" : "View history"}
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className={`transition ${historyOpen ? "rotate-180" : ""}`}>
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-[#5c4451]">{statusMeta.helper}</p>
                  {request?.rejectionReason ? (
                    <p className="mt-3 rounded-2xl border border-[#fecaca] bg-[#fff5f5] p-3 text-sm text-[#7f1d1d]">
                      Rejection reason: <span className="font-semibold">{request.rejectionReason}</span>
                    </p>
                  ) : null}
                  {hasPendingRequest ? (
                    <p className="mt-3 rounded-2xl bg-[#ecfdf5] p-3 text-sm font-semibold text-[#065f46]">
                      We&apos;re currently reviewing your documents. You&apos;ll receive an email as soon as we conclude.
                    </p>
                  ) : null}
                </div>
                <div className="rounded-3xl border border-[#bbf7d0] bg-gradient-to-br from-white via-[#f5fff9] to-[#e7fff1] p-5 shadow-sm shadow-[#ccf2dc]">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                    Credibility spotlight
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#174836]">Turn trust into more deals</h3>
                  <ul className="mt-3 space-y-2 text-sm text-[#174836]">
                    {verificationSpotlightBenefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#0d9f6e]" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    disabled={ctaDisabled}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0d9f6e33] transition disabled:opacity-50"
                    style={{ backgroundColor: "#0d9f6e" }}
                  >
                    {hasPendingRequest ? "Request in review" : "Earn the verified badge"}
                  </button>
                  <p className="mt-2 text-xs text-[#256c51]">
                    {isCompanyTypeEligible
                      ? hasPendingRequest
                        ? "Your submission is being reviewed by Manufacture compliance."
                        : "Trader & manufacturer accounts can upload GST + Aadhaar to claim the badge."
                      : "Only trader and manufacturer account types are eligible for verification."}
                  </p>
                </div>
              </div>
              <AnimatePresence initial={false}>
                {historyOpen ? (
                  <motion.div
                    key="verification-history"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="mt-5"
                  >
                    <VerificationHistory request={request} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </>
          ) : (
            <p className="mt-6 text-sm text-[#5c4451]">
              Select or create a trader/manufacturer company to unlock verification. Once selected, your badge controls will appear here.
            </p>
          )}
        </section>
      ) : null}
      <VerificationModal
        open={isModalOpen}
        onClose={handleCloseModal}
        companyName={latest?.company?.displayName ?? user.displayName ?? user.email}
        companyType={latest?.company?.type}
        gstDocument={gstDocument}
        aadhaarDocument={aadhaarDocument}
        onSelectGst={(files) => handleDocumentSelect(files, setGstDocument)}
        onSelectAadhaar={(files) => handleDocumentSelect(files, setAadhaarDocument)}
        notes={notes}
        onChangeNotes={setNotes}
        onSubmit={handleSubmit}
        formError={formError}
        successMessage={successMessage}
        submitting={submitting}
      />
    </>
  );
};
const VerificationHistory = ({ request }: { request: CompanyVerificationRequest | null }) => {
  if (!request) {
    return (
      <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5">
        <p className="text-sm text-[#5c4451]">
          When you submit your GST + Aadhaar documents, the compliance team&apos;s updates will appear here.
        </p>
      </div>
    );
  }

  const docEntries = [
    { label: "GST certificate", doc: request.documents?.gstCertificate },
    { label: "Aadhaar card", doc: request.documents?.aadhaarCard },
  ];
  const requestedBy = request.requestedBy?.displayName ?? request.requestedBy?.email ?? "You";
  const auditTrail = request.auditTrail ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-3xl border border-[var(--border-soft)] bg-white p-5 shadow-sm shadow-[#e7ddea]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
          Latest submission
        </p>
        <h4 className="mt-2 text-lg font-semibold text-[#1f1422]">Documents on file</h4>
        <p className="text-sm text-[#5c4451]">
          Submitted {formatDateTime(request.createdAt)} by {requestedBy}.
        </p>
        <div className="mt-4 space-y-3">
          {docEntries.map((entry) => (
            <div
              key={entry.label}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3 text-sm text-[#2e1f2c]"
            >
              <p className="font-semibold">{entry.label}</p>
              {entry.doc ? (
                <p className="text-xs text-[#7a5d6b]">
                  {entry.doc.fileName ?? "Uploaded file"}
                  {entry.doc.size ? ` · ${formatFileSize(entry.doc.size)}` : ""}
                </p>
              ) : (
                <p className="text-xs text-[#b98b9e]">Waiting on upload</p>
              )}
              {entry.doc?.uploadedAt ? (
                <p className="text-xs text-[#b98b9e]">Uploaded {formatDateTime(entry.doc.uploadedAt)}</p>
              ) : null}
            </div>
          ))}
        </div>
        {request.notes ? (
          <p className="mt-4 rounded-2xl bg-[var(--surface-muted)] p-3 text-sm text-[#5c4451]">
            Submitter note: <span className="font-semibold">{request.notes}</span>
          </p>
        ) : null}
        {request.decisionNotes ? (
          <p className="mt-2 rounded-2xl bg-white/70 p-3 text-sm text-[#2e1f2c]">
            Reviewer note: <span className="font-semibold">{request.decisionNotes}</span>
          </p>
        ) : null}
      </div>
      <div className="rounded-3xl border border-[var(--border-soft)] bg-white p-5 shadow-sm shadow-[#e7ddea]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
          Audit trail
        </p>
        <h4 className="mt-2 text-lg font-semibold text-[#1f1422]">Verification steps</h4>
        {auditTrail.length ? (
          <ul className="mt-4 space-y-3">
            {auditTrail.map((entry, index) => (
              <li
                key={`${entry.action}-${entry.at ?? index}`}
                className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3"
              >
                <p className="text-sm font-semibold text-[#2e1f2c] capitalize">{entry.action}</p>
                <p className="text-xs text-[#7a5d6b]">
                  {formatDateTime(entry.at)} · {entry.by?.displayName ?? entry.by?.email ?? "System"}
                </p>
                {entry.notes ? <p className="mt-1 text-xs text-[#5c4451]">{entry.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#5c4451]">
            Once compliance reviews your submission, their actions will show up here with timestamps.
          </p>
        )}
      </div>
    </div>
  );
};

type VerificationModalProps = {
  open: boolean;
  onClose: () => void;
  companyName?: string | null;
  companyType?: string | null;
  gstDocument: UploadEntry | null;
  aadhaarDocument: UploadEntry | null;
  onSelectGst: (files: FileList | null) => void;
  onSelectAadhaar: (files: FileList | null) => void;
  notes: string;
  onChangeNotes: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  formError: string | null;
  successMessage: string | null;
  submitting: boolean;
};

const VerificationModal = ({
  open,
  onClose,
  companyName,
  companyType,
  gstDocument,
  aadhaarDocument,
  onSelectGst,
  onSelectAadhaar,
  notes,
  onChangeNotes,
  onSubmit,
  formError,
  successMessage,
  submitting,
}: VerificationModalProps) => (
  <AnimatePresence>
    {open ? (
      <>
        <motion.div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-xl rounded-3xl border border-[var(--border-soft)] bg-white p-6 shadow-2xl shadow-[#5a304236]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                  Verification request
                </p>
                <h3 className="text-xl font-semibold text-[#1f1422]">Submit documents</h3>
                <p className="text-sm text-[#5f3c4c]">
                  We&apos;ll review GST + Aadhaar uploads for {companyName}. {companyType ? `Current type: ${companyType}.` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[var(--border-soft)] p-2 text-[#5a3042] disabled:opacity-60"
                aria-label="Close verification modal"
                disabled={submitting}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <DocumentUploadField label="GST certificate" entry={gstDocument} onSelect={onSelectGst} disabled={submitting} />
              <DocumentUploadField label="Aadhaar card" entry={aadhaarDocument} onSelect={onSelectAadhaar} disabled={submitting} />
              <label className="text-sm font-semibold text-[#2e1f2c]">
                Reviewer notes (optional)
                <textarea
                  className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-[#2e1f2c] focus:outline-none"
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(event) => onChangeNotes(event.target.value)}
                  placeholder="Share any procurement context that speeds up review."
                  disabled={submitting}
                />
              </label>
              {formError ? <p className="text-sm font-semibold text-[#b91c1c]">{formError}</p> : null}
              {successMessage ? <p className="text-sm font-semibold text-[#14532d]">{successMessage}</p> : null}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[#5a3042] disabled:opacity-60"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0d9f6e] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#0d9f6e33] disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </>
    ) : null}
  </AnimatePresence>
);

const DocumentUploadField = ({
  label,
  entry,
  onSelect,
  disabled,
}: {
  label: string;
  entry: UploadEntry | null;
  onSelect: (files: FileList | null) => void;
  disabled?: boolean;
}) => (
  <div>
    <p className="text-sm font-semibold text-[#2e1f2c]">{label}</p>
    <label
      className={`mt-2 block rounded-2xl border border-dashed border-[var(--border-soft)] bg-white/70 px-4 py-4 text-sm text-[#5c4451] ${
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`}
    >
      <input
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          onSelect(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      {entry ? (
        <div>
          <p className="font-semibold text-[#2e1f2c]">{entry.fileName}</p>
          <p className="text-xs text-[#7a5d6b]">{entry.sizeLabel}</p>
          <p className="text-xs text-[var(--color-plum)]">Click to replace file</p>
        </div>
      ) : (
        <p>Click to upload PDF or image scans.</p>
      )}
    </label>
  </div>
);



const fileToDocumentPayload = (file: File): Promise<CompanyVerificationDocumentUpload> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read file contents."));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1] ?? "" : result;
      resolve({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        content: base64,
      });
    };
    reader.onerror = () => reject(new Error("Unable to read file contents."));
    reader.readAsDataURL(file);
  });
};

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;
  return `${size.toFixed(1)} ${units[index]}`;
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const getVerificationStatusMeta = (status?: CompanyVerificationStatus | string | null) => {
  const normalized = typeof status === "string" ? status.toLowerCase() : "not_submitted";
  const metaMap: Record<string, { label: string; className: string; helper: string }> = {
    approved: {
      label: "Verified",
      className: "border-[#bbf7d0] bg-[#ecfdf5] text-[#065f46]",
      helper: "Your company is verified. Keep documents updated to maintain the badge.",
    },
    active: {
      label: "Verified",
      className: "border-[#bbf7d0] bg-[#ecfdf5] text-[#065f46]",
      helper: "Your company is verified. Keep documents updated to maintain the badge.",
    },
    verified: {
      label: "Verified",
      className: "border-[#bbf7d0] bg-[#ecfdf5] text-[#065f46]",
      helper: "Your company is verified. Keep documents updated to maintain the badge.",
    },
    pending: {
      label: "Under review",
      className: "border-[#fde68a] bg-[#fff7ed] text-[#92400e]",
      helper: "Our compliance team is reviewing the latest submission. Expect updates soon.",
    },
    rejected: {
      label: "Needs attention",
      className: "border-[#fecaca] bg-[#fef2f2] text-[#7f1d1d]",
      helper: "We couldn't approve the last submission. Review the notes and try again.",
    },
  };

  return (
    metaMap[normalized] ?? {
      label: "Not submitted",
      className: "border-[#f5d6e8] bg-[#fff7fb] text-[#5a3042]",
      helper: "Earn trust by submitting GST + Aadhaar documents once you're ready.",
    }
  );
};
