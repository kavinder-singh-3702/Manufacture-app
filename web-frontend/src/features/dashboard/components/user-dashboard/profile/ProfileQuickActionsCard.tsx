"use client";

import Link from "next/link";
import { Card } from "@/src/components/ui/Surface";
import { ProfileIcon, type ProfileIconName } from "./ProfileIcons";

type ActionTile =
  | { label: string; icon: ProfileIconName; href: string; onClick?: never }
  | { label: string; icon: ProfileIconName; onClick: () => void; href?: never };

/**
 * Action grid mirroring the app's ProfileQuickActionsCard
 * (app-frontend/src/screens/profile/components/ProfileQuickActionsCard.tsx) —
 * omits "Feedback" (no web page for it) and the admin-only "Notification
 * Studio" tile (this page is only reached by non-admin users on web).
 */
export const ProfileQuickActionsCard = ({
  onEditIdentity,
  onEditProfessional,
}: {
  onEditIdentity: () => void;
  onEditProfessional: () => void;
}) => {
  const actions: ActionTile[] = [
    { label: "Edit Personal", icon: "person", onClick: onEditIdentity },
    { label: "Edit Professional", icon: "briefcase", onClick: onEditProfessional },
    { label: "Company", icon: "building", href: "/dashboard/company" },
    { label: "My Quotes", icon: "receipt", href: "/dashboard/quotes" },
    { label: "Notifications", icon: "bell", href: "/dashboard/notifications" },
  ];

  return (
    <Card padding="md">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>Quick actions</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {actions.map((action) => {
          const content = (
            <>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
              >
                <ProfileIcon name={action.icon} size={18} />
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{action.label}</span>
            </>
          );
          const className = "flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-opacity hover:opacity-80";
          const style = { border: "1px solid var(--border)", backgroundColor: "var(--card)" };

          return action.href ? (
            <Link key={action.label} href={action.href} className={className} style={style}>
              {content}
            </Link>
          ) : (
            <button key={action.label} type="button" onClick={action.onClick} className={className} style={style}>
              {content}
            </button>
          );
        })}
      </div>
    </Card>
  );
};
