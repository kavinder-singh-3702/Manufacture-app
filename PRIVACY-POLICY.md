# ARVANN — Privacy Policy

**Effective Date:** [YYYY-MM-DD — set to your App Store submission date]
**Last Updated:** [YYYY-MM-DD]

> **Placeholders to fill in before publishing:**
> - `[OWNER_NAME]` — your friend's full legal name (individual proprietor of ARVANN)
> - `[CONTACT_EMAIL]` — the email address you want to receive privacy queries
> - `[BUSINESS_ADDRESS]` — the address to list as the data controller (an Indian address is required by Apple for apps from Indian developers)

---

## 1. Who we are

ARVANN ("we", "us", "our") is an industrial-marketplace mobile and web application that connects manufacturers, traders, and buyers. The app is operated by **[OWNER_NAME]** as an individual proprietor from **[BUSINESS_ADDRESS]**.

This Privacy Policy explains what information we collect when you use the ARVANN app or website, how we use it, who we share it with, and the choices you have.

By using ARVANN, you agree to the practices described here. If you do not agree, please do not use the app.

---

## 2. What we collect

We collect the minimum information needed to run the marketplace. We do not use third-party analytics, third-party advertising networks, or trackers.

### 2.1 Account information

When you sign up:
- **Email address** (required)
- **Mobile phone number** (required for account recovery, order coordination, and support)
- **Display name** and, optionally, first / last name
- **Profile photo** (optional, if you upload one)
- **Password** (stored in hashed form; we never see or store the original)
- **Apple user ID** (only if you sign in with Apple — see Section 5)

### 2.2 Company / business information

If you list products or a business on ARVANN:
- **Company name, description, categories, and contact details**
- **Address**
- **Verification documents** — GST certificate, Aadhaar card, or other identity/business documents you upload during the verification flow. These are stored securely and used only for compliance verification.

### 2.3 Content you create

- **Product listings** (title, description, price, categories, images)
- **Messages** you send through the in-app chat
- **Feedback** you submit through the "Send feedback" screen (subject, message, optional star rating)
- **Quotes, orders, and inquiries** you send or receive

### 2.4 Device and technical information

- **Platform** (iOS or Android)
- **Push-notification token** — used to deliver notifications to your device
- **IP address** — recorded at login for security auditing
- **Basic device information** used by Expo / React Native to render the app correctly (screen size, OS version)

We do **not** collect precise location data, contacts, calendar entries, or camera-recorded content. When you upload a product image or a verification document, you pick it from your device's photo library — we only receive the file you explicitly select.

### 2.5 Activity information

- **Login events** (timestamp, IP address) for security
- **Product views, favorites, cart contents** — used to power recommendations inside the app
- **Ad interactions** — impressions, clicks, and dismissals for advertisements shown within ARVANN. Ads are created only by our own admins for products already listed in the marketplace. We do not use third-party ad networks and do not share this data with any advertising partner.

### 2.6 Payment information

When you complete a purchase, payment is processed by **Razorpay**, a PCI-DSS-compliant payment processor. Your card, UPI, or bank details are entered directly into Razorpay's secure interface — we never see or store them. We only receive the transaction status (success / failure), an order reference, and the payment amount. See Section 5.4 for Razorpay's role.

---

## 3. How we use your information

We use the information described above only for the following purposes:

- **Provide the service** — create your account, show relevant products, deliver messages, complete orders.
- **Communicate with you** — send order updates, chat notifications, verification decisions, and other service-related messages via in-app notification, push, email, or (rarely) SMS.
- **Verify businesses** — review GST / Aadhaar and other documents you submit so that verified sellers can display a trust badge to buyers.
- **Improve the app** — read the feedback you submit through the in-app form.
- **Security and fraud prevention** — detect suspicious logins, throttle abuse, keep basic audit logs.
- **Legal compliance** — comply with Indian law, respond to lawful requests from authorities.

We do **not** sell your personal information to any third party.
We do **not** use your data for behavioral advertising outside ARVANN.
We do **not** run any third-party tracking SDK.

---

## 4. Notifications

When you enable notifications, we may send you:
- **In-app notifications** shown inside the ARVANN app
- **Push notifications** delivered through Apple Push Notification service (iOS) or Firebase Cloud Messaging (Android)
- **Email notifications** for important account or order events

You can manage push preferences at any time from your device settings and from the "Notification Settings" screen inside the app. Some transactional messages (e.g. security alerts) may still be sent because they are essential to the service.

---

## 5. Third parties who process data on our behalf

