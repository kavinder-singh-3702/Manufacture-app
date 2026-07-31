import { IntroCard } from "@/src/features/auth";

export const metadata = {
  title: "ARVANN — Welcome",
  description: "Sign in or create your ARVANN workspace.",
  robots: { index: false },
};

export default function WelcomePage() {
  return <IntroCard />;
}
