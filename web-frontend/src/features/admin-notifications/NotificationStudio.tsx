"use client";

import { useCallback, useState } from "react";
import { PageHeader } from "@/src/components/ui/Surface";
import { ComposerPanel } from "./ComposerPanel";
import { DispatchHistory } from "./DispatchHistory";

/**
 * Notification Studio shell — composer on the left, batch dispatch history
 * on the right. Split out of one 348-line file into
 * ComposerPanel/RecipientPicker/DispatchHistory/DeliveryStatusChips so each
 * piece (audience resolution, recipient search, batch rollups) can be read
 * and changed independently.
 */
export const NotificationStudio = () => {
  const [reloadToken, setReloadToken] = useState(0);
  const bumpReload = useCallback(() => setReloadToken((n) => n + 1), []);

  return (
    <div className="space-y-6">
      <PageHeader title="Notification Studio" />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <ComposerPanel onDispatched={bumpReload} />
        <DispatchHistory reloadToken={reloadToken} />
      </div>
    </div>
  );
};
