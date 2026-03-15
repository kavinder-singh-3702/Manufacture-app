import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { authSharedStyles } from "./styles";

type StepKey = string;

type SignupStepperProps<Step extends StepKey> = {
  steps: readonly Step[];
  activeStep: Step;
  titles: Record<Step, string>;
};

export const SignupStepper = <Step extends StepKey>({ steps, activeStep, titles }: SignupStepperProps<Step>) => {
  const { colors } = useTheme();
  const currentStepIndex = steps.indexOf(activeStep);
  const progressRatio = steps.length > 1 ? currentStepIndex / (steps.length - 1) : 1;

  return (
    <View
      style={[
        authSharedStyles.borderedContainer,
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.progressStep, { color: colors.textSecondary }]}>
          Step {currentStepIndex + 1} of {steps.length}
        </Text>
        <Text style={[styles.progressTitle, { color: colors.text }]}>
          {titles[activeStep]}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(1, Math.max(0, progressRatio)) * 100}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <View style={styles.dotRow}>
        {steps.map((value, index) => {
          const isActive = index <= currentStepIndex;
          return (
            <View key={value} style={[styles.dot, { backgroundColor: isActive ? colors.primary : colors.border }]} />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  progressStep: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressTitle: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
  },
  track: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  dotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
});
