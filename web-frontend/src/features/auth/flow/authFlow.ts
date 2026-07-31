// Web analog of the app's AuthView (app-frontend/src/types/auth.ts) and the
// view-swap wiring in app-frontend/src/screens/auth/AuthScreen.tsx. The app
// keeps the whole auth flow in one `view` state; the web keeps it as real
// routes (so refresh / back-forward / deep links all resolve correctly) but
// the graph below is the same shape as AuthScreen's edges — one place that
// says what step follows what, instead of hardcoding hrefs in every card.
export type AuthStep = "intro" | "login" | "signup" | "forgot" | "reset";

export const AUTH_ROUTES: Record<AuthStep, string> = {
  intro: "/welcome",
  login: "/signin",
  signup: "/signup",
  forgot: "/forgot-password",
  reset: "/reset-password",
};

// Where the shell's back arrow sends you from each step — mirrors each
// screen's onBack prop in AuthScreen.tsx (LoginScreen back → intro,
// ForgotPasswordScreen back → login, ResetPasswordScreen back → forgot).
// SignupCard's own mid-step back is handled internally by its step machine
// and only reaches this table once it's back at its first step.
export const AUTH_BACK: Record<AuthStep, AuthStep | null> = {
  intro: null,
  login: "intro",
  signup: "login",
  forgot: "login",
  reset: "forgot",
};

export type AuthFooterLink = {
  text: string;
  linkLabel: string;
  href: string;
  cta: string;
};

export type AuthStepCopy = {
  // "\n" marks the line break the hero renders as <br /> (mirrors the
  // hardcoded two-line headline the original SignInHero shipped with).
  headline: string;
  description: string;
  footer: AuthFooterLink | null;
};

// Per-step hero copy for AuthFlowShell (web-frontend/src/features/auth/components/AuthFlowShell.tsx).
// The app doesn't need this table — its shell only ever shows the brand
// lockup, not step-specific marketing copy — but the web hero panel
// (SignInHero) already carries copy, so each step gets its own. Each card
// still renders its own eyebrow label ("Reset access", "New password", …)
// in its own header, so the hero doesn't duplicate one.
export const AUTH_STEP_COPY: Record<AuthStep, AuthStepCopy> = {
  intro: {
    headline: "Your manufacturing\ncommand centre.",
    description:
      "One secure workspace to connect with verified suppliers, manage your pipeline, and grow your business.",
    footer: null,
  },
  login: {
    headline: "Your manufacturing\ncommand centre.",
    description:
      "One secure login to connect with verified suppliers, manage your pipeline, and grow your business.",
    footer: {
      text: "New to ARVANN?",
      linkLabel: "Create your workspace in 3 minutes",
      href: AUTH_ROUTES.signup,
      cta: "Sign up →",
    },
  },
  signup: {
    headline: "Build your workspace\nin minutes.",
    description: "Create your account to connect with manufacturers, traders, and buyers across India.",
    footer: {
      text: "Already building on ARVANN?",
      linkLabel: "Sign in to your workspace",
      href: AUTH_ROUTES.login,
      cta: "Sign in →",
    },
  },
  forgot: {
    headline: "Keep operations\nmoving.",
    description:
      "Request a reset with your registered email. We keep responses vague by design to protect accounts.",
    footer: { text: "Remembered your credentials?", linkLabel: "Back to sign in", href: AUTH_ROUTES.login, cta: "Sign in →" },
  },
  reset: {
    headline: "Prove possession,\nthen reset.",
    description: "Use the code or link we emailed you to sign back in with a new password.",
    footer: {
      text: "Need a fresh code?",
      linkLabel: "Request reset instructions",
      href: AUTH_ROUTES.forgot,
      cta: "Get a new code →",
    },
  },
};

const PATH_TO_STEP: Record<string, AuthStep> = Object.fromEntries(
  (Object.entries(AUTH_ROUTES) as [AuthStep, string][]).map(([step, path]) => [path, step])
);

export const stepFromPathname = (pathname: string | null): AuthStep => {
  if (!pathname) return "intro";
  return PATH_TO_STEP[pathname] ?? "intro";
};
