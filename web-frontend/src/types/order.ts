export type ProductOrderStatus =
  | "payment_pending"
  | "payment_authorized"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type ProductOrderPaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type ProductOrderLineItem = {
  product?: string;
  variant?: string;
  productName: string;
  productSku?: string;
  productCategory?: string;
  variantTitle?: string;
  variantSku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  unit?: string;
};

export type ProductOrderTotals = {
  subtotal: number;
  total: number;
  amountPaid: number;
  currency: string;
  itemCount: number;
};

export type ProductOrder = {
  _id: string;
  clientRequestId?: string;
  buyer: {
    user: string;
    displayName?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  source: "buy_now" | "cart";
  status: ProductOrderStatus;
  paymentStatus: ProductOrderPaymentStatus;
  paymentProvider?: string;
  lineItems: ProductOrderLineItem[];
  totals: ProductOrderTotals;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CheckoutIntentResponse = {
  order: ProductOrder;
  payment: {
    provider: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    receipt?: string;
  };
};

export type VerifyPaymentPayload = {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyPaymentResponse = {
  success: boolean;
  message?: string;
  orderId?: string;
  paymentStatus?: ProductOrderPaymentStatus;
  order?: ProductOrder;
};

export type OrderListResponse = {
  orders: ProductOrder[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};
