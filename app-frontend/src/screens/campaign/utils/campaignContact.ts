import { Linking } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { chatService } from "../../../services/chat.service";
import { PersonalizedOffer } from "../../../services/preference.service";
import { RootStackParamList } from "../../../navigation/types";

type CampaignContactContext = {
  campaign: PersonalizedOffer;
  isGuest: boolean;
  requestLogin: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  toastError: (title: string, message?: string) => void;
};

const resolveId = (value?: string | { id: string }): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.id;
};

const getRecipientId = (campaign: PersonalizedOffer): string | undefined => {
  return campaign.contact?.adminUserId || resolveId(campaign.createdBy);
};

const getRecipientName = (campaign: PersonalizedOffer): string => {
  return campaign.contact?.adminName || "Campaign manager";
};

const getRecipientPhone = (campaign: PersonalizedOffer): string | undefined => {
  if (campaign.contact?.phone) return campaign.contact.phone;
  if (typeof campaign.createdBy !== "string") return campaign.createdBy?.phone;
  return undefined;
};

const isChatAllowed = (campaign: PersonalizedOffer): boolean => {
  return campaign.contact?.allowChat !== false;
};

const isCallAllowed = (campaign: PersonalizedOffer): boolean => {
  return campaign.contact?.allowCall !== false;
};

export const canMessageCampaign = (campaign: PersonalizedOffer): boolean => {
  return Boolean(getRecipientId(campaign) && isChatAllowed(campaign));
};

export const canCallCampaign = (campaign: PersonalizedOffer): boolean => {
  return Boolean(getRecipientPhone(campaign) && isCallAllowed(campaign));
};

export const startCampaignConversation = async ({
  campaign,
  isGuest,
  requestLogin,
  navigation,
  toastError,
}: CampaignContactContext) => {
  if (isGuest) {
    requestLogin();
    return;
  }

  if (!isChatAllowed(campaign)) {
    toastError("Chat unavailable", "Messaging is disabled for this campaign.");
    return;
  }

  const recipientId = getRecipientId(campaign);
  if (!recipientId) {
    toastError("Chat unavailable", "Campaign contact is not configured.");
    return;
  }

  try {
    const conversationId = await chatService.startConversation(recipientId);
    navigation.navigate("Chat", {
      conversationId,
      recipientId,
      recipientName: getRecipientName(campaign),
      recipientPhone: getRecipientPhone(campaign),
    });
  } catch (error: any) {
    toastError("Chat unavailable", error?.message || "Could not start conversation.");
  }
};

export const callCampaignContact = async ({
  campaign,
  toastError,
}: Omit<CampaignContactContext, "isGuest" | "requestLogin" | "navigation">) => {
  if (!isCallAllowed(campaign)) {
    toastError("Call unavailable", "Calling is disabled for this campaign.");
    return;
  }

  const phone = getRecipientPhone(campaign);
  if (!phone) {
    toastError("Call unavailable", "Phone number is not available for this campaign.");
    return;
  }

  try {
    await Linking.openURL(`tel:${phone}`);
  } catch {
    toastError("Call unavailable", "This device could not start the call.");
  }
};
