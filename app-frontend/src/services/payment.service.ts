/**
 * Payment service — handles Razorpay order creation, checkout, and verification.
 *
 * Flow:
 *  1. Frontend calls `createOrder()` → backend creates a Razorpay order
 *  2. Frontend calls `openCheckout()` → launches Razorpay payment sheet
 *  3. On success, frontend calls `verifyPayment()` → backend verifies signature
 */

import RazorpayCheckout from "react-native-razorpay";
import { apiClient } from "./apiClient";
import { PAYMENT_CONFIG } from "../config/payment";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateOrderPayload = {
  /** Amount in the smallest currency unit (paise for INR). e.g. ₹500 → 50000 */
  amount: number;
  /** Optional reference to a quote that's being paid */
  quoteId?: string;
  /** Optional notes/metadata for the order */
  notes?: Record<string, string>;
};

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
};

export type CreateOrderResponse = {
  success: boolean;
  order: RazorpayOrder;
};

export type RazorpaySuccessData = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayErrorData = {
  code: number;
  description: string;
};

export type VerifyPaymentPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyPaymentResponse = {
  success: boolean;
  message: string;
  orderId?: string;
};

export type CheckoutOptions = {
  /** Amount in rupees (will be converted to paise internally) */
  amountInRupees: number;
  /** Description shown on checkout */
  description?: string;
  /** Prefill contact info */
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  /** Quote ID if paying for a quote */
  quoteId?: string;
  /** Additional notes */
  notes?: Record<string, string>;
};

// ─── Service ─────────────────────────────────────────────────────────────────

class PaymentService {
  /**
   * Step 1: Ask backend to create a Razorpay order
   */
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    return apiClient.post<CreateOrderResponse>("/payments/create-order", payload);
  }

  /**
   * Step 2: Open the Razorpay checkout sheet
   * Returns the success data (payment_id, order_id, signature) or throws on failure.
   */
  async openCheckout(
    razorpayOrderId: string,
    amountInPaise: number,
    options?: {
      description?: string;
      prefill?: { name?: string; email?: string; contact?: string };
      notes?: Record<string, string>;
    }
  ): Promise<RazorpaySuccessData> {
    const razorpayOptions = {
      key: PAYMENT_CONFIG.razorpayKeyId,
      amount: String(amountInPaise),
      currency: PAYMENT_CONFIG.currency,
      name: PAYMENT_CONFIG.companyName,
      description: options?.description ?? PAYMENT_CONFIG.defaultDescription,
      order_id: razorpayOrderId,
      prefill: {
        name: options?.prefill?.name ?? PAYMENT_CONFIG.prefill.name,
        email: options?.prefill?.email ?? PAYMENT_CONFIG.prefill.email,
        contact: options?.prefill?.contact ?? PAYMENT_CONFIG.prefill.contact,
      },
      notes: options?.notes ?? {},
      theme: {
        color: PAYMENT_CONFIG.themeColor,
      },
    };

    // RazorpayCheckout.open returns a promise that resolves on success, rejects on failure
    const data: RazorpaySuccessData = await RazorpayCheckout.open(razorpayOptions);
    return data;
  }

  /**
   * Step 3: Ask backend to verify the payment signature
   */
  async verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    return apiClient.post<VerifyPaymentResponse>("/payments/verify", payload);
  }

  /**
   * Convenience: Full checkout flow (create order → open checkout → verify)
   * Returns verification response on success, or throws with user-friendly message.
   */
  async checkout(options: CheckoutOptions): Promise<VerifyPaymentResponse> {
    const amountInPaise = Math.round(options.amountInRupees * 100);

    // 1. Create order on backend
    const { order } = await this.createOrder({
      amount: amountInPaise,
      quoteId: options.quoteId,
      notes: options.notes,
    });

    // 2. Open Razorpay checkout
    const successData = await this.openCheckout(order.id, order.amount, {
      description: options.description,
      prefill: options.prefill,
      notes: options.notes,
    });

    // 3. Verify payment on backend
    const verification = await this.verifyPayment({
      razorpay_order_id: successData.razorpay_order_id,
      razorpay_payment_id: successData.razorpay_payment_id,
      razorpay_signature: successData.razorpay_signature,
    });

    return verification;
  }
}

export const paymentService = new PaymentService();
