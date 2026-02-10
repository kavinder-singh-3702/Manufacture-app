import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type ProfileProfessionalCardProps = {
  companyAbout?: string | null;
  bio?: string | null;
  tags: string[];
  onEdit: () => void;
};

export const ProfileProfessionalCard = ({ companyAbout, bio, tags, onEdit }: ProfileProfessionalCardProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Professional</Text>
        <TouchableOpacity onPress={onEdit} style={[styles.editButton, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "16" }]}>
          <Ionicons name="pencil" size={13} color={colors.primary} />
          <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.block, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.blockLabel, { color: colors.textMuted }]}>Company About</Text>
        <Text style={[styles.blockValue, { color: colors.text }]} numberOfLines={4}>
          {companyAbout || "Add your company overview to build trust with buyers."}
        </Text>
      </View>

      <View style={[styles.block, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.blockLabel, { color: colors.textMuted }]}>Bio</Text>
        <Text style={[styles.blockValue, { color: colors.text }]} numberOfLines={4}>
          {bio || "Add a short personal bio to highlight your role and expertise."}
        </Text>
      </View>

      <View style={styles.tagsWrap}>
        <Text style={[styles.blockLabel, { color: colors.textMuted }]}>Skills & Interests</Text>
        {tags.length ? (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <View key={tag} style={[styles.tag, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "16" }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.tagsPlaceholder, { color: colors.textMuted }]}>No tags added yet.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  block: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  blockValue: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  tagsWrap: {
    marginTop: 2,
    gap: 8,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tagsPlaceholder: {
    fontSize: 13,
    fontWeight: "500",
  },
});
