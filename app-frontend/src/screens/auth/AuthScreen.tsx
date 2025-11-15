import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Typography } from "../../components/common/Typography";
import { useTheme } from "../../hooks/useTheme";
import { Card } from "../../components/common/Card";
import { LoginScreen } from "./LoginScreen";
import { SignupScreen } from "./SignupScreen";

export const AuthScreen = () => {
  const { spacing, colors } = useTheme();
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <View style={[styles.container, { padding: spacing.lg, backgroundColor: colors.background }]}>
      <View style={{ marginBottom: spacing.lg }}>
        <Typography variant="heading">Manufacture Command</Typography>
        <Typography variant="body" color={colors.muted} style={{ marginTop: spacing.xs }}>
          Secure access to production intelligence and workflows.
        </Typography>
      </View>

      <Card>
        {mode === "login" ? (
          <LoginScreen onSignup={() => setMode("signup")} />
        ) : (
          <SignupScreen onBackToLogin={() => setMode("login")} />
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
});
