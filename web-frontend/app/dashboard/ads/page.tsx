import { Metadata } from "next";
import { AdRunsContainer } from "@/src/features/ads/components/AdRunsContainer";

export const metadata: Metadata = {
  title: "ARVANN — Ad Runs",
  description: "Track the advertisement requests you've filed for your products.",
};

export default function AdRunsPage() {
  return <AdRunsContainer />;
}
