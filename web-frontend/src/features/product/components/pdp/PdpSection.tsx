"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
  /** DOM id — the anchor target for SectionNav's scroll-spy links. */
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  /** Trailing slot in the header row, e.g. a "View all" link. */
  action?: ReactNode;
};

/**
 * Titled card wrapper shared by every long-form PDP module (Product Details,
 * Company Details, Reviews, Explore More). Owns only layout chrome — content
 * and data come from the caller.
 */
export const PdpSection = ({ id, title, subtitle, icon, children, action }: Props) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.3 }}
    className="scroll-mt-32 rounded-2xl p-5 sm:p-6"
    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold" style={{ color: "var(--foreground)" }}>
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </motion.section>
);
