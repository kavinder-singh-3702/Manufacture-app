import { CommonActions, createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

export const navigateRoot = (
  screen: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
) => {
  if (!rootNavigationRef.isReady()) return false;
  rootNavigationRef.dispatch(
    CommonActions.navigate({
      name: screen as string,
      params: params as object | undefined,
    })
  );
  return true;
};
