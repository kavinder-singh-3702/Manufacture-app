/**
 * Topic glyphs for the notification feed — mirrors app-frontend's
 * `topicIcon()` in NotificationsScreen.tsx (quote→receipt, compliance→shield,
 * service→construct, else→bell), following the same inline-SVG icon-set
 * pattern as ProfileIcons.tsx / Navigation.tsx's NavIcon.
 */
export type NotificationTopicIconName = "receipt" | "shield" | "construct" | "bell";

export const topicIconName = (topic?: string): NotificationTopicIconName => {
  if (!topic) return "bell";
  if (topic.includes("quote")) return "receipt";
  if (topic.includes("compliance")) return "shield";
  if (topic.includes("service")) return "construct";
  return "bell";
};

export const NotificationTopicIcon = ({
  topic,
  size = 14,
  color = "currentColor",
}: {
  topic?: string;
  size?: number;
  color?: string;
}) => {
  switch (topicIconName(topic)) {
    case "receipt":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2zM9 9h6M9 13h6M9 17h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "construct":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14.5 6.5 17 4l3 3-2.5 2.5M9 11l-6 6a2 2 0 0 0 3 3l6-6M12 8l-3.5 3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "bell":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 14v-3a6 6 0 1 0-12 0v3l-1.5 3H19.5L18 14z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
};
