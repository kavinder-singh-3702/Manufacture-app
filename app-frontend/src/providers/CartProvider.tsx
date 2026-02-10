import { createContext, ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Product, productService } from "../services/product.service";
import { productVariantService } from "../services/productVariant.service";
import { preferenceService } from "../services/preference.service";

export type CartVariantSnapshot = {
  id: string;
  title?: string;
  options?: Record<string, unknown>;
  price?: {
    amount: number;
    currency?: string;
    unit?: string;
  } | null;
  unit?: string;
};

export const getCartLineKey = (itemId: string, variantId?: string | null) => `${itemId}::${variantId || "base"}`;

export type CartItem = {
  lineKey: string;
  item: Product;
  variant?: CartVariantSnapshot | null;
  quantity: number;
  addedAt: Date;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalItems: number;
  addToCart: (item: Product, quantity?: number, variant?: CartVariantSnapshot | null) => void;
  removeFromCart: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  updateCartItem: (itemId: string, updatedProduct: Product) => void;
  refreshCartItems: () => Promise<void>;
  clearCart: () => void;
  isInCart: (itemId: string, variantId?: string | null) => boolean;
  getCartItem: (itemId: string, variantId?: string | null) => CartItem | undefined;
  getProductQuantity: (itemId: string) => number;
};

export const CartContext = createContext<CartContextValue | undefined>(undefined);

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>(items);

  itemsRef.current = items;

  const logEventSafe = useCallback((payload: Parameters<typeof preferenceService.logEvent>[0]) => {
    preferenceService.logEvent(payload).catch((err) => {
      console.warn("Preference log failed", err?.message || err);
    });
  }, []);

  const addToCart = useCallback(
    (item: Product, quantity: number = 1, variant?: CartVariantSnapshot | null) => {
      const lineKey = getCartLineKey(item._id, variant?.id);

      setItems((prev) => {
        const existingIndex = prev.findIndex((ci) => ci.lineKey === lineKey);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
            variant: variant || updated[existingIndex].variant,
          };
          return updated;
        }

        return [
          ...prev,
          {
            lineKey,
            item,
            variant: variant || null,
            quantity,
            addedAt: new Date(),
          },
        ];
      });

      logEventSafe({
        type: "add_to_cart",
        productId: item._id,
        category: item.category,
        quantity,
        meta: {
          variantId: variant?.id,
          variantTitle: variant?.title,
        },
      } as any);
    },
    [logEventSafe]
  );

  const removeFromCart = useCallback(
    (lineKey: string) => {
      const existing = itemsRef.current.find((ci) => ci.lineKey === lineKey);
      setItems((prev) => prev.filter((ci) => ci.lineKey !== lineKey));
      logEventSafe({
        type: "remove_from_cart",
        productId: existing?.item?._id,
        category: existing?.item?.category,
        meta: {
          variantId: existing?.variant?.id,
          variantTitle: existing?.variant?.title,
        },
      } as any);
    },
    [logEventSafe]
  );

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((ci) => ci.lineKey !== lineKey));
      return;
    }
    setItems((prev) =>
      prev.map((ci) => (ci.lineKey === lineKey ? { ...ci, quantity } : ci))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const updateCartItem = useCallback((itemId: string, updatedProduct: Product) => {
    setItems((prev) =>
      prev.map((ci) => (ci.item._id === itemId ? { ...ci, item: updatedProduct } : ci))
    );
  }, []);

  const refreshCartItems = useCallback(async () => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) return;

    try {
      const updatedItems = await Promise.all(
        currentItems.map(async (ci) => {
          try {
            const updatedProduct = await productService.getById(ci.item._id, {
              scope: "marketplace",
              includeVariantSummary: true,
            });

            let availableQty = Number(updatedProduct.availableQuantity || 0);
            let updatedVariant = ci.variant || null;

            if (ci.variant?.id) {
              try {
                const variant = await productVariantService.getById(ci.item._id, ci.variant.id, {
                  scope: "marketplace",
                });
                availableQty = Number(variant.availableQuantity || 0);
                updatedVariant = {
                  ...ci.variant,
                  id: variant._id,
                  title: variant.title || ci.variant.title,
                  options: (variant.options as Record<string, unknown>) || ci.variant.options,
                  price: variant.price || ci.variant.price,
                  unit: variant.unit || ci.variant.unit,
                };
              } catch {
                // Keep existing snapshot if variant fetch fails
              }
            }

            const adjustedQuantity = Math.min(ci.quantity, Number.isFinite(availableQty) ? availableQty : ci.quantity);
            if (Number.isFinite(availableQty) && availableQty <= 0) {
              return null;
            }
            const finalQuantity = adjustedQuantity > 0 ? adjustedQuantity : 1;
            return { ...ci, item: updatedProduct, variant: updatedVariant, quantity: finalQuantity };
          } catch {
            return ci;
          }
        })
      );

      setItems(updatedItems.filter((item): item is CartItem => Boolean(item)));
    } catch (error) {
      console.error("Error refreshing cart items:", error);
    }
  }, []);

  const isInCart = useCallback(
    (itemId: string, variantId?: string | null) => {
      if (variantId !== undefined) {
        return items.some((ci) => ci.lineKey === getCartLineKey(itemId, variantId));
      }
      return items.some((ci) => ci.item._id === itemId);
    },
    [items]
  );

  const getCartItem = useCallback(
    (itemId: string, variantId?: string | null) => {
      if (variantId !== undefined) {
        return items.find((ci) => ci.lineKey === getCartLineKey(itemId, variantId));
      }
      return items.find((ci) => ci.item._id === itemId);
    },
    [items]
  );

  const getProductQuantity = useCallback(
    (itemId: string) => items.filter((ci) => ci.item._id === itemId).reduce((sum, ci) => sum + ci.quantity, 0),
    [items]
  );

  const itemCount = items.length;
  const totalItems = useMemo(() => items.reduce((sum, ci) => sum + ci.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      totalItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateCartItem,
      refreshCartItems,
      clearCart,
      isInCart,
      getCartItem,
      getProductQuantity,
    }),
    [
      items,
      itemCount,
      totalItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateCartItem,
      refreshCartItems,
      clearCart,
      isInCart,
      getCartItem,
      getProductQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
