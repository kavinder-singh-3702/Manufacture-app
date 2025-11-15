import { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { Typography } from "../../components/common/Typography";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

type LoginScreenProps = {
  onSignup: () => void;
};

export const LoginScreen = ({ onSignup }: LoginScreenProps) => {
  const { login } = useAuth();
  const { spacing, colors } = useTheme();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      if (!password.trim()) {
        setError("Password is required");
        return;
      }

      const payload =
        email.trim().length > 0
          ? { email: email.trim(), password }
          : phone.trim().length > 0
          ? { phone: phone.trim(), password }
          : null;

      if (!payload) {
        setError("Enter email or phone to continue");
        return;
      }

      setLoading(true);
      await login(payload);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Typography variant="subheading">Welcome back</Typography>
      <Typography variant="body" color={colors.muted} style={{ marginBottom: spacing.lg, marginTop: spacing.xs }}>
        Use your manufacturing credentials to access dashboards.
      </Typography>

      <InputField label="Email" placeholder="opslead@company.com" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <InputField
        label="Phone"
        placeholder="+11234567890"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <InputField
        label="Password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {error ? (
        <Text style={{ color: colors.critical, marginBottom: spacing.md }}>
          {error}
        </Text>
      ) : null}

      <Button label="Sign in" onPress={handleSubmit} loading={loading} />

      <View style={{ marginTop: spacing.lg, alignItems: "center" }}>
        <TouchableOpacity onPress={onSignup}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Need an account? Start signup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
