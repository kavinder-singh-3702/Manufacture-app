# Backend Production Deployment README

This document explains how the `backend` is deployed to production, how to verify it, and what infrastructure it depends on.

Important: do not commit raw production secrets, private keys, passwords, tokens, full MongoDB URIs, Redis passwords, SMTP passwords, Razorpay secrets, or AWS secret keys into this repository. Production credentials live on the EC2 host in `/srv/manufacture/backend/.env` and must be shared only through an approved secure channel.

## Current Production Topology

```text
Public API:        https://api.arvann.in/api
Frontend:          https://arvann.in
EC2 public IP:     13.206.204.61
EC2 SSH user:      ubuntu
SSH key path:      /Users/kavin/Documents/ssl keys/Arvann.pem
Backend path:      /srv/manufacture/backend
Frontend path:     /srv/manufacture/web-frontend
Backend service:   manufacture-backend (systemd, pm2-runtime cluster, 2 workers)
Frontend service:  manufacture-web (systemd, Next.js server)
Backend port:      4000 (proxied by Nginx for api.arvann.in)
Frontend port:     3000 (proxied by Nginx for arvann.in)
Reverse proxy:     Nginx
Database:          MongoDB Atlas, database `manufacture`
Redis:             Native redis-server (systemd) on 127.0.0.1:6379 (NOT Docker)
S3 bucket:         arvann-prod-uploads
S3 region:         ap-south-1
Uploads prefix:    uploads
Support email:     arvann100@gmail.com
```

The frontend is a Next.js server (SSR + ISR), not a static export. Public
product/seller detail pages are server-rendered for per-item metadata, Open
Graph tags and JSON-LD, and `next.config.ts` owns redirects, rewrites and
security headers — so Nginx must proxy to the running Next server, not serve
static files.

Request flow:

```text
Client -> api.arvann.in HTTPS -> Nginx -> 127.0.0.1:4000 -> PM2 cluster workers (backend)
                                              |
                                              +-> MongoDB Atlas
                                              +-> Redis (native redis-server)
                                              +-> AWS S3 via EC2 IAM role
                                              +-> SMTP

Client -> arvann.in HTTPS     -> Nginx -> 127.0.0.1:3000 -> Next.js server (web-frontend)
```

## Credential Policy

The user asked for credentials to be documented with no masking. That is intentionally not done here because this file is committed to git and visible to other people. Raw secrets in git are a production incident.

Do not commit these values:

```text
MONGO_URI
REDIS_URL
JWT_SECRET
SESSION_SECRET
ADMIN_INVITE_TOKEN
SMTP_USER
SMTP_PASS
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
EXPO_PUSH_ACCESS_TOKEN
AWS_S3_ACCESS_KEY_ID
AWS_S3_SECRET_ACCESS_KEY
Private SSH key contents
```

Where secrets actually live:

```text
Production env file: /srv/manufacture/backend/.env
SSH private key:     /Users/kavin/Documents/ssl keys/Arvann.pem
```

Safe env audit command, without printing secret values:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  cd /srv/manufacture/backend
  for key in NODE_ENV PORT MONGO_URI REDIS_URL JWT_SECRET SESSION_SECRET ADMIN_INVITE_TOKEN SMTP_USER SMTP_PASS AWS_S3_BUCKET AWS_S3_REGION SUPPORT_EMAIL; do
    if grep -qE "^${key}=" .env; then
      value=$(grep -E "^${key}=" .env | tail -1 | cut -d= -f2-)
      case "$key" in
        MONGO_URI|REDIS_URL|JWT_SECRET|SESSION_SECRET|ADMIN_INVITE_TOKEN|SMTP_USER|SMTP_PASS)
          printf "%s=present(len=%s)\n" "$key" "${#value}"
          ;;
        *)
          printf "%s=%s\n" "$key" "$value"
          ;;
      esac
    else
      printf "%s=missing\n" "$key"
    fi
  done
