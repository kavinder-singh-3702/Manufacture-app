import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";

export type SpotlightProgram = {
  id: string;
  title: string;
  stat: string;
  description: string;
};

type SpotlightProgramsProps = {
  title?: string;
  programs: readonly SpotlightProgram[];
  actionLabel?: string;
  onProgramPress?: (programId: string) => void;
  onActionPress?: () => void;
};

export const SpotlightPrograms = ({
  title = "Spotlight programs",
  programs,
  actionLabel,
  onProgramPress,
  onActionPress,
}: SpotlightProgramsProps) => {
  const { colors, radius, spacing } = useTheme();

  return (
    <View>
      <View style={styles.header}>
        <Typography variant="subheading">{title}</Typography>
        {actionLabel ? (
          <TouchableOpacity onPress={onActionPress}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={[styles.wrap, { marginTop: spacing.sm }]}>
        {programs.map((program) => (
          <TouchableOpacity
            key={program.id}
            style={[styles.card, { borderRadius: radius.lg, borderColor: colors.border }]}
            activeOpacity={onProgramPress ? 0.8 : 1}
            onPress={() => onProgramPress?.(program.id)}
          >
            <Text style={styles.stat}>{program.stat}</Text>
            <Typography variant="body" style={styles.title}>
              {program.title}
            </Typography>
            <Text style={styles.description}>{program.description}</Text>
            <Text style={styles.linkText}>Know more &gt;</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A7C7D",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    flexBasis: "48%",
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  stat: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#0A7C7D",
  },
  title: {
    marginTop: 4,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "#475467",
    marginVertical: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A7C7D",
  },
});
