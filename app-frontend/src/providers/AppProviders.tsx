import { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "./CartProvider";
import { ToastProvider } from "../components/ui/Toast";

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>{children}</ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
