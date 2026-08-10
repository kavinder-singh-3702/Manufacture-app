import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/src/lib/contact";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

export type LegalDocumentContent = {
  eyebrow: string;
  title: string;
  summary: string;
  effectiveDate: string;
  reviewerNote: string;
  sections: LegalSection[];
};

export const privacyPolicyContent: LegalDocumentContent = {
  eyebrow: "Privacy Policy",
  title: "ARVANN Privacy Policy",
  summary:
    "This Privacy Policy explains what information we collect when you use the ARVANN mobile app or website, how we use it, who we share it with, and the choices you have.",
  effectiveDate: "August 8, 2026",
  reviewerNote:
    "This page is public and can be reviewed without signing in. It reflects the actual data practices in the live ARVANN product across mobile and web.",
  sections: [
    {
      title: "1. Who we are",
      paragraphs: [
        "ARVANN (\"we\", \"us\", \"our\") is an industrial-marketplace mobile and web application that connects manufacturers, traders, and buyers.",
        "This Privacy Policy explains what information we collect, how we use it, who we share it with, and the choices you have.",
        "This policy is a notice describing how we handle your information — not a blanket consent to every processing activity. Different activities rest on different legal bases: providing the marketplace and completing your orders is necessary to perform our agreement with you; retaining tax and payment records is a legal obligation; security logging serves our legitimate interest in protecting the platform; and anything optional (such as marketing messages) is done only with your separate consent, which you can withdraw at any time.",
        "If you do not agree with how we handle information, please stop using ARVANN and contact us to close your account."
      ]
    },
    {
      title: "2. What we collect",
      paragraphs: [
        "We collect the minimum information needed to run the marketplace. We do not use third-party analytics, third-party advertising networks, or trackers."
      ],
      items: [
        "Account information — email address, mobile phone number, display name, optional first/last name, optional profile photo, password (stored only as a hash), and Apple user ID if you sign in with Apple.",
        "Company / business information — company name, description, categories, contact details, address, and verification documents (GST certificate, Aadhaar card, or other identity or business documents) that you upload during the verification flow. Verification documents are stored securely, accessible only to our verification admins, and used only for compliance review.",
        "Content you create — product listings (title, description, price, categories, images), messages sent through in-app chat, feedback you submit, and quotes, orders, or inquiries you send or receive.",
        "Device and technical information — platform (iOS, Android, web), push-notification token, IP address recorded at login for security auditing, and basic device information used by the app to render correctly (screen size, OS version).",
        "Activity information — login events (timestamp, IP address) for security, product views, favorites, cart contents, and ad interactions (impressions, clicks, dismissals) within ARVANN.",
        "Payment information — when you complete a purchase, payment is processed by Razorpay (a PCI-DSS-compliant payment processor). Your card, UPI, or bank details are entered directly into Razorpay's secure interface and we never see or store them. We only receive the transaction status, an order reference, and the payment amount."
      ]
    },
    {
      title: "3. What we do NOT collect",
      paragraphs: [
        "We do not collect precise location data, contacts, calendar entries, or camera-recorded content. When you upload a product image or a verification document, you pick it from your device's photo library or camera — we only receive the file you explicitly select."
      ]
    },
    {
      title: "4. Advertising and third parties",
      paragraphs: [
        "Ads shown inside ARVANN are created only by our own admins and promote products already listed in the marketplace. We do not use third-party ad networks (Google AdMob, Meta Audience, and similar are not integrated) and do not share user data with any advertising partner.",
        "Some ads may link out to external websites (for example, a partner store). When you tap through, we do not share your ARVANN account data with the destination. The external site's own privacy policy applies from the moment you leave ARVANN.",
        "We do not use Google Analytics, Firebase Analytics, Mixpanel, Amplitude, Segment, Sentry, PostHog, Facebook SDK, AdMob, or any other analytics or advertising SDK.",
        "We do not track you across other companies' apps or websites, and we do not participate in cross-app advertising identifiers (IDFA)."
      ]
    },
    {
      title: "5. How we use your information",
      paragraphs: [
        "We use the information described above only for the following purposes:"
      ],
      items: [
        "To provide the service — create your account, show relevant products, deliver messages, complete orders.",
        "To communicate with you — order updates, chat notifications, verification decisions, and other service-related messages via in-app notification, push, email, or (rarely) SMS.",
        "To verify businesses — review GST, Aadhaar, or other documents you submit so that verified sellers can display a trust badge to buyers.",
        "To improve the app — read feedback you submit through the in-app form.",
        "For security and fraud prevention — detect suspicious logins, throttle abuse, and keep basic audit logs.",
        "For legal compliance — comply with Indian law and respond to lawful requests from authorities.",
        "We do NOT sell your personal information to any third party.",
        "We do NOT use your data for behavioral advertising outside ARVANN.",
        "We do NOT run any third-party tracking SDK."
      ]
    },
    {
      title: "6. Notifications",
      paragraphs: [
        "When you enable notifications, we may send you:"
      ],
      items: [
        "In-app notifications shown inside the ARVANN app or website.",
        "Push notifications delivered through Apple Push Notification service (iOS) or Firebase Cloud Messaging (Android).",
        "Email notifications for important account or order events.",
        "You can manage push preferences at any time from your device settings and from the Notification Settings screen inside the app. Some transactional messages (such as security alerts) may still be sent because they are essential to the service."
      ]
    },
    {
      title: "7. Third parties who process data on our behalf",
      paragraphs: [
        "We use a small number of trusted service providers to run ARVANN. Each receives only the minimum data needed for its function."
      ],
      items: [
        "Amazon Web Services (AWS S3) — media you upload (product images, verification documents, ad banners, videos) is stored in Amazon S3. AWS acts as our storage provider and does not access the content of your files for its own purposes.",
        "Apple — Sign in with Apple. If you choose Sign in with Apple, Apple returns a stable user identifier and (with your permission) your name and email address. We use this only to create or match your ARVANN account.",
        "Apple Push Notification service (APNs) and Firebase Cloud Messaging (FCM) — when your device registers for push notifications, we obtain a push token that we send to APNs or FCM to deliver notifications. Push previews may include your first name and a snippet of a message; we do not include email addresses or payment details in push previews.",
        "Razorpay — payments are processed by Razorpay Software Private Limited. When you pay, you interact directly with Razorpay's SDK; we do not see your card or UPI details.",
        "Nodemailer / SMTP email delivery — used to send OTPs, password reset links, verification decision notices, and other operational messages."
      ]
    },
    {
      title: "8. Data retention",
      paragraphs: [
        "Retention periods differ by data type:"
      ],
      items: [
        "Account data is retained as long as your account is active. If you delete your account (see Section 10), we delete your personal information within 30 days, except where retention is required by law (for example, tax records for orders) or for legitimate security purposes (for example, logs of abusive activity).",
        "Uploaded verification documents (GST certificate, Aadhaar card, etc.) are retained as long as the company is active on the platform. They are accessible only to internal verification admins, are not visible to other users, and are deleted when the associated company is removed.",
        "Chat messages are retained so both sides of a conversation can review their history; you can request deletion (see Section 10).",
        "Payment records and related tax invoices are retained for the period required under Indian tax law."
      ]
    },
    {
      title: "9. Security",
      paragraphs: [
        "We use reasonable technical and organizational measures to protect account, company, and transaction data."
      ],
      items: [
        "Passwords are hashed with a modern algorithm; we never store or transmit them in plain text.",
        "Sessions are secured with JSON Web Tokens (JWT) and session cookies for web access.",
        "All traffic between the app or website and our servers uses HTTPS.",
        "Uploaded media is stored in S3 with access controls appropriate to the file type.",
        "We periodically review our code for common security issues.",
        `No system is completely secure. If you discover a vulnerability, please email ${SUPPORT_EMAIL} — we will investigate promptly.`
      ]
    },
    {
      title: "10. Your rights and choices",
      paragraphs: [
        "Depending on where you live, you may have the right to:"
      ],
      items: [
        "Access the personal data we hold about you.",
        "Correct inaccurate data (most fields are directly editable in the app and website).",
        "Delete your account and associated personal data. On the mobile app, open Profile → Delete Account to delete your account from inside the app. You can also email arvann100@gmail.com to request deletion.",
        "Object to specific uses of your data.",
        "Export a copy of your data — email us to request an export.",
        "To exercise any of these rights, email arvann100@gmail.com from the address associated with your ARVANN account. We will respond within 30 days.",
        "You can also change notification preferences from the in-app Notification Settings screen, turn off push notifications from your iOS or Android system settings, and sign out or delete your account at any time."
      ]
    },
    {
      title: "11. Children",
      paragraphs: [
        "ARVANN is intended for use by adults transacting in an industrial marketplace. It is not directed at children under 13, and we do not knowingly collect personal information from anyone under 13.",
        `If you believe a child has provided us information, contact ${SUPPORT_EMAIL} or ${SUPPORT_PHONE_DISPLAY} and we will delete it.`
      ]
    },
    {
      title: "12. International users",
      paragraphs: [
        "ARVANN is operated from India. If you use the app or website from outside India, your data is transferred to and processed on servers in India (and, for storage, in AWS regions we operate). By using ARVANN you consent to this transfer."
      ]
    },
    {
      title: "13. Changes to this policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. When we do, we will change the effective date at the top and, for material changes, we may notify you in the app or by email. Continued use of ARVANN after a change means you accept the updated policy."
      ]
    },
    {
      title: "14. Contact",
      paragraphs: [
        `If you have questions about this Privacy Policy, privacy requests, verification data handling, or account closure, contact ARVANN at ${SUPPORT_EMAIL} or on ${SUPPORT_PHONE_DISPLAY}.`,
        `Grievance contact: ${SUPPORT_PHONE_DISPLAY} · ${SUPPORT_EMAIL}. We acknowledge grievances within 24 hours and aim to resolve them within 15 days.`
      ]
    }
  ]
};

