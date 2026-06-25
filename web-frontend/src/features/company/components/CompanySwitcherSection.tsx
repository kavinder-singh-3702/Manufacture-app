"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { ApiError } from "@/src/lib/api-error";
import { useDashboardContext } from "@/src/features/dashboard/components/user-dashboard/context";
import { CompanyCreateDrawer } from "./CompanyCreateDrawer";
import { CompanyVerificationDrawer } from "./CompanyVerificationDrawer";
import type { Company } from "@/src/types/company";

const COMPLIANCE_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  verified: { label: "Verified", bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  approved: { label: "Verified", bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  active:   { label: "Verified", bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  pending:  { label: "Under review", bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  rejected: { label: "Needs attention", bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

const getComplianceMeta = (status?: string) =>
  COMPLIANCE_META[(status ?? "").toLowerCase()] ?? {
    label: "Not submitted", bg: "var(--primary-light)", text: "var(--primary)", dot: "var(--primary)",
  };

const buildInitials = (name?: string) =>
  (name ?? "CO").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay },
});

const CompanyCard = ({
  company,
  isActive,
  isSwitching,
  onSwitch,
  onVerify,
}: {
  company: Company;
  isActive: boolean;
  isSwitching: boolean;
  onSwitch: () => void;
  onVerify: () => void;
}) => {
  const compliance = getComplianceMeta(company.complianceStatus);
  const initials = buildInitials(company.displayName);
  const categories = company.categories?.slice(0, 3) ?? [];
  const isEligibleToVerify =
    ["trader", "manufacturer"].includes((company.type ?? "").toLowerCase()) &&
    !["verified", "approved", "active", "pending"].includes((company.complianceStatus ?? "").toLowerCase());

  return (
    <motion.div
      {...fade(0)}
      whileHover={{ y: -3 }}
      className="relative flex flex-col overflow-hidden rounded-3xl transition-shadow hover:shadow-lg"
      style={{
        border: isActive ? "2px solid var(--primary)" : "1px solid var(--border)",
        backgroundColor: "var(--card)",
        boxShadow: isActive ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
    >
      {isActive && (
        <div
          className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl"
          style={{ background: "var(--gradient-brand)" }}
        />
      )}

      <div className="flex items-start gap-4 p-5">
        {/* Logo / Initials */}
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-bold"
          style={{
            backgroundColor: isActive ? "var(--primary)" : "var(--primary-light)",
            color: isActive ? "#fff" : "var(--primary)",
            border: "1px solid var(--border)",
          }}
        >
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={company.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold" style={{ color: "var(--foreground)" }}>
              {company.displayName}
            </h3>
            {isActive && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: "var(--primary)", color: "#fff" }}
              >
                Active
              </span>
            )}
          </div>

          {company.legalName && company.legalName !== company.displayName && (
            <p className="truncate text-xs" style={{ color: "var(--medium-gray)" }}>{company.legalName}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {company.type && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                style={{ backgroundColor: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                {company.type}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: compliance.bg, color: compliance.text }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: compliance.dot }} />
              {compliance.label}
            </span>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize"
              style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Location */}
      {(company.headquarters?.city || company.headquarters?.country) && (
        <p className="flex items-center gap-1 px-5 pb-3 text-xs" style={{ color: "var(--medium-gray)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {[company.headquarters.city, company.headquarters.country].filter(Boolean).join(", ")}
        </p>
      )}

      {/* Actions */}
      <div
        className="mt-auto flex items-center gap-2 px-5 pb-5"
        style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}
      >
        {!isActive && (
          <button
            type="button"
            onClick={onSwitch}
            disabled={isSwitching}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
          >
            {isSwitching ? "Switching…" : "Switch to this"}
          </button>
        )}
        {isActive && (
          <span
            className="flex-1 rounded-xl py-2.5 text-center text-sm font-semibold"
            style={{ backgroundColor: "var(--background)", color: "var(--primary)", border: "1px solid var(--primary)" }}
          >
            ✓ Currently active
          </span>
        )}
        {isEligibleToVerify && (
          <button
            type="button"
            onClick={onVerify}
            className="rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#DCFCE7", color: "#15803D", border: "1px solid #bbf7d0" }}
            title="Submit for verification"
          >
            Verify →
          </button>
        )}
      </div>
    </motion.div>
  );
};

const CreateCompanyCard = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ y: -3, boxShadow: "var(--shadow-md)" }}
    whileTap={{ scale: 0.98 }}
    className="flex flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center transition-all"
    style={{
      border: "1.5px dashed var(--border)",
      backgroundColor: "var(--card)",
      color: "var(--foreground)",
      boxShadow: "var(--shadow-sm)",
      minHeight: "200px",
    }}
  >
    <div
      className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
      style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
    >
      +
    </div>
    <div>
      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Add new company</p>
      <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
        Create another workspace under your account
      </p>
    </div>
  </motion.button>
);

