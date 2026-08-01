import type { FaqEntry } from "./industries";

export type ServiceContent = {
  /** URL slug — app/services/[service]/page.tsx. */
  slug: string;
  title: string;
  icon: string;
  intro: string;
  bullets: { title: string; detail: string }[];
  faqs: FaqEntry[];
};

/**
 * Hand-written content for the 7 service landing pages (doc pages 20-27:
 * Services, Accounting, Inventory, Verification, Advertising, Transport,
 * Workers, Business Setup). Every one of these maps to a real, shipped
 * dashboard feature — see src/features/accounting, src/features/inventory,
 * src/features/admin-verification, src/features/ads, and the "worker" /
 * "transport" service-request types in src/features/services/components —
 * so this describes real functionality, not aspirational product copy.
 */
export const SERVICE_CONTENT: readonly ServiceContent[] = [
  {
    slug: "accounting",
    title: "Accounting & GST",
    icon: "📊",
    intro:
      "ARVANN's built-in accounting turns your marketplace orders and manual entries into GST-ready books — no separate accounting software needed. Generate profit & loss statements, GST summaries, and party (customer/supplier) ledgers directly from the same workspace you use to manage orders and inventory.",
    bullets: [
      { title: "GST summaries", detail: "Sales and purchase GST rolled up automatically from your recorded transactions." },
      { title: "P&L and ledgers", detail: "Profit & loss and party-wise ledgers generated from your accounting vouchers and orders." },
      { title: "Vouchers & journal entries", detail: "Record sales, purchase, payment, and journal vouchers with a proper double-entry ledger underneath." },
    ],
    faqs: [
      { question: "Does ARVANN's accounting replace Tally or similar software?", answer: "For many small manufacturers it can — it covers vouchers, ledgers, GST summaries, and P&L. Whether it fully replaces your existing setup depends on your business's specific reporting needs." },
      { question: "Is accounting tied to marketplace orders only, or can I record other transactions?", answer: "You can record manual vouchers (sales, purchase, payment, journal) independent of marketplace orders, not just transactions that happened through ARVANN." },
    ],
  },
  {
    slug: "inventory",
    title: "Inventory Management",
    icon: "📦",
    intro:
      "Track stock levels, incoming and outgoing movements, and low-stock alerts for both your marketplace-listed products and internal-only inventory items — raw materials or work-in-progress you don't sell directly — from one dashboard.",
    bullets: [
      { title: "Stock movements", detail: "Record stock in/out movements with a running balance, not just a static quantity field." },
      { title: "Low-stock signals", detail: "Set a minimum stock threshold per product so you know before you run out, not after." },
      { title: "Internal inventory", detail: "Track raw materials and internal items that never go on the public marketplace, separate from your sellable product catalogue." },
    ],
    faqs: [
      { question: "Can I track inventory that isn't listed on the marketplace?", answer: "Yes — internal inventory items are tracked separately from your public product listings, for raw materials or components you use but don't sell directly." },
      { question: "Does inventory sync automatically with marketplace orders?", answer: "Yes, an order against a listed product moves its stock accordingly, so your listed availability stays accurate." },
    ],
  },
  {
    slug: "verification",
    title: "Business Verification",
    icon: "🛡️",
    intro:
      "Submit your business and compliance documents once through ARVANN's verification flow. Once reviewed, your compliance status appears on your public seller profile and every product listing, giving buyers a signal they can factor into their sourcing decision.",
    bullets: [
      { title: "One-time document submission", detail: "Upload your business documents once — the resulting status follows your company profile everywhere it appears." },
      { title: "Visible trust signal", detail: "Compliance status shows on your seller profile and product listings, visible to any buyer evaluating your business." },
      { title: "Re-verification on request", detail: "Admins may request updated documents if something needs to be re-confirmed." },
    ],
    faqs: [
      { question: "What documents does verification require?", answer: "This depends on your business type and is specified in the verification flow itself in your dashboard — check there for the current requirements." },
      { question: "How long does verification take?", answer: "Review time varies by submission volume and completeness of your documents — submitting complete, legible documents up front is the best way to avoid delays." },
      { question: "Is verification mandatory to sell on ARVANN?", answer: "Check the current requirement in your dashboard's verification section — regardless, a verified badge is a meaningful trust signal to buyers even where not strictly required." },
    ],
  },
  {
    slug: "advertising",
    title: "Advertising",
    icon: "📢",
    intro:
      "Promote your products beyond organic search and category browsing with ARVANN's ad placements — sponsored rail cards on the homepage and banner placements buyers see while browsing the marketplace.",
    bullets: [
      { title: "Sponsored placements", detail: "Get featured in the homepage's sponsored rail and category-page banners, seen by buyers browsing the marketplace." },
      { title: "Campaign dashboard", detail: "Manage your ad campaigns, budget, and placements from your ARVANN dashboard." },
      { title: "Performance visibility", detail: "See how your campaigns are performing directly in the ad studio." },
    ],
    faqs: [
      { question: "How do I start advertising my products?", answer: "Open the Ads section in your dashboard to create a campaign and choose a placement." },
      { question: "What ad placements are available?", answer: "Placements include the homepage sponsored rail and category-page banners — available options are shown when you create a campaign." },
    ],
  },
  {
    slug: "transport",
    title: "Logistics & Transport",
    icon: "🚚",
    intro:
      "Arrange trucking, rail, or courier logistics for moving raw materials and finished goods through ARVANN's service-request flow — request transport the same way you'd request any other service, without needing your own logistics contacts.",
    bullets: [
      { title: "Freight & delivery requests", detail: "Submit a transport request for moving materials or finished goods, and get matched with logistics providers." },
      { title: "Multiple modes", detail: "Cover trucking, rail, or courier depending on your shipment's size and urgency." },
    ],
    faqs: [
      { question: "How do I request transport for a shipment?", answer: "From your dashboard's Services section, submit a transport service request with your shipment details." },
      { question: "Is transport arranged automatically with every order?", answer: "No — transport is a separate service request, not an automatic part of every marketplace order. Request it when you need logistics support." },
    ],
  },
  {
    slug: "workers",
    title: "Worker Recruitment",
    icon: "👷",
    intro:
      "Find temporary, contract, or permanent workers with verified certifications through ARVANN's worker-recruitment service request — useful for manufacturers scaling production up or down without maintaining a permanent HR/recruitment function.",
    bullets: [
      { title: "Skilled & unskilled workforce", detail: "Request workers across skill levels depending on your production needs." },
      { title: "Flexible engagement", detail: "Covers temporary, contract, and permanent placement, not just one hiring model." },
      { title: "Verified certifications", detail: "Worker certifications are part of the matching process, relevant for roles requiring specific safety or skill credentials." },
    ],
    faqs: [
      { question: "Can I request workers for a short-term production spike?", answer: "Yes — temporary and contract placements are supported alongside permanent hiring." },
      { question: "How do I submit a worker request?", answer: "From your dashboard's Services section, submit a worker-recruitment request specifying your requirement." },
    ],
  },
  {
    slug: "business-setup",
    title: "Business Setup",
    icon: "🏢",
    intro:
      "If you're formalizing a manufacturing business — registration, licensing, or initial compliance setup — ARVANN's business-setup service request connects you with the support needed to get your company profile and compliance documentation in order from day one.",
    bullets: [
      { title: "Guided setup request", detail: "Submit a business-setup request describing what you need help formalizing." },
      { title: "Feeds into verification", detail: "A properly set-up business profile is the foundation for a smooth verification process afterward." },
    ],
    faqs: [
      { question: "Is business-setup support only for brand-new businesses?", answer: "It's most useful for businesses formalizing or expanding, but existing businesses tightening up their compliance documentation can request it too." },
      { question: "How do I request business-setup support?", answer: "From your dashboard's Business Setup section, submit a request describing what you need." },
    ],
  },
];

export const getServiceContent = (slug: string): ServiceContent | undefined =>
  SERVICE_CONTENT.find((s) => s.slug === slug);
