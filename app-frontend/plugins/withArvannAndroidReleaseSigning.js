const fs = require("node:fs");
const path = require("node:path");
const { createRunOncePlugin, withAppBuildGradle, withDangerousMod } = require("expo/config-plugins");

const pkg = require("../package.json");

const GRADLE_SCRIPT_NAME = "arvann-release-signing.gradle";
const APPLY_GRADLE_SCRIPT_LINE = `apply from: "./${GRADLE_SCRIPT_NAME}"`;
const GRADLE_SCRIPT_CONTENT = `def arvannUploadStoreFile = (findProperty("ARVANN_UPLOAD_STORE_FILE") ?: "").toString().trim()
def arvannUploadKeyAlias = (findProperty("ARVANN_UPLOAD_KEY_ALIAS") ?: "").toString().trim()
def arvannUploadStorePassword = (findProperty("ARVANN_UPLOAD_STORE_PASSWORD") ?: "").toString().trim()
def arvannUploadKeyPassword = (findProperty("ARVANN_UPLOAD_KEY_PASSWORD") ?: "").toString().trim()

def hasArvannReleaseSigning = [
    arvannUploadStoreFile,
    arvannUploadKeyAlias,
    arvannUploadStorePassword,
    arvannUploadKeyPassword,
].every { !it.isEmpty() }

android {
    signingConfigs {
        if (hasArvannReleaseSigning) {
            release {
                storeFile file(arvannUploadStoreFile)
                storePassword arvannUploadStorePassword
                keyAlias arvannUploadKeyAlias
                keyPassword arvannUploadKeyPassword
            }
        }
    }
    buildTypes {
        release {
            if (hasArvannReleaseSigning) {
                signingConfig signingConfigs.release
            }
        }
    }
}

if (!hasArvannReleaseSigning) {
    logger.lifecycle("[ARVANN] Release signing properties are missing. Supply ARVANN_UPLOAD_* values in android/gradle.properties before running app:assembleRelease.")
}
`;

function withArvannAndroidReleaseSigning(config) {
  config = withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const appDir = path.join(modConfig.modRequest.platformProjectRoot, "app");
      const gradleScriptPath = path.join(appDir, GRADLE_SCRIPT_NAME);

      fs.mkdirSync(appDir, { recursive: true });
      fs.writeFileSync(gradleScriptPath, GRADLE_SCRIPT_CONTENT);

      return modConfig;
    },
  ]);

  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== "groovy") {
      throw new Error("withArvannAndroidReleaseSigning only supports Groovy app/build.gradle files.");
    }

    if (!modConfig.modResults.contents.includes(APPLY_GRADLE_SCRIPT_LINE)) {
      modConfig.modResults.contents = `${modConfig.modResults.contents.trimEnd()}\n\n${APPLY_GRADLE_SCRIPT_LINE}\n`;
    }

    return modConfig;
  });
}

module.exports = createRunOncePlugin(
  withArvannAndroidReleaseSigning,
  "with-arvann-android-release-signing",
  pkg.version,
);
