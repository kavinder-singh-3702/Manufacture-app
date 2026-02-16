import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type StepItem = {
  title: string;
  subtitle?: string;
};

export const FormStepIndicator = ({
  steps,
  currentStep,
}: {
  steps: StepItem[];
  currentStep: number;
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const nodeBg = isCompleted || isActive ? colors.primary : colors.surfaceElevated;
        const nodeText = isCompleted || isActive ? colors.textOnPrimary : colors.textMuted;
        const lineColor = stepNumber < currentStep ? colors.primary : colors.border;

        return (
          <View key={step.title} style={styles.stepWrap}>
            <View style={styles.row}>
              <View style={[styles.node, { backgroundColor: nodeBg }]}>
                <Text style={[styles.nodeText, { color: nodeText }]}>{stepNumber}</Text>
              </View>
              {index < steps.length - 1 ? (
                <View style={[styles.line, { backgroundColor: lineColor }]} />
              ) : null}
            </View>
            <Text
              style={[
                styles.title,
                {
                  color: isActive || isCompleted ? colors.text : colors.textMuted,
                },
              ]}
              numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}
            >
              {step.title}
            </Text>
            {step.subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
                {step.subtitle}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
  },
  stepWrap: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  node: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  title: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
  },
});
