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
  const { colors, spacing } = useTheme();
  const currentStepIndex = steps.indexOf(activeStep);
  const progressRatio = steps.length > 1 ? currentStepIndex / (steps.length - 1) : 1;

  return (
    <View
      style={[
        authSharedStyles.borderedContainer,
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: spacing.md,
          borderRadius: 16,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.progressStep, { color: colors.muted }]}>
          Step {currentStepIndex + 1} of {steps.length}
        </Text>
        <Text style={[styles.progressTitle, { color: colors.text }]}>{titles[activeStep]}</Text>
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
      <View style={[styles.stepRow, { marginTop: spacing.sm }]}>
        {steps.map((value, index) => {
          const isCurrent = activeStep === value;
          const isComplete = index < currentStepIndex;
          return (
            <View key={value} style={styles.stepItem}>
              <View
                style={[
                  authSharedStyles.dot,
                  styles.dot,
                  {
                    borderColor: isComplete || isCurrent ? colors.primary : colors.border,
                    backgroundColor: isComplete ? colors.accent : isCurrent ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text style={[styles.dotText, { color: isComplete || isCurrent ? "#fff" : colors.muted }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: isCurrent ? colors.text : colors.muted }]}>{titles[value]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  progressStep: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  track: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  stepItem: {
    alignItems: "center",
    marginTop: 12,
    minWidth: 80,
  },
  dot: {},
  dotText: {
    fontWeight: "700",
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
