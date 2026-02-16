import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { routes } from "./routes";
import type { CompanyContextRedirectTarget, RootStackParamList } from "./types";

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

type NavigationMode = "replace" | "navigate";

export const redirectAfterCompanyResolved = (
  navigation: RootNavigation,
  redirectTo?: CompanyContextRedirectTarget,
  mode: NavigationMode = "replace"
) => {
  if (redirectTo?.kind === "main") {
    (navigation as any)[mode]("Main", { screen: redirectTo.screen as any });
    return;
  }

  if (redirectTo?.kind === "stack") {
    (navigation as any)[mode](redirectTo.screen, redirectTo.params as any);
    return;
  }

  (navigation as any)[mode]("Main", { screen: routes.DASHBOARD as any });
};
