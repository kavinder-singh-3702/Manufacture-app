"use client";

import { PageHeader } from "@/src/components/ui/Surface";
import { AccountingGuard } from "./AccountingGuard";
import { InternalStockModeView } from "./InternalStockModeView";

/**
 * Own route for what used to be the "Internal Stock" side of the Books ⇄
 * Internal Stock toggle on the overview page. `InternalStockModeView`
 * already owns its own loading/empty/error states — this is just the
 * route-level shell (guard + header) around it.
 */
export const InternalStockPage = () => (
  <AccountingGuard>
    <div className="space-y-6">
      <PageHeader title="Internal Stock" />
      <InternalStockModeView />
    </div>
  </AccountingGuard>
);
