/**
 * Small inline-SVG icon set for the Profile cards — mirrors the app's
 * Ionicons `-outline` glyphs (person, mail, call, location, briefcase,
 * color-palette, notifications, options, receipt, business) used across
 * ProfileAccountCard / ProfileProfessionalCard / ProfileQuickActionsCard.
 * One file, same pattern as Navigation.tsx's NavIcon, so no card redraws
 * its own copy of the same glyph.
 */

export type ProfileIconName =
  | "person"
  | "at"
  | "mail"
  | "call"
  | "location"
  | "briefcase"
  | "palette"
  | "bell"
  | "sliders"
  | "receipt"
  | "building"
  | "chevronRight"
  | "camera";

export const ProfileIcon = ({ name, size = 16, color = "currentColor" }: { name: ProfileIconName; size?: number; color?: string }) => {
  switch (name) {
    case "person":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "at":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
          <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "mail":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.8" />
          <path d="m3 7 9 6 9-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "call":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6.5 4h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "location":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.3" stroke={color} strokeWidth="1.8" />
        </svg>
      );
    case "briefcase":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="8" width="18" height="12" rx="2" stroke={color} strokeWidth="1.8" />
          <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "palette":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .9-1.9 2-1.9h2a4 4 0 0 0 4-4c0-5-4.5-7.5-9-7.5Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7.5" cy="10.5" r="1.2" fill={color} />
          <circle cx="11" cy="7" r="1.2" fill={color} />
          <circle cx="15.5" cy="8.5" r="1.2" fill={color} />
        </svg>
      );
    case "bell":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 14v-3a6 6 0 1 0-12 0v3l-1.5 3H19.5L18 14z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "sliders":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 21v-7M4 10V3M12 21v-11M12 6V3M20 21v-5M20 12V3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="4" cy="13" r="2" stroke={color} strokeWidth="1.8" />
          <circle cx="12" cy="8" r="2" stroke={color} strokeWidth="1.8" />
          <circle cx="20" cy="14" r="2" stroke={color} strokeWidth="1.8" />
        </svg>
      );
    case "receipt":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2zM9 9h6M9 13h6M9 17h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "building":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4M7 17h1M16 17h1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "camera":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12.5" r="3.2" stroke={color} strokeWidth="1.8" />
        </svg>
      );
    case "chevronRight":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9 6 6 6-6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};
