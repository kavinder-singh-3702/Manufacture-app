import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ThemeMode } from "../theme";

const THEME_MODE_KEY = "app_theme_mode_v1";
const isWeb = Platform.OS === "web";

const isThemeMode = (value: string | null | undefined): value is ThemeMode => {
  return value === "system" || value === "light" || value === "dark";
};

export const themeStorage = {
  async getThemeMode(): Promise<ThemeMode | null> {
    try {
      const stored = isWeb ? localStorage.getItem(THEME_MODE_KEY) : await SecureStore.getItemAsync(THEME_MODE_KEY);
      return isThemeMode(stored) ? stored : null;
    } catch (error) {
      console.error("Error reading theme mode:", error);
      return null;
    }
  },

  async setThemeMode(mode: ThemeMode): Promise<void> {
    try {
      if (isWeb) {
        localStorage.setItem(THEME_MODE_KEY, mode);
      } else {
        await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
      }
    } catch (error) {
      console.error("Error saving theme mode:", error);
    }
  },

  async clearThemeMode(): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(THEME_MODE_KEY);
      } else {
        await SecureStore.deleteItemAsync(THEME_MODE_KEY);
      }
    } catch (error) {
      console.error("Error clearing theme mode:", error);
    }
  },
};
