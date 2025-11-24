import type { ActivityEvent } from "@/src/types/activity";
import type { AuthUser } from "@/src/types/auth";

export type ProfileFormState = ReturnType<typeof createProfileFormState>;
export type VerificationPillVariant = "verified" | "pending" | "warning";
export type ProfileVerificationState = { label: string; variant: VerificationPillVariant };

export const isLikelyObjectId = (value?: string | null) => !!value && /^[a-f0-9]{24}$/i.test(value);

export const resolveCompanyLabel = (user: AuthUser, resolvedActiveName?: string) => {
  if (resolvedActiveName) return resolvedActiveName;
  if (user.activeCompany && !isLikelyObjectId(user.activeCompany)) return user.activeCompany;
  const namedCompany = user.companies?.find((company) => company && !isLikelyObjectId(company));
  return namedCompany ?? user.displayName ?? user.email ?? "Your workspace";
};

export const buildInitials = (value?: string) => {
  if (!value) return "MC";
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "MC";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const formatCategory = (category: string) => category.charAt(0).toUpperCase() + category.slice(1);

export const activityBadgeStyles: Record<string, string> = {
  auth: "bg-[var(--color-peach)] text-[var(--color-plum)]",
  user: "bg-[#eef2ff] text-[#4338ca]",
  company: "bg-[#ecfdf3] text-[#166534]",
  verification: "bg-[#fff4e5] text-[#b45309]",
};

export const formatRelativeTime = (value: string) => {
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

export const buildActivityMetaLine = (activity: ActivityEvent) => {
  const parts: string[] = [];
  const relative = formatRelativeTime(activity.createdAt);
  if (relative) parts.push(relative);
  if (activity.companyName) parts.push(activity.companyName);
  const method = typeof activity.meta?.method === "string" ? (activity.meta.method as string) : undefined;
  if (method) parts.push(method);
  return parts.join(" • ");
};

export const createProfileFormState = (user: AuthUser) => ({
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

export const normalizeProfileForm = (form: ProfileFormState): ProfileFormState => {
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

export const buildAddressPayload = (form: ProfileFormState) => {
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

export const buildSocialLinksPayload = (form: ProfileFormState) => {
  const payload = cleanObject({
    website: form.website || undefined,
    linkedin: form.linkedin || undefined,
    twitter: form.twitter || undefined,
    github: form.github || undefined,
  });
  return Object.keys(payload).length ? payload : undefined;
};

export const buildActivityTags = (value: string) => {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
};

export const cleanObject = <T extends Record<string, unknown>>(obj: T) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as Partial<T>);
};
