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
    "This Privacy Policy explains how ARVANN collects, uses, stores, and shares information when you use Manufacture Command, our B2B manufacturing workspace and marketplace services.",
  effectiveDate: "April 5, 2026",
  reviewerNote:
    "This page is public and can be reviewed without signing in. It is intended to describe the current web and backend data practices reflected in the live product codebase.",
  sections: [
    {
      title: "1. Scope",
      paragraphs: [
        "This Privacy Policy applies to Manufacture Command web experiences operated by ARVANN, related backend APIs, and supporting account, verification, order, service, and communication workflows.",
        "By using the service, you understand that your information may be processed in connection with account creation, business onboarding, verification, operations management, and transaction support."
      ]
    },
    {
      title: "2. Information We Collect",
      paragraphs: [
        "We collect information that you provide directly during signup, login, profile completion, company onboarding, verification, file uploads, service requests, product orders, and support communications.",
        "We also collect technical and operational information required to secure accounts, maintain sessions, review submissions, and operate the platform."
      ],
      items: [
        "Identity and account data such as full name, display name, email address, phone number, password hash, role, account type, and account status.",
        "Authentication and security data such as OTP verification state, email verification timing, session information, session cookies for web access, JWT support for compatible clients, login timestamps, and security-related activity records.",
        "Profile and contact data such as address, bio, avatar, social links, notification preferences, locale, timezone, and communication settings.",
        "Company data such as company name, legal name, category, description, contact details, headquarters address, website, social links, business status, compliance status, and company settings.",
        "Verification and compliance data such as GST certificate files, Aadhaar card files, uploaded document metadata, reviewer notes, decision history, and audit trail entries.",
        "Uploaded content such as user files, company assets, and supporting documents stored through configured cloud storage services.",
        "Service marketplace data such as request title, description, contact name, contact email, contact phone, location, schedule, status history, notes, and assignment history.",
        "Order and payment support data such as shipping address, buyer snapshot details, order line items, totals, payment status, Razorpay-linked payment attempt records, provider order identifiers, and payment verification events.",
        "Operational data such as notifications, activity logs, administrative review actions, and usage context needed to run the service safely."
      ]
    },
    {
      title: "3. How We Use Information",
      paragraphs: [
        "We use personal and business information to provide the service, create and secure accounts, verify business identity, facilitate platform operations, support service requests and orders, communicate with users, and improve reliability.",
        "We may also use information to investigate abuse, enforce our policies, comply with legal obligations, respond to support requests, and maintain records required for operational or compliance purposes."
      ],
      items: [
        "To create accounts, sign users in, verify email or OTP-based identity, and maintain authenticated sessions.",
        "To create and manage user profiles, company workspaces, and active company context.",
        "To review submitted business verification documents and record approval or rejection decisions.",
        "To process product-order and payment-related workflows and validate transaction events.",
        "To send transactional messages such as OTP emails, password reset flows, verification notices, and platform notifications.",
        "To protect the service against fraud, misuse, unauthorized access, and policy violations."
      ]
    },
    {
      title: "4. Cookies, Sessions, and Similar Technologies",
      paragraphs: [
        "Manufacture Command uses session cookies to keep web users signed in and to support secure authenticated requests. These cookies are used for account continuity, session management, and security controls.",
        "We may also maintain related authentication state for compatible clients through issued tokens where supported by the relevant client flow."
      ]
    },
    {
      title: "5. How We Share Information",
      paragraphs: [
        "We do not publish your private account or verification data for general public viewing. We share information only as needed to operate the service, complete requested workflows, or comply with applicable law.",
        "Depending on the workflow, information may be accessible to internal administrators, compliance reviewers, infrastructure providers, payment providers, email providers, and other parties acting under operational necessity."
      ],
      items: [
        "With infrastructure and storage providers that host the application and store uploaded assets or verification files.",
        "With transactional email or notification providers used to deliver OTP, password reset, and operational messages.",
        "With payment service providers such as Razorpay for order-payment workflows and payment verification.",
        "With authorized internal reviewers or administrators evaluating company verification requests, moderation actions, support issues, or account misuse.",
        "With legal, regulatory, or law-enforcement authorities where disclosure is required by law, regulation, court order, or a good-faith safety obligation."
      ]
    },
    {
      title: "6. Data Retention",
      paragraphs: [
        "We retain information for as long as reasonably necessary to provide the service, maintain account records, support compliance review, resolve disputes, process payments, investigate abuse, and satisfy legal or operational recordkeeping needs.",
        "Retention periods may differ by data type. For example, account records, verification history, order records, payment verification events, and security logs may be retained longer than routine session state."
      ]
    },
    {
      title: "7. Security",
      paragraphs: [
        "We use reasonable technical and organizational measures to protect account, company, and transaction data, including authenticated access controls, password hashing, session handling, validation controls, and operational logging.",
        "No system can guarantee absolute security, and you are responsible for maintaining the confidentiality of your login credentials and limiting unauthorized access to your devices and accounts."
      ]
    },
    {
      title: "8. Your Choices and Requests",
      paragraphs: [
        "You may update portions of your profile and company information from within the service where those controls are available.",
        "If you need help accessing, correcting, or requesting deletion of account information, or if you need support related to verification documents or account closure, contact us at arvann100@gmail.com."
      ]
    },
    {
      title: "9. Cross-Border Processing",
      paragraphs: [
        "Our service providers, infrastructure, or support tools may process information in locations outside your immediate region. Where this occurs, we use the service to support legitimate platform operations, security, and compliance needs.",
        "By using the service, you understand that your information may be stored or processed in jurisdictions where our providers operate, subject to applicable law."
      ]
    },
    {
      title: "10. Children and Business Use",
      paragraphs: [
        "Manufacture Command is designed for business and professional use in manufacturing, sourcing, operations, and trade workflows. It is not intended for children.",
        "If you believe personal information was submitted inappropriately, contact us at arvann100@gmail.com so we can review the request."
      ]
    },
    {
      title: "11. Changes to This Policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time as our products, legal obligations, or operational practices evolve.",
        "When we make material updates, we may update the effective date and publish the revised version on this public page."
      ]
    },
    {
      title: "12. Contact",
      paragraphs: [
        "If you have questions about this Privacy Policy, privacy requests, verification data handling, or account closure, contact ARVANN at arvann100@gmail.com."
      ]
    }
  ]
};

