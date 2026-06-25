"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { companyService } from "@/src/services/company";
import { ApiError } from "@/src/lib/api-error";
import type { Company } from "@/src/types/company";
import { useAuth } from "@/src/hooks/useAuth";
import { PublicMarketplace } from "./PublicMarketplace";

// ── Company header ────────────────────────────────────────────────────────────

const CompanyHeader = ({ company }: { company: Company }) => {
  const { user } = useAuth();
  const isGuest = !user;
  const isVerified =
    company.complianceStatus === "verified" ||
    company.complianceStatus === "approved" ||
    company.complianceStatus === "active";

  const initials = (company.displayName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="border-b" style={{ borderColor: "var(--border)", background: "linear-gradient(160deg, #f8fafb 0%, #f0f9ff 100%)" }}>
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          {/* Logo / avatar */}
          <div className="flex-shrink-0">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={company.logoUrl} alt={company.displayName}
                className="h-20 w-20 rounded-2xl object-cover"
                style={{ border: "2px solid var(--border)" }} />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white"
                style={{ background: "var(--gradient-brand-deep)" }}>
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                {company.displayName}
              </h1>
              {isVerified && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ backgroundColor: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0" }}>
                  ✓ Verified seller
                </motion.span>
              )}
            </div>

            {company.legalName && company.legalName !== company.displayName && (
              <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{company.legalName}</p>
            )}

            {company.description && (
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--foreground)" }}>
                {company.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 pt-1">
              {company.type && (
                <span className="text-xs font-semibold capitalize"
                  style={{ color: "var(--medium-gray)" }}>
                  🏭 {company.type}
                </span>
              )}
              {company.headquarters?.city && (
                <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>
                  📍 {company.headquarters.city}{company.headquarters.state ? `, ${company.headquarters.state}` : ""}
                </span>
              )}
              {company.foundedAt && (
                <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>
                  📅 Est. {new Date(company.foundedAt).getFullYear()}
                </span>
              )}
              {company.contact?.website && (
                <a href={company.contact.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "var(--primary)" }}>
                  🌐 Website →
                </a>
              )}
            </div>

            {/* Categories */}
            {(company.categories ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(company.categories ?? []).map((cat) => (
                  <Link key={cat} href={`/products/category/${cat}`}
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize transition-opacity hover:opacity-70"
                    style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                    {cat.replace(/-/g, " ")}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Contact actions — call/email require sign-in */}
          <div className="flex flex-col gap-2 sm:flex-shrink-0">
            {company.contact?.phone && (
              isGuest ? (
                <Link href={`/signin?next=${encodeURIComponent(`/sellers/detail?companyId=${company.id}`)}`}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#EA580C" }}>
                  🔒 Sign in to call
                </Link>
              ) : (
                <a href={`tel:${company.contact.phone.replace(/[^\d+]/g, "")}`}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#EA580C" }}>
                  📞 Call seller
                </a>
              )
            )}
            {company.contact?.email && (
              isGuest ? (
                <Link href={`/signin?next=${encodeURIComponent(`/sellers/detail?companyId=${company.id}`)}`}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
                  🔒 Sign in to email
                </Link>
              ) : (
                <a href={`mailto:${company.contact.email}`}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
                  ✉️ Email seller
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── SellerProfile ─────────────────────────────────────────────────────────────

export const SellerProfile = ({ companyId }: { companyId: string }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { company: c } = await companyService.get(companyId);
      setCompany(c);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load seller profile");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div>
        {/* Header skeleton */}
        <div className="border-b px-6 py-8 lg:px-10" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <div className="mx-auto max-w-[1400px] flex gap-5">
            <div className="h-20 w-20 animate-pulse rounded-2xl flex-shrink-0" style={{ backgroundColor: "var(--light-gray)" }} />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
              <div className="h-4 w-64 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
              <div className="h-4 w-96 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
                <div className="aspect-[4/3] animate-pulse" style={{ backgroundColor: "var(--light-gray)" }} />
                <div className="space-y-2 p-4">
                  <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
                  <div className="h-3 w-1/2 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-5xl">🏭</div>
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Seller not found</p>
        <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{error ?? "This seller profile may not exist."}</p>
        <Link href="/products" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--primary)" }}>← Browse products</Link>
      </div>
    );
  }

  return (
    <div>
      <CompanyHeader company={company} />
      {/* Products section — reuse PublicMarketplace in company-scoped mode */}
      <PublicMarketplace companyId={companyId} />
    </div>
  );
};
