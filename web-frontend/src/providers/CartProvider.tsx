"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem, CartVariantSnapshot } from "../types/cart";
import { getCartLineKey } from "../types/cart";
import type { Product } from "../types/product";

const STORAGE_KEY = "manufacture:cart";
export const MAX_CART_ITEMS = 30;

export type AddToCartResult = "added" | "updated" | "limit";

type CartContextValue = {
  items: CartItem[];
  totalCount: number;
  totalValue: number;
  eligibleItems: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: CartVariantSnapshot) => AddToCartResult;
  removeFromCart: (lineKey: string) => void;
  removeManyFromCart: (lineKeys: string[]) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string, variantId?: string) => boolean;
  getCartItem: (productId: string, variantId?: string) => CartItem | undefined;
};

const CartContext = createContext<CartContextValue | null>(null);

const loadFromStorage = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
};

const saveToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage errors ignored
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setItems(loadFromStorage());
    setHydrated(true);
  }, []);

  // Persist whenever items change (after hydration)
  useEffect(() => {
    if (hydrated) saveToStorage(items);
  }, [items, hydrated]);

  const addToCart = useCallback((product: Product, quantity = 1, variant?: CartVariantSnapshot): AddToCartResult => {
    const lineKey = getCartLineKey(product._id, variant?.id);
    // Decide the outcome from current state so the caller gets a synchronous
    // result (the setItems updater runs later, during render).
    const existing = items.find((i) => i.lineKey === lineKey);
    const result: AddToCartResult = existing
      ? "updated"
      : items.length >= MAX_CART_ITEMS
        ? "limit"
        : "added";

    if (result === "limit") return result;

    setItems((prev) => {
      const current = prev.find((i) => i.lineKey === lineKey);
      if (current) {
        return prev.map((i) =>
          i.lineKey === lineKey ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      if (prev.length >= MAX_CART_ITEMS) return prev;
      const newItem: CartItem = {
        lineKey,
        product,
        variant,
        quantity,
        addedAt: new Date().toISOString(),
      };
      return [...prev, newItem];
    });
    return result;
  }, [items]);

  const removeFromCart = useCallback((lineKey: string) =>
    setItems((prev) => prev.filter((i) => i.lineKey !== lineKey)), []);

  const removeManyFromCart = useCallback((lineKeys: string[]) =>
    setItems((prev) => prev.filter((i) => !lineKeys.includes(i.lineKey))), []);

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.lineKey !== lineKey));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.lineKey === lineKey ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (productId: string, variantId?: string) =>
      items.some((i) => i.lineKey === getCartLineKey(productId, variantId)),
    [items]
  );

  const getCartItem = useCallback(
    (productId: string, variantId?: string) =>
      items.find((i) => i.lineKey === getCartLineKey(productId, variantId)),
    [items]
  );

  const eligibleItems = useMemo(
    () => items.filter((i) => i.product.purchaseOptions?.checkoutEligible),
    [items]
  );

  const totalCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const totalValue = useMemo(
    () =>
      items.reduce((s, i) => {
        const price = i.variant?.price?.amount ?? i.product.price.amount;
        return s + price * i.quantity;
      }, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items, totalCount, totalValue, eligibleItems,
      addToCart, removeFromCart, removeManyFromCart, updateQuantity,
      clearCart, isInCart, getCartItem,
    }),
    [items, totalCount, totalValue, eligibleItems, addToCart, removeFromCart,
      removeManyFromCart, updateQuantity, clearCart, isInCart, getCartItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