export const termsAndConditionsContent: LegalDocumentContent = {
  eyebrow: "Terms & Conditions",
  title: "ARVANN Terms & Conditions",
  summary:
    "These Terms & Conditions govern access to and use of Manufacture Command, a business-focused manufacturing workspace and marketplace service operated by ARVANN.",
  effectiveDate: "April 5, 2026",
  reviewerNote:
    "This page is public and available without login. It describes the current platform rules for business users, company verification, payments, and operational use.",
  sections: [
    {
      title: "1. Acceptance of Terms",
      paragraphs: [
        "By accessing or using Manufacture Command, you agree to be bound by these Terms & Conditions and any additional policies referenced by the service, including our Privacy Policy.",
        "If you use the service on behalf of a company, firm, or other organization, you represent that you have authority to bind that organization to these terms."
      ]
    },
    {
      title: "2. Service Description",
      paragraphs: [
        "Manufacture Command is a B2B manufacturing workspace and marketplace environment that may include account onboarding, company management, verification workflows, operational dashboards, service requests, notifications, product-order support, and related business tooling.",
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
        "You may stop using the service at any time. If you want help with account closure or deletion-related requests, contact arvann100@gmail.com."
      ]
    },
    {
      title: "9. Disclaimers",
      paragraphs: [
        "Manufacture Command is provided on an \"as is\" and \"as available\" basis to the maximum extent permitted by law. We do not guarantee uninterrupted operation, error-free availability, or the conduct, quality, legality, or performance of any user, buyer, supplier, service provider, or third-party integration.",
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
        "Questions about these Terms & Conditions, verification rules, or account restrictions may be sent to ARVANN at arvann100@gmail.com."
      ]
    }
  ]
};
