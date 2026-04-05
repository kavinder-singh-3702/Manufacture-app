# Manufacture Command Web Frontend

Next.js web console for ARVANN's Manufacture Command workspace.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
cp .env.example .env
```

3. Set the backend base URL in `.env`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`NEXT_PUBLIC_API_URL` is required. The web app uses it as the single source of truth for all backend API requests.

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start local development
- `npm run build` - create a production build
- `npm run start` - serve the production build
- `npm run lint` - run ESLint

## Environment variables

- `NEXT_PUBLIC_API_URL`
  Backend API base URL used by all frontend service modules.
  Example local value: `http://localhost:4000/api`
  Example hosted value: `https://api.example.com/api`

- `APP_VARIANT`
  Optional local environment label if you want to distinguish dev/staging behavior in local setup.
