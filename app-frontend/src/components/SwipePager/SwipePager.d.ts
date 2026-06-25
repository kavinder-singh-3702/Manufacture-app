import { StyleProp, ViewStyle } from "react-native";

// Type surface shared by SwipePager.native.tsx and SwipePager.web.tsx. TypeScript
// doesn't follow Metro's platform-extension resolution, so this declares the
// module that `./SwipePager` resolves to at runtime.
interface SwipePagerProps {
  pageIndex: number;
  onPageChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export declare const SwipePager: (props: SwipePagerProps) => JSX.Element;
