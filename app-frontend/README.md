# ARVANN — Mobile App (Frontend)

ARVANN is a **B2B manufacturing & trading business management app** built with React Native (Expo).
It serves two types of users — **regular business users** and **admins** — each with their own
set of screens and capabilities.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [App Overview](#app-overview)
3. [User Roles](#user-roles)
4. [Features by Role](#features-by-role)
5. [Project Structure](#project-structure)
6. [Screens Reference](#screens-reference)
7. [Services Reference](#services-reference)
8. [Navigation Architecture](#navigation-architecture)
9. [Environment Variables](#environment-variables)
10. [Local Development Setup](#local-development-setup)
11. [Build Profiles](#build-profiles)
12. [iOS Production Build (App Store)](#ios-production-build-app-store)
13. [Android Production Build](#android-production-build)
14. [EAS Builds (Cloud)](#eas-builds-cloud)
15. [Key Configurations](#key-configurations)
16. [Third-Party Integrations](#third-party-integrations)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript |
| Navigation | React Navigation v7 (native stack + bottom tabs) |
| Real-time | Socket.IO client |
| Payments | Razorpay (`react-native-razorpay`) |
| Charts | `react-native-gifted-charts` |
| Chat UI | `react-native-gifted-chat` |
| Auth tokens | `expo-secure-store` |
| Push notifications | `expo-notifications` |
| Media | `expo-image-picker`, `expo-image-manipulator`, `expo-av`, `expo-video` |
| File handling | `expo-document-picker`, `expo-file-system` |
| Fonts | Space Grotesk via `@expo-google-fonts/space-grotesk` |
| Build tool | EAS Build (Expo Application Services) |

---

## App Overview

- **App name:** ARVANN
- **Bundle ID (prod):** `com.manufactureapp.frontend`
- **Bundle ID (dev):** `com.manufactureapp.frontend.dev`
- **Production API:** `https://api.arvann.in/api`
- **Staging API:** `http://3.108.52.140/api`
- **EAS Project ID:** `de0a7eeb-a054-4057-a4c0-f60640b32765`

The app connects manufacturers, distributors, and traders. Users can browse and order products,
manage their own inventory, raise quotes, track accounting, and chat with support. Admins manage
the platform through a separate set of tabs.

---

## User Roles

The app has **role-based navigation**. Tabs shown depend on the logged-in user's role:

| Role | Description |
|---|---|
| `user` / `guest` | Regular business user — can shop, manage inventory, raise quotes, view accounts |
| `admin` | Platform admin — can manage users, companies, orders, inventory, and ops |
| `super-admin` | Same as admin with elevated access |

Role filtering happens inside `src/navigation/routes.ts` via `getTabsForRole()`.

---

## Features by Role

### Regular User (5 tabs)

| Tab | What it does |
|---|---|
| **Home** (Dashboard) | Overview of business activity and stats |
| **Shop** (Cart) | Browse in-house product catalog, add to cart, checkout with Razorpay |
| **Services** | Browse available services, submit service requests |
| **Accounts** | Accounting dashboard — P&L, GST summary, party outstanding, Tally integration |
| **Profile** | Company profile, personal profile, settings |

**Additional user screens (not tabs):**
- Product details, product variants, product search
- My products (own listings)
- Add / edit product listings (requires company context)
- Internal inventory management
- Quote center
- Real-time chat
- Notifications center
- Company creation, profile, and context switcher
- Company verification flow
- Business setup request
- Sales invoice, purchase bill, receipt/payment entry (Tally-connected)
- Transaction list
- Order checkout and confirmation

### Admin User (5 tabs)

| Tab | What it does |
|---|---|
| **Dashboard** | Platform-wide stats and overview |
| **Inventory** | Manage the in-house product catalog |
| **Orders** | View and manage all user orders |
| **Ops** | Admin chat / operations console |
| **Settings** | User management, company management, verifications, ad studio, notification studio |

---

## Project Structure

```
app-frontend/
├── src/
│   ├── app/                    # App-level providers and entry hooks
│   ├── components/             # Shared UI components
│   │   └── accounting/         # DateRangePicker and accounting-specific components
│   ├── config/
│   │   └── api.ts              # API base URL and socket URL — single source of truth
│   ├── constants/              # App-wide constants
│   ├── hooks/                  # Custom React hooks (useAuth, useTheme, etc.)
│   ├── navigation/
│   │   ├── AppNavigator.tsx    # Root navigation container + all screen registrations
│   │   ├── MainTabs.tsx        # Bottom tab navigator (role-filtered)
│   │   ├── routes.ts           # All route names + TAB_CONFIG (role-based tab definitions)
│   │   ├── types.ts            # TypeScript types for all route params
│   │   ├── navigationRef.ts    # Root navigation ref (for navigating outside React tree)
│   │   └── components/         # AdminOnlyScreen, CompanyContextGuard, FullScreenLoader
│   ├── providers/              # Context providers (auth, theme, company, etc.)
│   ├── screens/
│   │   ├── accounting/         # P&L, GST Summary, Party Outstanding, Accounting Dashboard
│   │   ├── admin/              # User management, companies, verifications, ad/notification studio
│   │   ├── auth/               # Login, Signup, Forgot Password, Reset Password
│   │   ├── business/           # Business setup request
│   │   ├── cart/               # Shop/cart screen, admin product catalog
│   │   ├── chat/               # Real-time chat (user + admin)
│   │   ├── company/            # Company profile, create, context picker
│   │   ├── internalInventory/  # Internal inventory item create/edit
│   │   ├── inventory/          # Product listings, search, filter, variants (user-facing)
│   │   ├── payment/            # Checkout, order confirmation
│   │   ├── product/            # Add/edit product screens
│   │   ├── profile/            # User profile
│   │   ├── quotes/             # Quote center
│   │   ├── services/           # Services overview, service detail, service request
│   │   ├── settings/           # Appearance (dark/light mode), notification preferences
│   │   ├── tally/              # Tally stats, sales invoice, purchase bill, receipt/payment, transactions
│   │   ├── verification/       # Company verification flow
│   │   ├── DashboardScreen.tsx # Main dashboard (user role)
│   │   ├── NotificationsScreen.tsx
│   │   └── StatsScreen.tsx     # Business stats overview
│   ├── services/               # All API calls (one file per domain)
│   ├── theme/                  # Design tokens, colors, gradients, spacing
│   ├── types/                  # Global TypeScript types
│   └── utils/                  # Helper functions
├── assets/
│   └── brand/                  # App icon (1024x1024), splash logo
├── plugins/
│   └── withArvannAndroidReleaseSigning.js  # Custom EAS plugin for Android signing
├── scripts/                    # Build scripts and QA audit tools
├── app.config.js               # Expo dynamic config (app name, bundle IDs, permissions)
├── eas.json                    # EAS build profiles (development, staging, production)
├── privacy-policy.html         # Privacy policy page (host this for App Store submission)
└── package.json
```

---

## Screens Reference

### Auth Screens (`src/screens/auth/`)
| Screen | Purpose |
|---|---|
| `AuthScreen.tsx` | Entry point — routes to login or signup |
| `LoginScreen.tsx` | Email/password login |
| `SignupScreen.tsx` | New user registration |
| `ForgotPasswordScreen.tsx` | Request password reset |
| `ResetPasswordScreen.tsx` | Set new password |

### Accounting Screens (`src/screens/accounting/`)
| Screen | Purpose |
|---|---|
| `AccountingDashboardScreen.tsx` | Summary of all accounting features |
| `ProfitLossScreen.tsx` | P&L report with pie charts, income/expense breakdown |
| `GSTSummaryScreen.tsx` | Input vs output GST, net payable calculation |
| `PartyOutstandingScreen.tsx` | Customer/supplier aging report (0-30, 31-60, 61-90, 90+ days) |

### Tally Screens (`src/screens/tally/`)
| Screen | Purpose |
|---|---|
| `TallyStatsScreen.tsx` | Tally-connected financial stats |
| `SalesInvoiceScreen.tsx` | Create/view sales invoice |
| `PurchaseBillScreen.tsx` | Create/view purchase bill |
| `ReceiptPaymentScreen.tsx` | Record receipt or payment |
| `TransactionListScreen.tsx` | Paginated transaction history |

### Admin Screens (`src/screens/admin/`)
| Screen | Purpose |
|---|---|
| `UserManagementScreen.tsx` | List and manage all users |
| `AdminUserDetailScreen.tsx` | Individual user details |
| `UserPreferenceScreen.tsx` | Manage user preferences |
| `UserActivityScreen.tsx` | View user activity log |
| `VerificationsScreen.tsx` | Approve/reject company verifications |
| `CompaniesScreen.tsx` | View and manage all companies |
| `AdStudioScreen.tsx` | Create and manage in-app ads |
| `NotificationStudioScreen.tsx` | Send push notifications to users |
| `AdminOpsConsoleScreen.tsx` | Operations console |
| `CommandCenterScreen.tsx` | Admin command center |
| `AdminSettingsScreen.tsx` | Admin-level settings |

### Payment Screens (`src/screens/payment/`)
| Screen | Purpose |
|---|---|
| `CheckoutScreen.tsx` | Order review and Razorpay payment trigger |
| `OrderConfirmationScreen.tsx` | Post-payment order confirmation |

---

## Services Reference

All API calls are in `src/services/`. Each file covers one domain:

| File | Covers |
|---|---|
| `auth.service.ts` | Login, signup, password reset |
| `user.service.ts` | User profile CRUD |
| `company.service.ts` | Company profile, creation, context |
| `product.service.ts` | Product catalog CRUD |
| `productVariant.service.ts` | Product variant management |
| `internalInventory.service.ts` | Internal inventory CRUD |
| `quote.service.ts` | Quote creation and management |
| `payment.service.ts` | Order creation, Razorpay integration |
| `accounting.service.ts` | P&L, GST, party outstanding reports |
| `tally.service.ts` | Tally sync and transaction APIs |
| `chat.service.ts` | Chat messages REST API |
| `chatSocket.ts` | Socket.IO real-time chat connection |
| `notification.service.ts` | Notification fetch and management |
| `pushRegistration.service.ts` | Register device push token |
| `notificationNavigation.service.ts` | Deep-link from notification tap |
| `admin.service.ts` | Admin-only platform management APIs |
| `ad.service.ts` | In-app advertising APIs |
| `serviceRequest.service.ts` | Service request submission |
| `verificationService.ts` | Company verification submission |
| `businessSetupRequest.service.ts` | Business setup request |
| `favorites.service.ts` | User product favorites |
| `preference.service.ts` | User preferences |
| `tokenStorage.ts` | Read/write auth token via expo-secure-store |
| `themeStorage.ts` | Persist theme preference |
| `apiClient.ts` | Base HTTP client setup |
| `http/` | Core HTTP layer (all requests go through here) |

---

## Navigation Architecture

```
AppNavigator (root stack, no header)
├── Auth screen (shown when not logged in)
└── Main (shown when logged in)
    ├── MainTabs (bottom tab bar — tabs filtered by role)
    │   ├── User tabs: Dashboard, Shop, Services, Accounts, Profile
    │   └── Admin tabs: Dashboard, Inventory, Orders, Ops, Settings
    └── Stack screens (push on top of tabs)
        ├── Profile, Appearance, NotificationPreferences
        ├── Cart (modal)
        ├── CompanyProfile, CompanyCreate, CompanyContextPicker (modal)
        ├── CompanyVerification, VerificationSubmit (modal)
        ├── Notifications (modal)
        ├── ProductDetails, ProductSearch, FilteredProducts, CategoryProducts
        ├── AddProduct, EditProduct, ProductVariants
        ├── InternalInventoryItemCreate, InternalInventoryItemEdit
        ├── QuoteCenter, Chat
        ├── ServiceDetail, ServiceRequest
        ├── ProfitLoss, GSTSummary, PartyOutstanding
        ├── TallyStats, SalesInvoice, PurchaseBill, ReceiptPayment, TransactionList
        ├── Checkout, OrderConfirmation
        └── Admin-guarded screens (UserManagement, Companies, Verifications, AdStudio, etc.)
```

**Guards used in navigation:**
- `withAdminGuard` — blocks non-admins from admin-only screens
- `withCompanyContextGuard` — requires a company to be selected before proceeding

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL (e.g. `https://api.arvann.in/api`) | Yes |
| `APP_VARIANT` | `dev` or `prod` — controls bundle ID and behavior | Yes |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Razorpay publishable key | Yes |

For local development, create a `.env` file in `app-frontend/`:

```bash
EXPO_PUBLIC_API_URL=http://3.108.52.140/api
APP_VARIANT=dev
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_REPLACE_ME
```

> The `EXPO_PUBLIC_` prefix is required for Expo to expose variables to the client bundle.

---

## Local Development Setup

```bash
# 1. Install dependencies
cd app-frontend
npm install

# 2. Install iOS pods (Mac only)
npx pod-install

# 3. Start the development server
npm start

# 4. Run on a connected device or simulator
npm run ios      # iOS simulator
npm run android  # Android emulator
```

For TypeScript checking without running the app:

```bash
npm run typecheck
```

---

## Build Profiles

Defined in `eas.json`:

| Profile | Variant | API URL | Notes |
|---|---|---|---|
| `development` | `dev` | Staging API | Dev client — for Expo Go or dev build |
| `preview` | `dev` | Staging API | Internal APK for quick testing |
| `staging` | `dev` | Staging API | Internal APK via GitHub Actions |
| `production` | `prod` | `https://api.arvann.in/api` | App Store / Play Store release |

---

## iOS Production Build (App Store)

### Prerequisites
- Mac with Xcode installed
- Apple Developer account
- EAS CLI: `npm install -g eas-cli`
- Logged into EAS: `eas login`

### Build with EAS (recommended)

```bash
eas build --platform ios --profile production
```

EAS handles signing automatically using managed credentials.

### Submit to App Store

```bash
eas submit --platform ios --profile production
```

You will need to set in `eas.json` → `submit.production.ios`:
- `appleId` — your Apple ID email
- `ascAppId` — App Store Connect app ID
- `appleTeamId` — your Apple team ID

### Privacy Policy
A `privacy-policy.html` file is included. Host it at a public URL
(e.g. `https://www.arvann.in/privacy-policy`) and add that URL in
App Store Connect under **App Information → Privacy Policy URL**.

---

## Android Production Build

### EAS Cloud Build (recommended)

```bash
eas build --platform android --profile production
```

Output: `.aab` (Android App Bundle) for Play Store.

### Local Gradle Build

Produces a signed `.apk` locally (useful for testing without EAS):

```bash
# One-time setup: download Android credentials from EAS
eas credentials -p android
# Save the downloaded credentials.json in app-frontend/

# Build
npm run apk:gradle:prod
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## EAS Builds (Cloud — GitHub Actions)

The repo has a GitHub Actions workflow (`Build Android APK`) that builds
staging APKs automatically.

**To trigger manually:**
1. Go to GitHub Actions → `Build Android APK`
2. Click `Run workflow`
3. Select `build_profile` (`staging` or `production`)
4. Run

**Required GitHub secret:**
- `EXPO_TOKEN` — your Expo account token (`Settings → Secrets and variables → Actions`)

---

## Key Configurations

### `app.config.js`
- Sets app name (`ARVANN`), bundle IDs, icon, splash screen
- iOS permissions declared here:
  - Camera (`NSCameraUsageDescription`)
  - Photo library (`NSPhotoLibraryUsageDescription`)
- Android permissions declared here:
  - `INTERNET`, `CAMERA`, `READ/WRITE_EXTERNAL_STORAGE`, `NOTIFICATIONS`
- Push notification icon and color

### `src/config/api.ts`
- Single file that exports `API_BASE_URL` and `SOCKET_BASE_URL`
- All services and the chat socket import from here — never hardcode URLs elsewhere
- Throws an error at startup if `EXPO_PUBLIC_API_URL` is missing or if prod uses HTTP

### `src/navigation/routes.ts`
- Single source of truth for all route names (`routes` object)
- `TAB_CONFIG` array defines all tabs with their role restrictions
- `getTabsForRole(role)` filters tabs for the current user

---

## Third-Party Integrations

| Integration | Purpose | Key files |
|---|---|---|
| **Razorpay** | Payment processing for shop orders | `src/services/payment.service.ts`, `src/screens/payment/CheckoutScreen.tsx` |
| **Socket.IO** | Real-time chat | `src/services/chatSocket.ts` |
| **Expo Notifications** | Push notifications | `src/services/pushRegistration.service.ts`, `src/services/notificationNavigation.service.ts` |
| **Expo Secure Store** | Secure auth token storage | `src/services/tokenStorage.ts` |
| **Tally** | Accounting sync (sales invoice, purchase bill, transactions) | `src/services/tally.service.ts`, `src/screens/tally/` |
