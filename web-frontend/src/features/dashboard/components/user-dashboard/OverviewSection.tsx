import { motion } from "framer-motion";
import { SectionHeader } from "./shared";

const workspaceShortcuts = [
  { title: "RFQ tracker", hint: "6 open threads" },
  { title: "Compliance vault", hint: "Updated 3 hrs ago" },
  { title: "Team roster", hint: "12 members" },
  { title: "Document signatures", hint: "2 pending" },
];

const upcomingSchedules = [
  { title: "Weekly ops standup", time: "Today · 15:30 IST", location: "Circuit HQ" },
  { title: "Customs documentation review", time: "Tomorrow · 11:00 IST", location: "Secure video room" },
  { title: "Supplier credit check", time: "Fri · 14:00 IST", location: "Shared notebook" },
];

export const OverviewSection = ({ cards }: { cards: { label: string; value: string; detail: string }[] }) => (
  <div className="space-y-6">
    <SectionHeader title="Today&apos;s overview" subtitle="Snapshot" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <motion.div
          key={card.label}
          className="rounded-3xl border border-[var(--border-soft)] bg-white/85 p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
            {card.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-[#2e1f2c]">{card.value}</p>
          <p className="text-sm text-[#7a5d6b]">{card.detail}</p>
        </motion.div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <motion.div
        className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SectionHeader title="Workspace shortcuts" subtitle="Navigate" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {workspaceShortcuts.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-[#2e1f2c]">{item.title}</p>
              <p className="text-xs text-[#7a5d6b]">{item.hint}</p>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <SectionHeader title="Upcoming" subtitle="Schedule" />
        <div className="mt-4 space-y-3">
          {upcomingSchedules.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--border-soft)] p-3">
              <p className="text-sm font-semibold text-[#2e1f2c]">{item.title}</p>
              <p className="text-xs text-[#7a5d6b]">{item.time}</p>
              <p className="text-xs text-[#b98b9e]">{item.location}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
);
