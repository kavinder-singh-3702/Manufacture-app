import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";

type ToastType = "success" | "error" | "warning" | "info";

type ToastInput =
  | string
  | {
      title?: any;
      message?: any;
      duration?: number;
    };

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  success: (title: ToastInput, message?: any) => void;
  error: (title: ToastInput, message?: any) => void;
  warning: (title: ToastInput, message?: any) => void;
  info: (title: ToastInput, message?: any) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastIcon = ({ type, color }: { type: ToastType; color: string }) => {
  if (type === "success") {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path
          d="M20 6L9 17l-5-5"
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (type === "error") {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} fill="none" />
        <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === "warning") {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path
          d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    );
  }

  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
};

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const { colors, radius } = useTheme();
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(width)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(1)).current;

  const getTone = () => {
    switch (toast.type) {
      case "success":
        return { bg: colors.successBg, border: colors.success };
      case "error":
        return { bg: colors.errorBg, border: colors.error };
      case "warning":
        return { bg: colors.warningBg, border: colors.warning };
      case "info":
        return { bg: colors.infoBg, border: colors.info };
    }
  };

  const tone = getTone();
  const duration = toast.duration || 4000;

  useEffect(() => {
    translateX.setValue(width);
  }, [translateX, width]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressWidth, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, opacity, progressWidth, translateX, width]);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: width,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onRemove(toast.id));
  };

  const progressWidthInterpolated = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: tone.bg,
          borderLeftColor: tone.border,
          borderRadius: radius.md,
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <ToastIcon type={toast.type} color={tone.border} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{toast.title}</Text>
        {toast.message ? <Text style={[styles.message, { color: colors.textMuted }]}>{toast.message}</Text> : null}
      </View>

      <TouchableOpacity onPress={handleRemove} style={styles.closeButton}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: tone.border,
            width: progressWidthInterpolated,
          },
        ]}
      />
    </Animated.View>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
}

const toText = (value: any) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  try {
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  } catch {
    return String(value);
  }
};

const defaultTitleForType: Record<ToastType, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

const buildToast = (type: ToastType, title: ToastInput, message?: any) => {
  if (typeof title === "string") {
    return {
      type,
      title: toText(title) || defaultTitleForType[type],
      message: message ? toText(message) : undefined,
    };
  }

  return {
    type,
    title: toText(title?.title) || defaultTitleForType[type],
    message: title?.message ? toText(title.message) : undefined,
    duration: title?.duration,
  };
};

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: ToastInput, message?: any) => addToast(buildToast("success", title, message)),
    [addToast]
  );

  const error = useCallback(
    (title: ToastInput, message?: any) => addToast(buildToast("error", title, message)),
    [addToast]
  );

  const warning = useCallback(
    (title: ToastInput, message?: any) => addToast(buildToast("warning", title, message)),
    [addToast]
  );

  const info = useCallback(
    (title: ToastInput, message?: any) => addToast(buildToast("info", title, message)),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  message: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 3,
    opacity: 0.3,
  },
});
