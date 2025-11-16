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
