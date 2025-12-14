import { createContext, ReactNode, useCallback, useMemo, useState } from "react";
import { InventoryItem } from "../services/inventory.service";

// ============================================================
// CART TYPES
// ============================================================

export type CartItem = {
  item: InventoryItem;
  quantity: number;
  addedAt: Date;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalItems: number;
  addToCart: (item: InventoryItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
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

  const addToCart = useCallback((item: InventoryItem, quantity: number = 1) => {
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
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((ci) => ci.item._id !== itemId));
  }, []);

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
      clearCart,
      isInCart,
      getCartItem,
    }),
    [items, itemCount, totalItems, addToCart, removeFromCart, updateQuantity, clearCart, isInCart, getCartItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
