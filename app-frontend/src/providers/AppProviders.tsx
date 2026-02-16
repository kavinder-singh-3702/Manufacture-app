import { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "./CartProvider";
import { UnreadMessagesProvider } from "./UnreadMessagesProvider";
import { NotificationsProvider } from "./NotificationsProvider";
import { PushNotificationsProvider } from "./PushNotificationsProvider";
import { ToastProvider } from "../components/ui/Toast";

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>
            <UnreadMessagesProvider>
              <PushNotificationsProvider>
                <NotificationsProvider>
                  <ToastProvider>{children}</ToastProvider>
                </NotificationsProvider>
              </PushNotificationsProvider>
            </UnreadMessagesProvider>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};
