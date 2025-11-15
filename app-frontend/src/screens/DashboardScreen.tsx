import { ScrollView, View, StyleSheet } from "react-native";
import { KPIBlock } from "../components/summary/KPIBlock";
import { Typography } from "../components/common/Typography";
import { Card } from "../components/common/Card";
import { useTheme } from "../hooks/useTheme";
import { appConfig } from "../config/appConfig";

const metrics = [
  { label: "Production Output", value: "1,482 units", trend: "up", trendValue: "8%" },
  { label: "On-Time Delivery", value: "96.2%", trend: "up", trendValue: "3%" },
  { label: "Quality Incidents", value: "4 issues", trend: "down", trendValue: "2" },
] as const;

const activities = [
  { id: "1", title: "Shift A quality audit", timestamp: "08:30 AM" },
  { id: "2", title: "Line 3 maintenance window", timestamp: "11:00 AM" },
  { id: "3", title: "Client shipment prep", timestamp: "02:45 PM" },
];

export const DashboardScreen = () => {
  const { spacing, colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
      <Typography variant="heading">{appConfig.companyName} Manufacturing Overview</Typography>
      <Typography variant="body" color={colors.muted} style={{ marginTop: spacing.xs }}>
        Quick glance at today&apos;s throughput and quality metrics.
      </Typography>

      <View style={[styles.metricsRow, { marginTop: spacing.lg }]}>
        {metrics.map((metric, index) => (
          <View
            key={metric.label}
            style={[
              styles.metricWrapper,
              {
                marginRight: index % 2 === 0 ? spacing.md : 0,
                marginBottom: spacing.md,
              },
            ]}
          >
            <KPIBlock
              label={metric.label}
              value={metric.value}
              trend={metric.trend === "down" ? "down" : "up"}
              trendValue={metric.trendValue}
            />
          </View>
        ))}
      </View>

      <Card style={{ marginTop: spacing.xl }}>
        <Typography variant="subheading">Upcoming Activities</Typography>
        <View style={{ marginTop: spacing.md }}>
          {activities.map((activity) => (
            <View key={activity.id} style={[styles.activityRow, { borderBottomColor: colors.border }]}>
              <View>
                <Typography variant="body">{activity.title}</Typography>
                <Typography variant="caption" style={{ marginTop: spacing.xs }}>
                  {activity.timestamp}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metricWrapper: {
    flex: 1,
    minWidth: 160,
  },
  activityRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
