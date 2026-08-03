import { redirect } from "next/navigation";

// `/dashboard/accounting` is the link target used everywhere (sidebar nav,
// mobile tab rail, the dashboard's Accounting quick action) — rather than
// update every one of those call sites, this bare index route just forwards
// to the tab that should open by default. Quick Entry, not the KPI overview:
// most visits here are to record a voucher, not to read a snapshot.
export default function AccountingIndexPage() {
  redirect("/dashboard/accounting/quick-entry");
}
