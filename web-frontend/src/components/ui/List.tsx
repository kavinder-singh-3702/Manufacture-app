"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { type ReactNode } from "react";

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.2 },
  },
};

const tableRowVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// ============================================
// ANIMATED LIST
// ============================================

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedList = ({ children, className = "" }: AnimatedListProps) => {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-2 ${className}`}
    >
      {children}
    </motion.ul>
  );
};

// ============================================
// ANIMATED LIST ITEM
// ============================================

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const AnimatedListItem = ({
  children,
  className = "",
  onClick,
  hoverable = true,
}: AnimatedListItemProps) => {
  return (
    <motion.li
      variants={itemVariants}
      layout
      whileHover={hoverable ? { scale: 1.01, x: 4 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`
        rounded-xl p-4 transition-colors
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border-soft)",
      }}
    >
      {children}
    </motion.li>
  );
};

// ============================================
// SWIPEABLE LIST ITEM
// ============================================

interface SwipeableListItemProps {
  children: ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

export const SwipeableListItem = ({
  children,
  onDelete,
  onEdit,
  className = "",
}: SwipeableListItemProps) => {
  return (
    <motion.li
      variants={itemVariants}
      layout
      drag="x"
      dragConstraints={{ left: -100, right: 0 }}
      dragElastic={0.1}
      className={`relative overflow-hidden rounded-xl ${className}`}
    >
      {/* Background actions */}
      <div
        className="absolute inset-y-0 right-0 flex items-center gap-2 px-4"
        style={{ backgroundColor: "var(--color-error)" }}
      >
        {onEdit && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </motion.button>
        )}
        {onDelete && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Content */}
      <motion.div
        className="relative p-4"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 12,
        }}
      >
        {children}
      </motion.div>
    </motion.li>
  );
};

// ============================================
// ANIMATED TABLE
// ============================================

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
}

interface AnimatedTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
}

export function AnimatedTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data available",
  className = "",
}: AnimatedTableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-xl ${className}`} style={{ border: "1px solid var(--border-soft)" }}>
      <table className="w-full">
        {/* Header */}
        <thead style={{ backgroundColor: "var(--surface-muted)" }}>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-plum)", width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <motion.tbody
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <AnimatePresence>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <motion.tr
                  key={keyExtractor(item, index)}
                  variants={tableRowVariants}
                  layout
                  whileHover={{ backgroundColor: "var(--surface-muted)" }}
                  onClick={() => onRowClick?.(item, index)}
                  className={`border-t transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                  style={{ borderColor: "var(--border-soft)" }}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--color-charcoal)" }}
                    >
                      {column.render
                        ? column.render(item, index)
                        : String((item as Record<string, unknown>)[column.key as string] ?? "")}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </AnimatePresence>
        </motion.tbody>
      </table>
    </div>
  );
}

// ============================================
// VIRTUAL LIST ITEM (for performance)
// ============================================

interface VirtualListItemProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export const VirtualListItem = ({ children, index, className = "" }: VirtualListItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// ACCORDION LIST
// ============================================

interface AccordionItemProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const AccordionItem = ({ title, children, defaultOpen = false, className = "" }: AccordionItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      layout
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border-soft)",
      }}
    >
      {/* Header */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
        whileHover={{ backgroundColor: "var(--surface-muted)" }}
      >
        <span className="font-medium" style={{ color: "var(--color-charcoal)" }}>
          {title}
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-plum)"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </motion.button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="p-4 pt-0"
              style={{ borderTop: "1px solid var(--border-soft)" }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

import { useState } from "react";

interface AccordionProps {
  children: ReactNode;
  className?: string;
}

export const Accordion = ({ children, className = "" }: AccordionProps) => {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
};
