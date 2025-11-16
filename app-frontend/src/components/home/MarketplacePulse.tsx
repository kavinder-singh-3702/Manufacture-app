import { StyleSheet, Text, View } from "react-native";
import { Card } from "../common/Card";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";

export type MarketplaceStat = {
  id: string;
  value: string;
  label: string;
};

type MarketplacePulseProps = {
  title?: string;
  stats: readonly MarketplaceStat[];
};

export const MarketplacePulse = ({ title = "Marketplace pulse", stats }: MarketplacePulseProps) => {
  const { colors } = useTheme();

  return (
    <Card>
      <Typography variant="subheading">{title}</Typography>
      <View style={[styles.row, { borderColor: colors.border }]}>
        {stats.map((stat, index) => (
          <View
            key={stat.id}
            style={[
              styles.stat,
              index < stats.length - 1 && { borderRightColor: colors.border, borderRightWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
  },
  stat: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  label: {
    fontSize: 13,
    color: "#475467",
    marginTop: 4,
  },
});
