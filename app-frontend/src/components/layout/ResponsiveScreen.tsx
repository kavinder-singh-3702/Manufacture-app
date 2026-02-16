import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import { Edge, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

type ResponsiveScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  keyboardAware?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeAreaEdges?: Edge[];
  paddingHorizontal?: number;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
};

export const ResponsiveScreen = ({
  children,
  scroll = true,
  keyboardAware = false,
  style,
  contentContainerStyle,
  safeAreaEdges = ["top", "left", "right", "bottom"],
  paddingHorizontal,
  scrollProps,
}: ResponsiveScreenProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { contentPadding } = useResponsiveLayout();
  const horizontal = typeof paddingHorizontal === "number" ? paddingHorizontal : contentPadding;

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingHorizontal: horizontal,
          paddingBottom: Math.max(insets.bottom, 10),
          flexGrow: 1,
        },
        contentContainerStyle,
      ]}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        {
          flex: 1,
          paddingHorizontal: horizontal,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={safeAreaEdges} style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {keyboardAware ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

