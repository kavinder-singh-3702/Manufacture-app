import { useCallback } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type OpenSwitcherOptions = {
  /**
   * When provided, called instead of navigating to CompanyContextPicker.
   * Use this on Home where we prefer the inline CompanySwitcherCard bottom
   * sheet (HomeToolbar.avatar already triggers it). Other surfaces are
   * already inside a stack so the stack picker is the right UX.
   */
  inlineHandler?: () => void;
};

/**
 * Centralized long-press "switch company" entry point. Ensures every call
 * site fires the same haptic (medium impact, iOS) before opening the
 * switcher — matches iOS conventions for long-press shortcuts. Falls back
 * silently on Android where the haptic API is a no-op for unsupported
 * devices.
 */
export const useCompanySwitcher = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const open = useCallback(
    async (options?: OpenSwitcherOptions) => {
      try {
        if (Platform.OS === "ios") {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {
        /* haptic best-effort */
      }
      if (options?.inlineHandler) {
        options.inlineHandler();
        return;
      }
      navigation.navigate("CompanyContextPicker", { source: "long-press" });
    },
    [navigation]
  );

  return { open };
};
