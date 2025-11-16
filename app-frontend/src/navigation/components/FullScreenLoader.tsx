import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export const FullScreenLoader = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
