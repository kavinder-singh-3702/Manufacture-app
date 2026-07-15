import { Platform } from "react-native";
import { apiClient } from "./apiClient";

export type FeedbackItem = {
  id: string;
  user:
    | string
    | {
        id: string;
        displayName?: string;
        email?: string;
      };
  subject: string;
  message: string;
  rating: number | null;
  appVersion?: string;
  platform?: string;
  resolvedAt: string | null;
  status?: "new" | "resolved";
  createdAt: string;
  updatedAt: string;
};

export type FeedbackPagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type SubmitFeedbackPayload = {
  subject?: string;
  message: string;
  rating?: number | null;
};

const resolvePlatform = (): "ios" | "android" | "web" | "unknown" => {
  if (Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web") {
    return Platform.OS;
  }
  return "unknown";
};


export const feedbackService = {
  submit: async (payload: SubmitFeedbackPayload): Promise<FeedbackItem> => {
    const response = await apiClient.post<{ feedback: FeedbackItem }>("/feedback", {
      subject: payload.subject,
      message: payload.message,
      rating: payload.rating ?? undefined,
      platform: resolvePlatform(),
    });
    return response.feedback;
  },

  list: async (params?: {
    status?: "new" | "resolved";
    limit?: number;
    offset?: number;
  }): Promise<{ feedback: FeedbackItem[]; pagination: FeedbackPagination }> => {
    return apiClient.get<{ feedback: FeedbackItem[]; pagination: FeedbackPagination }>(
      "/feedback",
      { params }
    );
  },

  setResolved: async (feedbackId: string, resolved = true): Promise<FeedbackItem> => {
    const response = await apiClient.patch<{ feedback: FeedbackItem }>(
      `/feedback/${feedbackId}/resolve`,
      { resolved }
    );
    return response.feedback;
  },
};
