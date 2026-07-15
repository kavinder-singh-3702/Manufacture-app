import { AppRoleType } from "../constants/roles";

export type AuthView = "intro" | "login" | "signup" | "forgot" | "reset";

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  companyAbout?: string;
  avatarUrl?: string;
  /**
   * App-level role that determines navigation stack
   * - "admin": Full admin access
   * - "user": Standard user access
   * - "guest": Limited guest access
   */
  role: AppRoleType;
  status?: string;
  accountType?: string;
  username?: string;
  activeCompany?: string;
  companies?: string[];
  address?: UserAddress;
  socialLinks?: UserSocialLinks;
  preferences?: UserPreferences;
  activityTags?: string[];
  secondaryEmails?: string[];
  emailVerifiedAt?: string | Date;
  phoneVerifiedAt?: string | Date;
  lastLoginAt?: string | Date;
  lastLoginIp?: string;
  onboardingCompletedAt?: string | Date;
  // Present when the account was provisioned via Sign in with Apple.
  // Backend (buildUserResponse / sanitizeUser) passes it through on
  // both /auth/apple and /users/me. Used to drive a durable phone-
  // collection gate that survives force-quit + relaunch, since
  // pendingSocialPhoneCollection is in-memory only.
  appleUserId?: string;
  [key: string]: unknown;
};

export type LoginPayload = {
  email?: string;
  phone?: string;
  password: string;
  remember?: boolean;
};

export type SignupStartPayload = {
  fullName: string;
  email: string;
};

export type SignupVerifyPayload = {
  otp: string;
};

export type SignupContactPayload = {
  phone: string;
};

export type SignupCompletePayload = {
  password: string;
  accountType: string;
  companyName?: string;
  categories?: string[];
  otp?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
};

export type AppleSignInPayload = {
  identityToken: string;
  fullName?: string;
};

export type ForgotPasswordPayload = {
  email?: string;
  phone?: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export type UserAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type UserSocialLinks = {
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
};

export type UserCommunicationsPreferences = {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
};

export type UserPreferences = {
  locale?: string;
  timezone?: string;
  theme?: "system" | "light" | "dark";
  communications?: UserCommunicationsPreferences;
  notifications?: {
    masterEnabled?: boolean;
    inAppEnabled?: boolean;
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    quietHours?: {
      enabled?: boolean;
      start?: string;
      end?: string;
      timezone?: string;
    };
    topicOverrides?: Record<string, Partial<Record<"inApp" | "push" | "email" | "sms", boolean>>>;
    priorityOverrides?: Record<string, Partial<Record<"inApp" | "push" | "email" | "sms", boolean>>>;
  };
};

export type UpdateUserPayload = Partial<Pick<AuthUser, "firstName" | "lastName" | "displayName" | "phone" | "bio" | "companyAbout" | "avatarUrl">> & {
  address?: UserAddress;
  socialLinks?: UserSocialLinks;
  preferences?: UserPreferences;
  activityTags?: string[];
};
