import { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { CompanySwitcherCard } from "../../components/company";
import { useTheme } from "../../hooks/useTheme";
import { redirectAfterCompanyResolved } from "../../navigation/companyContextNavigation";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PickerRoute = RouteProp<RootStackParamList, "CompanyContextPicker">;

export const CompanyContextPickerScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<PickerRoute>();
  const redirectTo = route.params?.redirectTo;
  const source = route.params?.source;

  const handleCompanySwitched = useCallback(() => {
    redirectAfterCompanyResolved(navigation, redirectTo);
  }, [navigation, redirectTo]);

  const handleCreateCompany = useCallback(() => {
    navigation.navigate("CompanyCreate", { redirectTo });
  }, [navigation, redirectTo]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlayAccent]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Active Company</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {source ? `${source} needs a company context to continue.` : "Select a company before continuing."}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
        <CompanySwitcherCard onSwitched={handleCompanySwitched} onAddCompany={handleCreateCompany} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
