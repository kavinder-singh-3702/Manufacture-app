import { View, FlatList } from "react-native";
import { Card } from "../components/common/Card";
import { Typography } from "../components/common/Typography";
import { useTheme } from "../hooks/useTheme";

const inventory = [
  { id: "steel", name: "Cold Rolled Steel", quantity: 124, status: "Healthy" },
  { id: "aluminum", name: "Aluminum Sheets", quantity: 48, status: "Low" },
  { id: "pcb", name: "Control PCBs", quantity: 210, status: "Healthy" },
  { id: "motors", name: "Servo Motors", quantity: 16, status: "Critical" },
];

export const InventoryScreen = () => {
  const { spacing, colors, radius } = useTheme();

  return (
    <View style={{ flex: 1, padding: spacing.lg }}>
      <Typography variant="heading">Inventory Health</Typography>
      <Typography variant="body" color={colors.muted} style={{ marginTop: spacing.xs }}>
        Visibility into incoming materials and bottlenecks.
      </Typography>

      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: spacing.lg }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.md }}>
            <Card>
              <Typography variant="subheading">{item.name}</Typography>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
                <Typography variant="body">Qty: {item.quantity}</Typography>
                <View
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    backgroundColor:
                      item.status === "Critical"
                        ? colors.critical
                        : item.status === "Low"
                        ? colors.secondary
                        : colors.accent,
                    borderRadius: radius.pill,
                  }}
                >
                  <Typography variant="caption" color={colors.surface}>
                    {item.status}
                  </Typography>
                </View>
              </View>
            </Card>
          </View>
        )}
      />
    </View>
  );
};
