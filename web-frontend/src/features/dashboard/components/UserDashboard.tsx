"use client";

import {
  FormEvent,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { userService } from "@/src/services/user";
import { ApiError } from "@/src/lib/api-error";
import type { AuthUser } from "@/src/types/auth";

const navItems = [
  { id: "overview", label: "Overview", description: "Workspace snapshot", href: "/dashboard" },
  { id: "profile", label: "Profile", description: "Identity & editing", href: "/dashboard/profile" },
  { id: "activity", label: "Activity", description: "Recent timeline", href: "/dashboard/activity" },
  { id: "settings", label: "Preferences", description: "Notifications & sharing", href: "/dashboard/settings" },
] as const;

const timelineEntries = [
  { title: "Supplier verification approved", meta: "9:24 AM", tag: "Compliance" },
  { title: "New RFQ shared with Delta Textiles", meta: "Yesterday", tag: "Trade lane" },
  { title: "Inventory sync scheduled", meta: "2 days ago", tag: "Inventory" },
  { title: "Team member invited", meta: "Jun 02", tag: "Workspace" },
];

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

const initialPreferences = {
  alerts: true,
  weeklyDigest: false,
  autoReports: true,
};

type ProfileFormState = ReturnType<typeof createProfileFormState>;

type DashboardContextValue = {
  user: AuthUser;
  refreshUser: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within DashboardFrame");
  }
  return context;
};

export const DashboardFrame = ({ children }: { children: ReactNode }) => {
  const { user, initializing, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!initializing && !user) {
      router.replace("/signin");
    }
  }, [initializing, user, router]);

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
    <DashboardContext.Provider value={{ user, refreshUser }}>
      <div className="space-y-6">
        <DashboardTopbar user={user} onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="flex flex-col gap-6 lg:flex-row">
          <Sidebar activePath={pathname} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-lg shadow-[#5a304218]">
            {children}
          </div>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};

export const DashboardOverview = () => {
  const { user } = useDashboardContext();
  const cards = useMemo(
    () => [
      {
        label: "Account health",
        value: user.status ?? "Pending",
        detail: user.role ? `Role: ${user.role}` : "Awaiting verification",
      },
      {
        label: "Active companies",
        value: user.companies?.length ? `${user.companies.length}` : "0",
        detail: "Linked workspaces",
      },
      {
        label: "Tasks due",
        value: "3",
        detail: "Document reviews",
      },
    ],
    [user]
  );

  return <OverviewSection user={user} cards={cards} />;
};

export const DashboardProfile = () => {
  const { user, refreshUser } = useDashboardContext();
  const [editForm, setEditForm] = useState<ProfileFormState>(() => createProfileFormState(user));
  const [saveState, setSaveState] = useState<{ status: "idle" | "saving" | "success" | "error"; message?: string }>({
    status: "idle",
  });

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

  return (
    <ProfileSection
      user={user}
      editForm={editForm}
      onChange={setEditForm}
      onSubmit={handleSaveProfile}
      saveState={saveState}
    />
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

const DashboardTopbar = ({ user, onToggleSidebar }: { user: AuthUser; onToggleSidebar: () => void }) => (
  <motion.header
    className="flex flex-col gap-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-lg shadow-[#5a304212] lg:flex-row lg:items-center lg:justify-between"
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
          Dashboard
        </p>
        <p className="text-lg font-semibold text-[#2e1f2c]">Hi {user.displayName ?? user.email}</p>
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center">
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
          placeholder="Search workspace"
          className="w-full bg-transparent text-sm text-[#2e1f2c] placeholder:text-[#b98b9e] focus:outline-none"
        />
      </div>
      <motion.div
        className="flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="text-sm">
          <p className="font-semibold text-[#2e1f2c]">{user.status ?? "Pending"}</p>
          <p className="text-xs text-[#7a5d6b]">Workspace status</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-peach)] text-sm font-semibold text-[var(--color-plum)]">
          {(user.displayName ?? user.email)?.slice(0, 2).toUpperCase()}
        </div>
      </motion.div>
    </div>
  </motion.header>
);

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

const OverviewSection = ({ user, cards }: { user: AuthUser; cards: { label: string; value: string; detail: string }[] }) => (
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
    <div className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-4">
      <SectionHeader title="Linked companies" subtitle="Relationships" />
      <div className="mt-4 flex flex-wrap gap-3">
        {(user.companies ?? ["Add your first company"]).map((company) => (
          <motion.span
            key={company}
            className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold text-[#5a3042]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {company}
          </motion.span>
        ))}
      </div>
    </div>
  </div>
);

const ProfileSection = ({
  user,
  editForm,
  onChange,
  onSubmit,
  saveState,
}: {
  user: AuthUser;
  editForm: ProfileFormState;
  onChange: (value: ProfileFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saveState: { status: "idle" | "saving" | "success" | "error"; message?: string };
}) => {
  const updateField = (key: keyof ProfileFormState, value: string) => {
    onChange({ ...editForm, [key]: value });
  };
  const currentTagPreview = buildActivityTags(editForm.activityTags) ?? [];
  const addressSummary = formatAddressSummary(user.address);
  const companyList =
    user.companies && user.companies.length ? user.companies : ["Add a company from admin console"];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Profile & identity"
        subtitle="Profile"
        action={
          saveState.status === "success" ? (
            <span className="rounded-full bg-[var(--color-peach)] px-4 py-1 text-xs font-semibold text-[var(--color-plum)]">
              Saved
            </span>
          ) : null
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5">
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
#elif)
