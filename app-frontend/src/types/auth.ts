export type AuthView = "intro" | "login" | "signup";

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  role?: string;
  status?: string;
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
  phone: string;
};

export type SignupVerifyPayload = {
  otp: string;
};

export type SignupCompletePayload = {
  password: string;
  accountType: string;
  companyName?: string;
  categories?: string[];
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
  theme?: string;
  communications?: UserCommunicationsPreferences;
};

export type UpdateUserPayload = Partial<Pick<AuthUser, "firstName" | "lastName" | "displayName" | "phone" | "bio">> & {
  address?: UserAddress;
  socialLinks?: UserSocialLinks;
  preferences?: UserPreferences;
  activityTags?: string[];
};
