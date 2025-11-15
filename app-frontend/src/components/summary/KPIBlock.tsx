import { View, StyleSheet } from "react-native";
import { Card } from "../common/Card";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";

type KPIBlockProps = {
  label: string;
  value: string;
  trend?: "up" | "down";
  trendValue?: string;
};

export const KPIBlock = ({ label, value, trend, trendValue }: KPIBlockProps) => {
  const { colors, spacing } = useTheme();
  const trendColor = trend === "down" ? colors.critical : colors.accent;

  return (
    <Card style={styles.card}>
      <Typography variant="caption" color={colors.muted}>
        {label}
      </Typography>
      <Typography variant="heading">{value}</Typography>
      {trend && trendValue ? (
        <View style={{ marginTop: spacing.sm }}>
          <Typography variant="body" color={trendColor}>
            {trend === "down" ? "▼" : "▲"} {trendValue} vs last week
          </Typography>
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
});
