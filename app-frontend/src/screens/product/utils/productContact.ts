import { Linking } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Product } from "../../../services/product.service";
import { chatService } from "../../../services/chat.service";
import { RootStackParamList } from "../../../navigation/types";

type ContactContext = {
  product: Product;
  isGuest: boolean;
  requestLogin: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  toastError: (title: string, message?: string) => void;
};

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

export const canMessageProduct = (product: Product): boolean => {
  return Boolean(getRecipientId(product) && isChatAllowed(product));
};

export const canCallProduct = (product: Product): boolean => {
  return Boolean(getRecipientPhone(product) && isCallAllowed(product));
};

export const startProductConversation = async ({
  product,
  isGuest,
  requestLogin,
  navigation,
  toastError,
}: ContactContext) => {
  if (isGuest) {
    requestLogin();
    return;
  }

  if (!isChatAllowed(product)) {
    toastError("Chat unavailable", "Seller disabled messaging for this product.");
    return;
  }

  const recipientId = getRecipientId(product);
  if (!recipientId) {
    toastError("Chat unavailable", "Seller contact is not configured.");
    return;
  }

  try {
    const conversationId = await chatService.startConversation(recipientId);
    navigation.navigate("Chat", {
      conversationId,
      recipientId,
      recipientName: getRecipientName(product),
      recipientPhone: getRecipientPhone(product),
    });
  } catch (error: any) {
    toastError("Chat unavailable", error?.message || "Could not start the conversation.");
  }
};

export const callProductSeller = async ({
  product,
  toastError,
}: Omit<ContactContext, "isGuest" | "requestLogin" | "navigation">) => {
  if (!isCallAllowed(product)) {
    toastError("Call unavailable", "Seller disabled calling for this product.");
    return;
  }

  const phone = getRecipientPhone(product);
  if (!phone) {
    toastError("Call unavailable", "Seller phone number is not available.");
    return;
  }

  try {
    await Linking.openURL(`tel:${phone}`);
  } catch {
    toastError("Call unavailable", "This device could not start the call.");
  }
};
