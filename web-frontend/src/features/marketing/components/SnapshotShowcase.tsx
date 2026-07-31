import { Section, Card } from "@/src/components/ui/Surface";

// Replaces a prior mock "live dashboard" section that fabricated supplier
// names, on-time-shipment percentages, and a testimonial attributed to a
// named person who doesn't exist — the same invented-data problem the hero
// numbers had, just deeper in the page. This is the real, three-step flow
// instead, consolidated with DescriptionSection so the page isn't carrying
// two overlapping mock-dashboard blocks (minimal > redundant).
const steps = [
  { step: "01", title: "Discover", detail: "Browse verified manufacturers by category or search a product directly." },
  { step: "02", title: "Request a quote", detail: "Send an RFQ or message the seller — pricing and terms in one thread." },
  { step: "03", title: "Track & pay", detail: "Confirm the order, track it to delivery, and settle through the ledger." },
] as const;

export const SnapshotShowcase = () => (
  <Section title="How it works">
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map((item) => (
        <Card key={item.step}>
          <span className="text-xs font-bold tracking-wider" style={{ color: "var(--primary)" }}>{item.step}</span>
          <h3 className="mt-2 text-base font-bold" style={{ color: "var(--foreground)" }}>{item.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>{item.detail}</p>
        </Card>
      ))}
    </div>
  </Section>
);