'
```

## Required Production Environment

These values must exist in `/srv/manufacture/backend/.env`.

Non-secret current values:

```env
NODE_ENV=production
PORT=4000
TRUST_PROXY=true
SESSION_NAME=mf.sid
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
SESSION_COOKIE_DOMAIN=.arvann.in
AWS_S3_BUCKET=arvann-prod-uploads
AWS_S3_REGION=ap-south-1
AWS_S3_UPLOADS_FOLDER=uploads
APP_NAME=Arvann
APP_URL=https://arvann.in
EMAIL_FROM="Arvann <arvann100@gmail.com>"
SUPPORT_EMAIL=arvann100@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
NOTIFICATIONS_EMAIL_ENABLED=true
PAYMENT_CURRENCY=INR
APPLE_BUNDLE_IDS=com.manufactureapp.frontend,com.manufactureapp.frontend.dev
```

Secret or sensitive values required:

```env
MONGO_URI=<MongoDB Atlas URI targeting /manufacture>
REDIS_URL=<Redis URL with password>
JWT_SECRET=<strong random secret>
SESSION_SECRET=<strong random secret>
ADMIN_INVITE_TOKEN=<strong random token>
SMTP_USER=<SMTP account>
SMTP_PASS=<SMTP app password>
RAZORPAY_KEY_ID=<if payments enabled>
RAZORPAY_KEY_SECRET=<if payments enabled>
RAZORPAY_WEBHOOK_SECRET=<if payments enabled>
EXPO_PUSH_ACCESS_TOKEN=<if push enabled>
```

S3 credentials:

```text
Do not set AWS_S3_ACCESS_KEY_ID or AWS_S3_SECRET_ACCESS_KEY in production.
The EC2 instance uses an IAM role for S3 access.
```

If static AWS keys are accidentally present, remove them from production `.env` and restart the backend.

## AWS S3 Setup

Current bucket:

```text
Bucket: arvann-prod-uploads
Region: ap-south-1
Prefix: uploads/
```

Recommended IAM permissions for the EC2 role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "WriteDeleteUploadsPrefix",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::arvann-prod-uploads/uploads/*"
    },
    {
      "Sid": "ReadBucketLocation",
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::arvann-prod-uploads"
    }
  ]
}
```

The backend storage smoke command uploads a tiny file under `uploads/smoke-tests/` and then deletes it.

## MongoDB Atlas

Production uses MongoDB Atlas.

```text
Database name: manufacture
Env key:       MONGO_URI
```

The URI must explicitly target `/manufacture`.

Correct shape:

```text
mongodb+srv://<user>:<password>@<cluster-host>/manufacture?appName=<appName>
```

Wrong shape:

```text
mongodb+srv://<user>:<password>@<cluster-host>/?appName=<appName>
```

The second form may default to the wrong database.

## Redis

Redis runs as a native `redis-server` (systemd unit `redis-server`) bound to
`127.0.0.1:6379`. Docker is not installed on this host. Redis is used for:

```text
Express sessions
Socket.IO Redis adapter
Cross-worker session/socket consistency under PM2 cluster mode
```

Check it:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  sudo systemctl is-active redis-server
  pgrep -a redis-server
  sudo ss -ltnp | grep 6379
'
```

## Backend Deployment

Use this when deploying the latest local backend working tree to production.

### 1. Preflight

From repo root:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
```

Run targeted backend tests:

```bash
cd backend
npm test -- tests/contact.platform.test.js tests/ads.platform.test.js tests/chat.unread-senderRole.test.js tests/accounting.voucher.test.js
```

Optional full backend suite:

```bash
cd backend
npm test
```

Check production health before touching files:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  curl -fsS https://api.arvann.in/api/health
'
```

### 2. Back Up Production

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  set -euo pipefail
  ts=$(date +%Y%m%d%H%M%S)
  mkdir -p /srv/manufacture/backups
  cp /srv/manufacture/backend/.env /srv/manufacture/backups/backend.env.bak.$ts
  tar \
    --exclude=/srv/manufacture/backend/node_modules \
    --exclude=/srv/manufacture/backend/.env \
    -czf /srv/manufacture/backups/backend.bak.$ts.tar.gz \
    -C /srv/manufacture backend
  # Frontend rollback aids: current static-release pointer (legacy) and the
  # live Nginx config (so the SSR proxy switch can be reverted).
  readlink -f /var/www/arvann/current > /srv/manufacture/backups/frontend-current.$ts.txt 2>/dev/null || true
  sudo cp /etc/nginx/sites-enabled/arvann.in /srv/manufacture/backups/nginx-arvann.in.$ts.conf
  printf "backup_ts=%s\n" "$ts"
  curl -fsS https://api.arvann.in/api/health
'
```

Save the printed `backup_ts`. It is needed for rollback.

