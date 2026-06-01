import { motion } from "framer-motion";

export type ServiceTypeMeta = {
  type: "machine_repair" | "worker" | "transport" | "advertisement";
  icon: string;
  label: string;
  subtitle: string;
  hint: string;
  accent: string;
  accentBg: string;
};

export const SERVICE_TYPES: ServiceTypeMeta[] = [
  {
    type: "machine_repair",
    icon: "🔧",
    label: "Machine Repair",
    subtitle: "On-site & remote maintenance",
    hint: "Book a certified engineer for breakdown, preventive maintenance, or warranty claims.",
    accent: "#1E40AF",
    accentBg: "#DBEAFE",
  },
  {
    type: "worker",
    icon: "👷",
    label: "Worker Recruitment",
    subtitle: "Skilled & unskilled workforce",
    hint: "Find temporary, contract, or permanent workers with verified certifications.",
    accent: "#15803D",
    accentBg: "#DCFCE7",
  },
  {
    type: "transport",
    icon: "🚚",
    label: "Logistics & Transport",
    subtitle: "Freight & delivery solutions",
    hint: "Arrange trucking, rail, or courier for raw materials and finished goods.",
    accent: "#92400E",
    accentBg: "#FEF3C7",
  },
  {
    type: "advertisement",
    icon: "📢",
    label: "Advertisement",
    subtitle: "Promote your products & brand",
    hint: "Boost product visibility with targeted ads across the manufacturing marketplace.",
    accent: "#5B21B6",
    accentBg: "#EDE9FE",
  },
];

export const getServiceTypeMeta = (type: string): ServiceTypeMeta =>
  SERVICE_TYPES.find((s) => s.type === type) ?? SERVICE_TYPES[0];

type ServiceTypeCardProps = {
  meta: ServiceTypeMeta;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onStart?: () => void;
};

export const ServiceTypeCard = ({ meta, selected, compact, onClick, onStart }: ServiceTypeCardProps) => {
  if (compact) {
    return (
      <motion.button
        type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all"
        style={{
          border: selected ? `1.5px solid ${meta.accent}` : "1px solid var(--border)",
          backgroundColor: selected ? meta.accentBg : "var(--surface)",
        }}
      >
        <span className="text-base">{meta.icon}</span>
        <span className="text-xs font-semibold" style={{ color: selected ? meta.accent : "var(--foreground)" }}>
          {meta.label}
        </span>
        {selected && (
          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white font-bold"
            style={{ backgroundColor: meta.accent }}>✓</span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--shadow-lg)" }}
      className="flex flex-col overflow-hidden rounded-3xl transition-shadow"
      style={{
        border: selected ? `2px solid ${meta.accent}` : "1px solid var(--border)",
        backgroundColor: "var(--card)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="h-1" style={{ backgroundColor: meta.accent }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{ backgroundColor: meta.accentBg }}
          >{meta.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight" style={{ color: "var(--foreground)" }}>{meta.label}</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{meta.subtitle}</p>
          </div>
        </div>
        <div className="mt-3 flex-1 rounded-xl p-3 text-xs leading-relaxed" style={{ backgroundColor: "var(--background)", color: "var(--medium-gray)" }}>
          {meta.hint}
        </div>
        {onStart && (
          <button
            type="button" onClick={onStart}
            className="mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: meta.accent, boxShadow: `0 4px 12px ${meta.accent}33` }}
          >
            Start request →
          </button>
        )}
      </div>
    </motion.div>
  );
};
