import { VerificationRequestsPanel } from "@/src/features/admin-verification";

export const metadata = {
  title: "Admin · Company Verification Requests",
  description: "Review and moderate company verification submissions.",
};

export default function VerificationRequestsPage() {
  return (
    <main
      className="min-h-screen pb-16 pt-10"
      style={{
        color: "var(--foreground)",
        background: "linear-gradient(180deg, rgba(18,17,29,0.95), rgba(42,26,31,0.92))",
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4">
        <VerificationRequestsPanel />
      </div>
    </main>
  );
}
