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

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
  accountType?: string;
  address?: UserAddress;
  socialLinks?: UserSocialLinks;
  preferences?: UserPreferences;
  activityTags?: string[];
  activeCompany?: string;
  companies?: string[];
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
  otp?: string;
  fullName?: string;
  email?: string;
  phone?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

// The backend accepts either credential emailed from the same request: the
// long-lived link token (one-click, from ?token= in the reset URL) or the
// 6-digit code paired with the account email (typed in by hand).
export type ResetPasswordPayload =
  | { token: string; password: string }
  | { email: string; code: string; password: string };

export type ForgotPasswordResponse = {
  message: string;
  channel: "email";
  expiresInMs: number;
  resendAvailableInMs: number;
  // Dev/staging only — the backend strips these in production.
  resetToken?: string;
  resetCode?: string;
  expiresAt?: string;
};

export type ResetPasswordResponse = { user: AuthUser };

export type UpdateUserPayload = Partial<
  Pick<AuthUser, "firstName" | "lastName" | "displayName" | "phone" | "bio" | "avatarUrl">
> & {
  address?: UserAddress;
  socialLinks?: UserSocialLinks;
  preferences?: UserPreferences;
  activityTags?: string[];
};
