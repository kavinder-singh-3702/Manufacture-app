"use client";
"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BUSINESS_ACCOUNT_TYPES, BUSINESS_CATEGORIES } from "@/src/constants/business";
import { useAuth } from "@/src/hooks/useAuth";
import { ApiError } from "@/src/lib/api-error";
import { companyService } from "@/src/services/company";
import type { Company } from "@/src/types/company";

const formatCategory = (category: string) => category.charAt(0).toUpperCase() + category.slice(1);

const CompanyBadge = ({
  company,
  active,
  onSwitch,
  switching,
}: {
  company: Company;
  active: boolean;
  onSwitch: (id: string) => Promise<void>;
  switching: boolean;
}) => {
  const categoryLabel = company.categories?.[0] ? formatCategory(company.categories[0]) : "General";
  return (
    <motion.div
      key={company.id}
      className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-white/90 px-4 py-3 shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center gap-3">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.displayName}
            className="h-10 w-10 rounded-full border border-[var(--border-soft)] object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-peach)] text-sm font-semibold text-[var(--color-plum)]">
            {company.displayName.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-[#2e1f2c]">{company.displayName}</p>
          <p className="text-xs text-[#7a5d6b]">
            {categoryLabel} • {company.type ?? "normal"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {active ? (
          <span className="rounded-full bg-[var(--color-peach)] px-3 py-1 text-xs font-semibold text-[var(--color-plum)]">
            Active
          </span>
        ) : (
          <button
            onClick={() => onSwitch(company.id)}
            disabled={switching}
            className="rounded-full border border-[var(--color-plum)] px-3 py-1 text-xs font-semibold text-[var(--color-plum)] transition hover:scale-[1.02] disabled:opacity-50"
          >
            {switching ? "Switching…" : "Switch"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const CompanyWorkspace = () => {
  const { user, refreshUser, switchCompany } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    type: user?.accountType ?? "normal",
    categories: [] as string[],
    logoUrl: "",
  });
  const activeCompanyId = user?.activeCompany ?? null;

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await companyService.list();
      setCompanies(response.companies);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to load companies.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleSwitch = async (companyId: string) => {
    try {
      setSwitchingId(companyId);
      await switchCompany(companyId);
      await refreshUser();
      await loadCompanies();
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to switch company.";
      setError(message);
    } finally {
      setSwitchingId(null);
    }
  };

  const toggleCategory = (category: string) => {
    setForm((prev) => {
      const exists = prev.categories.includes(category);
      return { ...prev, categories: exists ? prev.categories.filter((item) => item !== category) : [...prev.categories, category] };
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.displayName.trim()) {
      setError("Add a display name for your company.");
      return;
    }
    try {
      setCreating(true);
      setError(null);
      await companyService.create({
        displayName: form.displayName.trim(),
        type: form.type,
        categories: form.categories,
        logoUrl: form.logoUrl?.trim() || undefined,
      });
      setForm({ displayName: "", type: form.type, categories: [], logoUrl: "" });
      await refreshUser();
      await loadCompanies();
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to create company.";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const activeName = useMemo(() => {
    const active = companies.find((company) => company.id === activeCompanyId);
    return active?.displayName ?? activeCompanyId ?? "Select a company";
  }, [companies, activeCompanyId]);

  return (
    <section className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Multi-company
          </p>
          <h3 className="text-xl font-semibold text-[#2e1f2c]">Linked workspaces</h3>
          <p className="text-sm text-[#5c4451]">
            Switch like Instagram profiles. Create and link multiple entities under one login.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-plum)]">
          Active: {activeName}
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-2xl border border-[#ff9aa2] bg-[#ffeef1] px-4 py-3 text-sm font-semibold text-[#b23a48]">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <div className="h-4 w-28 rounded bg-[var(--color-linen)]" />
              <div className="h-4 w-20 rounded bg-[var(--color-linen)]" />
            </div>
          ) : companies.length ? (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {companies.map((company) => (
                  <CompanyBadge
                    key={company.id}
                    company={company}
                    active={company.id === activeCompanyId}
                    onSwitch={handleSwitch}
                    switching={switchingId === company.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <p className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[#5c4451]">
              No companies yet. Create one to get started.
            </p>
          )}
        </div>

        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-[var(--border-soft)] bg-white p-4 shadow-sm shadow-[#5a304210]"
        >
          <p className="text-sm font-semibold text-[#2e1f2c]">Create a company</p>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-plum)" }}>
            Display name
            <input
              className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] px-3 py-2 text-sm text-[#2e1f2c] placeholder:text-[#b98b9e] focus:outline-none"
              placeholder="e.g., Acme Textiles"
              value={form.displayName}
              onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-plum)" }}>
            Logo URL
            <input
              className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] px-3 py-2 text-sm text-[#2e1f2c] placeholder:text-[#b98b9e] focus:outline-none"
              placeholder="https://..."
              value={form.logoUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
            />
            <span className="mt-1 block text-[11px] text-[#7a5d6b]">Paste an image link to personalize the company avatar.</span>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-plum)" }}>
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

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-full bg-[var(--color-plum)] py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#5a304225] disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create & link"}
          </button>
        </form>
      </div>
    </section>
  );
};
