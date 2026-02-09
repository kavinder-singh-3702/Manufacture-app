import { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "./CartProvider";
import { UnreadMessagesProvider } from "./UnreadMessagesProvider";
import { NotificationsProvider } from "./NotificationsProvider";
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
            <UnreadMessagesProvider>
              <NotificationsProvider>
                <ToastProvider>{children}</ToastProvider>
              </NotificationsProvider>
            </UnreadMessagesProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
