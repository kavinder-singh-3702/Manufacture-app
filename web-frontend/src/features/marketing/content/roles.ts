import type { FaqEntry } from "./industries";

export type RoleContent = {
  /** URL slug — matches the app/[slug]/page.tsx folder name. */
  slug: string;
  title: string;
  /** Short noun phrase for metadata titles, e.g. "for manufacturers". */
  audienceLabel: string;
  intro: string;
  /** What this role actually does on ARVANN — real, shipped functionality only, never invented adoption numbers. */
  bullets: { title: string; detail: string }[];
  faqs: FaqEntry[];
};

/**
 * Hand-written content for the 8 role landing pages (doc pages 12-19):
 * manufacturers, suppliers, traders, wholesalers, distributors, importers,
 * exporters, buyers. Each maps to real ARVANN functionality — RFQs,
 * verification, accounting, in-house catalogue — not invented statistics
 * (see HeroEntry.tsx's own comment about the fabricated numbers it replaced;
 * these pages hold the same bar).
 */
export const ROLE_CONTENT: readonly RoleContent[] = [
  {
    slug: "manufacturers",
    title: "Manufacturers",
    audienceLabel: "for manufacturers",
    intro:
      "ARVANN gives Indian manufacturers a public storefront and a back-office workspace in one place. List your products across 20+ industry categories, receive RFQs and quote requests directly from buyers, and manage compliance verification, inventory, and GST accounting without switching tools.",
    bullets: [
      { title: "Public product listings", detail: "Your products appear on category and industry pages, with SKU, pricing, and stock status visible to buyers searching ARVANN." },
      { title: "Direct RFQs & quotes", detail: "Buyers request quotes straight from your listing; respond and negotiate in one thread instead of scattered email." },
      { title: "Compliance verification", detail: "Submit your documents once — your verification badge then follows every listing and your seller profile." },
      { title: "Accounting & GST", detail: "Generate GST summaries, P&L, and party ledgers from your ARVANN orders without a separate accounting tool." },
    ],
    faqs: [
      { question: "How do I list my products on ARVANN?", answer: "Create a workspace, add your company profile, then add products with pricing, stock, and images from your dashboard's Products section." },
      { question: "Is there a fee to list as a manufacturer?", answer: "Check the current pricing on the signup flow — this varies and is best confirmed there rather than assumed from marketing copy." },
      { question: "How does buyer verification work?", answer: "Submit your business documents through the verification flow; once reviewed, your compliance badge appears on your public seller profile." },
      { question: "Can I manage multiple factories/companies from one account?", answer: "Yes — ARVANN supports switching between multiple companies from a single user account." },
    ],
  },
  {
    slug: "suppliers",
    title: "Suppliers",
    audienceLabel: "for suppliers",
    intro:
      "Suppliers use ARVANN to reach buyers actively sourcing across specific industries and sub-categories, without needing their own e-commerce storefront. List your catalogue, respond to RFQs, and let ARVANN's category and industry pages bring the right buyer to you.",
    bullets: [
      { title: "Category-targeted discovery", detail: "Your listings surface on the specific industry and sub-category pages buyers actually search, not just a generic catalogue." },
      { title: "RFQ inbox", detail: "Receive and respond to buyer quote requests in one place, with pricing and MOQ negotiated per conversation." },
      { title: "Inventory sync", detail: "Track available quantity and stock status so buyers see accurate availability, not a stale listing." },
      { title: "Verified profile", detail: "A completed compliance profile signals trust to buyers comparing multiple suppliers." },
    ],
    faqs: [
      { question: "What's the difference between a supplier and manufacturer account?", answer: "Both use the same listing and RFQ tools — the distinction is about your business type, which you set when creating your company profile." },
      { question: "Can I list products I source from multiple manufacturers?", answer: "Yes, as long as you accurately represent your business relationship to the buyer — ARVANN doesn't restrict trading/reselling listings." },
      { question: "How do buyers find my listings?", answer: "Through category/industry browsing, search, and direct RFQ responses — accurate category and sub-category tagging on your products matters for discoverability." },
    ],
  },
  {
    slug: "traders",
    title: "Traders",
    audienceLabel: "for traders",
    intro:
      "Traders on ARVANN buy and resell across industries without owning manufacturing capacity — the platform's RFQ and quote tools work the same way whether you're sourcing to fulfil a buyer order or listing stock you already hold.",
    bullets: [
      { title: "List stock you hold", detail: "Post available inventory for buyers to find and quote, the same as a manufacturer would." },
      { title: "Source via RFQ", detail: "Use the marketplace to find manufacturers for products you need to fulfil your own buyer commitments." },
      { title: "One workspace, two directions", detail: "Manage both your buying and selling activity from the same ARVANN account." },
    ],
    faqs: [
      { question: "Can I both buy and sell on ARVANN as a trader?", answer: "Yes — the same account and dashboard support both sourcing (as a buyer) and listing (as a seller)." },
      { question: "Do I need a manufacturing license to register as a trader?", answer: "No — trading/reselling accounts don't require manufacturing licenses, though standard business registration and compliance documents still apply." },
    ],
  },
  {
    slug: "wholesalers",
    title: "Wholesalers",
    audienceLabel: "for wholesalers",
    intro:
      "Wholesalers use ARVANN to move bulk volume to retail and institutional buyers. List bulk-quantity pricing and MOQs on your products, and let buyers filter and compare across your catalogue and competitors' on the same category pages.",
    bullets: [
      { title: "Bulk pricing & MOQ", detail: "Specify minimum order quantities and volume pricing directly on your product listings." },
      { title: "Institutional buyer reach", detail: "Category and industry pages surface your listings to buyers actively comparing bulk suppliers." },
      { title: "Order & inventory tracking", detail: "Track fulfilment against your available stock as orders come in through the platform." },
    ],
    faqs: [
      { question: "Can I set different pricing tiers for different order volumes?", answer: "Specify your MOQ and pricing per product; volume-tier negotiation for larger orders typically happens through the RFQ/quote conversation." },
      { question: "How do buyers compare my prices to other wholesalers?", answer: "Buyers can view multiple listings within the same category or sub-category page, so accurate, competitive pricing matters for conversion." },
    ],
  },
  {
    slug: "distributors",
    title: "Distributors",
    audienceLabel: "for distributors",
    intro:
      "Distributors on ARVANN manage relationships between manufacturers and downstream retail or institutional buyers. List the brands and product lines you distribute, and use the platform's compliance and inventory tools to operate as a verified, trusted link in the supply chain.",
    bullets: [
      { title: "Represent multiple product lines", detail: "List products across the manufacturers/brands you distribute, tagged to the correct industry categories." },
      { title: "Verified distributor profile", detail: "Compliance verification helps buyers trust a distributor relationship they can't directly audit with the original manufacturer." },
      { title: "Inventory & fulfilment tracking", detail: "Track stock and fulfilment across the distribution relationships you manage." },
    ],
    faqs: [
      { question: "Can I list products on behalf of a manufacturer I distribute for?", answer: "Yes, as long as your listing accurately represents the product and your role — buyers should be able to tell they're dealing with a distributor." },
      { question: "Do I need separate accounts for each manufacturer I represent?", answer: "No — manage all your distributed product lines from a single company workspace." },
    ],
  },
  {
    slug: "importers",
    title: "Importers",
    audienceLabel: "for importers",
    intro:
      "Importers use ARVANN to source from Indian manufacturers for international resale, and to list imported goods for domestic Indian buyers. Compliance verification and direct RFQ conversations help establish trust across a cross-border transaction.",
    bullets: [
      { title: "Source from verified manufacturers", detail: "Use RFQs and industry pages to find Indian manufacturers for products you intend to import and resell abroad." },
      { title: "List imported goods domestically", detail: "If you import into India for domestic resale, list those products for Indian buyers the same way a manufacturer would." },
      { title: "Compliance-first discovery", detail: "Buyers and sellers on cross-border deals lean more heavily on verification status — keep your compliance documents current." },
    ],
    faqs: [
      { question: "Does ARVANN handle customs/export documentation?", answer: "No — ARVANN connects buyers and sellers and supports RFQ/quote conversations; customs, export licensing, and shipping documentation are handled directly between the parties." },
      { question: "Can international buyers use ARVANN to source from India?", answer: "Yes — international buyers can browse and request quotes from Indian manufacturers and suppliers listed on the marketplace." },
    ],
  },
  {
    slug: "exporters",
    title: "Exporters",
    audienceLabel: "for exporters",
    intro:
      "Exporters use ARVANN to reach international buyers sourcing from India. List your export-ready products with compliance and certification details visible, and manage buyer conversations and quotes through the same RFQ tools used for domestic sales.",
    bullets: [
      { title: "Reach international buyers", detail: "Your listings are visible to any buyer browsing ARVANN's public marketplace, not just domestic ones." },
      { title: "Certification visibility", detail: "Compliance status and product specifications help international buyers evaluate your listing without an in-person visit." },
      { title: "RFQ-based negotiation", detail: "Handle export quote requests, quantities, and terms through the same RFQ/quote thread as any other buyer conversation." },
    ],
    faqs: [
      { question: "Do I need export licensing to list products for export?", answer: "Yes — standard export licensing (like an IEC code) and any product-specific export approvals remain your responsibility; ARVANN doesn't verify or replace them." },
      { question: "Can I specify export-only pricing separate from domestic pricing?", answer: "List products with the terms relevant to your export business; use the RFQ conversation to clarify export-specific pricing or terms with a buyer." },
    ],
  },
  {
    slug: "buyers",
    title: "Buyers",
    audienceLabel: "for buyers",
    intro:
      "Buyers use ARVANN to source directly from verified Indian manufacturers, suppliers, traders, and exporters across 20+ industries — browsing by category, comparing listings, and requesting quotes without needing an existing supplier relationship.",
    bullets: [
      { title: "Browse by industry & category", detail: "Filter listings by industry, sub-category, price, stock status, and location to narrow down the right supplier." },
      { title: "Compare verified sellers", detail: "Compliance status is visible on every seller profile, so you can factor verification into your shortlist." },
      { title: "Request quotes directly", detail: "Send an RFQ from any product listing instead of cold-emailing a company's general contact address." },
      { title: "Track orders in one place", detail: "Once you're buying, manage orders, quotes, and supplier chat from your ARVANN dashboard." },
    ],
    faqs: [
      { question: "Do I need an account to browse products?", answer: "No — browsing the marketplace, industries, and product pages doesn't require an account. Signing in is needed to request quotes, chat with sellers, or reveal contact details." },
      { question: "How do I know a seller is legitimate?", answer: "Check the compliance status shown on their seller profile, and use it as a starting point for your own due diligence — it reflects ARVANN's verification process, not a guarantee." },
      { question: "Can I request quotes from multiple sellers at once?", answer: "You can send RFQs to multiple sellers individually from their respective product listings and compare responses in your dashboard." },
    ],
  },
];

export const getRoleContent = (slug: string): RoleContent | undefined =>
  ROLE_CONTENT.find((r) => r.slug === slug);
