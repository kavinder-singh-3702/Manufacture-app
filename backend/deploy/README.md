# Production Deployment Assets

This folder contains deployment assets for `api.arvann.in`:

- `docker-compose.infrastructure.yml` for local MongoDB + Redis (Docker).
- `ecosystem.config.cjs` for PM2 cluster process management.
- `nginx-api.arvann.in.conf` for Nginx reverse proxy.

Runtime settings expected in backend `.env`:

- `MONGO_URI`
- `REDIS_URL`
- `TRUST_PROXY`
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_SAMESITE`
- `SESSION_COOKIE_DOMAIN`
