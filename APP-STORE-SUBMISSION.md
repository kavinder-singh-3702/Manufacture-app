# ARVANN — App Store submission

Internal notes for submitting the iOS app. This is not store copy — the
public description, keywords and URLs live in
`~/Desktop/arvann-play-listing.txt` (the full description is shared
between both stores).

Before starting, check that the backend has been pulled and restarted
(account deletion, reports and blocks are all server-side), that
https://arvann.in/privacy-policy loads with the current text, and that
`app.config.js` has a build number higher than anything already uploaded.


## What changed since the rejected build

Build 1 was rejected under Guideline 2.1 because the Profile tab rendered
a placeholder reading "Coming Soon" and "Under Development". That screen
is gone — it now shows a working Profile hub. All placeholder wording was
removed from the bundle, including a "Coming soon" chip on the Services
cards.

Several things were added at the same time, none of which Apple asked for
but all of which they check: account deletion at Profile > Delete Account
(Guideline 5.1.1(v)); the privacy policy inside the app at Profile >
Privacy Policy and linked from the sign-in screen (5.1.1); reporting and
blocking for user-generated content plus an admin moderation queue (1.2);
and camera and photo permission strings that name every real use rather
than just product photos.


## App Privacy questionnaire

App Store Connect blocks submission until this is filled in and published.
Answer "Yes" to the opening question about collecting data, then declare
the types below. For every one of them, Linked to the user is Yes and Used
for tracking is No.

| Category | Type | Purpose |
|---|---|---|
| Contact Info | Email Address | App Functionality |
| Contact Info | Name | App Functionality |
| Contact Info | Phone Number | App Functionality |
| Contact Info | Physical Address | App Functionality |
| User Content | Photos or Videos | App Functionality |
| User Content | Customer Support | App Functionality |
| User Content | Other User Content | App Functionality |
| Identifiers | User ID | App Functionality |
| Identifiers | Device ID | App Functionality |
| Usage Data | Product Interaction | App Functionality, Product Personalization |
| Sensitive Info | Other Sensitive Info | App Functionality |

For the Sensitive Info description, use: "Business owners may upload GST
certificates or identity documents (including Aadhaar) to verify their
company listing. Used only for compliance verification and visible only to
internal verification admins."

Leave everything else unticked — Precise and Coarse Location, Health,
Contacts, Browsing History, Search History, Audio Data, Advertising Data,
Crash Data and Performance Data. None of those are collected.

Payment Info stays unticked too. In-app checkout is disabled behind
`IN_APP_CHECKOUT_ENABLED` in `src/constants/features.ts` and the Buy Now
branch in ProductDetailsScreen is commented out, so the app never collects
payment data. The react-native-razorpay SDK is still bundled but never
invoked, which is not a violation. If payments are ever switched on, come
back and add Financial Info > Payment Info here.

Answering No to tracking everywhere is accurate: there are no analytics or
advertising SDKs in any of the three packages, no IDFA, and no
`requestTrackingAuthorization` call. The ads in the app are our own
marketplace promotions.

Remember to click Publish when done. Saving alone leaves it incomplete and
the submission stays blocked.


## App Information

Privacy Policy URL is https://arvann.in/privacy-policy and Support URL is
https://arvann.in/support. Primary category Business, secondary Shopping.
Tick the content rights box.

For export compliance, answer Yes to "does your app use encryption" (HTTPS
counts), then Yes to the exemption question — standard encryption only,
category 5D992.c.

Under Pricing and Availability, deselect China mainland. Distributing there
requires an ICP filing number, which needs a Chinese entity.


## App Review Information

Sign-in required is Yes. Username is abj11kickshot@gmail.com; the password
is deliberately not written here since this repo is shared and may go
public — keep it in a password manager and paste it straight into App Store
Connect.

That account exists solely for review, holds no real customer data, and was
populated by `npm run seed:demo-account`. Because it is disposable,
reviewers can be invited to run the account deletion flow end to end, which
is a stronger signal than asking them to leave it alone.

Never submit an admin account. A reviewer browsing the admin sidebar would
see User Management with every real user's email and phone number, which
contradicts the privacy policy's claim that verification data is visible
only to internal admins.

The Notes field has a 4,000 character limit. The text that goes in it lives
at `~/Desktop/arvann-app-review-notes.txt` — see the next section for why.


## Replying to "Information Needed"

Apple asked for this on the first submission. It is an information request
rather than a rejection: nothing is broken, review simply pauses until you
reply. They ask seven set questions, and putting the answers in the Notes
field on every future submission should stop it recurring.

The prepared reply is at `~/Desktop/arvann-app-review-notes.txt`, trimmed to
fit the 4,000 character limit. Two placeholders need filling before it goes
anywhere: the screen recording link, and your actual device models.

The recording has to be captured on a physical iPhone, not a simulator, and
Apple named the flows they want to see. Start from the home screen so the
cold launch is visible, then register a new account including the OTP step,
log out and back in, browse from Home through a category into a product,
trigger the photo library permission prompt by editing a product and adding
a photo, report a listing you do not own, block a user from a seller chat,
request a quote, show the accounting dashboard, and finish by completing the
account deletion flow.

Do the deletion last, since it destroys the account. Afterwards create a
fresh one, re-seed it, and update the credentials both in App Store Connect
and in item 4 of the reply.

Upload the video to Drive or Dropbox with link sharing turned on. Apple's
attachment field only accepts certain file types and has a size limit, so a
link is more reliable than attaching the file.


## Build and submit

    cd app-frontend
    eas build --platform ios --profile production
    eas submit --platform ios

The build takes ten to fifteen minutes to appear in App Store Connect after
submission. Select it in the Build section of the version page, fill in
everything above, then Add for Review.


## Check on a device first

Sign in as the review account and confirm each of these, because three of
them are backend-dependent and were only recently deployed:

Report a listing from a product you do not own. Report and block a user
from a seller chat. Open a support chat and confirm there is no three-dot
menu, since support must not be blockable. Open the cart and confirm there
is no Proceed to Payment button. Open Profile > Privacy Policy. Open
Profile > Delete Account and check the warning screen renders. Tap the
Privacy Policy link on the sign-in screen while logged out. Confirm every
bottom tab opens something functional. Rotate to landscape on iPad.


## If it comes back again

The most likely remaining issue is Guideline 1.2 depth — reporting
currently works at the user level from chat rather than per message. That
would be a small addition if they ask for it.

If the review account looks empty they may flag completeness, so re-run the
seed script before submitting.

If they ask why there is no purchase flow, the answer is that ARVANN is an
enquiry and quote marketplace. Buyers and sellers settle off-platform, so
nothing is sold in-app and Guideline 3.1.1 does not apply.

Reply in Resolution Center with specifics: which guideline, what changed,
and where to find it in the app.
