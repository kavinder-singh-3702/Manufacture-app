# App Frontend (Expo)

## Build Tester APK via GitHub Actions

This project ships a production-config Android APK pipeline at:

- `.github/workflows/android-apk.yml`

The workflow builds a signed APK with the EAS `production` profile, uploads it as a workflow artifact, and also publishes it to a unique GitHub prerelease.

### What this build uses

- Profile: `production` from `app-frontend/eas.json`
- Android build type: `apk`
- Runtime API URL: `https://api.manufactureapp.com/api`
- Package ID: `com.manufactureapp.frontend`
- Versioning: `autoIncrement: true` (ensures installable upgrades for testers)

### One-time setup

1. Add repository secret `EXPO_TOKEN` in GitHub:
   - `Settings -> Secrets and variables -> Actions -> New repository secret`
2. Ensure the Expo account behind `EXPO_TOKEN` can access EAS project:
   - `dd80ff5b-6e67-4ea6-acf8-2ae5d3455602`
3. Use Expo-managed Android keystore.
   - If credentials are not configured yet, run an interactive EAS credentials setup once, then rerun CI.

### Run a tester APK build

1. Commit and push your branch.
2. In GitHub, open `Actions -> Build Android APK (Production)`.
3. Click `Run workflow` on the branch you want to test.

### Output artifacts

Each run creates:

- Workflow artifact:
  - `ARVANN-prod-<UTC_TIMESTAMP>.apk`
  - `ARVANN-prod-<UTC_TIMESTAMP>.apk.sha256`
- GitHub prerelease:
  - Tag format: `apk-test-<UTC_TIMESTAMP>-run<RUN_NUMBER>`
  - Same APK and checksum attached as release assets

### Smoke gate in CI

The workflow always enforces:

- `npm run doctor` (`expo-doctor@latest`)

The workflow also runs:

- `npm run typecheck` (`tsc --noEmit`)

For immediate tester delivery, typecheck is currently warning-only and does not block APK publishing.

### Local preflight (optional)

From `app-frontend`:

```bash
npm ci
npm run doctor
npm run typecheck
```
