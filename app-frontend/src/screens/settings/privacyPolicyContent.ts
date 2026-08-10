/**
 * Structured content for the in-app Privacy Policy screen.
 *
 * Keep this in sync with the canonical `PRIVACY-POLICY.md` in the repo
 * root (which is what gets hosted at arvann.in/privacy for App Store
 * Connect + Google Play). Two copies exist so the app doesn't need to
 * fetch or parse markdown at runtime — Apple requires the policy to be
 * reachable inside the app even offline (Guideline 5.1.1).
 */

export type PolicyBlock =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "meta"; label: string; value: string }
  | { kind: "p"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "divider" };

// Effective / Last Updated dates. Update these when the policy content
// materially changes; also update the canonical PRIVACY-POLICY.md.
// Kept in sync with the canonical web version at
// web-frontend/src/features/legal/legal-content.ts (effectiveDate).
export const PRIVACY_POLICY_EFFECTIVE_DATE = "August 8, 2026";
export const PRIVACY_POLICY_LAST_UPDATED = "August 8, 2026";

export const PRIVACY_POLICY_BLOCKS: PolicyBlock[] = [
  { kind: "h1", text: "ARVANN — Privacy Policy" },
  { kind: "meta", label: "Effective Date", value: PRIVACY_POLICY_EFFECTIVE_DATE },
  { kind: "meta", label: "Last Updated", value: PRIVACY_POLICY_LAST_UPDATED },
  { kind: "divider" },

  { kind: "h2", text: "1. Who we are" },
  {
    kind: "p",
    text:
      "ARVANN (\"we\", \"us\", \"our\") is an industrial-marketplace mobile and web application that connects manufacturers, traders, and buyers.",
  },
  {
    kind: "p",
    text:
      "This Privacy Policy explains what information we collect when you use the ARVANN app or website, how we use it, who we share it with, and the choices you have.",
  },
  {
    kind: "p",
    text:
      "This policy is a notice describing how we handle your information — not a blanket consent to every processing activity. Different activities rest on different legal bases: providing the marketplace and completing your orders is necessary to perform our agreement with you; retaining tax and payment records is a legal obligation; security logging serves our legitimate interest in protecting the platform; and anything optional (such as marketing messages) is done only with your separate consent, which you can withdraw at any time.",
  },
  {
    kind: "p",
    text:
      "If you do not agree with how we handle information, please stop using ARVANN and delete your account (Profile → Delete Account) or contact us to close it.",
  },
  { kind: "divider" },

  { kind: "h2", text: "2. What we collect" },
  {
    kind: "p",
    text:
      "We collect the minimum information needed to run the marketplace. We do not use third-party analytics, third-party advertising networks, or trackers.",
  },
  { kind: "h2", text: "2.1 Account information" },
  { kind: "p", text: "When you sign up we collect:" },
  { kind: "bullet", text: "Email address (required)" },
  { kind: "bullet", text: "Mobile phone number (required for recovery, order coordination, and support)" },
  { kind: "bullet", text: "Display name and, optionally, first / last name" },
  { kind: "bullet", text: "Profile photo (optional, if you upload one)" },
  { kind: "bullet", text: "Password (stored in hashed form; we never see or store the original)" },
  { kind: "bullet", text: "Apple user ID (only if you sign in with Apple — see Section 5)" },

  { kind: "h2", text: "2.2 Company / business information" },
  { kind: "p", text: "If you list products or a business on ARVANN we collect:" },
  { kind: "bullet", text: "Company name, description, categories, and contact details" },
  { kind: "bullet", text: "Address" },
  {
    kind: "bullet",
    text:
      "Verification documents — GST certificate, Aadhaar card, or other identity / business documents you upload during the verification flow. Stored securely, accessible only to our verification admins, and used only for compliance verification.",
  },

  { kind: "h2", text: "2.3 Content you create" },
  { kind: "bullet", text: "Product listings (title, description, price, categories, images)" },
  { kind: "bullet", text: "Messages you send through the in-app chat" },
  { kind: "bullet", text: "Feedback you submit through the \"Send feedback\" screen (subject, message, optional rating)" },
  { kind: "bullet", text: "Quotes, orders, and inquiries you send or receive" },

  { kind: "h2", text: "2.4 Device and technical information" },
  { kind: "bullet", text: "Platform (iOS or Android)" },
  { kind: "bullet", text: "Push-notification token — used to deliver notifications to your device" },
  { kind: "bullet", text: "IP address — recorded at login for security auditing" },
  { kind: "bullet", text: "Basic device information used by the app to render correctly (screen size, OS version)" },
  {
    kind: "p",
    text:
      "We do NOT collect precise location, contacts, calendar entries, or camera-recorded content. When you upload a product image or a verification document, you pick it from your device's photo library — we only receive the file you explicitly select.",
  },

  { kind: "h2", text: "2.5 Activity information" },
  { kind: "bullet", text: "Login events (timestamp, IP address) for security" },
  { kind: "bullet", text: "Product views, favorites, cart contents — used to power recommendations inside the app" },
  {
    kind: "bullet",
    text:
      "Ad interactions — impressions, clicks, and dismissals for advertisements shown within ARVANN. Ads are created only by our own admins for products already listed in the marketplace. We do not use third-party ad networks and do not share this data with any advertising partner.",
  },
  {
    kind: "p",
    text:
      "Some ads may link to external websites (e.g. a partner store). When you tap through, we do not share your ARVANN account data with the destination. The external site's own privacy policy applies from that point onward.",
  },

  { kind: "h2", text: "2.6 Payment information" },
  {
    kind: "p",
    text:
      "When you complete a purchase, payment is processed by Razorpay, a PCI-DSS-compliant payment processor. Your card, UPI, or bank details are entered directly into Razorpay's secure interface — we never see or store them. We only receive the transaction status (success / failure), an order reference, and the payment amount. See Section 5.4 for Razorpay's role.",
  },
  { kind: "divider" },

  { kind: "h2", text: "3. How we use your information" },
  {
    kind: "p",
    text: "We use the information described above only for the following purposes:",
  },
  { kind: "bullet", text: "Provide the service — create your account, show relevant products, deliver messages, complete orders" },
  {
    kind: "bullet",
    text:
      "Communicate with you — send order updates, chat notifications, verification decisions, and other service-related messages via in-app notification, push, email, or (rarely) SMS",
  },
  {
    kind: "bullet",
    text:
      "Verify businesses — review GST / Aadhaar and other documents you submit so that verified sellers can display a trust badge to buyers",
  },
  { kind: "bullet", text: "Improve the app — read the feedback you submit through the in-app form" },
  { kind: "bullet", text: "Security and fraud prevention — detect suspicious logins, throttle abuse, keep basic audit logs" },
  { kind: "bullet", text: "Legal compliance — comply with Indian law, respond to lawful requests from authorities" },
  { kind: "p", text: "We do NOT sell your personal information to any third party." },
  { kind: "p", text: "We do NOT use your data for behavioral advertising outside ARVANN." },
  { kind: "p", text: "We do NOT run any third-party tracking SDK." },
  { kind: "divider" },

  { kind: "h2", text: "4. Notifications" },
  { kind: "p", text: "When you enable notifications, we may send you:" },
  { kind: "bullet", text: "In-app notifications shown inside the ARVANN app" },
  { kind: "bullet", text: "Push notifications delivered through Apple Push Notification service (iOS) or Firebase Cloud Messaging (Android)" },
  { kind: "bullet", text: "Email notifications for important account or order events" },
  {
    kind: "p",
    text:
      "You can manage push preferences at any time from your device settings and from the \"Notification Settings\" screen inside the app. Some transactional messages (e.g. security alerts) may still be sent because they are essential to the service.",
  },
  { kind: "divider" },

  { kind: "h2", text: "5. Third parties who process data on our behalf" },
  {
    kind: "p",
    text:
      "We use a small number of trusted service providers to run ARVANN. Each of them only receives the minimum data needed for their function.",
  },
  { kind: "h2", text: "5.1 Amazon Web Services (AWS S3)" },
  {
    kind: "p",
    text:
      "Media you upload (product images, verification documents, ad banners, videos) is stored in Amazon S3 buckets. AWS acts as our storage provider; they do not access the content of your files for their own purposes.",
  },
  { kind: "h2", text: "5.2 Apple — Sign in with Apple" },
  {
    kind: "p",
    text:
      "If you choose \"Sign in with Apple\", Apple returns to us a stable user identifier and (with your permission) your name and email address. We use this only to create or match your ARVANN account.",
  },
  { kind: "h2", text: "5.3 Apple Push Notification service (APNs) and Firebase Cloud Messaging (FCM)" },
  {
    kind: "p",
    text:
      "When your device registers for push notifications, we obtain a push token that we send to APNs (iOS) or FCM (Android) to deliver the notification. The notification body may include your first name and a preview of a message; we do not include email addresses or payment details in push previews.",
  },
  { kind: "h2", text: "5.4 Razorpay" },
  {
    kind: "p",
    text:
      "Payments are processed by Razorpay Software Private Limited. When you pay, you interact directly with Razorpay's SDK; we do not see your card / UPI details.",
  },
  {
    kind: "p",
    text:
      "We do NOT use Google Analytics, Firebase Analytics, Mixpanel, Amplitude, Segment, Sentry, PostHog, Facebook SDK, AdMob, or any other analytics or advertising SDK.",
  },
  { kind: "divider" },

  { kind: "h2", text: "6. Data retention" },
  {
    kind: "bullet",
    text:
      "Account data is retained as long as your account is active. If you delete your account (see Section 8), we delete your personal information within 30 days, except where retention is required by law (e.g. tax records for orders) or for legitimate security purposes (e.g. logs of abusive activity).",
  },
  { kind: "bullet", text: "Uploaded verification documents are retained as long as the company is active on the platform." },
  { kind: "bullet", text: "Chat messages are retained so both sides of a conversation can review their history; you can request deletion (see Section 8)." },
  { kind: "bullet", text: "Payment records and related tax invoices are retained for the period required under Indian tax law." },
  { kind: "divider" },

  { kind: "h2", text: "7. Security" },
  { kind: "bullet", text: "Passwords are hashed with a modern algorithm; we never store or transmit them in plain text." },
  { kind: "bullet", text: "Sessions are secured with JSON Web Tokens." },
  { kind: "bullet", text: "All traffic between the app and our servers uses HTTPS." },
  { kind: "bullet", text: "Uploaded media is stored in S3 with access controls appropriate to the file type." },
  { kind: "bullet", text: "We periodically review our code for common security issues." },
  {
    kind: "p",
    text:
      "No system is completely secure. If you discover a vulnerability, please email arvann100@gmail.com — we will investigate promptly.",
  },
  { kind: "divider" },

  { kind: "h2", text: "8. Your rights and choices" },
  { kind: "p", text: "Depending on where you live, you may have the right to:" },
  { kind: "bullet", text: "Access the personal data we hold about you" },
  { kind: "bullet", text: "Correct inaccurate data (most fields are directly editable in the app)" },
  { kind: "bullet", text: "Delete your account and associated data (Profile → Delete Account, inside the app)" },
  { kind: "bullet", text: "Object to specific uses of your data" },
  { kind: "bullet", text: "Export a copy of your data" },
  {
    kind: "p",
    text:
      "To exercise any of these rights, email us at arvann100@gmail.com from the address associated with your ARVANN account. We will respond within 30 days.",
  },
  { kind: "p", text: "You can also:" },
  { kind: "bullet", text: "Change notification preferences from the in-app \"Notification Settings\" screen" },
  { kind: "bullet", text: "Turn off push notifications from your iOS / Android system settings" },
  { kind: "bullet", text: "Sign out or delete your account at any time" },
  { kind: "divider" },

  { kind: "h2", text: "9. Children" },
  {
    kind: "p",
    text:
      "ARVANN is intended for use by adults transacting in an industrial marketplace. It is not directed at children under 13, and we do not knowingly collect personal information from anyone under 13. If you believe a child has provided us information, contact arvann100@gmail.com and we will delete it.",
  },
  { kind: "divider" },

  { kind: "h2", text: "10. International users" },
  {
    kind: "p",
    text:
      "ARVANN is operated from India. If you use the app from outside India, your data is transferred to and processed on servers in India (and, for storage, in AWS regions we operate). By using ARVANN you consent to this transfer.",
  },
  { kind: "divider" },

  { kind: "h2", text: "11. Changes to this policy" },
  {
    kind: "p",
    text:
      "We may update this Privacy Policy from time to time. When we do, we will change the \"Last Updated\" date at the top and, for material changes, we may notify you in the app or by email. Continued use of ARVANN after a change means you accept the updated policy.",
  },
  { kind: "divider" },

  { kind: "h2", text: "12. Contact" },
  { kind: "p", text: "For any question about this Privacy Policy or your data:" },
  { kind: "meta", label: "Email", value: "arvann100@gmail.com" },
];
