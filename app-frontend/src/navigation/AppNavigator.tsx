import { useEffect, useState } from "react";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { useAuth } from "../hooks/useAuth";
import { MainTabs } from "./components/MainTabs";
import { FullScreenLoader } from "./components/FullScreenLoader";
import { ProfileScreen } from "../screens/profile/ProfileScreen";

export const AppNavigator = () => {
  const { user, initializing } = useAuth();
  const [scene, setScene] = useState<"main" | "profile">("main");

  useEffect(() => {
    if (!user && scene !== "main") {
      setScene("main");
    }
  }, [scene, user]);

  if (initializing) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (scene === "profile") {
    return <ProfileScreen onBack={() => setScene("main")} />;
  }

  return <MainTabs onShowProfile={() => setScene("profile")} />;
};
