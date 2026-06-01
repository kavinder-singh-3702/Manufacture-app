import { httpClient } from "../lib/http-client";
import type {
  CheckoutAddressInput,
  CheckoutLineInput,
  CheckoutSource,
} from "../types/cart";
import type {
  CheckoutIntentResponse,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
} from "../types/order";

export type CreateCheckoutIntentPayload = {
  source: CheckoutSource;
  lines: CheckoutLineInput[];
  shippingAddress: CheckoutAddressInput;
  clientRequestId?: string;
};

const createCheckoutIntent = async (payload: CreateCheckoutIntentPayload) =>
  httpClient.post<CheckoutIntentResponse>("/product-orders/checkout-intent", payload);

const verifyPayment = async (payload: VerifyPaymentPayload) =>
  httpClient.post<VerifyPaymentResponse>("/product-orders/verify-payment", payload);

export const checkoutService = { createCheckoutIntent, verifyPayment };
