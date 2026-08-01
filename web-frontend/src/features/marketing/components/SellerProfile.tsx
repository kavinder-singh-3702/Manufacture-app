"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { companyService } from "@/src/services/company";
import { ApiError } from "@/src/lib/api-error";
import type { Company } from "@/src/types/company";
import { useAuth } from "@/src/hooks/useAuth";
import { buildCompanyRows } from "@/src/features/product/utils/specs";
import { buildTrustBadges, formatCompanyLocation } from "@/src/features/product/utils/seller";
import { getCategoryMeta, getCategoryHref } from "@/src/features/product/utils/categories";
import {
  PdpSection, SpecTable, TrustBadgeRow, RevealPhoneButton, SectionNav,
} from "@/src/features/product/components/pdp";
import { ListingResults } from "@/src/features/product/components/listing";

const COMPANY_TYPE_LABELS: Record<string, string> = {
  normal: "Business",
  trader: "Trader / Supplier",
  manufacturer: "Manufacturer",
};

// ── Header — banner + logo + trust info + quick actions ────────────────────────

const CompanyHeader = ({ company, isAuthed, onRequireAuth }: { company: Company; isAuthed: boolean; onRequireAuth: () => void }) => {
  const trustBadges = buildTrustBadges(company);
  const location = formatCompanyLocation(company);
  const initials = (company.displayName ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="h-20 sm:h-24" style={{ background: "var(--gradient-brand-deep)" }} />
      <div className="mx-auto max-w-[1400px] px-6 pb-6 lg:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
          <div className="-mt-10 flex-shrink-0 sm:-mt-12">
            {company.logoUrl ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl sm:h-24 sm:w-24"
                style={{ border: "3px solid var(--surface)", boxShadow: "var(--shadow-md)" }}>
                <Image src={company.logoUrl} alt={company.displayName} fill sizes="96px" className="object-cover" />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white sm:h-24 sm:w-24"
                style={{ background: "var(--gradient-brand-deep)", border: "3px solid var(--surface)", boxShadow: "var(--shadow-md)" }}>
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2 pt-2">
            <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>{company.displayName}</h1>
            {company.legalName && company.legalName !== company.displayName && (
              <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{company.legalName}</p>
            )}

            <TrustBadgeRow badges={trustBadges} />

            <div className="flex flex-wrap gap-4 pt-1">
              {company.type && <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>{COMPANY_TYPE_LABELS[company.type] ?? company.type}</span>}
              {location && <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>📍 {location}</span>}
              {company.contact?.website && (
                <a href={company.contact.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
                  🌐 Website →
                </a>
              )}
            </div>

            {(company.categories ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(company.categories ?? []).map((cat) => {
                  // company.categories is a broader "business category" tag
                  // set (backend BUSINESS_CATEGORIES), not guaranteed to be a
                  // real product-category id — e.g. legacy values like
                  // "manufacturing"/"logistics" have no /industries page.
                  // Only render as a link when it resolves to a real one
                  // (getCategoryMeta), otherwise show a plain, non-clickable
                  // chip instead of risking a link into a 404.
                  const meta = getCategoryMeta(cat);
                  const label = cat.replace(/-/g, " ");
                  const chipStyle = { backgroundColor: "var(--primary-light)", color: "var(--primary)" };
                  return meta ? (
                    <Link key={cat} href={getCategoryHref(cat)}
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize transition-opacity hover:opacity-70"
                      style={chipStyle}>
                      {label}
                    </Link>
                  ) : (
                    <span key={cat} className="rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize" style={chipStyle}>
                      {label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-2 sm:flex-shrink-0 sm:w-64">
            {company.contact?.phone && (
              <RevealPhoneButton phone={company.contact.phone} isAuthed={isAuthed} onRequireAuth={onRequireAuth} />
            )}
            {company.contact?.email && (
              isAuthed ? (
                <a href={`mailto:${company.contact.email}`}
                  className="flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
                  ✉️ Email seller
                </a>
              ) : (
                <button type="button" onClick={onRequireAuth}
                  className="flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
                  🔒 Sign in to email
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── SellerProfile ─────────────────────────────────────────────────────────────

export const SellerProfile = ({
  companyId,
  initialCompany,
}: {
  companyId: string;
  /** Server-rendered seller (SSR/ISR) so the page paints instantly and is crawlable. */
  initialCompany?: Company;
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(initialCompany ?? null);
  const [loading, setLoading] = useState(!initialCompany);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Public profile page — must use the unauthenticated public endpoint,
      // not the owner/admin-only companyService.get(). The latter 401s for
      // every other visitor (which is exactly why this page previously never
      // loaded for a real buyer, only for the company's own owner or an
      // admin — see publicData.ts getPublicCompany).
      const { company: c } = await companyService.getPublic(companyId);
      setCompany(c);
      setError(null);
    } catch (err) {
      if (!silent) setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load seller profile");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(Boolean(initialCompany)); }, [load, initialCompany]);

  const companyRows = useMemo(() => buildCompanyRows(company ?? undefined), [company]);
  const requireAuth = () => router.push(`/signin?next=${encodeURIComponent(`/sellers/${companyId}`)}`);

  if (loading) {
    return (
      <div>
        <div className="h-20 sm:h-24" style={{ background: "var(--light-gray)" }} />
        <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
          <div className="h-24 w-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--light-gray)" }} />
          <div className="mt-4 space-y-3">
            <div className="h-6 w-48 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
            <div className="h-4 w-64 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
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

  const navItems = [
    { id: "seller-products", label: "Products" },
    ...(companyRows.length > 0 || company.description ? [{ id: "seller-about", label: "About Company" }] : []),
    ...(company.contact?.phone || company.contact?.website || company.headquarters ? [{ id: "seller-contact", label: "Contact" }] : []),
  ];

  return (
    <div>
      <CompanyHeader company={company} isAuthed={!!user} onRequireAuth={requireAuth} />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionNav items={navItems} />
      </div>

      <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6 lg:px-10">
        <motion.div id="seller-products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="scroll-mt-32">
          <h2 className="mb-4 text-base font-bold" style={{ color: "var(--foreground)" }}>Products from {company.displayName}</h2>
          <ListingResults companyId={companyId} emptyIcon="📦" emptyTitle="No products listed yet" />
        </motion.div>

        {(companyRows.length > 0 || company.description) && (
          <PdpSection id="seller-about" icon="🏭" title="About Company">
            <div className="space-y-5">
              {company.description && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{company.description}</p>
              )}
              {companyRows.length > 0 && <SpecTable rows={companyRows} />}
            </div>
          </PdpSection>
        )}

        {(company.contact?.phone || company.contact?.website || company.headquarters) && (
          <PdpSection id="seller-contact" icon="📇" title="Contact">
            <div className="space-y-3">
              {company.contact?.phone && (
                <RevealPhoneButton phone={company.contact.phone} isAuthed={!!user} onRequireAuth={requireAuth} />
              )}
              {company.contact?.website && (
                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                  🌐 <a href={company.contact.website} target="_blank" rel="noopener noreferrer" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>{company.contact.website}</a>
                </p>
              )}
              {company.headquarters && (
                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                  📍 {[company.headquarters.line1, company.headquarters.line2, company.headquarters.city, company.headquarters.state, company.headquarters.postalCode].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </PdpSection>
        )}
      </div>
    </div>
  );
};
