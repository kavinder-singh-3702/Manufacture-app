/**
 * Razorpay payment configuration.
 *
 * Replace the placeholder values with your actual Razorpay credentials
 * before going live. The key is safe to embed in the client app —
 * the secret must ONLY live on your backend server.
 *
 * Test-mode keys start with "rzp_test_", live keys with "rzp_live_".
 */

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_test_REPLACE_ME";

export const PAYMENT_CONFIG = {
  razorpayKeyId: RAZORPAY_KEY_ID,

  /** Company name shown on the Razorpay checkout sheet */
  companyName: "ARVANN",

  /** Fallback description if none provided */
  defaultDescription: "ARVANN Order Payment",

  /** Default currency */
  currency: "INR" as const,

  /** App theme color shown in Razorpay UI */
  themeColor: "#4F46E5",

  /** Prefill defaults (override per-transaction) */
  prefill: {
    name: "",
    email: "",
    contact: "",
  },
} as const;