### 3. Sync Backend Code

From repo root:

```bash
rsync -az --delete \
  -e "ssh -i '/Users/kavin/Documents/ssl keys/Arvann.pem' -o StrictHostKeyChecking=accept-new" \
  --exclude ".env" \
  --exclude ".env.*" \
  --exclude "node_modules" \
  --exclude ".mongo-data" \
  --exclude "logs" \
  backend/ ubuntu@13.206.204.61:/srv/manufacture/backend/
```

### 4. Install, Validate, Restart

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  set -euo pipefail
  cd /srv/manufacture/backend
  npm ci --omit=dev
  node -e "require(\"./src/app\"); console.log(\"backend_require_ok\")"
  sudo systemctl restart manufacture-backend
  sleep 8
  sudo systemctl is-active manufacture-backend
  PM2_HOME=/home/ubuntu/.pm2 pm2 status --no-color
  curl -fsS https://api.arvann.in/api/health
'
```

## Frontend Deployment

Frontend is a **Next.js server (SSR + ISR)**, not a static export. It runs under
the `manufacture-web` systemd service (`next start` on port 3000) and Nginx
proxies `arvann.in` to `127.0.0.1:3000`.

`NEXT_PUBLIC_*` values are inlined at build time, so the production API URL and
app variant must be passed to the build, not just the runtime.

> Historical note: the frontend used to be a static export served from
> `/var/www/arvann/current`. Commit `53cbd54` migrated public product/seller
> detail pages to SSR/ISR, and later commits moved redirects + security headers
> into `next.config.ts`. Static export (`out/`) is no longer produced. The
> deploy artifacts for the server runtime live in `web-frontend/deploy/`
> (`manufacture-web.service`, `nginx-arvann.in.conf`).

### 1. Build Locally First (validation)

```bash
cd web-frontend
NEXT_PUBLIC_API_URL=https://api.arvann.in/api APP_VARIANT=production npm run build
```

### 2. Sync Source

```bash
rsync -az --delete \
  -e "ssh -i '/Users/kavin/Documents/ssl keys/Arvann.pem' -o StrictHostKeyChecking=accept-new" \
  --exclude ".env" \
  --exclude ".env.*" \
  --exclude "node_modules" \
  --exclude ".next" \
  --exclude "out" \
  web-frontend/ ubuntu@13.206.204.61:/srv/manufacture/web-frontend/
```

### 3. Build on EC2 and Restart the Next Server

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  set -euo pipefail
  cd /srv/manufacture/web-frontend
  npm ci
  NEXT_PUBLIC_API_URL=https://api.arvann.in/api APP_VARIANT=production npm run build
  sudo systemctl restart manufacture-web
  sleep 6
  sudo systemctl is-active manufacture-web
  curl -fsS -o /dev/null -w "next_local %{http_code}\n" http://127.0.0.1:3000/
'
```

### 4. First-Time Setup Only (already done in production)

Only needed when provisioning a fresh host or re-migrating from static export.

Install the systemd unit and Nginx config (both tracked in
`web-frontend/deploy/`):

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  set -euo pipefail
  # Next server service
  sudo cp /srv/manufacture/web-frontend/deploy/manufacture-web.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable --now manufacture-web
  # Nginx: proxy arvann.in -> 127.0.0.1:3000
  sudo cp /srv/manufacture/web-frontend/deploy/nginx-arvann.in.conf /etc/nginx/sites-enabled/arvann.in
  sudo nginx -t && sudo systemctl reload nginx
'
```

The Nginx config keeps the legacy `/dashboard/products/<id>` and
`/admin/users/<id>` query-param redirects, but deliberately has **no**
`/sellers/<id>` redirect: `/sellers/<id>` and `/products/<id>` are now real SSR
pages, and `next.config.ts` already 308-canonicalizes the legacy
`?companyId` / `?productId` forms. Re-adding a `/sellers/<id>` Nginx redirect
would create a redirect loop.

## Smoke Checks

Run these after every deploy.

### Backend

```bash
curl -fsS https://api.arvann.in/api/health

ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  sudo systemctl is-active manufacture-backend
  PM2_HOME=/home/ubuntu/.pm2 pm2 status --no-color
  cd /srv/manufacture/backend
  npm run storage:verify
  npm run email:verify
