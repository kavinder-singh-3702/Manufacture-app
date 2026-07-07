import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Persists when the login ad popup was last shown so the "once per hour" cadence
// survives app restarts (a purely in-memory timer would reset on every relaunch).
const LAST_SHOWN_KEY = "ad_popup_last_shown_at_v1";

// SecureStore isn't available on web — fall back to localStorage there.
const isWeb = Platform.OS === "web";

export const adPopupStorage = {
  async getLastShownAt(): Promise<number | null> {
    try {
      const raw = isWeb ? localStorage.getItem(LAST_SHOWN_KEY) : await SecureStore.getItemAsync(LAST_SHOWN_KEY);
      if (!raw) return null;
      const ts = Number(raw);
      return Number.isFinite(ts) ? ts : null;
    } catch (error) {
      console.error("Error reading ad popup timestamp:", error);
      return null;
    }
  },

  async setLastShownAt(timestamp: number): Promise<void> {
    try {
      const raw = String(timestamp);
      if (isWeb) {
        localStorage.setItem(LAST_SHOWN_KEY, raw);
      } else {
        await SecureStore.setItemAsync(LAST_SHOWN_KEY, raw);
      }
    } catch (error) {
      console.error("Error saving ad popup timestamp:", error);
    }
  },
};
