"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BUSINESS_ACCOUNT_TYPES, COMPANY_VERIFICATION_ACCOUNT_TYPES } from "@/src/constants/business";
import { useAuth } from "@/src/hooks/useAuth";
import { ApiError } from "@/src/lib/api-error";
import { companyService } from "@/src/services/company";
import { useDashboardContext } from "@/src/features/dashboard/components/UserDashboard";
import type {
  Company,
  CompanyAddress,
  CompanyContact,
  CompanySocialLinks,
  UpdateCompanyPayload,
} from "@/src/types/company";

type CompanyFormState = {
  displayName: string;
  legalName: string;
  description: string;
  type: string;
  sizeBucket: string;
  categories: string;
  foundedAt: string;
  logoUrl: string;
  coverImageUrl: string;
  contact: CompanyContact;
  headquarters: CompanyAddress;
  socialLinks: CompanySocialLinks;
};

const SIZE_BUCKETS = ["1-10", "11-50", "51-200", "201-500", "500+"];

const formatCategory = (category: string) => category.charAt(0).toUpperCase() + category.slice(1);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
        {subtitle ?? "Company".toUpperCase()}
      </p>
      <h2 className="text-2xl font-semibold text-[#2e1f2c]">{title}</h2>
    </div>
  </div>
);

const createFormState = (company?: Company): CompanyFormState => ({
  displayName: company?.displayName ?? "",
  legalName: company?.legalName ?? "",
  description: company?.description ?? "",
  type: company?.type ?? "",
  sizeBucket: company?.sizeBucket ?? "",
  categories: company?.categories?.join(", ") ?? "",
  foundedAt: company?.foundedAt?.slice(0, 10) ?? "",
  logoUrl: company?.logoUrl ?? "",
  coverImageUrl: company?.coverImageUrl ?? "",
  contact: {
    email: company?.contact?.email ?? "",
    phone: company?.contact?.phone ?? "",
    website: company?.contact?.website ?? "",
  },
  headquarters: {
    line1: company?.headquarters?.line1 ?? "",
    line2: company?.headquarters?.line2 ?? "",
    city: company?.headquarters?.city ?? "",
    state: company?.headquarters?.state ?? "",
    postalCode: company?.headquarters?.postalCode ?? "",
    country: company?.headquarters?.country ?? "",
  },
  socialLinks: {
    linkedin: company?.socialLinks?.linkedin ?? "",
    twitter: company?.socialLinks?.twitter ?? "",
    instagram: company?.socialLinks?.instagram ?? "",
    youtube: company?.socialLinks?.youtube ?? "",
  },
});

const normalizeForm = (form: CompanyFormState): UpdateCompanyPayload => {
  const trim = (value: string) => value.trim();
  const categories = form.categories
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return {
    displayName: trim(form.displayName),
    legalName: trim(form.legalName) || undefined,
    description: trim(form.description) || undefined,
    type: trim(form.type) || undefined,
    sizeBucket: trim(form.sizeBucket) || undefined,
    categories: categories.length ? categories : undefined,
    foundedAt: form.foundedAt ? new Date(form.foundedAt).toISOString() : undefined,
    logoUrl: trim(form.logoUrl) || undefined,
    coverImageUrl: trim(form.coverImageUrl) || undefined,
    contact: {
      email: trim(form.contact.email) || undefined,
      phone: trim(form.contact.phone) || undefined,
      website: trim(form.contact.website) || undefined,
    },
    headquarters: {
      line1: trim(form.headquarters.line1) || undefined,
      line2: trim(form.headquarters.line2) || undefined,
      city: trim(form.headquarters.city) || undefined,
      state: trim(form.headquarters.state) || undefined,
      postalCode: trim(form.headquarters.postalCode) || undefined,
      country: trim(form.headquarters.country) || undefined,
    },
    socialLinks: {
      linkedin: trim(form.socialLinks.linkedin) || undefined,
      twitter: trim(form.socialLinks.twitter) || undefined,
      instagram: trim(form.socialLinks.instagram) || undefined,
      youtube: trim(form.socialLinks.youtube) || undefined,
    },
  };
};

