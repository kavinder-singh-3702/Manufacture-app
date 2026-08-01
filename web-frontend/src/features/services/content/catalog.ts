/**
 * Service-type display metadata — the ONE place a catalog card, a request
 * form header, and the detail page all read from. Ported from the mobile
 * app's `services.constants.ts` (copy) + `services.palette.ts` (the unified
 * blue-ramp gradient identity, cyan → sky → royal → indigo) so both surfaces
 * show the same titles and colors.
 *
 * Previously this lived hardcoded inside `ServiceTypeCard.tsx` with
 * completely different labels ("Worker Recruitment" vs the app's "Expert
 * Workforce") and independently-invented accent hexes — this file replaces
 * that copy.
 */

import type { ServiceType } from "@/src/constants/services";

export type ServiceCatalogMeta = {
  type: ServiceType;
  emoji: string;
  title: string;
  subtitle: string;
  /** Short "what's required" note shown at the top of the request form. */
  quickHint: string;
  /** Longer descriptive sentence used in card bodies and the detail page. */
  hint: string;
  /** Bright accent used for dots, borders, and small UI chrome. */
  accent: string;
  /** Diagonal gradient used as the card background. */
  gradient: readonly [string, string];
  /** Tinted shadow that gives each card a colored glow. */
  glow: string;
};

export const SERVICE_CATALOG: Record<ServiceType, ServiceCatalogMeta> = {
  machine_repair: {
    type: "machine_repair",
    emoji: "🔧",
    title: "Machine Repair",
    subtitle: "Diagnostics, OEM-safe fixes, planned downtime",
    quickHint: "Machine type and issue summary required",
    hint: "Book a certified engineer for breakdown, preventive maintenance, or warranty claims.",
    accent: "#22D3EE",
    gradient: ["#0E7490", "#0B3D4E"],
    glow: "rgba(34, 211, 238, 0.35)",
  },
  worker: {
    type: "worker",
    emoji: "👷",
    title: "Expert Workforce",
    subtitle: "Technicians, operators, supervisors",
    quickHint: "Industry and headcount required",
    hint: "Find temporary, contract, or permanent workers with verified certifications.",
    accent: "#38BDF8",
    gradient: ["#0369A1", "#0B2C44"],
    glow: "rgba(56, 189, 248, 0.35)",
  },
  transport: {
    type: "transport",
    emoji: "🚚",
    title: "Transport & Fleet",
    subtitle: "Road, rail, air and sea coordination",
    quickHint: "Pickup and drop city required",
    hint: "Arrange trucking, rail, or courier for raw materials and finished goods.",
    accent: "#60A5FA",
    gradient: ["#1E40AF", "#0F1F4D"],
    glow: "rgba(96, 165, 250, 0.35)",
  },
  advertisement: {
    type: "advertisement",
    emoji: "📢",
    title: "Advertisement",
    subtitle: "Promote your listed products to targeted buyers",
    quickHint: "Pick product and targeting goal",
    hint: "Boost product visibility with targeted ads across the marketplace.",
    accent: "#818CF8",
    gradient: ["#1E3A8A", "#0B1437"],
    glow: "rgba(129, 140, 248, 0.35)",
  },
};

export const SERVICE_CATALOG_LIST: ServiceCatalogMeta[] = Object.values(SERVICE_CATALOG);

export const getServiceCatalogMeta = (type: string): ServiceCatalogMeta =>
  SERVICE_CATALOG[type as ServiceType] ?? SERVICE_CATALOG.machine_repair;

/**
 * "Start your own business" — ported verbatim from the app's BUSINESS_ACCENT
 * (services.palette.ts) and Services-tab copy. Not a ServiceType: it is a
 * separate business-setup domain (own model/endpoint), rendered as a 5th
 * catalog card that routes to /dashboard/business-setup instead of the
 * request form. Shares the same card shape as a real service via
 * `ServiceTypeCard`, so this is data, not a second component.
 */
export const BUSINESS_CATALOG_META: Omit<ServiceCatalogMeta, "type" | "quickHint"> & { href: string } = {
  emoji: "🚀",
  title: "Start your own business",
  subtitle: "Tell us your idea and get launch support from our team.",
  hint: "From GST registration to factory setup — our concierge team handles everything end-to-end.",
  accent: "#A5B4FC",
  gradient: ["#312E81", "#0F0C45"],
  glow: "rgba(165, 180, 252, 0.35)",
  href: "/dashboard/business-setup",
};
