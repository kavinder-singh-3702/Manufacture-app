"use client";

import { useEffect, useState } from "react";
import { adminService, AdminUser, AdminCompany } from "@/src/services/admin";

const SEARCH_DEBOUNCE_MS = 220;

// Mirrors app-frontend/src/constants/roles.ts `isAdminRole` — web-frontend
// has no equivalent shared roles module, so this stays a tiny local copy
// rather than pulling in a whole constants file for one predicate.
const isAdminRole = (role?: string | null) => role === "admin" || role === "super-admin";

/**
 * Searchable recipient picker for the composer's "Single user" / "Company"
 * audiences — replaces the raw ObjectId text box the web studio previously
 * required (W2), matching the picker the app studio already has
 * (app-frontend/src/screens/admin/NotificationStudioScreen.tsx).
 */
export const UserRecipientPicker = ({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (userId: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminService.listUsers({
          status: "active",
          limit: 40,
          offset: 0,
          search: search.trim() || undefined,
          sort: "updatedAt:desc",
        });
        if (!active) return;
        // Admins don't receive their own broadcasts — exclude them from the
        // picker entirely so it can't select a target that a 'user' dispatch
        // to an admin would work, but isn't a real use case here.
        setUsers((res.users || []).filter((u) => !isAdminRole(u.role)));
      } catch {
        if (active) setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="space-y-2">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const u = users.find((x) => x.id === id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(id)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary)" }}
              >
                {u ? u.displayName || u.email : `${id.slice(-6)}`}
                <span aria-hidden="true">×</span>
              </button>
            );
          })}
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users by name, email, or phone…"
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
      />

      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
        {loading ? (
          <p className="px-3 py-3 text-xs" style={{ color: "var(--medium-gray)" }}>Searching…</p>
        ) : users.length === 0 ? (
          <p className="px-3 py-3 text-xs" style={{ color: "var(--medium-gray)" }}>No users found.</p>
        ) : (
          users.map((u) => {
            const selected = selectedIds.includes(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => onToggle(u.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors"
                style={{ backgroundColor: selected ? "var(--primary-light)" : "transparent" }}
              >
                <span className="min-w-0 truncate">
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>{u.displayName || "Unnamed user"}</span>
                  <span className="ml-1.5" style={{ color: "var(--medium-gray)" }}>{u.email}</span>
                </span>
                {selected && <span style={{ color: "var(--primary)" }}>✓</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export const CompanyRecipientPicker = ({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (companyId: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminService.listCompanies({
          limit: 40,
          offset: 0,
          search: search.trim() || undefined,
          sort: "updatedAt:desc",
        });
        if (active) setCompanies(res.companies || []);
      } catch {
        if (active) setCompanies([]);
      } finally {
        if (active) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const selectedCompany = companies.find((c) => c.id === selectedId);

  return (
    <div className="space-y-2">
      {selectedCompany && (
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold"
          style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary)" }}
        >
          {selectedCompany.displayName}
          <button type="button" onClick={() => onSelect("")} aria-label="Clear company">×</button>
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search companies…"
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
      />

      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
        {loading ? (
          <p className="px-3 py-3 text-xs" style={{ color: "var(--medium-gray)" }}>Searching…</p>
        ) : companies.length === 0 ? (
          <p className="px-3 py-3 text-xs" style={{ color: "var(--medium-gray)" }}>No companies found.</p>
        ) : (
          companies.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors"
              style={{ backgroundColor: selectedId === c.id ? "var(--primary-light)" : "transparent" }}
            >
              <span className="min-w-0 truncate font-semibold" style={{ color: "var(--foreground)" }}>{c.displayName}</span>
              {selectedId === c.id && <span style={{ color: "var(--primary)" }}>✓</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
