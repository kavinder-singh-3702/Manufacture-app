// Tiny module-level pub/sub used to decouple "user added an item to the cart"
// from the global cross-sell ad modal host. CartProvider emits; CrossSellAdHost
// subscribes. Keeps us from threading callbacks through the provider tree.

export type CrossSellTrigger = {
  productId: string;
  category?: string;
  subCategory?: string;
};

type Listener = (payload: CrossSellTrigger) => void;

const listeners = new Set<Listener>();

export const crossSellEvents = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit(payload: CrossSellTrigger): void {
    listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // A misbehaving listener must not break add-to-cart.
      }
    });
  },
};
