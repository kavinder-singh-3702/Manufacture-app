import React, { ReactNode } from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

type AdaptiveSingleLineTextProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  minimumFontScale?: number;
  allowOverflowScroll?: boolean;
  testID?: string;
};

export const AdaptiveSingleLineText = ({
  children,
  style,
  containerStyle,
  minimumFontScale = 0.68,
  allowOverflowScroll = true,
  testID,
}: AdaptiveSingleLineTextProps) => {
  const textNode = (
    <Text
      testID={testID}
      numberOfLines={1}
      ellipsizeMode="clip"
      adjustsFontSizeToFit
      minimumFontScale={minimumFontScale}
      style={[styles.text, style]}
    >
      {children}
    </Text>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {allowOverflowScroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          alwaysBounceHorizontal={false}
          contentContainerStyle={styles.scrollContent}
        >
          {textNode}
        </ScrollView>
      ) : (
        textNode
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
    flexShrink: 1,
  },
  scrollContent: {
    minWidth: "100%",
    flexGrow: 1,
  },
  text: {
    minWidth: 0,
    flexShrink: 1,
  },
});

