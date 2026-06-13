import { useEffect, useRef } from "react";
import { StyleProp, ViewStyle } from "react-native";
import PagerView from "react-native-pager-view";

interface SwipePagerProps {
  pageIndex: number;
  onPageChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// Native: real swipeable pager. Controlled by `pageIndex` — tapping a header
// drives it via setPage; swiping reports back through onPageChange. Both paths
// converge on the parent's state.
export const SwipePager = ({ pageIndex, onPageChange, style, children }: SwipePagerProps) => {
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    pagerRef.current?.setPage(pageIndex);
  }, [pageIndex]);

  return (
    <PagerView
      ref={pagerRef}
      style={style}
      initialPage={pageIndex}
      onPageSelected={(event) => onPageChange(event.nativeEvent.position)}
    >
      {children}
    </PagerView>
  );
};
