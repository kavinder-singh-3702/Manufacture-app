import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Typography } from "../common/Typography";

export type QuickAction = {
  id: string;
  title: string;
  description: string;
  cta: string;
};

type QuickActionGridProps = {
  actions: readonly QuickAction[];
};

export const QuickActionGrid = ({ actions }: QuickActionGridProps) => {
  const { colors, radius, spacing } = useTheme();

  return (
    <View style={[styles.grid, { marginTop: spacing.xs }]}>
      {actions.map((action) => (
        <View key={action.id} style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border }]}>
          <View style={styles.cardContent}>
            <Typography variant="body" style={styles.title}>
              {action.title}
            </Typography>
            <Text style={styles.description}>{action.description}</Text>
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]}>
            <Text style={[styles.buttonLabel, { color: colors.textInverse }]}>{action.cta}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    flexBasis: "48%",
    backgroundColor: "#fff",
    padding: 10,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    justifyContent: "space-between",
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
  },
  description: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 8,
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonLabel: {
    fontWeight: "600",
  },
});
