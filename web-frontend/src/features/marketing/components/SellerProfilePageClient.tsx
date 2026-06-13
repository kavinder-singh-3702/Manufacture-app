"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SellerProfile } from "./SellerProfile";

export const SellerProfilePageClient = () => {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId")?.trim() ?? "";

  if (!companyId) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-10">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
            Seller not found
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
            Missing seller id in the page link.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: "var(--primary)", color: "#fff" }}
          >
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  return <SellerProfile companyId={companyId} />;
};
