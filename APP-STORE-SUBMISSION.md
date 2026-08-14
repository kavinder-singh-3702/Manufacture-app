# ARVANN — App Store Submission Guide

Everything you need to fill in App Store Connect, plus the build commands.
Written for **build 2** (resubmission after the Guideline 2.1 rejection).

---

## 0. Before you start

Confirm these are done:

- [ ] Backend pulled + restarted (`git pull && pm2 restart <backend>`) — the account-deletion, report, and block endpoints are new
- [ ] Web frontend deployed — `https://arvann.in/privacy-policy` loads and shows "Effective August 8, 2026"
- [ ] `app.config.js` shows `buildNumber: "2"` (already committed)

---

## 1. What changed since the rejected build

Use this to write your response to App Review.

| Rejection reason | Fix shipped in build 2 |
|---|---|
| Guideline 2.1 — placeholder "Coming Soon" / "Under Development" content | Profile tab placeholder replaced with a functional Profile hub. "Coming soon" chip on Services renamed to "Unavailable". No placeholder wording anywhere in the bundle. |
| (proactive) Guideline 5.1.1(v) — account deletion | Added Profile → Delete Account with a real backend purge |
| (proactive) Guideline 5.1.1 — privacy policy in app | Added Profile → Privacy Policy, plus a link on the sign-in screen |
| (proactive) Guideline 1.2 — UGC safety | Added Report on listings and users, Block users, and an admin moderation queue |
| (proactive) permission accuracy | Camera / photo usage strings now name every real use |

---

## 2. App Privacy questionnaire

App Store Connect → your app → **App Privacy** → Edit.

### Global answer

**"Do you or your third-party partners collect data from this app?"** → **Yes**

