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
PM2 app name:      manufacture-backend
Backend port:      4000
Reverse proxy:     Nginx
Process manager:   systemd service running pm2-runtime
Database:          MongoDB Atlas, database `manufacture`
Redis:             Docker container on same EC2 host
S3 bucket:         arvann-prod-uploads
S3 region:         ap-south-1
Uploads prefix:    uploads
Support email:     arvann100@gmail.com
```

Request flow:

```text
Client -> api.arvann.in HTTPS -> Nginx -> 127.0.0.1:4000 -> PM2 cluster workers
                                              |
                                              +-> MongoDB Atlas
                                              +-> Redis
                                              +-> AWS S3 via EC2 IAM role
                                              +-> SMTP
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

Redis runs in Docker on the EC2 host and is used for:

```text
Express sessions
Socket.IO Redis adapter
Cross-worker session/socket consistency under PM2 cluster mode
```

Expected Redis container:

```text
manufacture-redis
```

Check it:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  docker ps --filter name=manufacture-redis
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

Frontend is a static Next.js export behind Nginx.

Use this when backend changes need matching web changes or when deploying both apps.

### 1. Build Locally First

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

### 3. Build and Publish on EC2

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  set -euo pipefail
  cd /srv/manufacture/web-frontend
  npm ci
  NEXT_PUBLIC_API_URL=https://api.arvann.in/api APP_VARIANT=production npm run build
  release=/var/www/arvann/releases/$(date +%Y%m%d%H%M%S)
  mkdir -p "$release"
  rsync -a --delete out/ "$release"/
  ln -sfn "$release" /var/www/arvann/current
  printf "frontend_release=%s\n" "$release"
'
```

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

```bash
for url in \
  "https://arvann.in/" \
  "https://arvann.in/about/" \
  "https://arvann.in/contact/" \
  "https://arvann.in/support/" \
  "https://arvann.in/products/" \
  "https://arvann.in/products/detail/?productId=detail" \
  "https://arvann.in/admin/ad-studio/"; do
  curl -k -sS -o /tmp/arvann-smoke-body -w "$url -> %{http_code}\n" "$url"
done
```

Redirect checks:

```bash
curl -k -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.arvann.in/contact/
curl -k -sS -L --max-redirs 8 -o /dev/null -w "%{http_code} redirects=%{num_redirects} final=%{url_effective}\n" https://arvann.in/dashboard/products/legacy-id/
```

Expected:

```text
www -> 301 to https://arvann.in/...
old dashboard product URL -> one redirect to /dashboard/products/detail/?productId=...
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

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  set -euo pipefail
  ts=<backup_ts>
  previous=$(cat /srv/manufacture/backups/frontend-current.$ts.txt)
  test -d "$previous"
  ln -sfn "$previous" /var/www/arvann/current
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

Nginx status:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  sudo nginx -t
  sudo systemctl status nginx --no-pager
'
```

Current frontend release:

```bash
ssh -i "/Users/kavin/Documents/ssl keys/Arvann.pem" ubuntu@13.206.204.61 '
  readlink -f /var/www/arvann/current
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
- Frontend is static and does not need PM2.
- Backend is PM2 cluster mode and depends on Redis for sessions and Socket.IO cross-worker behavior.
- If a secret leaks into git, rotate it immediately.