export const CompanyProfile = () => {
  const { user } = useAuth();
  const { openVerificationModal } = useDashboardContext();
  const activeCompanyId = user?.activeCompany as string | undefined;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyFormState>(() => createFormState());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const companySummary = useMemo(
    () => [
      { label: "Type", value: company?.type ?? "Not set" },
      { label: "Status", value: company?.status ?? "Pending" },
      { label: "Verification", value: company?.complianceStatus ?? "Pending" },
      { label: "Categories", value: company?.categories?.map((cat) => formatCategory(cat)).join(", ") ?? "Add categories" },
      { label: "Size", value: company?.sizeBucket ?? "Unspecified" },
      { label: "Founded", value: company?.foundedAt ? company.foundedAt.slice(0, 10) : "Unknown" },
    ],
    [company]
  );

  const loadCompany = async () => {
    if (!activeCompanyId) {
      setCompany(null);
      setError("Select an active company to view its profile.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await companyService.get(activeCompanyId);
      setCompany(response.company);
      setForm(createFormState(response.company));
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to load company profile.";
      setError(message);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompanyId]);

  const updateField = (key: keyof CompanyFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateNested = <T extends object, K extends keyof T>(
    parentKey: keyof CompanyFormState,
    key: K,
    value: T[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [parentKey]: { ...(prev[parentKey] as object), [key]: value } as CompanyFormState[typeof parentKey],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeCompanyId) {
      setError("Select an active company to update its profile.");
      return;
    }
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);
      const payload = normalizeForm(form);
      if (!payload.displayName) {
        setError("Display name is required.");
        setSaving(false);
        return;
      }
      const response = await companyService.update(activeCompanyId, payload);
      setCompany(response.company);
      setForm(createFormState(response.company));
      setSuccess("Company profile updated.");
      setEditing(false);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to update company.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-6 text-[#5c4451]">
        Please sign in to view your company.
      </div>
    );
  }

  if (!activeCompanyId) {
    return (
      <div className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-6 text-[#5c4451]">
        <p className="text-lg font-semibold text-[#2e1f2c]">No active company selected</p>
        <p className="mt-2 text-sm">
          Create or select a company from the admin console to see its profile here.
        </p>
        <div className="mt-4">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-full bg-[var(--color-plum)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5a304233]"
          >
            Go to admin
          </Link>
        </div>
      </div>
    );
  }

  const verificationBanner = (() => {
    const status = company?.complianceStatus?.toLowerCase();
    const isVerified = status === "approved" || status === "verified";
    const companyType = company?.type?.toLowerCase();
    const eligible = !companyType || COMPANY_VERIFICATION_ACCOUNT_TYPES.includes(companyType as (typeof COMPANY_VERIFICATION_ACCOUNT_TYPES)[number]);
    if (isVerified) return null;
    return (
      <div className="rounded-3xl border border-[#fed7aa] bg-gradient-to-r from-[#fffaf0] via-[#fffdf5] to-white p-5 shadow-sm shadow-[#ffefd533]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center rounded-full border border-[#fb923c] bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#b45309]">
              Unverified
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#7c2d12]">{company?.displayName ?? "Your company"} isn&apos;t verified yet.</p>
              <p className="text-xs text-[#9a4a2a]">
                Claim the badge to boost trust, unlock private RFQs, and surface higher in buyer searches.
              </p>
            </div>
          </div>
          {eligible ? (
            <button
              type="button"
              onClick={openVerificationModal}
              className="inline-flex items-center justify-center rounded-full bg-[#0d9f6e] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#0d9f6e33] transition hover:scale-[1.01]"
            >
              Get verified
            </button>
          ) : (
            <p className="text-xs font-semibold text-[#b45309]">Set company type to trader or manufacturer to become eligible.</p>
          )}
        </div>
      </div>
    );
  })();

  return (
    <div className="space-y-6">
      {verificationBanner}
      <div className="overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-gradient-to-br from-[#fff5fb] via-white to-[#eef2ff] shadow-lg shadow-[#5a30421a]">
        <div
          className="h-36 w-full"
          style={{
            backgroundImage: company?.coverImageUrl
              ? `linear-gradient(120deg, rgba(90,48,66,0.75), rgba(255,255,255,0.7)), url(${company.coverImageUrl})`
              : "linear-gradient(120deg, #f472b6, #c084fc, #93c5fd)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="-mt-10 flex flex-wrap items-center justify-between gap-4 px-5 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-[var(--color-plum)] shadow-lg shadow-[#5a30423a]">
              {company?.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={company.logoUrl} alt={company.displayName ?? "Company"} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                (company?.displayName ?? "CO").slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--color-plum)" }}>
                Company
              </p>
              <p className="text-2xl font-semibold text-[#1f1422]">{company?.displayName ?? "Loading…"}</p>
              <p className="text-sm text-[#7a5d6b]">{company?.legalName ?? "Add legal name"}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#7a5d6b]">
                {company?.type ? (
                  <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[var(--color-plum)] shadow-sm shadow-[#5a304222]">
                    Type: {company.type}
                  </span>
                ) : null}
                {company?.complianceStatus ? (
                  <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[var(--color-plum)] shadow-sm shadow-[#5a304222]">
                    Compliance: {company.complianceStatus}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-plum)] bg-white px-5 py-2 text-sm font-semibold text-[var(--color-plum)] shadow-sm shadow-[#5a304233] transition hover:bg-[var(--color-plum)] hover:text-white"
            >
              {editing ? "Close editor" : "Edit profile"}
            </button>
          </div>
        </div>
        {error ? <p className="px-5 pb-3 text-sm font-semibold text-[#b91c1c]">{error}</p> : null}
        {success ? <p className="px-5 pb-3 text-sm font-semibold text-[#065f46]">{success}</p> : null}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 text-sm text-[#5c4451]">Loading company…</div>
      ) : company ? (
        <>
          <div className="space-y-5">
            <section className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-5 shadow-sm shadow-[#e7ddea]">
              <SectionHeader title="Profile overview" subtitle="Company" />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {companySummary.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4 shadow-sm shadow-[#5a30421a]">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[#2e1f2c]">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <section className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-5 shadow-sm shadow-[#e7ddea]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--color-plum)" }}>
                        Story
                      </p>
                      <h3 className="text-lg font-semibold text-[#2e1f2c]">About this company</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[#5c4451]">
                    {company.description?.length ? company.description : "Add a description to tell buyers who you are."}
                  </p>
                </section>

                <section className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-5 shadow-sm shadow-[#e7ddea]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--color-plum)" }}>
                        Contact
                      </p>
                      <h3 className="text-lg font-semibold text-[#2e1f2c]">Primary details</h3>
                    </div>
                  </div>
                  <dl className="mt-3 grid gap-3 md:grid-cols-2">
                    <ContactRow label="Email" value={company.contact?.email} />
                    <ContactRow label="Phone" value={company.contact?.phone} />
                    <ContactRow label="Website" value={company.contact?.website} isLink />
                  </dl>
                </section>
              </div>

              <div className="space-y-5">
                <section className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-5 shadow-sm shadow-[#e7ddea]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--color-plum)" }}>
                        Location
                      </p>
                      <h3 className="text-lg font-semibold text-[#2e1f2c]">Headquarters</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[#5c4451]">
                    {formatAddress(company.headquarters) || "Add a headquarters address."}
                  </p>
                  {company.locations && company.locations.length ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                        LOCATIONS
                      </p>
                      {company.locations.map((location, index) => (
                        <p key={`${location.line1}-${index}`} className="text-sm text-[#5c4451]">
                          {formatAddress(location)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-5 shadow-sm shadow-[#e7ddea]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--color-plum)" }}>
                        Presence
                      </p>
                      <h3 className="text-lg font-semibold text-[#2e1f2c]">Social links</h3>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-2 text-sm text-[#5c4451]">
                    <ContactRow label="LinkedIn" value={company.socialLinks?.linkedin} isLink />
                    <ContactRow label="Twitter" value={company.socialLinks?.twitter} isLink />
                    <ContactRow label="Instagram" value={company.socialLinks?.instagram} isLink />
                    <ContactRow label="YouTube" value={company.socialLinks?.youtube} isLink />
                  </dl>
                </section>
              </div>
            </div>
          </div>

          {editing ? (
            <section className="rounded-3xl border border-[var(--border-soft)] bg-white/95 p-5 shadow-sm shadow-[#e7ddea]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--color-plum)" }}>
                    Edit
                  </p>
                  <h3 className="text-lg font-semibold text-[#2e1f2c]">Update company profile</h3>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Display name" value={form.displayName} onChange={(value) => updateField("displayName", value)} />
                  <TextField label="Legal name" value={form.legalName} onChange={(value) => updateField("legalName", value)} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Type"
                    value={form.type}
                    options={BUSINESS_ACCOUNT_TYPES.map((type) => ({ label: type, value: type }))}
                    onChange={(value) => updateField("type", value)}
                  />
                  <SelectField
                    label="Size bucket"
                    value={form.sizeBucket}
                    options={SIZE_BUCKETS.map((size) => ({ label: size, value: size }))}
                    onChange={(value) => updateField("sizeBucket", value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Categories"
                    value={form.categories}
                    onChange={(value) => updateField("categories", value)}
                    helper="Comma separated (e.g. printing, manufacturing)"
                  />
                  <TextField
                    label="Founded at"
                    type="date"
                    value={form.foundedAt}
                    onChange={(value) => updateField("foundedAt", value)}
                  />
                </div>
                <TextField
                  label="Description"
                  value={form.description}
                  onChange={(value) => updateField("description", value)}
                  multiline
                  rows={4}
                  placeholder="Share a short overview to help buyers learn about you."
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Logo URL" value={form.logoUrl} onChange={(value) => updateField("logoUrl", value)} />
                  <TextField
                    label="Cover image URL"
                    value={form.coverImageUrl}
                    onChange={(value) => updateField("coverImageUrl", value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Email"
                    value={form.contact.email ?? ""}
                    onChange={(value) => updateNested<CompanyContact, keyof CompanyContact>("contact", "email", value)}
                  />
                  <TextField
                    label="Phone"
                    value={form.contact.phone ?? ""}
                    onChange={(value) => updateNested<CompanyContact, keyof CompanyContact>("contact", "phone", value)}
                  />
                </div>
                <TextField
                  label="Website"
                  value={form.contact.website ?? ""}
                  onChange={(value) => updateNested<CompanyContact, keyof CompanyContact>("contact", "website", value)}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Headquarters line 1"
                    value={form.headquarters.line1 ?? ""}
                    onChange={(value) => updateNested<CompanyAddress, keyof CompanyAddress>("headquarters", "line1", value)}
                  />
                  <TextField
                    label="Headquarters line 2"
                    value={form.headquarters.line2 ?? ""}
                    onChange={(value) => updateNested<CompanyAddress, keyof CompanyAddress>("headquarters", "line2", value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="City"
                    value={form.headquarters.city ?? ""}
                    onChange={(value) => updateNested<CompanyAddress, keyof CompanyAddress>("headquarters", "city", value)}
                  />
                  <TextField
                    label="State"
                    value={form.headquarters.state ?? ""}
                    onChange={(value) => updateNested<CompanyAddress, keyof CompanyAddress>("headquarters", "state", value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Postal code"
                    value={form.headquarters.postalCode ?? ""}
                    onChange={(value) =>
                      updateNested<CompanyAddress, keyof CompanyAddress>("headquarters", "postalCode", value)
                    }
                  />
                  <TextField
                    label="Country"
                    value={form.headquarters.country ?? ""}
                    onChange={(value) => updateNested<CompanyAddress, keyof CompanyAddress>("headquarters", "country", value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="LinkedIn"
                    value={form.socialLinks.linkedin ?? ""}
                    onChange={(value) => updateNested<CompanySocialLinks, keyof CompanySocialLinks>("socialLinks", "linkedin", value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Twitter"
                    value={form.socialLinks.twitter ?? ""}
                    onChange={(value) => updateNested<CompanySocialLinks, keyof CompanySocialLinks>("socialLinks", "twitter", value)}
                  />
                  <TextField
                    label="Instagram"
                    value={form.socialLinks.instagram ?? ""}
                    onChange={(value) =>
                      updateNested<CompanySocialLinks, keyof CompanySocialLinks>("socialLinks", "instagram", value)
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-full border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[#5a3042] disabled:opacity-60"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--color-plum)] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#5a304233] disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

const ContactRow = ({ label, value, isLink }: { label: string; value?: string; isLink?: boolean }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
      {label}
    </p>
    {value ? (
      isLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--color-plum)]">
          {value}
        </a>
      ) : (
        <p className="text-sm text-[#2e1f2c]">{value}</p>
      )
    ) : (
      <p className="text-sm text-[#b98b9e]">Not provided</p>
    )}
  </div>
);

const TextField = ({
  label,
  value,
  onChange,
  helper,
  multiline,
  rows = 2,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
  placeholder?: string;
}) => {
  const baseClasses = "mt-2 w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none";
  return (
    <label className="text-sm font-semibold text-[#2e1f2c]">
      {label}
      {multiline ? (
        <textarea
          className={`${baseClasses} border-[var(--border-soft)] bg-white`}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={`${baseClasses} border-[var(--border-soft)] bg-white`}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {helper ? <span className="mt-1 block text-xs text-[#b98b9e]">{helper}</span> : null}
    </label>
  );
};

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) => (
  <label className="text-sm font-semibold text-[#2e1f2c]">
    {label}
    <select
      className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-[#2e1f2c] focus:outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Select</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const formatAddress = (address?: CompanyAddress) => {
  if (!address) return "";
  const parts = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.join(", ");
};
