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

The in-app Razorpay checkout is currently disabled — the "Buy Now" branch
in `ProductDetailsScreen` is commented out, and products show "Get Quote"
or "Contact to Purchase" instead. The iOS app therefore **never collects
payment information**, so declaring *Financial Info → Payment Info* would
over-declare against actual behaviour.

The `react-native-razorpay` SDK is still bundled but is never invoked. An
unused dependency is not a violation, so there's no need to strip it
before this submission.

> If in-app checkout is ever re-enabled, you must come back and add
> *Financial Info → Payment Info* here.

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

Create one on production before submitting, then fill in:

```
Username: <your demo email>
Password: <your demo password>
```

> Make sure this account has: a verified company, a few products with images, at least one posted sales invoice, and one support chat thread. Reviewers judge the app by what this account sees.

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
  Requires typing DELETE plus password confirmation, then permanently
  anonymizes the account, unpublishes the user's listings, purges push
  tokens and personal data, and signs the user out on all devices.

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

Payments are processed by Razorpay. Test purchases can be completed
using Razorpay test-mode cards if needed - please contact us and we
will enable test mode for the review period.

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

---

## 7. If Apple rejects again

Most likely remaining risks, in order:

1. **Guideline 1.2 depth** — if they want per-message reporting (we currently report at the user level from chat), that's a small addition
2. **Demo account content** — if the reviewer's account looks empty, they may flag completeness. Seed it well.
3. **Payments** — if they can't complete a purchase, enable Razorpay test mode and tell them in the notes

Reply to rejections in Resolution Center with specifics: which guideline, what you changed, and where to find it in the app.
