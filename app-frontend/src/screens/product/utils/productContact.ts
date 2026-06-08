import { Linking } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Product } from "../../../services/product.service";
import { chatService } from "../../../services/chat.service";
import { RootStackParamList } from "../../../navigation/types";

/**
 * Canonical toast strings for the seller-contact flow. Matches the SupportFab
 * tone so seller chat and support chat present a consistent voice. Imported
 * by every entry point instead of ad-hoc one-off messages.
 */
const SELLER_CHAT_UNAVAILABLE_TITLE = "Chat unavailable";
const SELLER_CALL_UNAVAILABLE_TITLE = "Call unavailable";
const SELLER_OWN_PRODUCT_TITLE = "Can't message yourself";
const SELLER_OWN_PRODUCT_BODY =
  "You can't open a chat about your own product.";
const SELLER_CHAT_DISABLED_BODY =
  "The seller has disabled messaging for this product.";
const SELLER_CHAT_NOT_CONFIGURED_BODY =
  "This seller hasn't set up messaging yet.";
const SELLER_CHAT_GENERIC_FAILURE_BODY =
  "Couldn't open the chat right now. Please try again.";
const SELLER_CALL_DISABLED_BODY =
  "The seller has disabled calling for this product.";
const SELLER_CALL_NO_PHONE_BODY =
  "This seller hasn't shared a phone number.";
const SELLER_CALL_DEVICE_FAILURE_BODY =
  "This device couldn't start the call.";

type ContactContext = {
  product: Product;
  isGuest: boolean;
  /** Current user's id — used to short-circuit "Message yourself" requests. */
  currentUserId?: string;
  requestLogin: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  toastError: (title: string, message?: string) => void;
  /**
   * Optional loading callback — entry points can pass useState plumbing to
   * show an ActivityIndicator on the Message button while the createConversation
   * POST is in flight. Mirrors the SupportFab.tsx pattern.
   */
  setLoading?: (loading: boolean) => void;
};

/** Module-level guard preventing concurrent startProductConversation calls
 *  from racing each other. Cleared inside the helper's `finally`. Survives
 *  rapid-fire tap of a Message button even before consumers wire up setLoading. */
let _startInFlight = false;

const getRecipientId = (product: Product): string | undefined => {
  if (!product?.createdBy) return undefined;
  return String(product.createdBy);
};

const getRecipientName = (product: Product): string => {
  return product?.company?.displayName || "Seller";
};

const getRecipientPhone = (product: Product): string | undefined => {
  return product?.company?.contact?.phone;
};

const isChatAllowed = (product: Product): boolean => {
  if (!product?.contactPreferences) return true;
  return product.contactPreferences.allowChat !== false;
};

const isCallAllowed = (product: Product): boolean => {
  if (!product?.contactPreferences) return true;
  return product.contactPreferences.allowCall !== false;
};

/** True when the current user is the seller of the product — i.e. messaging
 *  themselves. UI should hide/disable the Message button in this case. */
export const isOwnProduct = (product: Product, currentUserId?: string): boolean => {
  const recipientId = getRecipientId(product);
  return Boolean(recipientId && currentUserId && recipientId === String(currentUserId));
};

export const canMessageProduct = (product: Product, currentUserId?: string): boolean => {
  return Boolean(
    getRecipientId(product) && isChatAllowed(product) && !isOwnProduct(product, currentUserId)
  );
};

export const canCallProduct = (product: Product, currentUserId?: string): boolean => {
  return Boolean(
    getRecipientPhone(product) && isCallAllowed(product) && !isOwnProduct(product, currentUserId)
  );
};

export const startProductConversation = async ({
  product,
  isGuest,
  currentUserId,
  requestLogin,
  navigation,
  toastError,
  setLoading,
}: ContactContext) => {
  // Rapid-tap protection — even before consumers wire setLoading the helper
  // refuses concurrent calls, so the backend never sees parallel
  // startConversation requests for the same product.
  if (_startInFlight) return;

  if (isGuest) {
    requestLogin();
    return;
  }

  if (isOwnProduct(product, currentUserId)) {
    toastError(SELLER_OWN_PRODUCT_TITLE, SELLER_OWN_PRODUCT_BODY);
    return;
  }

  if (!isChatAllowed(product)) {
    toastError(SELLER_CHAT_UNAVAILABLE_TITLE, SELLER_CHAT_DISABLED_BODY);
    return;
  }

  const recipientId = getRecipientId(product);
  if (!recipientId) {
    toastError(SELLER_CHAT_UNAVAILABLE_TITLE, SELLER_CHAT_NOT_CONFIGURED_BODY);
    return;
  }

  _startInFlight = true;
  setLoading?.(true);
  try {
    const conversationId = await chatService.startConversation(recipientId, {
      productId: product?._id,
    });
    navigation.navigate("Chat", {
      conversationId,
      recipientId,
      recipientName: getRecipientName(product),
      recipientPhone: getRecipientPhone(product),
      productId: product?._id,
    });
  } catch (error: any) {
    toastError(
      SELLER_CHAT_UNAVAILABLE_TITLE,
      error?.message || SELLER_CHAT_GENERIC_FAILURE_BODY
    );
  } finally {
    _startInFlight = false;
    setLoading?.(false);
  }
};

export const callProductSeller = async ({
  product,
  toastError,
}: Omit<ContactContext, "isGuest" | "requestLogin" | "navigation">) => {
  if (!isCallAllowed(product)) {
    toastError(SELLER_CALL_UNAVAILABLE_TITLE, SELLER_CALL_DISABLED_BODY);
    return;
  }

  const phone = getRecipientPhone(product);
  if (!phone) {
    toastError(SELLER_CALL_UNAVAILABLE_TITLE, SELLER_CALL_NO_PHONE_BODY);
    return;
  }

  try {
    await Linking.openURL(`tel:${phone}`);
  } catch {
    toastError(SELLER_CALL_UNAVAILABLE_TITLE, SELLER_CALL_DEVICE_FAILURE_BODY);
  }
};
