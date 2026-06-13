import type { Metadata } from "next";
import { AboutPage } from "@/src/features/marketing";

export const metadata: Metadata = {
  title: "About ARVANN — India's manufacturing marketplace",
  description: "ARVANN connects verified manufacturers, suppliers, and buyers in one workspace for sourcing, compliance, and operations.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return <AboutPage />;
}
