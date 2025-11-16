import { AuthScreen } from "../screens/auth/AuthScreen";
import { useAuth } from "../hooks/useAuth";
import { MainTabs } from "./components/MainTabs";
import { FullScreenLoader } from "./components/FullScreenLoader";

export const AppNavigator = () => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <MainTabs />;
};
