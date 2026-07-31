"use client";

import { useAuthFlow } from "../flow/useAuthFlow";

type AuthBackButtonProps = {
  className?: string;
};

// Circular "‹" control every non-intro app auth screen renders (see e.g.
// app-frontend/src/screens/auth/LoginScreen.tsx#L195-L209). Routes through
// useAuthFlow().back(), which resolves the current step's predecessor from
// AUTH_BACK — callers never hardcode where "back" goes.
export const AuthBackButton = ({ className = "" }: AuthBackButtonProps) => {
  const { back } = useAuthFlow();

  return (
    <button
      type="button"
      onClick={back}
      aria-label="Go back"
      className={`flex h-11 w-11 items-center justify-center rounded-full text-xl font-semibold transition-opacity hover:opacity-70 ${className}`}
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
    >
      ‹
    </button>
  );
};
