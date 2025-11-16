import { StyleSheet } from "react-native";

export const authSharedStyles = StyleSheet.create({
  borderedContainer: {
    borderWidth: 1,
  },
  pillBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
  },
  highlightText: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: "600",
  },
  highlightLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  feedbackContainer: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 12,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