'
```

### Support Admin Endpoint

```bash
curl -fsS https://api.arvann.in/api/auth/support-admin
```

Expected:

```json
{"supportAdminId":"<mongo-user-id>"}
```

### Contact Endpoint

```bash
curl -fsS \
  -X POST https://api.arvann.in/api/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://arvann.in" \
  --data '{
    "name": "Deployment Smoke",
    "email": "smoke@example.com",
    "topic": "deployment-smoke",
    "message": "Deployment smoke test for contact endpoint."
  }'
```

Expected:

```json
{"ok":true,"message":"Thanks for reaching out — we'll get back to you shortly.","contactMessageId":"<id>"}
```

### Frontend

The Next server defaults to `trailingSlash: false`, so trailing-slash URLs
(`/about/`) 308-redirect to the no-slash form (`/about`). Use no-slash URLs to
get a direct 200:

```bash
# Next server is up locally on the host
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  sudo systemctl is-active manufacture-web
  curl -fsS -o /dev/null -w "next_local %{http_code}\n" http://127.0.0.1:3000/
'

# Public pages (expect 200)
for url in \
  "https://arvann.in/" \
  "https://arvann.in/about" \
  "https://arvann.in/contact" \
  "https://arvann.in/support" \
  "https://arvann.in/products" \
  "https://arvann.in/signin" \
  "https://arvann.in/admin/ad-studio" \
  "https://arvann.in/robots.txt" \
  "https://arvann.in/sitemap.xml" \
  "https://arvann.in/manifest.webmanifest"; do
  curl -sS -o /dev/null -w "$url -> %{http_code}\n" "$url"
done

# A real SSR product detail page (pulled from the sitemap) should be 200 and
# carry per-item <title>/og:title (proves SSR, not a static fallback).
prod_url=$(curl -sS https://arvann.in/sitemap.xml \
  | grep -oE "https://arvann.in/products/[^<]+" | grep -vE "/category/" | head -1)
curl -sS -o /tmp/arvann-prod.html -w "$prod_url -> %{http_code}\n" "$prod_url"
grep -oE "<title>[^<]*</title>" /tmp/arvann-prod.html | head -1
```

Redirect checks:

```bash
# www -> apex (301)
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.arvann.in/contact
# legacy detail query params -> clean SSR URLs (308, via next.config.ts)
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://arvann.in/products/detail?productId=abc123"
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://arvann.in/sellers/detail?companyId=xyz789"
# legacy dashboard id -> detail query param (302, via Nginx)
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://arvann.in/dashboard/products/legacy-id/"
# /sellers/<id> must resolve directly with NO redirect loop
curl -sS -L --max-redirs 5 -o /dev/null -w "final=%{http_code} redirects=%{num_redirects}\n" "https://arvann.in/sellers/some-id"
```

Expected:

```text
www -> 301 to https://arvann.in/...
/products/detail?productId=X  -> 308 to /products/X
/sellers/detail?companyId=X   -> 308 to /sellers/X
old dashboard product URL     -> 302 to /dashboard/products/detail/?productId=...
/sellers/<id>                 -> 200, redirects=0 (no loop)
```

Security headers (now set by `next.config.ts`, not Nginx):

```bash
curl -sSI https://arvann.in/ | grep -iE \
  "strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy"
```

## Rollback

Use the `backup_ts` printed during backup.

### Backend Rollback

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  set -euo pipefail
  ts=<backup_ts>
  cd /srv/manufacture
  rm -rf backend.rollback
  mkdir -p backend.rollback
  tar -xzf /srv/manufacture/backups/backend.bak.$ts.tar.gz -C /srv/manufacture/backend.rollback
  rsync -a --delete /srv/manufacture/backend.rollback/backend/ /srv/manufacture/backend/
  cp /srv/manufacture/backups/backend.env.bak.$ts /srv/manufacture/backend/.env
  cd /srv/manufacture/backend
  npm ci --omit=dev
  sudo systemctl restart manufacture-backend
  sleep 8
  curl -fsS https://api.arvann.in/api/health
'
```

### Frontend Rollback

The frontend is now a server, so rollback is restoring the previous code/build
and restarting the Next server. Re-sync the previous working tree (or restore
from a backup tar), then:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  set -euo pipefail
  cd /srv/manufacture/web-frontend
  npm ci
  NEXT_PUBLIC_API_URL=https://api.arvann.in/api APP_VARIANT=production npm run build
  sudo systemctl restart manufacture-web
  sleep 6
  sudo systemctl is-active manufacture-web
  curl -fsS -o /dev/null -w "next_local %{http_code}\n" http://127.0.0.1:3000/
