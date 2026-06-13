import { Children } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

interface SwipePagerProps {
  pageIndex: number;
  onPageChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// Web: react-native-pager-view is native-only, so there's no swipe here.
// Header taps still switch tabs (parent controls pageIndex); we just render
// the active page. onPageChange is unused on web but kept for API parity.
export const SwipePager = ({ pageIndex, style, children }: SwipePagerProps) => {
  const pages = Children.toArray(children);
  return <View style={style}>{pages[pageIndex] ?? null}</View>;
};
