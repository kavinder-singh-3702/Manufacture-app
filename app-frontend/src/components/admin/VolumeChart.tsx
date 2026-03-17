import { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type VolumeChartProps = {
  data?: number[];
  labels?: string[];
  title?: string;
};

const DEFAULT_DATA = [12, 19, 8, 15, 22, 17, 25];
const DEFAULT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const AnimatedBar = ({ height, maxHeight, color, delay }: { height: number; maxHeight: number; color: string; delay: number }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: height,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [height, delay]);

  const barHeight = animValue.interpolate({
    inputRange: [0, Math.max(maxHeight, 1)],
    outputRange: [4, 100],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={{
        width: "100%",
        height: barHeight,
        backgroundColor: color,
        borderRadius: 4,
        minHeight: 4,
      }}
    />
  );
};

export const VolumeChart = ({
  data = DEFAULT_DATA,
  labels = DEFAULT_LABELS,
  title = "WEEKLY VOLUME",
}: VolumeChartProps) => {
  const { colors, radius } = useTheme();

  const maxValue = Math.max(...data, 1);
  const total = data.reduce((sum, v) => sum + v, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderColor: colors.text + "30",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 6,
          elevation: 2,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.avgLabel, { color: colors.textMuted }]}>
          Avg: <Text style={{ color: colors.primary, fontWeight: "800" }}>{avg}</Text>
        </Text>
      </View>

      <View style={styles.chartArea}>
        {data.map((value, index) => {
          const isMax = value === maxValue;
          const barColor = isMax ? colors.primary : colors.primary + "50";

          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <AnimatedBar
                  height={value}
                  maxHeight={maxValue}
                  color={barColor}
                  delay={index * 80}
                />
              </View>
              <Text
                style={[
                  styles.barLabel,
                  { color: isMax ? colors.primary : colors.textMuted },
                ]}
              >
                {labels[index] ?? ""}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  avgLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 110,
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    gap: 6,
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
});
