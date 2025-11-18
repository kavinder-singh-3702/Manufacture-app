# Manufacture App

Unified manufacturing ecosystem spanning B2B trade, e-commerce, services, record-keeping, and business enablement. The project houses a React Native client (`app-frontend`) and a Node.js + Express + MongoDB backend (`backend`).

---

## Domain Scope
- **Manufacture-to-Manufacture Market:** Listings, search, negotiation, chat/call, ratings.
- **Client E-Commerce Store:** Catalog, cart, checkout, payments, order history.
- **Service Marketplace:** Transport, manpower, repair bookings with status tracking.
- **Business Support:** Knowledge base, starter packages, mentorship.
- **Record Management:** Finances, invoices, inventory, exports, dashboards.
- **Communication & Support:** Real-time chat, calls, helpdesk, notifications.
- **Advertising & Promotions:** Admin + self-serve ads, boosts, analytics.

---

## Tech Stack & Integrations
- **Frontend:** React Native (Expo/CLI) targeting Android + iOS.
- **Backend:** Node.js, Express 5, MongoDB (Atlas) with Mongoose.
- **Storage:** AWS S3 or Firebase Storage for media uploads.
- **Auth & Messaging:** JWT for API auth, Socket.io or Firebase for chat, Twilio/Agora for calling.
- **Payments:** Razorpay or Stripe SDK + webhook processing.
- **Notifications:** Firebase Cloud Messaging (FCM).
- **Observability:** Morgan, custom logger, future Sentry/New Relic hooks.

---

## Local Development

### Backend
1. `cd backend`
2. `cp .env.example .env` and update `MONGO_URI`, `PORT`, API secrets.
3. `npm install`
4. `npm run dev`

Key folders:
- `src/config` – environment + Mongo helpers.
- `src/routes` & `src/controllers` – feature APIs (expand per module).
- `src/middleware` – errors, auth, rate limiting, etc.

Current auth/user endpoints:
- `POST /api/auth/register` – create manufacturer/dealer/service-provider/entrepreneur accounts with company metadata.
- `POST /api/auth/login` – email or phone + password exchange for JWT.
- `GET /api/users/me` – fetch profile (requires `Authorization: Bearer <token>`).
- `PATCH /api/users/me` – update business/contact details for the authenticated user.

### Company Verification Flow
- `POST /api/companies/:companyId/verification` – authenticated company owners upload GST & Aadhaar documents (Base64) that are pushed to the configured S3 bucket.
- `GET /api/companies/:companyId/verification` – fetch the latest verification status for the active company, including reviewer notes and document metadata.
- `GET /api/verification-requests?status=pending` – admin-only queue of submitted requests (filter by `pending`, `approved`, `rejected`, or omit for all).
- `PATCH /api/verification-requests/:requestId` – admin decision endpoint; pass `{ action: "approve" }` or `{ action: "reject", rejectionReason }` with optional reviewer notes to update the company status.

The React Native profile screen now surfaces this flow end-to-end, while the Next.js web console exposes an admin dashboard under `/admin/verification-requests` for moderation.

### Frontend
1. `cd app-frontend`
2. `npm install` (or `yarn install`)
3. Configure `.env`/app config for API base URL, Firebase, Razorpay keys.
4. `npm run start` (Metro bundler) and launch on Android/iOS.

Keep API contracts documented (OpenAPI/Swagger) to sync both ends.

---

## Required Environment Variables
| Variable | Purpose |
| --- | --- |
| `NODE_ENV`, `PORT` | Server environment + port. |
| `MONGO_URI` | MongoDB Atlas connection string. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Auth tokens. |
| `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY` | Media storage (GST/Aadhaar uploads). |
| `AWS_S3_UPLOADS_FOLDER` | Optional folder prefix for S3 uploads. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET` (or Stripe keys) | Payments + webhooks. |
| `FCM_SERVER_KEY` | Push notifications. |
| `TWILIO_* / AGORA_*` | Voice/video integration. |

Mirror any new secrets in `.env.example` without real values.

---

## Implementation Workflow
1. **Foundation**
   - Harden backend scaffolding (lint/tests, logging, error responses).
   - Establish shared UI kit, navigation, and state management (Redux/RTK Query, Recoil, or Zustand).
   - Create OpenAPI spec + Postman collection for APIs.
2. **Authentication & Roles**
   - Email/phone OTP flows, admin verification queue, role-based access control.
   - Profile onboarding forms with document upload + moderation.
3. **Manufacture-to-Manufacture Dealing**
   - Product CRUD, categories, search/filter, pagination.
   - Negotiation chat/call, transaction audit logs, review system.
4. **E-Commerce Storefront**
   - Client catalog, cart, checkout, Razorpay/Stripe integration, webhook handling, order history + invoices.
5. **Service Marketplace**
   - Service listings, booking flow (Request → Completed), notification hooks, provider dashboards.
6. **Business Support & Mentorship**
   - Static CMS-like content, FAQ, optional subscription packages.
7. **Record Management**
   - Money/stock/bill schemas, CRUD, upload receipts, export to CSV/PDF, analytics widgets.
8. **Comms & Advertising**
   - Real-time chat (Socket.io/Firebase), helpdesk, admin + manufacturer ads, boosting, impressions tracking.
9. **QA & Deployment**
   - E2E tests (Playwright/Detox), load tests, CI/CD pipelines, staging + production releases.

Each module should include API validators, data models, mobile screens, and analytics/events.

---

## Milestone Timeline (1.5–2 Months)
| Week | Goals |
| --- | --- |
| **Week 1** | Finalize requirements, architecture, ERD, design system, CI scaffolding. |
| **Week 2** | Auth service (signup/login/OTP), role setup, profile onboarding UI, base navigation. |
| **Week 3** | M2M product listings + search API/UI, chat schema stub, media uploads. |
| **Week 4** | E-commerce cart/checkout, payment gateway integration, order tracking, invoices. |
| **Week 5** | Service marketplace bookings + notifications, business support content, record schemas. |
| **Week 6** | Record management UI, exports, dashboards, ads module MVP, helpdesk/chat wiring. |
| **Week 7** | Integrations hardening (Socket.io, FCM, S3), QA cycles, load/security testing. |
| **Week 8** | Polish, analytics, deployment to stores/testflight, production backend rollout. |

Adjust per team velocity; backlog any optional features (AI chatbot, advanced recommendations) for Phase 2.

---

## Integration Checklist
- **API Security:** JWT, rate limiting, data validation, audit logs.
- **Media Uploads:** Signed URLs + CDN caching, background processing for large files.
- **Real-time Stack:** Socket.io namespace per module or Firebase channels, chat storage in Mongo + S3 attachments.
- **Notifications:** FCM topic strategy (orders, services, chat), expo push for RN testing.
- **Payments:** Webhook endpoint with signature validation, reconciliation scripts, invoice PDFs.
- **Analytics & Monitoring:** Mixpanel/Segment for product metrics, server health dashboards, alerting.
- **DevOps:** Dockerfiles, GitHub Actions workflows, environment promotion strategy (dev → staging → prod).

---

## Contribution Notes
- Use feature branches (`feature/m2m-listings`, etc.) and open PRs against `main`.
- Keep backend lint/tests passing before merge.
- Document API changes in Swagger + notify mobile team.
- Tag releases per milestone (e.g., `v0.3-m2m-alpha`).

This README should evolve alongside the SRS—update milestones, integrations, and workflows as the roadmap matures.
