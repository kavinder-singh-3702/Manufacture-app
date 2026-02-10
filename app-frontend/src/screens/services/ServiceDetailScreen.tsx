import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, "ServiceDetail">;

// Legacy compatibility route: forwards old deep links to the new request screen.
export const ServiceDetailScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const { colors } = useTheme();

  useEffect(() => {
    const id = setTimeout(() => {
      navigation.replace("ServiceRequest", { serviceType: route.params.serviceType });
    }, 0);

    return () => clearTimeout(id);
  }, [navigation, route.params.serviceType]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700" }}>Opening request flow...</Text>
      </View>
    </SafeAreaView>
  );
};
