import { useMemo, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { InputField } from "../../components/common/InputField";
import { Typography } from "../../components/common/Typography";
import { Button } from "../../components/common/Button";
import { authService } from "../../services/auth.service";
import { BUSINESS_ACCOUNT_TYPES, BUSINESS_CATEGORIES, BusinessAccountType } from "../../constants/business";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";

type SignupStep = "profile" | "otp" | "account";

type SignupScreenProps = {
  onBackToLogin: () => void;
};

const stepOrder: SignupStep[] = ["profile", "otp", "account"];

const createInitialAccountState = () => ({
  password: "",
  accountType: "normal" as BusinessAccountType,
  companyName: "",
  categories: [] as string[],
});

const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const SignupScreen = ({ onBackToLogin }: SignupScreenProps) => {
  const { spacing, colors, radius } = useTheme();
  const { setUser } = useAuth();

  const [step, setStep] = useState<SignupStep>("profile");
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [account, setAccount] = useState(createInitialAccountState());
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);

  const requiresCompanyDetails = account.accountType !== "normal";

  const currentStepIndex = useMemo(() => stepOrder.indexOf(step) + 1, [step]);

  const handleProfileSubmit = async () => {
    if (!profile.fullName.trim() || !profile.email.trim() || !profile.phone.trim()) {
      setError("Full name, email, and phone are required to start signup");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await authService.signup.start({
        fullName: profile.fullName.trim(),
        email: profile.email.trim().toLowerCase(),
        phone: profile.phone.trim(),
      });
      setStatus(`OTP sent. Expires in ${(response.expiresInMs / 1000 / 60).toFixed(0)} minutes.`);
      setExpiresInMs(response.expiresInMs);
      setOtp("");
      setStep("otp");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to start signup");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otp.trim()) {
      setError("Enter the verification code to continue");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authService.signup.verify({ otp: otp.trim() });
      setStatus("OTP verified. Finish setting up your account.");
      setStep("account");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountComplete = async () => {
    if (account.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (requiresCompanyDetails) {
      if (!account.companyName.trim()) {
        setError("Company name is required for trader or manufacturer accounts");
        return;
      }
      if (!account.categories.length) {
        setError("Select at least one business category");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        password: account.password,
        accountType: account.accountType,
        companyName: account.companyName.trim() || undefined,
        categories: account.categories,
      };
      const { user } = await authService.signup.complete(payload);
      setStatus("Signup complete. Redirecting to your workspace.");
      setUser(user);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to complete signup");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep("profile");
    setOtp("");
    setStatus(null);
    setError(null);
    setExpiresInMs(null);
    setAccount(createInitialAccountState());
  };

  const handleSubmit = () => {
    if (step === "profile") {
      return handleProfileSubmit();
    }
    if (step === "otp") {
      return handleOtpVerify();
    }
    return handleAccountComplete();
  };

  const renderProfileStep = () => (
    <View>
      <InputField label="Full name" placeholder="Avery Operations" value={profile.fullName} onChangeText={(fullName) => setProfile((prev) => ({ ...prev, fullName }))} />
      <InputField
        label="Work email"
        placeholder="avery@acme.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={profile.email}
        onChangeText={(email) => setProfile((prev) => ({ ...prev, email }))}
      />
      <InputField
        label="Phone"
        placeholder="+11234567890"
        keyboardType="phone-pad"
        value={profile.phone}
        onChangeText={(phone) => setProfile((prev) => ({ ...prev, phone }))}
      />
    </View>
  );

  const renderOtpStep = () => (
    <View>
      <Typography variant="body" color={colors.muted} style={{ marginBottom: spacing.sm }}>
        Enter the OTP sent to {profile.email || "your email"} or SMS. Session expires in {expiresInMs ? Math.ceil(expiresInMs / 1000 / 60) : "a few"} minutes.
      </Typography>
      <InputField
        label="One-time password"
        placeholder="123456"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        autoCapitalize="none"
      />
    </View>
  );

  const renderAccountStep = () => (
    <View>
      <InputField
        label="Create password"
        placeholder="Use 8+ characters"
        value={account.password}
        onChangeText={(password) => setAccount((prev) => ({ ...prev, password }))}
        secureTextEntry
        autoCapitalize="none"
      />
      <Typography variant="body" color={colors.muted} style={{ marginBottom: spacing.xs }}>
        Select account type
      </Typography>
      <View style={styles.chipRow}>
        {BUSINESS_ACCOUNT_TYPES.map((type) => {
          const isActive = account.accountType === type;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setAccount((prev) => ({ ...prev, accountType: type }))}
              style={[
                styles.chip,
                {
                  borderColor: isActive ? colors.primary : colors.border,
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={{ color: isActive ? "#fff" : colors.text }}>{toTitleCase(type)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {requiresCompanyDetails ? (
        <View>
          <InputField
            label="Company name"
            placeholder="Acme Manufacturing"
            value={account.companyName}
            onChangeText={(companyName) => setAccount((prev) => ({ ...prev, companyName }))}
          />
          <Typography variant="body" color={colors.muted} style={{ marginBottom: spacing.xs }}>
            Business categories
          </Typography>
          <View style={styles.categoryWrap}>
            {BUSINESS_CATEGORIES.map((category) => {
              const isSelected = account.categories.includes(category);
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() =>
                    setAccount((prev) => {
                      const exists = prev.categories.includes(category);
                      const categories = exists
                        ? prev.categories.filter((value) => value !== category)
                        : [...prev.categories, category];
                      return { ...prev, categories };
                    })
                  }
                  style={[
                    styles.categoryChip,
                    {
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Text style={{ color: isSelected ? "#fff" : colors.text }}>{toTitleCase(category)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View>
      <Typography variant="subheading">Create an account</Typography>
      <Typography variant="caption" style={{ marginBottom: spacing.sm }}>
        Step {currentStepIndex} of {stepOrder.length}
      </Typography>

      {status ? (
        <Text style={{ color: colors.accent, marginBottom: spacing.sm }}>
          {status}
        </Text>
      ) : null}
      {error ? (
        <Text style={{ color: colors.critical, marginBottom: spacing.sm }}>
          {error}
        </Text>
      ) : null}

      {step === "profile" && renderProfileStep()}
      {step === "otp" && renderOtpStep()}
      {step === "account" && renderAccountStep()}

      <Button
        label={step === "account" ? "Create account" : "Continue"}
        onPress={handleSubmit}
        loading={loading}
        style={{ marginTop: spacing.md }}
      />

      {step !== "profile" ? (
        <TouchableOpacity style={{ marginTop: spacing.sm }} onPress={handleStartOver}>
          <Text style={{ color: colors.primary, textAlign: "center" }}>Start over</Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ marginTop: spacing.lg, alignItems: "center" }}>
        <TouchableOpacity onPress={onBackToLogin}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
});
