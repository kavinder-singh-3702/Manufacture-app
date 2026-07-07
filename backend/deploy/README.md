# Production Deployment Assets

This folder contains deployment assets for `api.arvann.in`:

- `docker-compose.infrastructure.yml` for local MongoDB + Redis (Docker).
- `ecosystem.config.cjs` for PM2 cluster process management.
- `nginx-api.arvann.in.conf` for Nginx reverse proxy.
- The API Nginx site must keep `client_max_body_size 100M;` so ad banner
  videos reach Express/Multer instead of being rejected by Nginx first.

Runtime settings expected in backend `.env`:

- `MONGO_URI`
- `REDIS_URL`
- `TRUST_PROXY`
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_SAMESITE`
- `SESSION_COOKIE_DOMAIN`
- `AWS_S3_BUCKET` (required)
- `AWS_S3_REGION` (required)
- `AWS_S3_ACCESS_KEY_ID` / `AWS_S3_SECRET_ACCESS_KEY` (optional if IAM role/profile is available)
- `AWS_S3_UPLOADS_FOLDER` (optional)

## Storage requirements

- Backend startup now fails fast when `AWS_S3_BUCKET` or `AWS_S3_REGION` is missing.
- Upload IAM permissions must include `s3:PutObject` for the target bucket/prefix.
- Product cards use returned image URLs directly, so ensure your bucket/CDN policy allows read access as required by your app.

## Upload troubleshooting

- `413 Request Entity Too Large` before backend logs: Nginx body size is too
  small. Apply `client_max_body_size 100M;` to the `api.arvann.in` server block
  and reload Nginx.
- `LIMIT_FILE_SIZE`: request reached Multer, but the file exceeded the
  endpoint-specific backend limit.
- `STORAGE_NOT_CONFIGURED`: missing `AWS_S3_BUCKET` or `AWS_S3_REGION`.
- `STORAGE_INVALID_CREDENTIALS`: invalid key pair or unavailable IAM provider chain credentials.
- `STORAGE_ACCESS_DENIED`: IAM principal lacks write access to the bucket/prefix.
- `STORAGE_REGION_MISMATCH`: `AWS_S3_REGION` does not match the bucket region.
