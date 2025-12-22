import { createContext, ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Product, productService } from "../services/product.service";
import { preferenceService } from "../services/preference.service";

// ============================================================
// CART TYPES
// ============================================================

export type CartItem = {
  item: Product;
  quantity: number;
  addedAt: Date;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalItems: number;
  addToCart: (item: Product, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCartItem: (itemId: string, updatedProduct: Product) => void;
  refreshCartItems: () => Promise<void>;
  clearCart: () => void;
  isInCart: (itemId: string) => boolean;
  getCartItem: (itemId: string) => CartItem | undefined;
};

export const CartContext = createContext<CartContextValue | undefined>(undefined);

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>(items);

  // Keep ref in sync with state
  itemsRef.current = items;

  const logEventSafe = useCallback((payload: Parameters<typeof preferenceService.logEvent>[0]) => {
    preferenceService.logEvent(payload).catch((err) => {
      console.warn("Preference log failed", err?.message || err);
    });
  }, []);

  const addToCart = useCallback((item: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.item._id === item._id);
      if (existingIndex >= 0) {
        // Update existing item quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      // Add new item
      return [...prev, { item, quantity, addedAt: new Date() }];
    });

    logEventSafe({
      type: "add_to_cart",
      productId: item._id,
      category: item.category,
      quantity,
    });
  }, [logEventSafe]);

  const removeFromCart = useCallback((itemId: string) => {
    const existing = itemsRef.current.find((ci) => ci.item._id === itemId);
    setItems((prev) => prev.filter((ci) => ci.item._id !== itemId));
    logEventSafe({
      type: "remove_from_cart",
      productId: itemId,
      category: existing?.item?.category,
    });
  }, [logEventSafe]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((ci) => ci.item._id !== itemId));
      return;
    }
    setItems((prev) =>
      prev.map((ci) =>
        ci.item._id === itemId ? { ...ci, quantity } : ci
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const updateCartItem = useCallback((itemId: string, updatedProduct: Product) => {
    setItems((prev) =>
      prev.map((ci) =>
        ci.item._id === itemId ? { ...ci, item: updatedProduct } : ci
      )
    );
  }, []);

  const refreshCartItems = useCallback(async () => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) return;

    try {
      const updatedItems = await Promise.all(
        currentItems.map(async (ci) => {
          try {
            const updatedProduct = await productService.getById(ci.item._id);
            // Adjust cart quantity if it exceeds available stock
            const availableQty = updatedProduct.availableQuantity || 0;
            const adjustedQuantity = Math.min(ci.quantity, availableQty);
            // If no stock available, set to 1 (user can remove manually)
            const finalQuantity = adjustedQuantity > 0 ? adjustedQuantity : 1;
            return { ...ci, item: updatedProduct, quantity: finalQuantity };
          } catch {
            // If product not found (deleted), keep the old item data
            // It will be displayed but can be removed by user
            return ci;
          }
        })
      );
      // Filter out items with 0 available quantity if needed
      setItems(updatedItems);
    } catch (error) {
      console.error("Error refreshing cart items:", error);
    }
  }, []);

  const isInCart = useCallback(
    (itemId: string) => items.some((ci) => ci.item._id === itemId),
    [items]
  );

  const getCartItem = useCallback(
    (itemId: string) => items.find((ci) => ci.item._id === itemId),
    [items]
  );

  // Number of unique items in cart
  const itemCount = items.length;

  // Total quantity of all items
  const totalItems = useMemo(
    () => items.reduce((sum, ci) => sum + ci.quantity, 0),
    [items]
  );

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
    }),
    [items, itemCount, totalItems, addToCart, removeFromCart, updateQuantity, updateCartItem, refreshCartItems, clearCart, isInCart, getCartItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
