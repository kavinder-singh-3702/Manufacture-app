import type { ProductSort } from "@/src/types/product";

type SortValue = ProductSort | "";

const OPTIONS: { value: SortValue; label: string }[] = [
  { value: "", label: "Relevance" },
  { value: "createdAt:desc", label: "Newest first" },
  { value: "ratingDesc", label: "Top rated" },
  { value: "priceAsc", label: "Price: low → high" },
  { value: "priceDesc", label: "Price: high → low" },
];

type Props = { value: SortValue; onChange: (value: SortValue) => void };

export const SortSelect = ({ value, onChange }: Props) => (
  <select value={value} onChange={(e) => onChange(e.target.value as SortValue)}
    className="rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
    style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
    {OPTIONS.map((opt) => (
      <option key={opt.value || "relevance"} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);
