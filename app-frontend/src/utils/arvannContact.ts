import { Linking } from "react-native";
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from "../constants/brand";

/**
 * Reaching ARVANN itself — as opposed to a third-party seller, which goes
 * through `screens/product/utils/productContact.ts`.
 *
 * Both helpers deliberately skip `Linking.canOpenURL`. On Android 11+ package
 * visibility makes `canOpenURL("tel:…")` return false unless the manifest
 * declares a matching `<queries>` intent, and several admin screens in this app
 * already silently do nothing because of exactly that. Calling `openURL`
 * directly and catching the failure is both simpler and more reliable.
 */

const CALL_FAILED_TITLE = "Call unavailable";
const CALL_FAILED_BODY = "This device couldn't start the call.";
const WHATSAPP_FAILED_TITLE = "WhatsApp unavailable";
const WHATSAPP_FAILED_BODY = "Couldn't open WhatsApp. Try calling us instead.";

type ToastError = (title: string, message?: string) => void;

export const callArvann = async (toastError: ToastError) => {
  try {
    await Linking.openURL(`tel:${SUPPORT_PHONE}`);
  } catch {
    toastError(CALL_FAILED_TITLE, CALL_FAILED_BODY);
  }
};

export const openArvannWhatsApp = async (toastError: ToastError, message?: string) => {
  const url = message
    ? `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(message)}`
    : SUPPORT_WHATSAPP_URL;
  try {
    await Linking.openURL(url);
  } catch {
    toastError(WHATSAPP_FAILED_TITLE, WHATSAPP_FAILED_BODY);
  }
};
