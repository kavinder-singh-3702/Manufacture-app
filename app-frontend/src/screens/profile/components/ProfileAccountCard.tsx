import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type ProfileAccountCardProps = {
  fullName?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  onEdit: () => void;
};

const Row = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
      <View style={[styles.iconWrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
      </View>
      <View style={styles.valueWrap}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={2}>
          {value || "Not provided"}
        </Text>
      </View>
    </View>
  );
};

export const ProfileAccountCard = ({ fullName, displayName, email, phone, address, onEdit }: ProfileAccountCardProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Account Information</Text>
        <TouchableOpacity onPress={onEdit} style={[styles.editButton, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "16" }]}>
          <Ionicons name="pencil" size={13} color={colors.primary} />
          <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <Row icon="person-outline" label="Full Name" value={fullName} />
      <Row icon="at-outline" label="Display Name" value={displayName} />
      <Row icon="mail-outline" label="Email" value={email} />
      <Row icon="call-outline" label="Phone" value={phone} />
      <Row icon="location-outline" label="Address" value={address} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editText: {
    fontSize: 12,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  valueWrap: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
});