For every data type below, the answers are the same unless noted:
- **Linked to the user?** → **Yes**
- **Used for tracking?** → **No** (we never track across other companies' apps or sites)

### Data types to CHECK

| Category | Data type | Purposes |
|---|---|---|
| Contact Info | Email Address | App Functionality |
| Contact Info | Name | App Functionality |
| Contact Info | Phone Number | App Functionality |
| Contact Info | Physical Address | App Functionality *(only when a user enters shipping/billing details)* |
| User Content | Photos or Videos | App Functionality *(product images, verification documents, chat attachments, avatars)* |
| User Content | Customer Support | App Functionality *(in-app chat messages)* |
| User Content | Other User Content | App Functionality *(product descriptions, feedback text)* |
| Identifiers | User ID | App Functionality |
| Identifiers | Device ID | App Functionality *(Expo push notification token only)* |
| Usage Data | Product Interaction | App Functionality, Product Personalization |
| Sensitive Info | Other Sensitive Info | App Functionality — description: *"Business owners may upload GST certificates or identity documents (including Aadhaar) to verify their company listing. Used only for compliance verification and visible only to internal verification admins."* |

### Do NOT declare Payment Info

ARVANN does not process online payments anywhere — not in the app, not on
the website. Buying happens off-platform: buyers request a quote or
contact the seller, and payment is settled directly between them.

In the app, checkout is off behind `IN_APP_CHECKOUT_ENABLED` in
`src/constants/features.ts`, and the "Buy Now" branch in
`ProductDetailsScreen` is commented out. Products surface "Get Quote" or
"Contact to Purchase" instead. The `react-native-razorpay` SDK is still
bundled but unreachable — an unused dependency is not a violation, so
there's no need to strip it before this submission.

Declaring *Financial Info → Payment Info* would therefore over-declare
against actual behaviour.

> If online payment is ever switched on, you must come back and add
> *Financial Info → Payment Info* here, and update the privacy policy to
> name the payment processor.

### Data types to LEAVE UNCHECKED

Do **not** check any of these — we genuinely don't collect them:

- Precise Location, Coarse Location
- Health & Fitness
- Contacts
- Browsing History
- Search History *(we log in-app product searches under Product Interaction, not this category)*
- Audio Data
- **Advertising Data / Ad IDs / IDFA** — we run only our own internal marketplace ads, no third-party ad networks
- Crash Data, Performance Data, Other Diagnostic Data — no Sentry/Crashlytics installed

### App Tracking Transparency

We do **not** use ATT. Confirm:
- No `NSUserTrackingUsageDescription` in Info.plist ✅ (verified — not present)
- No `requestTrackingAuthorization` call ✅ (verified — not present)
- "Used for tracking" answered **No** for every data type above

---

## 3. App Information

| Field | Value |
|---|---|
| Privacy Policy URL | `https://arvann.in/privacy-policy` |
| Support URL | `https://arvann.in/support` |
| Marketing URL (optional) | `https://arvann.in` |
| Primary Category | Business |
| Secondary Category | Shopping *(or Productivity)* |
| Content Rights | Check the box confirming you have rights to all content |
| Age Rating | Complete the questionnaire — expect 4+ (no objectionable content, but the UGC questions may push it to 17+; answer honestly: user-generated content **is** present and **is** moderated) |

### Export compliance

When asked *"Does your app use encryption?"*:
- Answer **Yes** (HTTPS counts)
- Then *"Does your app qualify for any of the exemptions?"* → **Yes** — standard encryption only (HTTPS/TLS), exempt under category 5D992.c

---

## 4. App Review Information

### Sign-in required
**Yes** — provide a demo account.

### Demo account

```
Username: abj11kickshot@gmail.com
Password: <paste from your password manager — see note below>
```

**The password is deliberately not committed here.** This repo is shared
and may go public, and plaintext credentials in git trip secret scanners.
Keep it wherever you keep passwords and paste it straight into App Store
Connect.

This is a disposable account created purely for review — non-admin, no
real customer data, populated by `npm run seed:demo-account`. Two
consequences worth knowing:

- Reviewers **can** be invited to exercise the account-deletion flow,
  because losing this account costs nothing. That's a stronger signal
  than asking them not to touch it.
- Nothing in it is confidential, so there's no need to audit chat threads
  before submitting.

> Never submit an admin account. A reviewer browsing the admin sidebar
> would see User Management with every real user's email and phone number,
> which contradicts the privacy policy's "accessible only to internal
> verification admins".

### Notes to reviewer

Copy-paste this:

```
ARVANN is a B2B industrial marketplace for Indian manufacturers,
traders, and buyers. Users list products, negotiate via quotes and
in-app chat, and manage GST-compliant accounting.

This build addresses the previous rejection under Guideline 2.1
(App Completeness). The Profile tab previously rendered a placeholder
screen reading "Coming Soon" / "Under Development"; it now shows a
functional Profile hub with working navigation. All placeholder
wording has been removed from the bundle.

Also included in this build:

- Account deletion (Guideline 5.1.1(v)): Profile > Delete Account.
  The confirmation screen lists exactly what is deleted and what is
  retained. Completing it requires typing DELETE plus the account
  password, then permanently anonymizes the account, unpublishes the
  user's listings, purges push tokens and personal data, and signs the
  user out on all devices.

  The account above was created solely for this review and holds no real
  customer data, so please feel free to run the deletion end to end if
  you wish to verify it. If you do and then need access again, let us
  know in Resolution Center and we will provide fresh credentials
  immediately.

- Privacy policy in-app (Guideline 5.1.1): Profile > Privacy Policy.
  Also linked from the sign-in screen before account creation, and
  publicly at https://arvann.in/privacy-policy

- User-generated content safety (Guideline 1.2):
  * Report a listing: open any product you do not own, tap the flag
    icon in the top bar, choose a reason.
  * Report or block a user: open any chat, tap the three-dot menu in
    the header.
  * Blocked users can no longer message each other in either
    direction.
  * Reports route to an admin moderation queue (admin accounts only:
    sidebar > Moderation).

ARVANN does not process payments in the app. Buyers request a quote or
contact the seller directly, and payment is settled off-platform between
the two businesses. There is no in-app purchase flow to test.

We do not use any third-party analytics or advertising SDKs. Ads shown
in the app are our own marketplace promotions for products already
listed on ARVANN.
```

---

## 5. Build and submit

```bash
cd app-frontend

# Production build (uses APP_VARIANT=prod bundle id)
eas build --platform ios --profile production

# Once the build finishes, submit it
eas submit --platform ios
```

Then in App Store Connect:
1. Go to your app → the version → **Build** section
2. Select the newly uploaded build (should show as **1.0.0 (2)**)
3. Fill everything in sections 2–4 above
4. **Add for Review** → **Submit**

---

## 6. Reviewer walkthrough (what they'll test)

Sanity-check each of these on a real device with the demo account **before** submitting:

- [ ] Sign in with the demo credentials
- [ ] Browse products, open a product detail
- [ ] Tap the flag icon on someone else's listing → report sheet opens → submit works
- [ ] Open a chat → three-dot menu → Report user and Block user both work
- [ ] Profile → Privacy Policy → renders the full policy
- [ ] Profile → Delete Account → warning screen renders (do **not** actually delete the demo account)
- [ ] Every bottom tab opens a functional screen (no placeholders)
- [ ] Rotate to landscape on iPad — layout holds
- [ ] Add an item to the cart — confirm **no** "Proceed to Payment" button appears (in-app checkout is off; a reviewer reaching a payment screen that fails is a Guideline 2.1 rejection)

---

## 7. Guideline 2.1 "Information Needed" — standing reply

Apple asked for this on the first 1.0 submission (2026-08-11). It is an
**information request, not a rejection** — nothing is broken, review simply
pauses until you reply in Resolution Center.

They ask seven things. Put the answers in the **Notes** field of App Review
Information on every future submission and this shouldn't recur.

### Screen recording (item 1)

Record on a **physical iPhone**, not a simulator. Control Centre screen
recorder is fine. 3–5 minutes. Apple named specific flows, so hit each:

1. Launch from the home screen (they want the cold start)
2. Register a new account, including OTP entry
3. Log out, then log back in
4. Browse: Home → category → product detail
5. Trigger the photo-library permission prompt (Edit product → Add photo)
6. Report a listing: flag icon → reason → Submit
7. Block a user: seller chat → ⋯ → Block
8. Request a quote (our equivalent of a purchase flow)
9. Accounting dashboard showing real figures
10. **Account deletion, completed end to end** — do this last

Upload to Drive/Dropbox with link sharing on, paste the link into item 1.

After recording deletion, create a fresh account and update the credentials
in both App Store Connect and item 4.

### The reply

Fill the two placeholders (video link, device models), then paste:

```
Thank you for reviewing ARVANN. Responses to each item below.

1. SCREEN RECORDING
A screen recording captured on a physical iPhone running iOS 26 is
available here: [PASTE YOUR LINK]
It covers app launch, account registration with email OTP verification,
login, browsing and product detail, the photo-library permission prompt,
content reporting, user blocking, the quote request flow, the accounting
dashboard, and the full account deletion flow.

2. DEVICES AND OS TESTED
- iPhone [MODEL], iOS 26.5.2
- iPad [MODEL], iPadOS 26 (the app supports tablet layouts and rotation)

3. APP FUNCTION AND TARGET AUDIENCE
ARVANN is a business-to-business marketplace for the Indian
manufacturing sector. The target audience is manufacturers, traders,
wholesalers, and industrial buyers - typically small and medium
enterprises.

Problem it solves: sourcing industrial materials in India still happens
largely over phone calls and WhatsApp, with no structured record of who
quoted what. Small manufacturers also lack affordable GST-compliant
bookkeeping.

ARVANN provides: a searchable catalogue across 16+ manufacturing
categories; verified company profiles backed by GST and identity
document review; structured quote requests where sellers respond with
unit price, minimum order quantity, and lead time; real-time buyer-
seller messaging; and integrated GST-compliant invoicing with inventory
that updates automatically from those invoices.

ARVANN does not process payments. Buyers and sellers agree commercial
terms in the app and settle directly between themselves off-platform.
There is no in-app purchase, subscription, or paid content of any kind.

4. SETUP AND ACCESS INSTRUCTIONS
No setup or sample files are required. Sign in with:

  Username: abj11kickshot@gmail.com
  Password: [see password manager]

This account is created solely for review, contains no real customer
data, and is pre-populated with 8 products, 3 trading parties, and 4
posted invoices so all features are immediately visible.

Where to find each feature:
- Browse catalogue: Home tab > Browse by category
- Product detail and enquiry: tap any product
- Report a listing: open a product you do not own > flag icon in the
  top bar > choose a reason > Submit
- Report or block a user: open any seller chat > three-dot menu in the
  header > Report user / Block user
- Request a quote: open a product > Get Quote
- Chat with a seller: open a product > Message
- Accounting and invoicing: Accounts tab > Accounting
- Inventory: Accounts tab > Inventory
- Your own listings: Profile > Open Company > Products
- Privacy Policy: Profile > Privacy Policy (also linked on the sign-in
  screen before account creation, and at
  https://arvann.in/privacy-policy)
- Account deletion: Profile > Delete Account. Requires typing DELETE
  and the account password. Permanently anonymises the account,
  unpublishes the user's listings, purges push tokens and personal
  data, and signs out all devices. Please feel free to run this end to
  end - the account is disposable. If you need access afterwards, ask
  here and we will supply fresh credentials immediately.

Note on content moderation: reports submitted by users route to an
internal admin moderation queue where they are reviewed and actioned.
That queue is admin-only and is not reachable from the review account,
by design - it would expose other users' personal data.

5. EXTERNAL SERVICES USED
- Amazon Web Services (S3) - storage for product images, verification
  documents, and other uploads
- Sign in with Apple - optional social authentication
- Apple Push Notification service (APNs) - iOS push delivery
- Firebase Cloud Messaging - Android push delivery only; not used on iOS
- SMTP email delivery - signup OTP codes, password reset links,
  verification decisions
- MongoDB - primary application database
- Redis - session storage and real-time message fan-out
- Socket.IO - real-time chat transport

We do not use any analytics SDK, advertising SDK, or AI service. There
is no payment processor integrated in the app, as ARVANN does not
process payments. Advertisements shown in the app are our own
promotions for products already listed on ARVANN; they are not served
by any third-party ad network and involve no cross-app tracking.

6. REGIONAL DIFFERENCES
The app functions identically in all regions where it is available.
There is no region-gated content or functionality.

The app is designed for the Indian market: prices display in INR, and
the invoicing module implements Indian GST rules. These are product
characteristics rather than regional restrictions - the same features
are present for every user regardless of location.

The app is not distributed in China mainland.

7. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
ARVANN does not operate in a regulated industry. It is a listings and
communication platform: it does not sell goods itself, hold inventory,
process payments, act as a financial institution, or provide regulated
professional advice. Transactions are agreed and settled directly
between the two businesses.

The invoicing module is a bookkeeping tool that helps users produce
their own GST-compliant documents. It does not file returns with any
government authority and does not require a licence to provide.

Businesses may optionally upload GST certificates or identity documents
to earn a verified badge. These are supplied voluntarily by the
business about itself, are visible only to internal verification
administrators, and are deleted when the associated company is removed.
This is described in section 2 of our Privacy Policy.

All product listings, images, and descriptions are user-generated by
the listing business. We do not host third-party copyrighted material.

Thank you - happy to provide anything further.
```

---

## 8. Other rejection risks

1. **Guideline 1.2 depth** — if they want per-message reporting (we currently report at the user level from chat), that's a small addition
2. **Demo account content** — if the reviewer's account looks empty, they may flag completeness. Re-run `npm run seed:demo-account`.
3. **Payments** — if asked why there's no purchase flow: ARVANN is an enquiry-and-quote marketplace, buyers and sellers settle off-platform, so there is nothing sold in-app and no in-app-purchase obligation under Guideline 3.1.1

Reply in Resolution Center with specifics: which guideline, what you changed, and where to find it in the app.
