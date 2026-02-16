import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

type AdaptiveTwoLineTextProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  minimumFontScale?: number;
  testID?: string;
};

export const AdaptiveTwoLineText = ({
  children,
  style,
  containerStyle,
  minimumFontScale = 0.62,
  testID,
}: AdaptiveTwoLineTextProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        testID={testID}
        numberOfLines={2}
        ellipsizeMode="clip"
        adjustsFontSizeToFit
        minimumFontScale={minimumFontScale}
        style={[styles.text, style]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
    flexShrink: 1,
  },
  text: {
    minWidth: 0,
    flexShrink: 1,
  },
});

