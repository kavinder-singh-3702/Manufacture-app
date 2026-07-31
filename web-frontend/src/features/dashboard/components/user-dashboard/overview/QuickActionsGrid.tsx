"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const QUICK_ACTIONS = [
  { label: "Inventory",  icon: "📦", href: "/dashboard/inventory",  gradient: "from-[#148DB2] to-[#1DA8D4]", shadow: "rgba(20,141,178,0.30)" },
  { label: "Products",   icon: "🏷️", href: "/dashboard/products",   gradient: "from-[#D5616D] to-[#E87B85]", shadow: "rgba(213,97,109,0.30)" },
  { label: "Quotes",     icon: "📋", href: "/dashboard/quotes",     gradient: "from-[#7C3AED] to-[#9D5CF0]", shadow: "rgba(124,58,237,0.25)" },
  { label: "Services",   icon: "🛠️", href: "/dashboard/services",   gradient: "from-[#059669] to-[#10B981]", shadow: "rgba(5,150,105,0.25)" },
  { label: "Chat",       icon: "💬", href: "/dashboard/chat",       gradient: "from-[#D97706] to-[#F59E0B]", shadow: "rgba(217,119,6,0.25)" },
  { label: "Accounting", icon: "📊", href: "/dashboard/accounting", gradient: "from-[#4F46E5] to-[#6366F1]", shadow: "rgba(79,70,229,0.25)" },
] as const;

/** One-tap shortcuts to the modules a seller uses most — moved out of the old monolithic OverviewSection. */
export const QuickActionsGrid = () => (
  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
    {QUICK_ACTIONS.map((action, i) => (
      <motion.div
        key={action.label}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 + i * 0.03 }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.96 }}
      >
        <Link
          href={action.href}
          className="relative flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all duration-200 sm:gap-2.5 sm:p-4"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 24px ${action.shadow}`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-sm)"; }}
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-xl sm:h-12 sm:w-12 sm:text-2xl ${action.gradient}`}
            style={{ boxShadow: `0 4px 10px ${action.shadow}` }}
          >
            {action.icon}
          </span>
          <span className="text-[11px] font-semibold sm:text-xs" style={{ color: "var(--foreground)" }}>{action.label}</span>
        </Link>
      </motion.div>
    ))}
  </div>
);
