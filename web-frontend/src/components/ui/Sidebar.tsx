"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type ReactNode, useState, createContext, useContext } from "react";

// ============================================
// SIDEBAR CONTEXT
// ============================================

interface SidebarContextType {
  isCollapsed: boolean;
  isOpen: boolean;
  toggleCollapse: () => void;
  toggleOpen: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

// ============================================
// SIDEBAR PROVIDER
// ============================================

interface SidebarProviderProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
}

export const SidebarProvider = ({ children, defaultCollapsed = false }: SidebarProviderProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isOpen, setIsOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleOpen = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, isOpen, toggleCollapse, toggleOpen, close }}>
      {children}
    </SidebarContext.Provider>
  );
};

// ============================================
// ANIMATED SIDEBAR
// ============================================

interface AnimatedSidebarProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const AnimatedSidebar = ({ children, header, footer, className = "" }: AnimatedSidebarProps) => {
  const { isCollapsed, isOpen, close } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 72 : 260,
          x: isOpen ? 0 : undefined,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          fixed lg:relative left-0 top-0 h-screen z-50
          flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${className}
        `}
        style={{
          background: "linear-gradient(180deg, var(--surface), var(--color-linen))",
          borderRight: "1px solid var(--border-soft)",
        }}
      >
        {/* Header */}
        {header && (
          <div className="p-4 border-b" style={{ borderColor: "var(--border-soft)" }}>
            {header}
          </div>
        )}

        {/* Content */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">{children}</nav>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t" style={{ borderColor: "var(--border-soft)" }}>
            {footer}
          </div>
        )}
      </motion.aside>
    </>
  );
};

// ============================================
// SIDEBAR ITEM
// ============================================

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number | string;
  children?: ReactNode;
}

export const SidebarItem = ({ icon, label, href, onClick, active = false, badge, children }: SidebarItemProps) => {
  const { isCollapsed } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = Boolean(children);

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    } else {
      onClick?.();
    }
  };

  const content = (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
          transition-colors duration-200
          ${active ? "bg-[var(--color-peach)]" : "hover:bg-[var(--surface-muted)]"}
        `}
        style={{
          color: active ? "var(--color-plum)" : "var(--color-charcoal)",
        }}
      >
        {/* Icon */}
        <motion.span
          animate={{ scale: active ? 1.1 : 1 }}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
        >
          {icon}
        </motion.span>

        {/* Label */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {badge && !isCollapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-0.5 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "white",
            }}
          >
            {badge}
          </motion.span>
        )}

        {/* Expand icon for nested items */}
        {hasChildren && !isCollapsed && (
          <motion.svg
            animate={{ rotate: isExpanded ? 180 : 0 }}
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </motion.div>

      {/* Nested items */}
      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-6 mt-1 space-y-1 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (href && !hasChildren) {
    return <a href={href}>{content}</a>;
  }

  return <div>{content}</div>;
};

// ============================================
// SIDEBAR GROUP
// ============================================

interface SidebarGroupProps {
  title?: string;
  children: ReactNode;
}

export const SidebarGroup = ({ title, children }: SidebarGroupProps) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="mb-4">
      <AnimatePresence>
        {title && !isCollapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            {title}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="space-y-1">{children}</div>
    </div>
  );
};

// ============================================
// SIDEBAR TOGGLE BUTTON
// ============================================

export const SidebarToggle = () => {
  const { isCollapsed, toggleCollapse } = useSidebar();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleCollapse}
      className="w-8 h-8 rounded-lg flex items-center justify-center"
      style={{
        backgroundColor: "var(--surface-muted)",
        color: "var(--color-plum)",
      }}
    >
      <motion.svg
        animate={{ rotate: isCollapsed ? 180 : 0 }}
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    </motion.button>
  );
};

// ============================================
// MOBILE SIDEBAR TRIGGER
// ============================================

export const MobileSidebarTrigger = () => {
  const { toggleOpen } = useSidebar();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleOpen}
      className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border-soft)",
        color: "var(--color-plum)",
      }}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
      </svg>
    </motion.button>
  );
};
