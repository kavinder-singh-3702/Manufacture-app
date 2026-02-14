# App Frontend (Expo)

## Build Tester APK via GitHub Actions

APK pipeline file:

- `.github/workflows/android-apk.yml`

The workflow supports two profiles:

- `staging` (default): internal APK for testing against `http://3.108.52.140/api`
- `production`: APK using `https://api.manufactureapp.com/api`

## Unified API Base URL

All app HTTP calls are centralized through:

- `src/config/api.ts` (`EXPO_PUBLIC_API_URL` -> `API_BASE_URL`)
- `src/services/http/index.ts` (single `httpClient` initialization)

Chat socket host is also derived from the same config via:

- `src/config/api.ts` (`SOCKET_BASE_URL`)
- `src/services/chatSocket.ts`

## Profile Behavior

- `staging`
  - `APP_VARIANT=dev`
  - `EXPO_PUBLIC_API_URL=http://3.108.52.140/api`
  - Android package: `com.manufactureapp.frontend.dev`
  - Android cleartext traffic: enabled (`usesCleartextTraffic=true`)
- `production`
  - `APP_VARIANT=prod`
  - `EXPO_PUBLIC_API_URL=https://api.manufactureapp.com/api`
  - Android package: `com.manufactureapp.frontend`
  - Android cleartext traffic: disabled

## One-time Setup

1. Add GitHub secret `EXPO_TOKEN`:
   - `Settings -> Secrets and variables -> Actions -> New repository secret`
2. Ensure Expo token account can access EAS project:
   - `c2343c00-43ee-4da9-a32a-d24b8f0f099b`
3. Ensure Expo-managed Android keystore exists for package ids used by your profile.

## Run a Staging APK Build

1. Commit and push your branch.
2. Open GitHub Actions workflow: `Build Android APK`.
3. Click `Run workflow`.
4. Select `build_profile=staging`.
5. Run the workflow.

## Artifacts

Each run publishes:

- Workflow artifact:
  - `ARVANN-<profile>-<UTC_TIMESTAMP>.apk`
  - `ARVANN-<profile>-<UTC_TIMESTAMP>.apk.sha256`
- GitHub prerelease with the same APK and checksum assets.
