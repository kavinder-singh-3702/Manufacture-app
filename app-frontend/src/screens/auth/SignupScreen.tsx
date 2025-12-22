import { ReactNode, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BUSINESS_ACCOUNT_TYPES, BUSINESS_CATEGORIES, BusinessAccountType } from "../../constants/business";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../hooks/useAuth";
import { tokenStorage } from "../../services/tokenStorage";

type SignupScreenProps = {
  onBack: () => void;
  onLogin: () => void;
};

type SignupStep = "profile" | "otp" | "account";

type ProfileState = {
  fullName: string;
  email: string;
  phone: string;
};

type AccountState = {
  password: string;
  accountType: BusinessAccountType;
  companyName: string;
  categories: string[];
};

type FieldErrors<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;

const steps: SignupStep[] = ["profile", "otp", "account"];

const stepTitles: Record<SignupStep, string> = {
  profile: "Create Account :)",
  otp: "Secure Verification",
  account: "Workspace Setup",
};

const stepDescriptions: Record<SignupStep, string> = {
  profile: "Enter who is leading ops so we can personalize the workspace.",
  otp: "Enter the 4-digit OTP we sent to your email / phone.",
  account: "Set your password and tell us about your business.",
};

const initialProfile: ProfileState = {
  fullName: "",
  email: "",
  phone: "",
};

const createInitialAccount = (): AccountState => ({
  password: "",
  accountType: "normal" as BusinessAccountType,
  companyName: "",
  categories: [],
});

