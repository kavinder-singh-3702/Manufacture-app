import RazorpayCheckout from "react-native-razorpay";
import { PAYMENT_CONFIG } from "../config/payment";
import { apiClient } from "./apiClient";

export type CheckoutSource = "buy_now" | "cart";

export type CheckoutAddressInput = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CheckoutLineInput = {
  lineKey?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  productName?: string;
  variantTitle?: string;
  unitPrice?: number;
  currency?: string;
};

export type ProductOrderLineItem = {
  product?: string;
  variant?: string;
  productName: string;
  productSku?: string;
  productCategory?: string;
  productSubCategory?: string;
  variantTitle?: string;
  variantSku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  unit?: string;
  purchaseConfig: {
    prepaidEnabled: boolean;
    paymentMode: "none" | "full_prepay";
    provider: "none" | "razorpay";
  };
};

export type ProductOrderSummary = {
  id: string;
  clientRequestId?: string;
  shippingAddress: CheckoutAddressInput;
  source: CheckoutSource;
  status: string;
  paymentStatus: "pending" | "authorized" | "paid" | "failed" | "cancelled" | "refunded";
  paymentProvider: "razorpay";
  lineItems: ProductOrderLineItem[];
  totals: {
    subtotal: number;
    total: number;
    amountPaid: number;
    currency: string;
    itemCount: number;
  };
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
};

export type CheckoutIntentPayment = {
  provider: "razorpay";
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  receipt?: string;
  notes?: Record<string, string>;
};

export type CheckoutIntentRequest = {
  source: CheckoutSource;
  clientRequestId: string;
  lines: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddress?: CheckoutAddressInput;
};

export type CheckoutIntentResponse = {
  order: ProductOrderSummary;
  payment: CheckoutIntentPayment;
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
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyPaymentResponse = {
  success: boolean;
  message: string;
  orderId: string;
  paymentStatus: ProductOrderSummary["paymentStatus"];
  order: ProductOrderSummary;
};

export type CheckoutOptions = {
  source: CheckoutSource;
  lines: CheckoutLineInput[];
  shippingAddress?: CheckoutAddressInput;
  clientRequestId?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
};

const sanitizeAddress = (address?: Partial<CheckoutAddressInput> | null): CheckoutAddressInput | undefined => {
  if (!address) return undefined;

  const sanitized = {
    line1: String(address.line1 || "").trim(),
    line2: String(address.line2 || "").trim() || undefined,
    city: String(address.city || "").trim(),
    state: String(address.state || "").trim(),
    postalCode: String(address.postalCode || "").trim(),
    country: String(address.country || "").trim(),
  };

  if (!sanitized.line1 || !sanitized.city || !sanitized.state || !sanitized.postalCode || !sanitized.country) {
    return undefined;
  }

  return sanitized;
};

const createClientRequestId = () =>
  `co_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

class PaymentService {
  async createCheckoutIntent(payload: CheckoutIntentRequest): Promise<CheckoutIntentResponse> {
    return apiClient.post<CheckoutIntentResponse>("/product-orders/checkout-intent", payload);
  }

  async openCheckout(
    checkoutIntent: CheckoutIntentResponse,
    options?: {
      description?: string;
      prefill?: { name?: string; email?: string; contact?: string };
    }
  ): Promise<RazorpaySuccessData> {
    const razorpayOptions = {
      key: checkoutIntent.payment.keyId,
      amount: String(checkoutIntent.payment.amount),
      currency: checkoutIntent.payment.currency,
      name: PAYMENT_CONFIG.companyName,
      description: options?.description ?? PAYMENT_CONFIG.defaultDescription,
      order_id: checkoutIntent.payment.razorpayOrderId,
      prefill: {
        name: options?.prefill?.name ?? PAYMENT_CONFIG.prefill.name,
        email: options?.prefill?.email ?? PAYMENT_CONFIG.prefill.email,
        contact: options?.prefill?.contact ?? PAYMENT_CONFIG.prefill.contact,
      },
      notes: checkoutIntent.payment.notes ?? {},
      theme: {
        color: PAYMENT_CONFIG.themeColor,
      },
    };

    return RazorpayCheckout.open(razorpayOptions);
  }

  async verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    return apiClient.post<VerifyPaymentResponse>("/product-orders/verify-payment", payload);
  }

  async checkout(options: CheckoutOptions): Promise<VerifyPaymentResponse> {
    const clientRequestId = options.clientRequestId || createClientRequestId();
    const checkoutIntent = await this.createCheckoutIntent({
      source: options.source,
      clientRequestId,
      lines: options.lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
      })),
      shippingAddress: sanitizeAddress(options.shippingAddress),
    });

    const successData = await this.openCheckout(checkoutIntent, {
      description: options.description,
      prefill: options.prefill,
    });

    return this.verifyPayment({
      orderId: checkoutIntent.order.id,
      razorpay_order_id: successData.razorpay_order_id,
      razorpay_payment_id: successData.razorpay_payment_id,
      razorpay_signature: successData.razorpay_signature,
    });
  }
}

export const paymentService = new PaymentService();