We use a small number of trusted service providers to run ARVANN. Each of them only receives the minimum data needed for their function.

### 5.1 Amazon Web Services (AWS S3)
Media you upload (product images, verification documents, ad banners, videos) is stored in Amazon S3 buckets. AWS acts as our storage provider; they do not access the content of your files for their own purposes.

### 5.2 Apple — Sign in with Apple
If you choose "Sign in with Apple", Apple returns to us a stable user identifier and (with your permission) your name and email address. We use this only to create or match your ARVANN account. See Apple's privacy policy at [https://www.apple.com/legal/privacy/](https://www.apple.com/legal/privacy/).

### 5.3 Apple Push Notification service (APNs) and Firebase Cloud Messaging (FCM)
When your device registers for push notifications, we obtain a push token that we send to APNs (iOS) or FCM (Android) to deliver the notification. The notification body may include your first name and a preview of a message; we do not include email addresses or payment details in push previews.

### 5.4 Razorpay
Payments are processed by Razorpay Software Private Limited. When you pay, you interact directly with Razorpay's SDK; we do not see your card / UPI details. See Razorpay's privacy policy at [https://razorpay.com/privacy/](https://razorpay.com/privacy/).

We do **not** use Google Analytics, Firebase Analytics, Mixpanel, Amplitude, Segment, Sentry, PostHog, Facebook SDK, AdMob, or any other analytics or advertising SDK.

---

## 6. Data retention

- **Account data** is retained as long as your account is active. If you delete your account (see Section 8), we delete your personal information within 30 days, except where retention is required by law (e.g. tax records for orders) or for legitimate security purposes (e.g. logs of abusive activity).
- **Uploaded documents** for company verification are retained as long as the company is active on the platform.
- **Chat messages** are retained so both sides of a conversation can review their history; you can request deletion (see Section 8).
- **Payment records** and related tax invoices are retained for the period required under Indian tax law.

---

## 7. Security

- Passwords are hashed with a modern algorithm; we never store or transmit them in plain text.
- Sessions are secured with JSON Web Tokens.
- All traffic between the app and our servers uses HTTPS.
- Uploaded media is stored in S3 with access controls appropriate to the file type.
- We periodically review our code for common security issues.

No system is completely secure. If you discover a vulnerability, please email **[CONTACT_EMAIL]** — we will investigate promptly.

---

## 8. Your rights and choices

Depending on where you live, you may have the right to:
- **Access** the personal data we hold about you
- **Correct** inaccurate data (most fields are directly editable in the app)
- **Delete** your account and associated data
- **Object** to specific uses of your data
- **Export** a copy of your data

To exercise any of these rights, email us at **[CONTACT_EMAIL]** from the address associated with your ARVANN account. We will respond within 30 days.

You can also:
- Change your notification preferences from the in-app "Notification Settings" screen
- Turn off push notifications from your iOS / Android system settings
- Sign out or delete your account at any time

---

## 9. Children

ARVANN is intended for use by adults transacting in an industrial marketplace. It is not directed at children under 13, and we do not knowingly collect personal information from anyone under 13. If you believe a child has provided us information, contact **[CONTACT_EMAIL]** and we will delete it.

---

## 10. International users

ARVANN is operated from India. If you use the app from outside India, your data is transferred to and processed on servers in India (and, for storage, in AWS regions we operate). By using ARVANN you consent to this transfer.

---

## 11. Changes to this policy

We may update this Privacy Policy from time to time. When we do, we will change the "Last Updated" date at the top and, for material changes, we may notify you in the app or by email. Continued use of ARVANN after a change means you accept the updated policy.

---

## 12. Contact

For any question about this Privacy Policy or your data:

**Email:** [CONTACT_EMAIL]
**Postal:** [OWNER_NAME], [BUSINESS_ADDRESS]

---
---

# App Store Connect — App Privacy questionnaire cheat sheet

Apple asks you to declare, in App Store Connect, what data types you collect. This is a set of checkbox questions. Answer them **honestly** and consistently with the policy above.

Based on what ARVANN actually does, here is what to check.

## Data collected

For each data type below, check **Yes, we collect this**, then for each, tick:
- **Linked to user:** YES (we tie it to the account)
- **Used for tracking:** NO (we do not use any data for cross-app / cross-website tracking)
- **Purposes:** as listed under each item

### Contact Info
- **Email Address** — Purposes: App Functionality, Account Management
- **Name** — Purposes: App Functionality (displaying who owns a listing / who sent a message)
- **Phone Number** — Purposes: App Functionality, Account Management
- **Physical Address** — Purposes: App Functionality (only if the user enters it for shipping/billing)

### Financial Info
- **Payment Info** — Purposes: App Functionality. **Note:** we process this via Razorpay; we do not store card details. Apple still requires this to be declared because a payment happens inside the app.

### User Content
- **Photos or Videos** — Purposes: App Functionality (product images, ad banners, verification documents, avatars)
- **Customer Support** — Purposes: App Functionality (in-app chat messages)
- **Other User Content** — Purposes: App Functionality (product descriptions, feedback text, reviews)

### Identifiers
- **User ID** — Purposes: App Functionality (our internal user id, tied to sessions)
- **Device ID** — Purposes: App Functionality (push notification token). **Not** used for tracking.

### Usage Data
- **Product Interaction** — Purposes: App Functionality (recording views, cart, favorites), Product Personalization (recommending relevant listings)

### Diagnostics
- **Crash Data** — Only if you enable Sentry / Crashlytics later. Right now: **No, we do not collect this**.
- **Performance Data** — Same as above: **No**.

### Sensitive Info
- **Government ID (Aadhaar)** — Purposes: App Functionality (KYC / business verification). Under Apple's schema this falls under "Sensitive Info → Other Info". Declare it and explain in the description field: "Business owners upload identity documents to verify a listing. Used only for verification."

## Data NOT collected
Explicitly **do not** check any of these:
- Precise Location
- Coarse Location
- Health & Fitness
- Contacts
- Browsing History
- Search History (any browsing outside our app)
- Audio Data
- Advertising Data (Ad IDs / IDFA — we do not use)

## App Tracking Transparency
Because we do **not** track users across other companies' apps or websites, you should:
- **Not** include `NSUserTrackingUsageDescription` in Info.plist
- **Not** call `requestTrackingAuthorization`
- Answer "Used for tracking: NO" for every data type above

---
---

# Info.plist usage descriptions you must set

Apple will reject the build if any privacy-sensitive API is used without a matching `NS...UsageDescription` in `Info.plist`. Based on the SDKs ARVANN uses, set at least:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>ARVANN needs access to your photos so you can upload product images and verification documents.</string>

<key>NSCameraUsageDescription</key>
<string>ARVANN uses your camera when you choose to take a new photo for a product listing.</string>
```

(Camera key only if the image picker offers "take photo"; if it only allows library pick, you can omit it — but including it is safer since Apple sometimes flags either way.)

Push notifications are prompted at runtime via `expo-notifications`; no plist string required.

Sign in with Apple requires an entitlement (not a plist string) — Expo handles this via `app.json` config.

---
---

# Hosting the privacy policy — three easy options

You need a URL that Apple can visit at any time. Pick one:

### Option A — Add it to your web frontend (recommended)
Serve this document at `https://arvann.in/privacy` (whatever your web-frontend domain is). Convert the markdown to HTML, drop it into a static route in the web-frontend, deploy. Cost: nothing (you already host web-frontend). Lets you brand the page. Best long-term option.

### Option B — GitHub Pages
Create a public repo `arvann/privacy-policy`, add this file as `index.md`, enable Pages. You get a URL like `https://<username>.github.io/privacy-policy`. Free, works forever, but the URL isn't branded.

### Option C — Free hosted page
Publish this markdown as a public Notion / Google Docs / anything with a stable public URL. Fastest for launch day; not the most professional.

Whatever you pick, **the URL must load without login** and must resolve reliably. Apple will access it during review.

---
---

# What to do next (checklist)

- [ ] Fill in the three placeholders (`OWNER_NAME`, `CONTACT_EMAIL`, `BUSINESS_ADDRESS`) in this document.
- [ ] **Have a lawyer review it if you plan to have any real revenue or user data** — this is a solid draft based on what ARVANN does, but a lawyer familiar with Indian IT rules (SPDI Rules, DPDPA 2023) should read it before you go live.
- [ ] Host it at a stable URL (Option A / B / C above).
- [ ] In App Store Connect → App Information → paste the URL under "Privacy Policy URL".
- [ ] In App Store Connect → App Privacy → click through the questionnaire using the cheat sheet above.
- [ ] Add the `NSPhotoLibraryUsageDescription` (and camera if needed) to your Info.plist / `app.json` `ios.infoPlist`.
- [ ] For the App Store submission itself: also prepare screenshots, an app icon, keywords, and the App Review notes.

That's it. The privacy policy is the biggest legal item; everything else Apple asks for is boilerplate marketing.
