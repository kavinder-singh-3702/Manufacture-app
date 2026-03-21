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

## Build a Signed Production APK Locally with Gradle

This app also supports a local Expo CNG -> Gradle release APK flow that always targets `https://api.manufactureapp.com/api`.

### One-time local setup

1. Install a Java runtime / JDK that Gradle can use.
2. Install Android SDK tools and make sure `ANDROID_SDK_ROOT` or `ANDROID_HOME` points at the SDK.
3. Install or access EAS CLI, then download the existing production Android credentials:
   - `cd app-frontend`
   - `eas credentials -p android`
4. Save the downloaded `credentials.json` in `app-frontend/`.
5. Make sure the `keystorePath` referenced by `credentials.json` points to a keystore file available on disk.

`credentials.json` is gitignored. The Gradle build script reads `android.keystore.keystorePath`, `keyAlias`, `keystorePassword`, and `keyPassword`, copies the keystore into the generated Android app, and writes transient `ARVANN_UPLOAD_*` properties into `android/gradle.properties`.

### Run the local Gradle APK build

From `app-frontend/`:

- `npm run apk:gradle:prod`

What the command does:

- Forces `APP_VARIANT=prod`
- Forces `EXPO_PUBLIC_API_URL=https://api.manufactureapp.com/api`
- Runs `npx expo config --type public --json` validation
- Regenerates `/android` with `npx expo prebuild --platform android --clean --no-install`
- Verifies the generated production package id and that cleartext traffic is not enabled
- Injects release signing properties from `credentials.json`
- Runs `./gradlew clean app:assembleRelease --no-build-cache`

Expected APK output:

- `android/app/build/outputs/apk/release/app-release.apk`

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

The existing GitHub Actions / EAS APK workflow remains unchanged and is still the recommended remote build path for staging and production artifacts.