'
```

If the Nginx proxy change itself needs reverting (e.g. to fall back to the old
static export), restore the saved Nginx config and reload:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  set -euo pipefail
  ts=<backup_ts>
  sudo cp /srv/manufacture/backups/nginx-arvann.in.$ts.conf /etc/nginx/sites-enabled/arvann.in
  sudo nginx -t && sudo systemctl reload nginx
  curl -fsSI https://arvann.in/
'
```

## Operational Commands

PM2 status:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  PM2_HOME=/home/ubuntu/.pm2 pm2 status --no-color
'
```

Backend logs:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  sudo journalctl -u manufacture-backend --since "30 minutes ago" --no-pager
'
```

Frontend (Next server) status, restart, and logs:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  sudo systemctl status manufacture-web --no-pager
  sudo systemctl restart manufacture-web
  sudo journalctl -u manufacture-web --since "30 minutes ago" --no-pager
'
```

Nginx status:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  sudo nginx -t
  sudo systemctl status nginx --no-pager
'
```

Current frontend build:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  cat /srv/manufacture/web-frontend/.next/BUILD_ID
  sudo ss -ltnp | grep ":3000"
'
```

Disk usage:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  df -h
  du -sh /srv/manufacture/backups /var/www/arvann/releases
'
```

## One-Time Scripts

Run dry-run first. Only use `--apply` when the dry-run output is understood.

Merge duplicate conversations:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  cd /srv/manufacture/backend
  node src/scripts/mergeDuplicateConversations.js
  node src/scripts/mergeDuplicateConversations.js --apply
'
```

Repoint stub admin conversations:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  cd /srv/manufacture/backend
  node src/scripts/repointStubAdminConversations.js
  # Apply only after approval:
  # node src/scripts/repointStubAdminConversations.js --apply
'
```

## Common Failure Modes

### `STORAGE_NOT_CONFIGURED`

Missing:

```text
AWS_S3_BUCKET
AWS_S3_REGION
```

Fix `.env`, restart backend, then run:

```bash
npm run storage:verify
```

### `STORAGE_ACCESS_DENIED`

The EC2 IAM role lacks `s3:PutObject` or `s3:DeleteObject` for:

```text
arn:aws:s3:::arvann-prod-uploads/uploads/*
```

Fix IAM policy or bucket policy.

### OTP Signup Returns 200 But User Does Not See Email

Check SMTP:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  cd /srv/manufacture/backend
  npm run email:verify
  npm run email:smoke -- ks176460@gmail.com
'
```

Important Gmail behavior:

```text
ks176460+anything@gmail.com normalizes to ks176460@gmail.com in signup validation.
If the base email already exists, signup returns 409 and no OTP is sent.
```

### PM2 Workers Not Online

Check:

```bash
sudo systemctl status manufacture-backend --no-pager
PM2_HOME=/home/ubuntu/.pm2 pm2 logs manufacture-backend --lines 100
```

Then restart:

```bash
sudo systemctl restart manufacture-backend
```

## Notes For Future Maintainers

- Prefer EC2 IAM roles over static AWS keys.
- Keep MongoDB Atlas URI pointed at `/manufacture`.
- Never replace production `.env` wholesale during rsync.
- Always run local tests and a production smoke pass.
- Always create backups before restart.
- Frontend is a Next.js server (`manufacture-web` systemd unit, port 3000),
  NOT a static export. `npm run build` does not produce `out/`. Nginx must
  proxy `arvann.in` to `127.0.0.1:3000`.
- `NEXT_PUBLIC_*` is inlined at build time, so always pass
  `NEXT_PUBLIC_API_URL` / `APP_VARIANT` to the build, then restart
  `manufacture-web`.
- Redirects, rewrites and security headers live in `next.config.ts`; do not
  duplicate them in Nginx, and never add a `/sellers/<id>` or `/products/<id>`
  redirect in Nginx (would loop with the next.config canonicalization).
- Backend is PM2 cluster mode and depends on Redis (native `redis-server`, not
  Docker) for sessions and Socket.IO cross-worker behavior.
- If a secret leaks into git, rotate it immediately.
