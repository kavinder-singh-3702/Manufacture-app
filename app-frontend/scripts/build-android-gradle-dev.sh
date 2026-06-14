#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ANDROID_DIR="${PROJECT_ROOT}/android"
ANDROID_APP_DIR="${ANDROID_DIR}/app"
CREDENTIALS_FILE="${PROJECT_ROOT}/credentials.json"
# Allow callers to override the API URL via env, default to prod (HTTPS still
# fine — cleartext flag is on so HTTP works if the URL is swapped on device).
EXPECTED_API_URL="${EXPO_PUBLIC_API_URL:-https://api.arvann.in/api}"
EXPECTED_PACKAGE="com.manufactureapp.frontend.dev"
GRADLE_SCRIPT_NAME="arvann-release-signing.gradle"
KEYSTORE_TARGET_NAME="arvann-upload.keystore"
KEYSTORE_TARGET_PATH="${ANDROID_APP_DIR}/${KEYSTORE_TARGET_NAME}"
GRADLE_PROPERTIES_FILE="${ANDROID_DIR}/gradle.properties"
# Output paths — release path if credentials.json is present, debug path
# otherwise. The debug APK is signed with the auto-generated debug.keystore
# and is the standard way to share installable testing builds when the
# production upload keystore isn't on the local machine.
APK_RELEASE_PATH="${ANDROID_APP_DIR}/build/outputs/apk/release/app-release.apk"
APK_DEBUG_PATH="${ANDROID_APP_DIR}/build/outputs/apk/debug/app-debug.apk"
USE_RELEASE_KEYSTORE="false"

log() {
  printf '[ARVANN-dev] %s\n' "$*"
}

