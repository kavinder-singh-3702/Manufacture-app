# ARVANN — Google Play Submission Guide

Companion to `APP-STORE-SUBMISSION.md`. Play Console differs from App Store
Connect in ways that catch people out, so this covers the whole path.

---

## 0. The thing that decides your timeline

The Play developer account is a **personal** account, which means Google
requires a **closed test with 12+ opted-in testers running 14 continuous
days** before you can apply for production access.

**Start the closed test before doing anything else.** The clock does not
start until testers are actually opted in and a build is rolled out.
Everything in this guide can be completed while it runs.

### Which track counts

| Track | Counts toward the 14 days? | Notes |
|---|---|---|
| Internal testing | ❌ No | Instant, up to 100 testers. Fine for your own QA, useless for the requirement. |
| **Closed testing** | ✅ **Yes** | This is the one. |
| Open testing | ✅ Yes | Public, anyone can join. |
| Production | — | The goal. |

A common waste of a week is running Internal testing and assuming it counts.

### Testers

12 people, each with a Google account, each of whom **actually clicks the
opt-in link**. Adding an email is not enough — Google counts opted-in
testers. Friends, family, colleagues, Kavinder all count.

---

## 1. Build

```bash
cd app-frontend
eas build --platform android --profile production
```

Produces an `.aab` (Android App Bundle), which is what Play requires.

First run asks about the Android Keystore — let EAS generate and manage it.

> **Back the keystore up afterwards.** With EAS: `eas credentials` and
> download it. With a local Gradle build, it's whatever path
> `ARVANN_UPLOAD_STORE_FILE` points at in `~/.gradle/gradle.properties`.
>
> Note this is the **upload key**, not the app signing key. Because AAB
> uploads require Play App Signing, Google generates and holds the actual
> app signing key and re-signs every build before distribution. So losing
> the upload key is recoverable — request a reset, register a new one.
> It costs days and a support round-trip, not the app. The old "lose the
> keystore, lose the app forever" rule applied to the pre-AAB world where
> you signed the distributed artifact yourself.

`versionCode` auto-increments (see `eas.json`), so repeat builds won't
collide.

---

## 2. Graphics

Play requires assets the App Store does not.

| Asset | Size | Status |
|---|---|---|
| App icon | 512 × 512 PNG, no transparency | ✅ in `assets/brand/` |
| **Feature graphic** | **1024 × 500 PNG/JPG** | ❌ **must create — submission is blocked without it** |
| Phone screenshots | 2–8, min 320px shortest side | Reuse the iOS ones |
| 7" tablet screenshots | optional | App supports tablet, worth adding |
| 10" tablet screenshots | optional | Same |

The feature graphic is the banner across the top of your Play listing.
Logo on the brand gradient with "Source. Connect. Grow." is sufficient —
it does not need to be elaborate, it needs to exist.

---

## 3. Store listing

### App name (30 chars max)
```
ARVANN
```

### Short description (80 chars max)
```
B2B marketplace for Indian manufacturing. Source, quote, chat and invoice.
```

### Full description (4000 chars max)

Reuse the App Store description verbatim — it fits Play's limit and reads
the same. See section 3 of `APP-STORE-SUBMISSION.md`.

Play renders plain text only; the ALL-CAPS section headers used there work
fine as visual structure.

---

## 4. Data safety form

Play's equivalent of Apple's App Privacy. Same underlying truth, different
UI. Declare **collected**, and for each type set *Collected: Yes*,
*Shared: No*, *Processed ephemerally: No*, *Required: Yes* unless noted.

| Category | Type | Purpose |
|---|---|---|
| Personal info | Name | App functionality, Account management |
| Personal info | Email address | App functionality, Account management |
| Personal info | Phone number | App functionality, Account management |
| Personal info | Address | App functionality *(optional — only if user enters one)* |
| Photos and videos | Photos | App functionality |
| Messages | Other in-app messages | App functionality |
| App activity | App interactions | App functionality, Personalisation |
| App info and performance | — | **nothing** — no crash or diagnostics SDK |
| Device or other IDs | Device or other IDs | App functionality *(push token only)* |

**Do NOT declare:** Location, Financial info (no payments), Health,
Contacts, Calendar, Search history from outside the app, Installed apps,
Audio.

**Security practices** — answer:
- Data encrypted in transit: **Yes** (HTTPS throughout)
- Users can request data deletion: **Yes** — and give the in-app path,
  `Profile > Delete Account`
- Committed to Play Families Policy: **No** (app is 18+)
- Independent security review: **No**

---

## 5. Content rating questionnaire

Answer honestly; expect a low rating with one caveat.

- Violence, sexual content, profanity, drugs, gambling → **No** to all
- **Does the app allow users to interact or exchange content?** → **Yes**
  (chat and user listings)
- Does it share user location? → **No**
- Does it allow purchase of digital goods? → **No**

The user-interaction answer will push the rating up slightly and require a
content-moderation declaration. That's fine — you have reporting, blocking,
and an admin moderation queue, all shipped.

---

## 6. App content declarations

| Question | Answer |
|---|---|
| Privacy policy URL | `https://arvann.in/privacy-policy` |
| Ads | **Yes, contains ads** — your own marketplace promotions still count |
| App access | Restricted — provide the review credentials (below) |
| Content rating | See section 5 |
| Target audience | **18 and over** — avoids Families Policy obligations entirely |
| News app | No |
| COVID-19 apps | No |
| Data safety | See section 4 |
| Government app | No |
| Financial features | **No** — the invoicing module is a bookkeeping tool; it moves no money and files nothing with any authority |

### App access credentials

Same review account as iOS:

```
Username: abj11kickshot@gmail.com
Password: <from your password manager>
```

Add instructions in the notes field — reuse item 4 from
`~/Desktop/arvann-app-review-notes.txt`.

---

## 7. Order of operations

```
Today
  1. eas build --platform android --profile production
  2. Back up the keystore (eas credentials)
  3. Play Console > Testing > Closed testing > create track
  4. Upload the AAB
  5. Add 12 testers, send them the opt-in link
  6. Chase them until all 12 have actually opted in   ← clock starts here

During the 14 days
  7. Feature graphic (1024x500)
  8. Store listing copy and screenshots
  9. Data safety form
 10. Content rating questionnaire
 11. App content declarations

After 14 days
 12. Apply for production access
 13. Google reviews (usually a few days)
 14. Promote the closed-test build to production
```

---

## 8. Differences from the App Store worth remembering

| | App Store | Play Store |
|---|---|---|
| Review time | 24–48 h | A few hours to a few days |
| New personal account gate | None | 12 testers × 14 days |
| Feature graphic | Not required | **Required** |
| Privacy declaration | App Privacy | Data safety |
| Binary | `.ipa` | `.aab` |
| Signing key loss | Recoverable via Apple | Recoverable — Play App Signing means Google holds the real key |

Android's total time to public is longer, but review itself is usually
faster and less adversarial. iOS remains the quicker route to launch.
