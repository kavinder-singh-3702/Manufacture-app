import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, View } from "react-native";

/**
 * Keyboard clearance for sheets inside a React Native <Modal> on Android.
 *
 * Two facts collide there: with edge-to-edge enforced (SDK 54) adjustResize
 * is no longer guaranteed to resize a window, and whether a Modal's window
 * resizes at all varies by OEM — Samsung does, others don't. So neither
 * "rely on resize" nor "always pad by keyboard height" is right: the first
 * buries the sheet on non-resizing devices, the second double-lifts on
 * resizing ones.
 *
 * This hook pads by the MEASURED overlap instead: when the keyboard opens,
 * it measures where the sheet's bottom actually is on screen and pads by
 * how far it sits below the keyboard's top. If the window already resized,
 * overlap measures ~0 and the pad stays 0. iOS returns 0 always — sheets
 * there keep their working KeyboardAvoidingView.
 *
 * Usage:
 *   const { sheetRef, keyboardPad } = useModalKeyboardClearance();
 *   <View ref={sheetRef} style={{ paddingBottom: base + keyboardPad }}>
 */
export const useModalKeyboardClearance = () => {
  const sheetRef = useRef<View>(null);
  const [keyboardPad, setKeyboardPad] = useState(0);
  const keyboardTopRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const keyboardTop = keyboardTopRef.current;
    const node = sheetRef.current;
    if (keyboardTop == null || !node) return;
    node.measureInWindow((_x, y, _w, h) => {
      const overlap = Math.max(0, Math.round(y + h - keyboardTop));
      setKeyboardPad((prev) => (Math.abs(prev - overlap) > 2 ? overlap : prev));
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      keyboardTopRef.current = e.endCoordinates?.screenY ?? null;
      // Measure on the next frame so any window resize has already applied.
      requestAnimationFrame(measure);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTopRef.current = null;
      setKeyboardPad(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [measure]);

  return { sheetRef, keyboardPad };
};
