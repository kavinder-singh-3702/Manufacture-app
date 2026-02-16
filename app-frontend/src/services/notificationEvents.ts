const listeners = new Set<() => void>();

export const subscribeNotificationRefresh = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const emitNotificationRefresh = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // no-op for observer errors
    }
  });
};
