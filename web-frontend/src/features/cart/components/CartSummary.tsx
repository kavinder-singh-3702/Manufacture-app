import { motion } from "framer-motion";
import { formatCurrency } from "@/src/features/product/utils/categories";
import type { CartItem } from "@/src/types/cart";

type CartSummaryProps = {
  items: CartItem[];
  totalValue: number;
  eligibleValue: number;
  currency?: string;
  /** Show the checkout button — pass false on the checkout page itself */
  showCheckoutCta?: boolean;
  onCheckout?: () => void;
  checkoutDisabled?: boolean;
  ctaLabel?: string;
};

export const CartSummary = ({
  items,
  totalValue,
  eligibleValue,
  currency = "INR",
  showCheckoutCta = true,
  onCheckout,
  checkoutDisabled,
  ctaLabel = "Proceed to checkout",
}: CartSummaryProps) => {
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const shortlistValue = totalValue - eligibleValue;
  const hasShortlist = shortlistValue > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-2xl p-5"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
        Order summary
      </p>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: "var(--medium-gray)" }}>
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          <span className="font-semibold" style={{ color: "var(--foreground)" }}>
            {formatCurrency(totalValue, currency)}
          </span>
        </div>

        {hasShortlist && (
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--medium-gray)" }}>Payable now (checkout)</span>
            <span className="font-semibold" style={{ color: "var(--primary)" }}>
              {formatCurrency(eligibleValue, currency)}
            </span>
          </div>
        )}

        {hasShortlist && (
          <div
            className="rounded-xl p-3 text-xs"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
          >
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>
              {formatCurrency(shortlistValue, currency)} is shortlisted
            </p>
            <p style={{ color: "var(--medium-gray)" }}>
              Some items require seller confirmation — contact them directly.
            </p>
          </div>
        )}

        <div
          className="flex items-center justify-between border-t pt-2.5"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {hasShortlist ? "Checkout total" : "Total"}
          </span>
          <span className="text-xl font-bold" style={{ color: "var(--primary)" }}>
            {formatCurrency(eligibleValue || totalValue, currency)}
          </span>
        </div>
      </div>

      {showCheckoutCta && (
        <button
          type="button"
          onClick={onCheckout}
          disabled={checkoutDisabled || (eligibleValue === 0 && totalValue === 0)}
          className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
        >
          {ctaLabel}
        </button>
      )}

      <p className="text-center text-xs" style={{ color: "var(--medium-gray)" }}>
        Secure checkout via Razorpay · INR only
      </p>
    </motion.div>
  );
};