die() {
  printf '[ARVANN-dev] Error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

require_java_runtime() {
  java -version >/dev/null 2>&1 || die "Java runtime not found. Install a JDK before running the Gradle APK build."
}

resolve_android_sdk_root() {
  local default_sdk_root="${HOME}/Library/Android/sdk"
  local sdk_root="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$default_sdk_root}}"

  [ -d "$sdk_root" ] || die "Android SDK directory not found. Set ANDROID_SDK_ROOT or ANDROID_HOME. Checked: ${sdk_root}"

  if [ ! -x "${sdk_root}/platform-tools/adb" ] \
    && [ ! -x "${sdk_root}/cmdline-tools/latest/bin/sdkmanager" ] \
    && [ ! -x "${sdk_root}/cmdline-tools/bin/sdkmanager" ]; then
    die "Android SDK tools not found under ${sdk_root}. Install Android platform-tools or command-line tools."
  fi

  RESOLVED_ANDROID_SDK_ROOT="$sdk_root"
}

load_release_credentials() {
  # Optional for dev — if credentials.json isn't present we'll just produce
  # a debug-signed APK instead, which is the standard "share with someone for
  # testing" artifact. The function returns early in that case.
  if [ ! -f "$CREDENTIALS_FILE" ]; then
    log "credentials.json not found at ${CREDENTIALS_FILE} — building debug-signed APK (no upload keystore required)"
    USE_RELEASE_KEYSTORE="false"
    return 0
  fi
  USE_RELEASE_KEYSTORE="true"

  mapfile -d '' -t credential_fields < <(node - "$PROJECT_ROOT" "$CREDENTIALS_FILE" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = process.argv[2];
const credentialsFile = process.argv[3];
const raw = JSON.parse(fs.readFileSync(credentialsFile, "utf8"));
const keystore = raw?.android?.keystore;

if (!keystore || typeof keystore !== "object") {
  throw new Error("credentials.json is missing android.keystore.");
}

for (const field of ["keystorePath", "keyAlias", "keystorePassword", "keyPassword"]) {
  if (!keystore[field] || typeof keystore[field] !== "string" || !keystore[field].trim()) {
    throw new Error(`credentials.json is missing android.keystore.${field}.`);
  }
}

const resolvedKeystorePath = path.isAbsolute(keystore.keystorePath)
  ? keystore.keystorePath
  : path.resolve(projectRoot, keystore.keystorePath);

if (!fs.existsSync(resolvedKeystorePath)) {
  throw new Error(`Keystore file not found: ${resolvedKeystorePath}`);
}

process.stdout.write([
  resolvedKeystorePath,
  keystore.keyAlias.trim(),
  keystore.keystorePassword,
  keystore.keyPassword,
].join("\u0000"));
process.stdout.write("\u0000");
NODE
  ) || die "Unable to read signing values from credentials.json."

  [ "${#credential_fields[@]}" -ge 4 ] || die "credentials.json did not produce the expected Android keystore fields."

  KEYSTORE_SOURCE_PATH="${credential_fields[0]}"
  KEY_ALIAS="${credential_fields[1]}"
  KEYSTORE_PASSWORD="${credential_fields[2]}"
  KEY_PASSWORD="${credential_fields[3]}"
}

validate_expo_config() {
  log "Validating Expo config for the dev Gradle build (API: ${EXPECTED_API_URL})"

  # Route through a temp file because `expo config | node - <<NODE` is
  # ambiguous: bash hands the pipe to node's stdin AND the heredoc tries
  # to be the script — bash's resolution prefers the pipe and feeds the
  # JSON to node as JavaScript, which crashes with "Unexpected end of JSON".
  #
  # Clean up the temp file by hand at function end rather than via a
  # `trap RETURN` — combined with `set -u` the trap fires on a stale
  # variable name after the function returns and emits a noisy "unbound
  # variable" line at script end. The same fix is applied transparently
  # via the conditional rm below.
  local config_json
  config_json="$(mktemp -t arvann-expo-config.XXXXXX.json)"

  APP_VARIANT=dev EXPO_PUBLIC_API_URL="$EXPECTED_API_URL" \
    npx expo config --type public --json > "$config_json"

  APP_VARIANT=dev EXPO_PUBLIC_API_URL="$EXPECTED_API_URL" \
    node - "$EXPECTED_API_URL" "$EXPECTED_PACKAGE" "$config_json" <<'NODE'
const fs = require("node:fs");

const expectedApiUrl = process.argv[2];
const expectedPackage = process.argv[3];
const configPath = process.argv[4];
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

if (config?.extra?.appVariant !== "dev") {
  throw new Error(`Expected extra.appVariant=dev, received: ${config?.extra?.appVariant ?? "<missing>"}`);
}

if (config?.android?.package !== expectedPackage) {
  throw new Error(`Expected android.package=${expectedPackage}, received: ${config?.android?.package ?? "<missing>"}`);
}

if (config?.android?.usesCleartextTraffic !== true) {
  throw new Error("Dev Android config did NOT enable cleartext traffic — expected usesCleartextTraffic=true.");
}

if (process.env.EXPO_PUBLIC_API_URL !== expectedApiUrl) {
  throw new Error(`Expected EXPO_PUBLIC_API_URL=${expectedApiUrl}, received: ${process.env.EXPO_PUBLIC_API_URL ?? "<missing>"}`);
}
NODE

  rm -f "$config_json"
}

run_prebuild() {
  log "Regenerating the Android project with Expo prebuild"
  APP_VARIANT=dev EXPO_PUBLIC_API_URL="$EXPECTED_API_URL" npx expo prebuild --platform android --clean --no-install
}

validate_generated_android() {
  [ -f "${ANDROID_APP_DIR}/build.gradle" ] || die "Expected generated file missing: ${ANDROID_APP_DIR}/build.gradle"
  [ -f "${ANDROID_APP_DIR}/src/main/AndroidManifest.xml" ] || die "Expected generated file missing: ${ANDROID_APP_DIR}/src/main/AndroidManifest.xml"
  [ -f "${ANDROID_APP_DIR}/${GRADLE_SCRIPT_NAME}" ] || die "Expected generated file missing: ${ANDROID_APP_DIR}/${GRADLE_SCRIPT_NAME}"

  grep -q "namespace '${EXPECTED_PACKAGE}'" "${ANDROID_APP_DIR}/build.gradle" \
    || die "Generated build.gradle is missing namespace '${EXPECTED_PACKAGE}'."

  grep -q "applicationId '${EXPECTED_PACKAGE}'" "${ANDROID_APP_DIR}/build.gradle" \
    || die "Generated build.gradle is missing applicationId '${EXPECTED_PACKAGE}'."

  grep -q "apply from: \"./${GRADLE_SCRIPT_NAME}\"" "${ANDROID_APP_DIR}/build.gradle" \
    || die "Generated build.gradle is missing the ${GRADLE_SCRIPT_NAME} apply directive."

  # Expo prebuild emits usesCleartextTraffic in the variant-specific
  # AndroidManifest (src/debug or src/debugOptimized) rather than the main
  # one, so it gets merged in only for debug builds. We accept the flag in
  # ANY of the per-variant manifests — the build_release_apk step picks
  # debug or release based on which one Gradle is told to assemble.
  if ! grep -lq 'usesCleartextTraffic="true"' \
      "${ANDROID_APP_DIR}/src/main/AndroidManifest.xml" \
      "${ANDROID_APP_DIR}/src/debug/AndroidManifest.xml" \
      "${ANDROID_APP_DIR}/src/debugOptimized/AndroidManifest.xml" 2>/dev/null; then
    die "No AndroidManifest variant has usesCleartextTraffic=\"true\" — dev build expects it in main, debug, or debugOptimized."
  fi
}

copy_release_keystore() {
  if [ "$USE_RELEASE_KEYSTORE" != "true" ]; then
    return 0
  fi
  cp "$KEYSTORE_SOURCE_PATH" "$KEYSTORE_TARGET_PATH"
}

write_gradle_signing_properties() {
  if [ "$USE_RELEASE_KEYSTORE" != "true" ]; then
    return 0
  fi
  [ -f "$GRADLE_PROPERTIES_FILE" ] || die "Expected generated file missing: ${GRADLE_PROPERTIES_FILE}"

  node - "$GRADLE_PROPERTIES_FILE" "$KEYSTORE_TARGET_NAME" "$KEY_ALIAS" "$KEYSTORE_PASSWORD" "$KEY_PASSWORD" <<'NODE'
const fs = require("node:fs");

const [filePath, storeFile, keyAlias, storePassword, keyPassword] = process.argv.slice(2);
const beginMarker = "# ARVANN release signing";
const endMarker = "# END ARVANN release signing";

const escapePropertyValue = (value) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");

let contents = fs.readFileSync(filePath, "utf8");
const managedBlockPattern = new RegExp(`\\n?${beginMarker}[\\s\\S]*?${endMarker}\\n?`, "g");
contents = contents.replace(managedBlockPattern, "\n");
contents = contents.replace(/\s*$/, "\n");

const block = [
  beginMarker,
  `ARVANN_UPLOAD_STORE_FILE=${escapePropertyValue(storeFile)}`,
  `ARVANN_UPLOAD_KEY_ALIAS=${escapePropertyValue(keyAlias)}`,
  `ARVANN_UPLOAD_STORE_PASSWORD=${escapePropertyValue(storePassword)}`,
  `ARVANN_UPLOAD_KEY_PASSWORD=${escapePropertyValue(keyPassword)}`,
  endMarker,
  "",
].join("\n");

fs.writeFileSync(filePath, `${contents}\n${block}`);
NODE
}

find_apksigner() {
  if command -v apksigner >/dev/null 2>&1; then
    command -v apksigner
    return 0
  fi

  if [ -d "${ANDROID_SDK_ROOT}/build-tools" ]; then
    find "${ANDROID_SDK_ROOT}/build-tools" -type f -name apksigner 2>/dev/null | LC_ALL=C sort | tail -n 1
    return 0
  fi

  return 1
}

verify_apk_signature() {
  local apksigner_path=""

  apksigner_path="$(find_apksigner || true)"
  [ -n "$apksigner_path" ] || {
    log "Skipping apksigner verification because apksigner was not found in PATH or Android build-tools"
    return 0
  }

  log "Verifying the signed APK certificate"
  "$apksigner_path" verify --print-certs "$BUILT_APK_PATH"
}

build_release_apk() {
  [ -x "${ANDROID_DIR}/gradlew" ] || die "Expected Gradle wrapper missing: ${ANDROID_DIR}/gradlew"

  if [ "$USE_RELEASE_KEYSTORE" = "true" ]; then
    log "Building dev APK with Gradle (clean + assembleRelease, signed with upload keystore)"
    (
      cd "$ANDROID_DIR"
      ./gradlew clean app:assembleRelease --no-build-cache
    )
    [ -f "$APK_RELEASE_PATH" ] || die "Gradle finished without producing ${APK_RELEASE_PATH}"
    BUILT_APK_PATH="$APK_RELEASE_PATH"
  else
    log "Building dev APK with Gradle (clean + assembleDebug, signed with debug.keystore)"
    (
      cd "$ANDROID_DIR"
      ./gradlew clean app:assembleDebug --no-build-cache
    )
    [ -f "$APK_DEBUG_PATH" ] || die "Gradle finished without producing ${APK_DEBUG_PATH}"
    BUILT_APK_PATH="$APK_DEBUG_PATH"
  fi
}

main() {
  log "Preparing local DEV Gradle APK build"
  log "API URL: ${EXPECTED_API_URL}"
  log "Package: ${EXPECTED_PACKAGE}"
  log "Cleartext: ENABLED (allows HTTP traffic — do not ship to Play Store)"

  require_java_runtime
  require_command node
  require_command npx

  export APP_VARIANT="dev"
  export EXPO_PUBLIC_API_URL="$EXPECTED_API_URL"
  resolve_android_sdk_root
  export ANDROID_SDK_ROOT="$RESOLVED_ANDROID_SDK_ROOT"
  export ANDROID_HOME="$ANDROID_SDK_ROOT"

  load_release_credentials
  validate_expo_config
  run_prebuild
  validate_generated_android
  copy_release_keystore
  write_gradle_signing_properties
  build_release_apk
  verify_apk_signature

  log "APK ready at ${BUILT_APK_PATH}"
  log "Signed with: $([ "$USE_RELEASE_KEYSTORE" = "true" ] && echo "upload keystore (production cert)" || echo "Android debug.keystore (auto-generated)")"
}

main "$@"