export const SignupScreen = ({ onBack, onLogin }: SignupScreenProps) => {
  const [step, setStep] = useState<SignupStep>("profile");
  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [otp, setOtp] = useState("");
  const [account, setAccount] = useState<AccountState>(createInitialAccount());
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileState>>({});
  const [accountErrors, setAccountErrors] = useState<FieldErrors<AccountState>>({});
  const [otpError, setOtpError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState("");

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return BUSINESS_CATEGORIES;
    return BUSINESS_CATEGORIES.filter((c) => c.toLowerCase().includes(q));
  }, [categorySearch]);

  const { setUser } = useAuth();
  const requiresCompany = account.accountType !== "normal";
  const stepIndex = steps.indexOf(step);

  const resetFlow = () => {
    setStep("profile");
    setProfile(initialProfile);
    setOtp("");
    setAccount(createInitialAccount());
    setProfileErrors({});
    setAccountErrors({});
    setOtpError(null);
    setStatus(null);
    setError(null);
    setExpiresInMs(null);
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      resetFlow();
      onBack();
      return;
    }
    const previous = steps[stepIndex - 1];
    setStep(previous);
    setError(null);
    setStatus(null);
    setOtpError(null);
    setProfileErrors({});
    setAccountErrors({});
  };

  const validateProfile = () => {
    const nextErrors: FieldErrors<ProfileState> = {};
    const trimmedName = profile.fullName.trim();
    const trimmedEmail = profile.email.trim().toLowerCase();
    const trimmedPhone = profile.phone.trim();

    if (!trimmedName.length) {
      nextErrors.fullName = "Please enter your full name";
    } else if (trimmedName.split(" ").length < 2) {
      nextErrors.fullName = "Include both first and last name";
    }

    if (!trimmedEmail.length) {
      nextErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email";
    }

    if (!trimmedPhone.length) {
      nextErrors.phone = "Phone number is required";
    } else if (!/^[0-9+]{7,15}$/.test(trimmedPhone)) {
      nextErrors.phone = "Use 7-15 digits (optionally +)";
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAccount = () => {
    const nextErrors: FieldErrors<AccountState> = {};
    if (account.password.length < 8) {
      nextErrors.password = "Use at least 8 characters";
    }
    if (requiresCompany) {
      if (!account.companyName.trim()) {
        nextErrors.companyName = "Company name is required";
      }
      if (!account.categories.length) {
        nextErrors.categories = "Select at least one category";
      }
    }
    setAccountErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProfileSubmit = async () => {
    if (!validateProfile()) {
      setError("Please fix the highlighted fields.");
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
      setStatus(`OTP sent. Expires in ${(response.expiresInMs / 60000).toFixed(0)} min.`);
      setExpiresInMs(response.expiresInMs);
      setStep("otp");
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Unable to start signup");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setOtpError("Enter the OTP code");
      setError("OTP is required");
      return;
    }

    try {
      setLoading(true);
      setOtpError(null);
      setError(null);
      await authService.signup.verify({ otp: trimmedOtp });
      setStatus("OTP verified. Finish your setup.");
      setStep("account");
    } catch (otpSubmitError) {
      const message = otpSubmitError instanceof Error ? otpSubmitError.message : "Unable to verify OTP";
      setError(message);
      setOtpError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async () => {
    if (!validateAccount()) {
      setError("Complete the required fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        password: account.password,
        accountType: account.accountType,
        companyName: requiresCompany ? account.companyName.trim() : undefined,
        categories: requiresCompany ? account.categories : undefined,
      };
      const response = await authService.signup.complete(payload);
      // Store the JWT token for API authentication
      if (response.token) {
        await tokenStorage.setToken(response.token);
      }
      setStatus("Signup complete! Redirecting...");
      // For manufacturer/trader accounts, trigger verification redirect
      setUser(response.user, { requiresVerification: requiresCompany });
    } catch (accountError) {
      setError(accountError instanceof Error ? accountError.message : "Unable to complete signup");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (step === "profile") {
      return handleProfileSubmit();
    }
    if (step === "otp") {
      return handleOtpSubmit();
    }
    return handleAccountSubmit();
  };

  const toggleCategory = (category: string) => {
    setAccount((prev) => {
      const exists = prev.categories.includes(category);
      const categories = exists ? prev.categories.filter((item) => item !== category) : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const renderProfileStep = () => (
    <View>
      <InputField
        value={profile.fullName}
        onChangeText={(value) => setProfile((prev) => ({ ...prev, fullName: value }))}
        placeholder="Enter Full Name"
        errorText={profileErrors.fullName}
      />
      <InputField
        value={profile.email}
        onChangeText={(value) => setProfile((prev) => ({ ...prev, email: value }))}
        placeholder="Enter Email Id"
        keyboardType="email-address"
        autoCapitalize="none"
        errorText={profileErrors.email}
      />
      <InputField
        value={profile.phone}
        onChangeText={(value) => setProfile((prev) => ({ ...prev, phone: value }))}
        placeholder="Enter Mobile Number"
        keyboardType="phone-pad"
        errorText={profileErrors.phone}
      />
    </View>
  );

  const renderOtpStep = () => (
    <View>
      <Text style={styles.helperCopy}>
        We sent an OTP to {profile.email || "your email"} and {profile.phone || "your phone"}. Expires in{" "}
        {expiresInMs ? Math.ceil(expiresInMs / 60000) : "a few"} minutes.
      </Text>
      <InputField
        value={otp}
        onChangeText={setOtp}
        placeholder="Enter OTP"
        keyboardType="number-pad"
        autoCapitalize="none"
        errorText={otpError || undefined}
      />
      <TouchableOpacity onPress={resetFlow}>
        <Text style={styles.secondaryLink}>Start over</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAccountStep = () => (
    <View>
      <InputField
        value={account.password}
        onChangeText={(value) => setAccount((prev) => ({ ...prev, password: value }))}
        placeholder="Create Password"
        secureTextEntry={!showSignupPassword}
        autoCapitalize="none"
        errorText={accountErrors.password}
        rightAccessory={
          <TouchableOpacity onPress={() => setShowSignupPassword((prev) => !prev)}>
            <Text style={styles.eyeText}>{showSignupPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        }
      />

      <Text style={styles.sectionLabel}>Select Account Type</Text>
      <View style={styles.accountTypeRow}>
        {BUSINESS_ACCOUNT_TYPES.map((type) => {
          const isActive = account.accountType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.accountChip, isActive ? styles.accountChipActive : null]}
              onPress={() => setAccount((prev) => ({ ...prev, accountType: type }))}
            >
              <Text style={[styles.accountChipText, isActive ? styles.accountChipTextActive : null]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {requiresCompany ? (
        <View>
          <InputField
            value={account.companyName}
            onChangeText={(value) => setAccount((prev) => ({ ...prev, companyName: value }))}
            placeholder="Company Name"
            errorText={accountErrors.companyName}
          />
          <Text style={styles.sectionLabel}>Business Categories</Text>
          <TextInput
            style={styles.categorySearch}
            placeholder="Search categories"
            placeholderTextColor="#999"
            value={categorySearch}
            onChangeText={setCategorySearch}
          />
          <View style={styles.categoryGrid}>
            {filteredCategories.map((category) => {
              const isSelected = account.categories.includes(category);
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, isSelected ? styles.categoryChipActive : null]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text style={[styles.categoryText, isSelected ? styles.categoryTextActive : null]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {accountErrors.categories ? <Text style={styles.fieldError}>{accountErrors.categories}</Text> : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.slide}
      keyboardVerticalOffset={32}
    >
      <View style={styles.card}>
        {/* Indigo glow blob */}
        <LinearGradient
          colors={["rgba(108, 99, 255, 0.25)", "rgba(108, 99, 255, 0.05)", "transparent"]}
          style={[styles.blob, styles.pinkBlobLarge]}
        />
        {/* Salmon glow blob */}
        <LinearGradient
          colors={["rgba(255, 140, 60, 0.2)", "rgba(255, 140, 60, 0.05)", "transparent"]}
          style={[styles.blob, styles.pinkBlobSmall]}
        />

        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <LinearGradient
          colors={["rgba(108, 99, 255, 0.2)", "rgba(108, 99, 255, 0.05)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.stepBadgeWrapper}
        >
          <Text style={styles.stepBadge}>
            Step {stepIndex + 1} of {steps.length}
          </Text>
        </LinearGradient>
        <Text style={styles.heading}>{stepTitles[step]}</Text>
        <Text style={styles.subheading}>{stepDescriptions[step]}</Text>

        {status ? <Text style={styles.statusText}>{status}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={styles.form}>
            {step === "profile" && renderProfileStep()}
            {step === "otp" && renderOtpStep()}
            {step === "account" && renderAccountStep()}

            <TouchableOpacity style={styles.primaryButtonWrapper} onPress={handleContinue} disabled={loading}>
              <LinearGradient
                colors={["#6C63FF", "#5248E6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{step === "account" ? "Create Account" : "Continue"}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onLogin} style={{ marginTop: 24 }}>
              <Text style={styles.loginLink}>Already have an account? <Text style={styles.loginLinkHighlight}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

type InputFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  errorText?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad";
  rightAccessory?: ReactNode;
};

const InputField = ({ value, onChangeText, placeholder, errorText, rightAccessory, ...rest }: InputFieldProps) => (
  <View style={{ marginBottom: 18 }}>
    <View style={[styles.inputWrapper, errorText ? styles.inputWrapperError : null]}>
      <TextInput
        style={[styles.input, rightAccessory ? styles.inputWithAccessory : null]}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        value={value}
        onChangeText={onChangeText}
        {...rest}
      />
      {rightAccessory ? <View style={styles.inputAccessory}>{rightAccessory}</View> : null}
    </View>
    {errorText ? <Text style={styles.fieldError}>{errorText}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },
  card: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
    position: "relative",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 200,
  },
  pinkBlobLarge: {
    width: 300,
    height: 300,
    top: -80,
    right: -60,
  },
  pinkBlobSmall: {
    width: 240,
    height: 240,
    bottom: -60,
    left: -60,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  stepBadgeWrapper: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  stepBadge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C63FF",
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subheading: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
    marginBottom: 16,
  },
  form: {
    paddingBottom: 80,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    backgroundColor: "rgba(22, 24, 29, 0.9)",
    position: "relative",
  },
  inputWrapperError: {
    borderColor: "#FF6B6B",
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#FFFFFF",
  },
  inputWithAccessory: {
    paddingRight: 64,
  },
  inputAccessory: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  eyeText: {
    fontWeight: "600",
    color: "#6C63FF",
  },
  primaryButtonWrapper: {
    marginTop: 12,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButton: {
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1.5,
  },
  loginLink: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.6)",
  },
  loginLinkHighlight: {
    color: "#6C63FF",
    fontWeight: "600",
  },
  errorText: {
    color: "#FF6B6B",
    marginBottom: 8,
    fontWeight: "500",
  },
  statusText: {
    color: "#4ADE80",
    marginBottom: 8,
    fontWeight: "500",
  },
  fieldError: {
    color: "#FF6B6B",
    fontSize: 13,
    marginTop: 4,
  },
  helperCopy: {
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 12,
  },
  secondaryLink: {
    color: "#6C63FF",
    textAlign: "right",
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
    marginTop: 12,
  },
  categorySearch: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
    color: "#fff",
    fontSize: 14,
  },
  accountTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  accountChip: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(30, 33, 39, 0.8)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  accountChipActive: {
    borderColor: "#6C63FF",
    backgroundColor: "rgba(108, 99, 255, 0.15)",
  },
  accountChipText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "600",
  },
  accountChipTextActive: {
    color: "#6C63FF",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(30, 33, 39, 0.8)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipActive: {
    borderColor: "#FF8C3C",
    backgroundColor: "rgba(255, 140, 60, 0.2)",
  },
  categoryText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#FF8C3C",
  },
});
