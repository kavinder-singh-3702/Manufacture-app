"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo } from "@/src/components/BrandLogo";
import { useAuthFlow } from "../flow/useAuthFlow";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// Web analog of AuthScreen's IntroPanel
// (app-frontend/src/screens/auth/AuthScreen.tsx#L175-L606): the same two
// exits — join now (→ signup) and skip (→ guest browsing) — plus a
// "sign in" link the app's intro doesn't need (it's reached from signup or
// post-logout, never cold start) but /welcome does, since it's the first
// screen a desktop visitor without a session lands on.
export const IntroCard = () => {
  const { go, browseAsGuest } = useAuthFlow();

  return (
    <div
      className="rounded-3xl p-8 text-center shadow-xl"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        color: "var(--foreground)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <motion.div {...fadeUp(0.05)} className="flex flex-col items-center">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-3xl"
          style={{ backgroundColor: "var(--primary-light)", border: "1px solid var(--border)" }}
        >
          <BrandLogo height={56} />
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.14)} className="mt-6">
        <h1 className="text-[28px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
          Welcome to ARVANN
        </h1>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--medium-gray)" }}>
          The business world
        </p>
        <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
      </motion.div>

      <motion.div {...fadeUp(0.22)} className="mt-8 space-y-3">
        <motion.button
          type="button"
          onClick={() => go("signup")}
          className="w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          Join now
        </motion.button>

        <button
          type="button"
          onClick={browseAsGuest}
          className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
        >
          Skip and browse as guest
        </button>
      </motion.div>

      <motion.p {...fadeUp(0.3)} className="mt-6 text-center text-sm" style={{ color: "var(--medium-gray)" }}>
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold" style={{ color: "var(--primary)" }}>
          Sign in
        </Link>
      </motion.p>
    </div>
  );
};
