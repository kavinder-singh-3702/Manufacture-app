import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { ServiceMeta } from "../services.constants";

export const ServiceTypeCard = ({
  service,
  selected,
  onPress,
  onStart,
}: {
  service: ServiceMeta;
  selected?: boolean;
  onPress?: () => void;
  onStart?: () => void;
}) => {
  const { colors, radius } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          borderRadius: radius.lg,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            {
              borderRadius: radius.md,
              backgroundColor: selected ? `${colors.primary}1A` : colors.surfaceElevated,
              borderColor: selected ? `${colors.primary}4D` : colors.border,
            },
          ]}
        >
          <Ionicons name={service.icon} size={18} color={selected ? colors.primary : colors.textMuted} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{service.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
            {service.subtitle}
          </Text>
        </View>
      </View>

      <Text style={[styles.hint, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
        {service.quickHint}
      </Text>

      {onStart ? (
        <TouchableOpacity
          onPress={onStart}
          activeOpacity={0.8}
          style={[styles.cta, { borderRadius: radius.md, backgroundColor: selected ? colors.primary : colors.surfaceElevated, borderColor: selected ? colors.primary : colors.border }]}
        >
          <Text style={[styles.ctaText, { color: selected ? colors.textOnPrimary : colors.text }]}>Start request</Text>
          <Ionicons name="arrow-forward" size={14} color={selected ? colors.textOnPrimary : colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: "800" },
  subtitle: { marginTop: 2, fontSize: 12, fontWeight: "600", lineHeight: 16 },
  hint: { fontSize: 12, fontWeight: "600" },
  cta: {
    marginTop: 4,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  ctaText: { fontSize: 12, fontWeight: "800" },
});
