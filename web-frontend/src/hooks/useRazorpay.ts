"use client";

import { useCallback, useRef } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const loadScript = (): Promise<boolean> => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayOptions = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
};

export const useRazorpay = () => {
  const instanceRef = useRef<unknown>(null);

  const openCheckout = useCallback(async (options: RazorpayOptions): Promise<void> => {
    const loaded = await loadScript();
    if (!loaded || !window.Razorpay) {
      throw new Error("Razorpay could not be loaded. Check your internet connection.");
    }

    const rzp = new window.Razorpay({
      key: options.keyId,
      order_id: options.orderId,
      amount: options.amount,
      currency: options.currency,
      name: options.name ?? "Manufacture Command",
      description: options.description ?? "Product Purchase",
      prefill: options.prefill ?? {},
      theme: { color: "#148DB2" },
      modal: { ondismiss: options.onDismiss },
      handler: (response: RazorpaySuccessResponse) => {
        options.onSuccess(response);
      },
    });

    instanceRef.current = rzp;
    rzp.open();
  }, []);

  return { openCheckout };
};
