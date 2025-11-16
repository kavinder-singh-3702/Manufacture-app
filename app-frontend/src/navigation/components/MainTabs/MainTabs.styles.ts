import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  screenContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hamburger: {
    padding: 8,
    marginRight: 12,
  },
  hamburgerLine: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  userInfo: {
    flex: 1,
  },
});
