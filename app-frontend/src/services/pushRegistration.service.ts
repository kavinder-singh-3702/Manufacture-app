import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { notificationService } from "./notification.service";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const ensureAndroidNotificationChannels = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4F46E5",
  });

  await Notifications.setNotificationChannelAsync("critical-alerts", {
    name: "Critical Alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 300, 300],
    sound: "default",
    lightColor: "#B4234D",
  });
};

export const registerPushToken = async () => {
  if (!Device.isDevice) {
    return null;
  }

  const { status: currentStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = currentStatus;

  if (currentStatus !== "granted") {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = tokenResponse.data;

  if (!token) return null;

  await ensureAndroidNotificationChannels();

  await notificationService.registerDevice({
    pushToken: token,
    platform: Platform.OS as "ios" | "android" | "web",
    pushProvider: "expo",
    appVersion: Constants.expoConfig?.version,
    buildNumber:
      Platform.OS === "ios"
        ? Constants.expoConfig?.ios?.buildNumber
        : Constants.expoConfig?.android?.versionCode
          ? String(Constants.expoConfig.android.versionCode)
          : undefined,
    deviceModel: Device.modelName || undefined,
    osVersion: Device.osVersion || undefined,
    // Was `Device.osName` — that's the OS name ("iOS"/"Android"), not a
    // locale, so every device reported its platform in the locale field
    // instead of e.g. "en-IN" (A6). `Intl` is already relied on two lines
    // below for timezone, so it's available here without a new native
    // dependency (unlike expo-localization, which would need a rebuild).
    locale: Intl.DateTimeFormat().resolvedOptions().locale || undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return token;
};

export const unregisterPushToken = async (token?: string | null) => {
  if (!token) return;
  try {
    await notificationService.unregisterDevice(token);
  } catch {
    // best effort only
  }
};