export const termsAndConditionsContent: LegalDocumentContent = {
  eyebrow: "Terms & Conditions",
  title: "ARVANN Terms & Conditions",
  summary:
    "These Terms & Conditions govern access to and use of ARVANN, a business-focused manufacturing workspace and marketplace service operated by ARVANN.",
  effectiveDate: "April 5, 2026",
  reviewerNote:
    "This page is public and available without login. It describes the current platform rules for business users, company verification, payments, and operational use.",
  sections: [
    {
      title: "1. Acceptance of Terms",
      paragraphs: [
        "By accessing or using ARVANN, you agree to be bound by these Terms & Conditions and any additional policies referenced by the service, including our Privacy Policy.",
        "If you use the service on behalf of a company, firm, or other organization, you represent that you have authority to bind that organization to these terms."
      ]
    },
    {
      title: "2. Service Description",
      paragraphs: [
        "ARVANN is a B2B manufacturing workspace and marketplace environment that may include account onboarding, company management, verification workflows, operational dashboards, service requests, notifications, product-order support, and related business tooling.",
        "Features may change over time, and certain capabilities may be limited by user role, company status, verification status, geographic availability, or platform policy."
      ]
    },
    {
      title: "3. Eligibility and Account Use",
      paragraphs: [
        "You must provide accurate, current, and complete registration and profile information. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.",
        "You must not share credentials irresponsibly, impersonate another person or business, or create accounts using misleading or unauthorized information."
      ]
    },
    {
      title: "4. Company Information and Verification",
      paragraphs: [
        "If you submit company records, verification details, or compliance documents, you must have the legal right to provide them and they must be truthful, current, and not misleading.",
        "ARVANN may review, approve, reject, defer, or request additional documentation for company verification. Verification status is determined in our discretion based on the records submitted and operational or compliance considerations."
      ],
      items: [
        "You must not submit forged, altered, expired, or unauthorized business or identity documents.",
        "You remain responsible for the legality and accuracy of all company information, certificates, and supporting uploads.",
        "Approval of a verification request does not create a guarantee of business performance, regulatory clearance, or commercial success."
      ]
    },
    {
      title: "5. Acceptable Use",
      paragraphs: [
        "You may use the service only for lawful business purposes connected to legitimate manufacturing, sourcing, trade, services, operations, or related professional activity.",
        "You may not misuse the platform, attempt unauthorized access, interfere with system integrity, scrape protected areas, or use the service to engage in fraud, harassment, infringement, or unlawful trade."
      ],
      items: [
        "Do not upload malicious code, unlawful content, or material that violates third-party rights.",
        "Do not abuse verification, payment, notification, or admin-review workflows.",
        "Do not misrepresent your business, pricing, compliance status, service capacity, or transaction intent.",
        "Do not use the platform in a way that could disrupt service stability or harm other users."
      ]
    },
    {
      title: "6. Content, Data, and Intellectual Property",
      paragraphs: [
        "You retain responsibility for the information, documents, text, images, and other content you submit through the service. You represent that you have the rights needed to upload and use that content.",
        "ARVANN and its licensors retain all rights in the platform, software, branding, workflows, layouts, and related service materials, except for rights that belong to users in their own submitted content."
      ]
    },
    {
      title: "7. Orders, Services, and Payments",
      paragraphs: [
        "Some parts of the service may support business requests, service bookings, product-order workflows, and payment processing. Third-party payment providers, including Razorpay where enabled, may be used to process or verify payment events.",
        "ARVANN does not guarantee that any marketplace interaction, service request, product order, or commercial negotiation will result in a completed transaction, successful fulfillment, or uninterrupted payment flow."
      ],
      items: [
        "You are responsible for the accuracy of shipping details, buyer information, service contact details, and transaction inputs you submit.",
        "Third-party payment processors may apply their own terms, verification rules, and operational controls.",
        "You remain responsible for taxes, invoicing, statutory compliance, and commercial terms applicable to your business activities."
      ]
    },
    {
      title: "8. Suspension, Restriction, and Termination",
      paragraphs: [
        "ARVANN may suspend, restrict, review, or terminate access to accounts, companies, content, or workflows where we believe there is misuse, inaccurate verification, fraud risk, policy violation, legal exposure, or operational necessity.",
        `You may stop using the service at any time. If you want help with account closure or deletion-related requests, contact ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE_DISPLAY}.`
      ]
    },
    {
      title: "9. Disclaimers",
      paragraphs: [
        "ARVANN is provided on an \"as is\" and \"as available\" basis to the maximum extent permitted by law. We do not guarantee uninterrupted operation, error-free availability, or the conduct, quality, legality, or performance of any user, buyer, supplier, service provider, or third-party integration.",
        "Verification, review, moderation, or payment support provided through the platform does not amount to legal, tax, financial, or regulatory advice."
      ]
    },
    {
      title: "10. Limitation of Liability",
      paragraphs: [
        "To the fullest extent permitted by applicable law, ARVANN will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost business, lost data, reputational harm, or interrupted operations arising from use of the service.",
        "Where liability cannot be excluded, ARVANN's aggregate liability will be limited to the amount, if any, paid by you directly to ARVANN for the relevant service giving rise to the claim."
      ]
    },
    {
      title: "11. Governing Law and Disputes",
      paragraphs: [
        "These Terms & Conditions are governed by the laws of India, without regard to conflict-of-law principles.",
        "Any dispute arising out of or relating to these terms or the service will be subject to the competent courts and legal processes available in India, unless applicable law requires otherwise."
      ]
    },
    {
      title: "12. Changes to These Terms",
      paragraphs: [
        "We may revise these Terms & Conditions from time to time. Updated terms become effective when posted on this public page unless a later effective date is stated.",
        "Your continued use of the service after updated terms are posted constitutes acceptance of the revised terms."
      ]
    },
    {
      title: "13. Contact",
      paragraphs: [
        `Questions about these Terms & Conditions, verification rules, or account restrictions may be sent to ARVANN at ${SUPPORT_EMAIL} or raised on ${SUPPORT_PHONE_DISPLAY}.`,
        `Grievance contact: ${SUPPORT_PHONE_DISPLAY} · ${SUPPORT_EMAIL}. We acknowledge grievances within 24 hours and aim to resolve them within 15 days.`
      ]
    }
  ]
};
