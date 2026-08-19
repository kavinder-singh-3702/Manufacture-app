import { useSharedValue } from "react-native-reanimated";
import { useKeyboardHandler } from "react-native-keyboard-controller";

/**
 * Per-frame keyboard height as a Reanimated SharedValue — positive pixels,
 * 0 when closed, tracking the keyboard's actual animated position on BOTH
 * platforms (including iOS interactive dismissal).
 *
 * Why not useReanimatedKeyboardAnimation? In react-native-keyboard-controller
 * 1.18.5 the provider updates that hook's shared values on iOS only at
 * animation START, not per-frame — so a layout driven by it snaps to the
 * final position, and on dismissal the input bar sits visibly behind the
 * keyboard for the ~250ms slide. This hook mirrors the library's own
 * KeyboardAvoidingView internals (components/KeyboardAvoidingView/hooks.ts):
 * subscribe per-frame via useKeyboardHandler, where onMove fires every frame
 * on both platforms.
 *
 * Note: useKeyboardHandler sets Android softInputMode to ADJUST_RESIZE on
 * mount and restores the default on unmount. The app default already is
 * adjustResize (app.config.js softwareKeyboardLayoutMode), so the cycle is a
 * no-op — but if that config ever changes, revisit this (the mount/unmount
 * flip would then actually change modes).
 */
export const useKeyboardHeight = () => {
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler(
    {
      // Deliberately no onStart: on iOS it reports the FINAL height the
      // moment the animation begins; writing it would snap the layout ahead
      // of the keyboard. onMove tracks the real position per-frame.
      onMove: (e) => {
        "worklet";
        keyboardHeight.value = e.height;
      },
      onInteractive: (e) => {
        "worklet";
        keyboardHeight.value = e.height;
      },
      onEnd: (e) => {
        "worklet";
        keyboardHeight.value = e.height;
      },
    },
    []
  );

  return keyboardHeight;
};
