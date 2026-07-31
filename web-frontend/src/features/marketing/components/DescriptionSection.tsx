import { Section, Card } from "@/src/components/ui/Surface";

// Real platform capabilities — each maps to a shipped feature (see the
// dashboard route table), replacing a prior version that illustrated fake
// milestones ("Day 1 / Day 4 / Day 9 / Day 14") and invented adoption
// metrics with no backing data.
const capabilities = [
  { icon: "📋", title: "RFQs & quotes", detail: "Route requests to verified suppliers and negotiate in one thread." },
  { icon: "🛡️", title: "Compliance verification", detail: "Upload documents once; the trust badge follows every listing." },
  { icon: "📊", title: "Accounting & GST", detail: "P&L, GST summaries, and party ledgers generated from your orders." },
  { icon: "💬", title: "Supplier chat", detail: "Message sellers directly from a product page — no email back-and-forth." },
] as const;

export const DescriptionSection = () => (
  <Section title="Built for manufacturing teams">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {capabilities.map((item) => (
        <Card key={item.title}>
          <span className="text-2xl">{item.icon}</span>
          <h3 className="mt-3 text-base font-bold" style={{ color: "var(--foreground)" }}>{item.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>{item.detail}</p>
        </Card>
      ))}
    </div>
  </Section>
);
