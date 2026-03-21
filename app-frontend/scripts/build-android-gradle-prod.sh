#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ANDROID_DIR="${PROJECT_ROOT}/android"
ANDROID_APP_DIR="${ANDROID_DIR}/app"
CREDENTIALS_FILE="${PROJECT_ROOT}/credentials.json"
EXPECTED_API_URL="https://api.manufactureapp.com/api"
EXPECTED_PACKAGE="com.manufactureapp.frontend"
GRADLE_SCRIPT_NAME="arvann-release-signing.gradle"
KEYSTORE_TARGET_NAME="arvann-upload.keystore"
KEYSTORE_TARGET_PATH="${ANDROID_APP_DIR}/${KEYSTORE_TARGET_NAME}"
GRADLE_PROPERTIES_FILE="${ANDROID_DIR}/gradle.properties"
APK_OUTPUT_PATH="${ANDROID_APP_DIR}/build/outputs/apk/release/app-release.apk"

log() {
  printf '[ARVANN] %s\n' "$*"
}

die() {
  printf '[ARVANN] Error: %s\n' "$*" >&2
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
  [ -f "$CREDENTIALS_FILE" ] || die "Missing credentials.json at ${CREDENTIALS_FILE}. Run 'eas credentials -p android' and download the production keystore for ${EXPECTED_PACKAGE}."

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
  log "Validating Expo config for the production Gradle build"

  APP_VARIANT=prod EXPO_PUBLIC_API_URL="$EXPECTED_API_URL" npx expo config --type public --json \
    | node - "$EXPECTED_API_URL" "$EXPECTED_PACKAGE" <<'NODE'
const fs = require("node:fs");

const expectedApiUrl = process.argv[2];
const expectedPackage = process.argv[3];
const config = JSON.parse(fs.readFileSync(0, "utf8"));

if (config?.extra?.appVariant !== "prod") {
  throw new Error(`Expected extra.appVariant=prod, received: ${config?.extra?.appVariant ?? "<missing>"}`);
}

if (config?.android?.package !== expectedPackage) {
  throw new Error(`Expected android.package=${expectedPackage}, received: ${config?.android?.package ?? "<missing>"}`);
}

if (config?.android?.usesCleartextTraffic === true) {
  throw new Error("Production Android config unexpectedly enables cleartext traffic.");
}

if (process.env.EXPO_PUBLIC_API_URL !== expectedApiUrl) {
  throw new Error(`Expected EXPO_PUBLIC_API_URL=${expectedApiUrl}, received: ${process.env.EXPO_PUBLIC_API_URL ?? "<missing>"}`);
}
NODE
}

run_prebuild() {
  log "Regenerating the Android project with Expo prebuild"
  APP_VARIANT=prod EXPO_PUBLIC_API_URL="$EXPECTED_API_URL" npx expo prebuild --platform android --clean --no-install
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

  if grep -q 'usesCleartextTraffic="true"' "${ANDROID_APP_DIR}/src/main/AndroidManifest.xml"; then
    die "Generated AndroidManifest.xml unexpectedly enables cleartext traffic for the production build."
  fi
}

copy_release_keystore() {
  cp "$KEYSTORE_SOURCE_PATH" "$KEYSTORE_TARGET_PATH"
}

write_gradle_signing_properties() {
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
  "$apksigner_path" verify --print-certs "$APK_OUTPUT_PATH"
}

build_release_apk() {
  [ -x "${ANDROID_DIR}/gradlew" ] || die "Expected Gradle wrapper missing: ${ANDROID_DIR}/gradlew"

  log "Building the signed production APK with Gradle"
  (
    cd "$ANDROID_DIR"
    ./gradlew clean app:assembleRelease --no-build-cache
  )

  [ -f "$APK_OUTPUT_PATH" ] || die "Gradle finished without producing ${APK_OUTPUT_PATH}"
}

main() {
  log "Preparing local production Gradle APK build"

  require_java_runtime
  require_command node
  require_command npx

  export APP_VARIANT="prod"
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

  log "APK ready at ${APK_OUTPUT_PATH}"
}

main "$@"
