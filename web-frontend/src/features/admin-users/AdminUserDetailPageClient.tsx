"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminUserDetail } from "./AdminUserDetail";

export const AdminUserDetailPageClient = () => {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId")?.trim() ?? "";

  if (!userId) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
      >
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          User not found
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
          Missing user id in the page link.
        </p>
        <Link
          href="/admin/users"
          className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Back to users
        </Link>
      </div>
    );
  }

  return <AdminUserDetail userId={userId} />;
};