export const CompanySwitcherSection = () => {
  const { companies, activeCompany, reloadCompanies } = useDashboardContext();
  const { switchCompany, refreshUser } = useAuth();

  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<Company | null>(null);

  const handleSwitch = async (company: Company) => {
    if (company.id === activeCompany?.id) return;
    try {
      setSwitchingId(company.id);
      setError(null);
      await switchCompany(company.id);
      await refreshUser();
      await reloadCompanies();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not switch company.");
    } finally {
      setSwitchingId(null);
    }
  };

  const verifiedCount = companies.filter((c) =>
    ["verified", "approved", "active"].includes((c.complianceStatus ?? "").toLowerCase())
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        {...fade(0)}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
            Workspaces
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Your Companies
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>
            {companies.length} workspace{companies.length !== 1 ? "s" : ""} · {verifiedCount} verified
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          Add company
        </button>
      </motion.div>

      {/* Stats strip */}
      {companies.length > 0 && (
        <motion.div
          {...fade(0.05)}
          className="grid grid-cols-3 gap-3 sm:grid-cols-3"
        >
          {[
            { label: "Total workspaces", value: companies.length },
            { label: "Verified", value: verifiedCount },
            { label: "Active workspace", value: activeCompany?.displayName ?? "None" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
                {stat.label}
              </p>
              <p className="mt-1.5 truncate text-xl font-bold" style={{ color: "var(--foreground)" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
          >
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-3 text-xs font-bold underline">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Companies grid */}
      {companies.length === 0 ? (
        <motion.div
          {...fade(0.1)}
          className="flex flex-col items-center gap-4 rounded-3xl p-12 text-center"
          style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}
        >
          <span className="text-4xl">🏭</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>No companies yet</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
              Create your first company to start listing products, managing inventory, and getting verified.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
          >
            Create first company
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } }, hidden: {} }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {companies.map((company) => (
            <motion.div
              key={company.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            >
              <CompanyCard
                company={company}
                isActive={company.id === activeCompany?.id}
                isSwitching={switchingId === company.id}
                onSwitch={() => handleSwitch(company)}
                onVerify={() => setVerifyTarget(company)}
              />
            </motion.div>
          ))}
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
            <CreateCompanyCard onClick={() => setCreateOpen(true)} />
          </motion.div>
        </motion.div>
      )}

      {/* Drawers */}
      <CompanyCreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async () => {
          await refreshUser();
          await reloadCompanies();
          setCreateOpen(false);
        }}
      />

      {verifyTarget && (
        <CompanyVerificationDrawer
          open={!!verifyTarget}
          companyId={verifyTarget.id}
          companyName={verifyTarget.displayName}
          companyType={verifyTarget.type}
          onClose={() => setVerifyTarget(null)}
          onSubmitted={() => { void reloadCompanies(); }}
        />
      )}
    </div>
  );
};
