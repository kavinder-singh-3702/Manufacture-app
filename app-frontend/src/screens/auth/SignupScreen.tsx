import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BUSINESS_ACCOUNT_TYPES, BUSINESS_CATEGORIES, BusinessAccountType } from "../../constants/business";
import { SignupStepper } from "../../components/auth/SignupStepper";
import { OtpCodeInput, OtpInputChangeMeta } from "../../components/auth/OtpCodeInput";
import { authService } from "../../services/auth.service";
import { ProductCategory, productService } from "../../services/product.service";
import { tokenStorage } from "../../services/tokenStorage";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

type SignupScreenProps = {
  onBack: () => void;
  onLogin: () => void;
};

type SignupStep = "identity" | "otp" | "contact" | "password" | "business";

type IdentityState = {
  firstName: string;
  lastName: string;
  email: string;
};

type VerifiedIdentityState = {
  fullName: string;
  email: string;
};

type ContactState = {
  phone: string;
};

type AccountState = {
  password: string;
  accountType: BusinessAccountType;
  companyName: string;
  categories: string[];
};

type FieldErrors<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;

type StepDescriptor = {
  title: string;
  description: string;
  hint: string;
};

type BusinessCategoryOption = {
  id: string;
  label: string;
  value: string;
};

const steps: SignupStep[] = ["identity", "otp", "contact", "password", "business"];

const stepMeta: Record<SignupStep, StepDescriptor> = {
  identity: {
    title: "Create your account",
    description: "Add your name and work email.",
    hint: "We only need basic identity details here.",
  },
  otp: {
    title: "Verify your email",
    description: "Enter the 6-digit code from your inbox.",
    hint: "Use the latest code. You can resend after the cooldown.",
  },
  contact: {
    title: "Add mobile number",
    description: "Use a reachable number for account support.",
    hint: "No phone OTP in this step.",
  },
  password: {
    title: "Set your password",
    description: "Create a secure password for sign in.",
    hint: "Use at least 8 characters.",
  },
  business: {
    title: "Business details",
    description: "Choose account type and business profile.",
    hint: "Normal accounts can continue immediately.",
  },
};

const progressTitles: Record<SignupStep, string> = {
  identity: "Identity",
  otp: "Verify",
  contact: "Mobile",
  password: "Password",
  business: "Business"
};

const initialIdentity: IdentityState = {
  firstName: "",
  lastName: "",
  email: "",
};

const initialContact: ContactState = {
  phone: "",
};

const createInitialAccount = (): AccountState => ({
  password: "",
  accountType: "normal" as BusinessAccountType,
  companyName: "",
  categories: [],
});

const normalizeNamePart = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizePhone = (value: string) => value.trim();
const composeFullName = (firstName: string, lastName: string) =>
  [firstName, lastName].filter(Boolean).join(" ").trim();
const OTP_LENGTH = 6;
const BUSINESS_CATEGORY_SET = new Set(BUSINESS_CATEGORIES.map((category) => category.toLowerCase()));

const createCategorySlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toHeadlineCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const mapProductCategoryToOption = (category: ProductCategory): BusinessCategoryOption | null => {
  const rawTitle = category.title?.trim() || "";
  const rawId = category.id?.trim().toLowerCase() || "";
  const normalizedTitle = rawTitle.toLowerCase();

  if (normalizedTitle && BUSINESS_CATEGORY_SET.has(normalizedTitle)) {
    return {
      id: rawId || createCategorySlug(normalizedTitle),
      label: rawTitle || toHeadlineCase(normalizedTitle),
      value: normalizedTitle,
    };
  }

  if (rawId && BUSINESS_CATEGORY_SET.has(rawId)) {
    return {
      id: rawId,
      label: rawTitle || toHeadlineCase(rawId.replace(/-/g, " ")),
      value: rawId,
    };
  }

  return null;
};

const getFallbackBusinessCategoryOptions = (): BusinessCategoryOption[] => {
  const options = BUSINESS_CATEGORIES.map((category) => ({
    id: createCategorySlug(category),
    label: toHeadlineCase(category),
    value: category.toLowerCase(),
  }));
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
};

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const maskEmail = (email: string) => {
  const safeEmail = normalizeEmail(email || "");
  const [localPart, domainPart] = safeEmail.split("@");
  if (!localPart || !domainPart) return "your email";
  if (localPart.length <= 1) return `*@${domainPart}`;
  return `${localPart.slice(0, 1)}***@${domainPart}`;
};

export const SignupScreen = ({ onBack, onLogin }: SignupScreenProps) => {
  const [step, setStep] = useState<SignupStep>("identity");
  const [identity, setIdentity] = useState<IdentityState>(initialIdentity);
  const [contact, setContact] = useState<ContactState>(initialContact);
  const [otp, setOtp] = useState("");
  const [account, setAccount] = useState<AccountState>(createInitialAccount());
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [identityErrors, setIdentityErrors] = useState<FieldErrors<IdentityState>>({});
  const [contactErrors, setContactErrors] = useState<FieldErrors<ContactState>>({});
  const [accountErrors, setAccountErrors] = useState<FieldErrors<AccountState>>({});
  const [otpError, setOtpError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);
  const [resendCountdownMs, setResendCountdownMs] = useState(0);
  const [categorySearch, setCategorySearch] = useState("");
  const [businessCategoryOptions, setBusinessCategoryOptions] = useState<BusinessCategoryOption[]>(
    getFallbackBusinessCategoryOptions
  );
  const [businessCategoryLoading, setBusinessCategoryLoading] = useState(false);
  const [businessCategoryLoadedFromApi, setBusinessCategoryLoadedFromApi] = useState(false);
  const [verifiedIdentity, setVerifiedIdentity] = useState<VerifiedIdentityState | null>(null);
  const { setUser } = useAuth();
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const { isCompact, isXCompact, clamp, fs } = useResponsiveLayout();
  const isDark = resolvedMode === "dark";
  const styles = useMemo(() => createStyles(colors, isDark, fs), [colors, isDark, fs]);
  const headerIntro = useRef(new Animated.Value(0)).current;
  const formIntro = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const lastAutoSubmittedOtpRef = useRef<string | null>(null);
  const headingColor = isDark ? colors.textOnDarkSurface : colors.textPrimary;
  const secondaryTextColor = isDark ? colors.subtextOnDarkSurface : colors.textSecondary;
  const inputPlaceholderColor = isDark ? colors.textMuted : colors.textTertiary;

  const filteredBusinessCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return businessCategoryOptions;
    return businessCategoryOptions.filter(
      (category) => category.label.toLowerCase().includes(query) || category.value.includes(query)
    );
  }, [businessCategoryOptions, categorySearch]);

  const stepIndex = steps.indexOf(step);
  const requiresCompany = account.accountType !== "normal";
  const activeStepMeta = stepMeta[step];
  const normalizedIdentity = useMemo(() => {
    const firstName = normalizeNamePart(identity.firstName || "");
    const lastName = normalizeNamePart(identity.lastName || "");
    return {
      firstName,
      lastName,
      fullName: composeFullName(firstName, lastName),
      email: normalizeEmail(identity.email || ""),
    };
  }, [identity.email, identity.firstName, identity.lastName]);
  const canResendOtp = resendCountdownMs <= 0 && !loading;
  const maskedIdentityEmail = useMemo(() => maskEmail(normalizedIdentity.email), [normalizedIdentity.email]);
  const otpExpiryText = expiresInMs ? `Expires in ${Math.ceil(expiresInMs / 60000)} min` : "Code expires soon";

  useEffect(() => {
    headerIntro.setValue(0);
    formIntro.setValue(0);
    Animated.stagger(80, [
      Animated.timing(headerIntro, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formIntro, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [formIntro, headerIntro, step]);

  useEffect(() => {
    if (resendCountdownMs <= 0) return undefined;
    const timeout = setTimeout(() => {
      setResendCountdownMs((current) => Math.max(0, current - 1000));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [resendCountdownMs]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  useEffect(() => {
    if (step !== "business" || !requiresCompany || businessCategoryLoadedFromApi || businessCategoryLoading) {
      return undefined;
    }

    let isMounted = true;

    const loadBusinessCategories = async () => {
      try {
        setBusinessCategoryLoading(true);
        const response = await productService.getCategoryStats();
        if (!isMounted) return;

        const mappedOptions = response.categories
          .map(mapProductCategoryToOption)
          .filter((option): option is BusinessCategoryOption => Boolean(option));

        if (mappedOptions.length) {
          const seenValues = new Set<string>();
          const uniqueOptions = mappedOptions.filter((option) => {
            if (seenValues.has(option.value)) return false;
            seenValues.add(option.value);
            return true;
          });
          setBusinessCategoryOptions(uniqueOptions);
        }
      } catch {
        // Keep fallback categories for signup if category API is unavailable.
      } finally {
        if (isMounted) {
          setBusinessCategoryLoading(false);
          setBusinessCategoryLoadedFromApi(true);
        }
      }
    };

    void loadBusinessCategories();

    return () => {
      isMounted = false;
    };
  }, [businessCategoryLoadedFromApi, businessCategoryLoading, requiresCompany, step]);

  const handleCtaPressIn = () => {
    Animated.spring(ctaScale, {
      toValue: 0.97,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handleCtaPressOut = () => {
    Animated.spring(ctaScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const clearTransientFeedback = () => {
    setStatus(null);
    setError(null);
    setOtpError(null);
  };

  const resetDownstreamState = () => {
    setOtp("");
    setContact(initialContact);
    setAccount(createInitialAccount());
    setCategorySearch("");
    setContactErrors({});
    setAccountErrors({});
    setOtpError(null);
    setVerifiedIdentity(null);
    setExpiresInMs(null);
    setResendCountdownMs(0);
    lastAutoSubmittedOtpRef.current = null;
  };

  const resetFlow = () => {
    setStep("identity");
    setIdentity(initialIdentity);
    setIdentityErrors({});
    resetDownstreamState();
    clearTransientFeedback();
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      resetFlow();
      onBack();
      return;
    }

    setStep(steps[stepIndex - 1]);
    clearTransientFeedback();
  };

  const validateIdentity = () => {
    const nextErrors: FieldErrors<IdentityState> = {};

    if (!normalizedIdentity.firstName.length) {
      nextErrors.firstName = "First name is required";
    } else if (normalizedIdentity.firstName.length < 2) {
      nextErrors.firstName = "Use at least 2 characters";
    }

    if (!normalizedIdentity.email.length) {
      nextErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(normalizedIdentity.email)) {
      nextErrors.email = "Enter a valid email address";
    }

    setIdentityErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateContact = () => {
    const nextErrors: FieldErrors<ContactState> = {};
    const normalizedPhone = normalizePhone(contact.phone || "");

    if (!normalizedPhone.length) {
      nextErrors.phone = "Mobile number is required";
    } else if (!/^[0-9+]{7,15}$/.test(normalizedPhone)) {
      nextErrors.phone = "Use 7-15 digits, optionally with +";
    }

    setContactErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePassword = () => {
    const nextErrors: FieldErrors<AccountState> = {};
    if (account.password.length < 8) {
      nextErrors.password = "Use at least 8 characters";
    }
    setAccountErrors((current) => ({ ...current, password: nextErrors.password }));
    return Object.keys(nextErrors).length === 0;
  };

  const validateBusiness = () => {
    const nextErrors: FieldErrors<AccountState> = {};

    if (requiresCompany) {
      if (!account.companyName.trim()) {
        nextErrors.companyName = "Company name is required";
      }
      if (!account.categories.length) {
        nextErrors.categories = "Select at least one category";
      }
    }

    setAccountErrors((current) => ({
      ...current,
      companyName: nextErrors.companyName,
      categories: nextErrors.categories,
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const handleIdentitySubmit = async () => {
    if (!validateIdentity()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    const identityChangedAfterVerification =
      verifiedIdentity &&
      (verifiedIdentity.email !== normalizedIdentity.email ||
        verifiedIdentity.fullName !== normalizedIdentity.fullName);

    if (identityChangedAfterVerification) {
      resetDownstreamState();
    }

    try {
      setLoading(true);
      clearTransientFeedback();
      const response = await authService.signup.start({
        fullName: normalizedIdentity.fullName,
        email: normalizedIdentity.email,
      });
      setExpiresInMs(response.expiresInMs);
      setResendCountdownMs(response.resendAvailableInMs ?? 0);
      setStatus(`Verification code sent to ${normalizedIdentity.email}.`);
      setStep("otp");
    } catch (signupStartError) {
      setError(signupStartError instanceof Error ? signupStartError.message : "Unable to start signup");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    await handleIdentitySubmit();
  };

  const handleOtpSubmit = async (otpValue?: string) => {
    const trimmedOtp = (otpValue ?? otp).trim();
    if (!trimmedOtp.length) {
      setOtpError("Enter the verification code");
      setError("Verification code is required");
      return;
    }

    try {
      setLoading(true);
      clearTransientFeedback();
      await authService.signup.verify({ otp: trimmedOtp });
      setVerifiedIdentity({
        fullName: normalizedIdentity.fullName,
        email: normalizedIdentity.email,
      });
      setStatus(`Email verified for ${normalizedIdentity.email}.`);
      setStep("contact");
    } catch (otpSubmitError) {
      const message = otpSubmitError instanceof Error ? otpSubmitError.message : "Unable to verify code";
      setError(message);
      setOtpError("Enter the latest code from your inbox");
    } finally {
      setLoading(false);
      lastAutoSubmittedOtpRef.current = null;
    }
  };

  const handleContactSubmit = async () => {
    if (!validateContact()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    try {
      setLoading(true);
      clearTransientFeedback();
      const response = await authService.signup.contact({
        phone: normalizePhone(contact.phone),
      });
      setContact({ phone: response.phone });
      setStatus("Mobile number saved.");
      setStep("password");
    } catch (contactSubmitError) {
      setError(contactSubmitError instanceof Error ? contactSubmitError.message : "Unable to save mobile number");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (!validatePassword()) {
      setError("Use a stronger password to continue.");
      return;
    }

    clearTransientFeedback();
    setStatus("Password saved. Complete your business setup.");
    setStep("business");
  };

  const handleBusinessSubmit = async () => {
    if (!validateBusiness()) {
      setError("Complete the required business details.");
      return;
    }

    try {
      setLoading(true);
      clearTransientFeedback();
      const response = await authService.signup.complete({
        password: account.password,
        accountType: account.accountType,
        companyName: requiresCompany ? account.companyName.trim() : undefined,
        categories: requiresCompany ? account.categories : undefined,
        fullName: normalizedIdentity.fullName,
        email: normalizedIdentity.email,
        phone: normalizePhone(contact.phone),
      });

      if (response.token) {
        await tokenStorage.setToken(response.token);
      }

      setStatus("Account created. Redirecting...");
      setUser(response.user, { requiresVerification: requiresCompany });
    } catch (accountError) {
      setError(accountError instanceof Error ? accountError.message : "Unable to complete signup");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (step === "identity") return handleIdentitySubmit();
    if (step === "otp") return handleOtpSubmit();
    if (step === "contact") return handleContactSubmit();
    if (step === "password") return handlePasswordSubmit();
    return handleBusinessSubmit();
  };

  const handleEditEmail = () => {
    resetDownstreamState();
    clearTransientFeedback();
    setStep("identity");
  };

  const handleOtpInputChange = (nextValue: string, meta: OtpInputChangeMeta) => {
    setOtp(nextValue);
    setOtpError(null);
    setError(null);

    if (nextValue.length < OTP_LENGTH) {
      lastAutoSubmittedOtpRef.current = null;
      return;
    }

    if (meta.bulk && nextValue.length === OTP_LENGTH && !loading && lastAutoSubmittedOtpRef.current !== nextValue) {
      lastAutoSubmittedOtpRef.current = nextValue;
      void handleOtpSubmit(nextValue);
    }
  };

  const toggleCategory = (category: string) => {
    setAccount((current) => {
      const exists = current.categories.includes(category);
      const categories = exists
        ? current.categories.filter((value) => value !== category)
        : [...current.categories, category];
      return { ...current, categories };
    });
  };

  const primaryButtonLabel =
    step === "otp"
      ? "Verify email"
      : step === "contact"
      ? "Save mobile"
      : step === "password"
      ? "Continue"
      : step === "business"
      ? "Create Account"
      : "Continue";

  const renderStepHint = (copy: string) => <Text style={styles.stepHint}>{copy}</Text>;

  const renderIdentityStep = () => (
    <View>
      {renderStepHint(activeStepMeta.hint)}
      <View style={styles.nameRow}>
        <InputField
          label="First name"
          required
          value={identity.firstName}
          onChangeText={(value) => {
            setIdentity((current) => ({ ...current, firstName: value }));
            setIdentityErrors((current) => ({ ...current, firstName: undefined }));
          }}
          placeholder="Enter first name"
          autoCapitalize="words"
          textContentType="givenName"
          autoComplete="name-given"
          returnKeyType="next"
          errorText={identityErrors.firstName}
          placeholderTextColor={inputPlaceholderColor}
          styles={styles}
          containerStyle={[styles.nameField, styles.nameFieldFirst]}
        />
        <InputField
          label="Last name"
          value={identity.lastName}
          onChangeText={(value) => {
            setIdentity((current) => ({ ...current, lastName: value }));
          }}
          placeholder="Enter last name"
          autoCapitalize="words"
          textContentType="familyName"
          autoComplete="name-family"
          returnKeyType="next"
          placeholderTextColor={inputPlaceholderColor}
          styles={styles}
          containerStyle={styles.nameField}
        />
      </View>
      <InputField
        label="Email address"
        required
        value={identity.email}
        onChangeText={(value) => {
          setIdentity((current) => ({ ...current, email: value }));
          setIdentityErrors((current) => ({ ...current, email: undefined }));
        }}
        placeholder="name@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="done"
        errorText={identityErrors.email}
        helperText="We will send a verification code to this email."
        placeholderTextColor={inputPlaceholderColor}
        styles={styles}
      />
    </View>
  );

  const renderOtpStep = () => (
    <View>
      <View style={styles.otpInfoCard}>
        <Text style={styles.otpInfoLabel}>Code sent to</Text>
        <Text style={styles.otpInfoEmail}>{maskedIdentityEmail}</Text>
        <Text style={styles.otpInfoMeta}>{otpExpiryText}</Text>
      </View>

      <Text style={styles.fieldLabel}>
        Verification code
        <Text style={styles.requiredMark}> *</Text>
      </Text>
      <OtpCodeInput
        value={otp}
        onChange={handleOtpInputChange}
        length={OTP_LENGTH}
        errorText={otpError || undefined}
        disabled={loading}
        onSubmitEditing={() => {
          void handleOtpSubmit();
        }}
      />

      <View style={styles.otpActionRow}>
        <TouchableOpacity onPress={handleEditEmail} activeOpacity={0.8}>
          <Text style={styles.otpEditEmail}>Edit email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleResendOtp}
          activeOpacity={0.85}
          disabled={!canResendOtp}
          style={[styles.otpResendButton, !canResendOtp ? styles.otpResendButtonDisabled : null]}
        >
          <Text style={[styles.otpResendButtonText, !canResendOtp ? styles.otpResendButtonTextDisabled : null]}>
            {canResendOtp ? "Resend code" : `Resend in ${formatCountdown(resendCountdownMs)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContactStep = () => (
    <View>
      {renderStepHint(activeStepMeta.hint)}
      <InputField
        label="Mobile number"
        required
        value={contact.phone}
        onChangeText={(value) => {
          setContact({ phone: value });
          setContactErrors((current) => ({ ...current, phone: undefined }));
        }}
        placeholder="+91 98765 43210"
        keyboardType="phone-pad"
        autoCapitalize="none"
        textContentType="telephoneNumber"
        autoComplete="tel"
        errorText={contactErrors.phone}
        helperText="This helps with order coordination and business support."
        placeholderTextColor={inputPlaceholderColor}
        styles={styles}
      />
    </View>
  );

  const renderPasswordStep = () => (
    <View>
      {renderStepHint(activeStepMeta.hint)}
      <InputField
        label="Password"
        required
        value={account.password}
        onChangeText={(value) => {
          setAccount((current) => ({ ...current, password: value }));
          setAccountErrors((current) => ({ ...current, password: undefined }));
        }}
        placeholder="Create a strong password"
        secureTextEntry={!showSignupPassword}
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="password-new"
        errorText={accountErrors.password}
        helperText="Use at least 8 characters."
        placeholderTextColor={inputPlaceholderColor}
        styles={styles}
        rightAccessory={
          <TouchableOpacity onPress={() => setShowSignupPassword((current) => !current)} activeOpacity={0.8}>
            <Text style={styles.eyeText}>{showSignupPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );

  const renderBusinessStep = () => (
    <View>
      {renderStepHint(activeStepMeta.hint)}
      <Text style={styles.sectionLabel}>
        Account type
        <Text style={styles.requiredMark}> *</Text>
      </Text>
      <View style={styles.accountTypeRow}>
        {BUSINESS_ACCOUNT_TYPES.map((type) => {
          const isActive = account.accountType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.accountChip, isActive ? styles.accountChipActive : null]}
              onPress={() => setAccount((current) => ({ ...current, accountType: type }))}
              activeOpacity={0.85}
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
            label="Company name"
            required
            value={account.companyName}
            onChangeText={(value) => {
              setAccount((current) => ({ ...current, companyName: value }));
              setAccountErrors((current) => ({ ...current, companyName: undefined }));
            }}
            placeholder="Enter your company name"
            autoCapitalize="words"
            textContentType="organizationName"
            errorText={accountErrors.companyName}
            placeholderTextColor={inputPlaceholderColor}
            styles={styles}
          />

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, styles.sectionLabelTight]}>
              Business categories
              <Text style={styles.requiredMark}> *</Text>
            </Text>
            <Text style={styles.sectionMetaText}>
              {businessCategoryLoading ? "Loading..." : `${account.categories.length} selected`}
            </Text>
          </View>
          <Text style={styles.sectionHelper}>Choose categories that match your product line.</Text>
          <View style={styles.categorySearchWrap}>
            <TextInput
              style={styles.categorySearch}
              placeholder="Search categories"
              placeholderTextColor={inputPlaceholderColor}
              value={categorySearch}
              onChangeText={setCategorySearch}
            />
          </View>

          <View style={styles.categoryListWrap}>
            {filteredBusinessCategories.map((category) => {
              const isSelected = account.categories.includes(category.value);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryRow, isSelected ? styles.categoryRowActive : null]}
                  onPress={() => toggleCategory(category.value)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.categoryIndicator, isSelected ? styles.categoryIndicatorActive : null]}>
                    {isSelected ? <View style={styles.categoryIndicatorDot} /> : null}
                  </View>
                  <Text style={[styles.categoryRowText, isSelected ? styles.categoryRowTextActive : null]}>{category.label}</Text>
                </TouchableOpacity>
              );
            })}
            {!filteredBusinessCategories.length ? (
              <Text style={styles.categoryEmpty}>No categories found for this search.</Text>
            ) : null}
          </View>
          {accountErrors.categories ? <Text style={styles.fieldError}>{accountErrors.categories}</Text> : null}
        </View>
      ) : (
        <Text style={styles.helperCopy}>
          Normal accounts can start right away. You can add business information later from your workspace.
        </Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.slide}
      keyboardVerticalOffset={32}
    >
      <View
        style={[
          styles.card,
          {
            paddingHorizontal: isXCompact ? 16 : isCompact ? 20 : 28,
            paddingTop: isCompact ? 14 : 20,
            paddingBottom: isCompact ? 20 : 28,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: colors.overlayLight,
              borderColor: colors.border,
              width: isCompact ? 40 : 42,
              height: isCompact ? 40 : 42,
              borderRadius: isCompact ? 20 : 21,
            },
          ]}
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Text style={[styles.backIcon, { color: headingColor }]}>‹</Text>
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            style={{
              opacity: headerIntro,
              transform: [
                {
                  translateY: headerIntro.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            }}
          >
            <Text style={[styles.heading, { color: headingColor, fontSize: fs(isXCompact ? 22 : 26) }]}>
              {activeStepMeta.title}
            </Text>
            <Text style={[styles.subheading, { color: secondaryTextColor }]}>{activeStepMeta.description}</Text>

            {status && step !== "otp" ? <Text style={[styles.statusText, { color: colors.success }]}>{status}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <SignupStepper steps={steps} activeStep={step} titles={progressTitles} />
          </Animated.View>

          <Animated.View
            style={[
              styles.formAnimated,
              {
                opacity: formIntro,
                transform: [
                  {
                    translateY: formIntro.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.form}>
              {step === "identity" ? renderIdentityStep() : null}
              {step === "otp" ? renderOtpStep() : null}
              {step === "contact" ? renderContactStep() : null}
              {step === "password" ? renderPasswordStep() : null}
              {step === "business" ? renderBusinessStep() : null}

              <Animated.View
                style={[
                  styles.primaryButtonWrapper,
                  {
                    shadowColor: colors.primary,
                    transform: [{ scale: ctaScale }],
                    opacity: loading ? 0.88 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={handleContinue}
                  disabled={loading}
                  onPressIn={handleCtaPressIn}
                  onPressOut={handleCtaPressOut}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.textOnPrimary} />
                    ) : (
                      <Text style={styles.primaryButtonText}>{primaryButtonLabel}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity onPress={onLogin} style={styles.loginLinkWrap} activeOpacity={0.8}>
                <Text style={[styles.loginLink, { color: secondaryTextColor }]}>
                  Already have an account? <Text style={[styles.loginLinkHighlight, { color: colors.primary }]}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

type InputFieldProps = {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  errorText?: string;
  helperText?: string;
  rightAccessory?: ReactNode;
  styles: ReturnType<typeof createStyles>;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  placeholderTextColor: string;
} & Pick<
  TextInputProps,
  | "secureTextEntry"
  | "autoCapitalize"
  | "keyboardType"
  | "textContentType"
  | "autoComplete"
  | "maxLength"
  | "returnKeyType"
>;

const InputField = ({
  label,
  required = false,
  value,
  onChangeText,
  placeholder,
  errorText,
  helperText,
  rightAccessory,
  styles,
  inputStyle,
  containerStyle,
  placeholderTextColor,
  ...rest
}: InputFieldProps) => (
  <View style={[styles.inputFieldWrap, containerStyle]}>
    <Text style={styles.fieldLabel}>
      {label}
      {required ? <Text style={styles.requiredMark}> *</Text> : null}
    </Text>
    <View style={[styles.inputWrapper, errorText ? styles.inputWrapperError : null]}>
      <TextInput
        style={[styles.input, rightAccessory ? styles.inputWithAccessory : null, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
        {...rest}
      />
      {rightAccessory ? <View style={styles.inputAccessory}>{rightAccessory}</View> : null}
    </View>
    {errorText ? <Text style={styles.fieldError}>{errorText}</Text> : null}
    {!errorText && helperText ? <Text style={styles.fieldHelper}>{helperText}</Text> : null}
  </View>
);

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean, fs: (size: number) => number) =>
  StyleSheet.create({
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
      position: "relative",
      overflow: "hidden",
    },
    backButton: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      marginBottom: 10,
      alignSelf: "flex-start",
    },
    backIcon: {
      fontSize: fs(26),
      fontWeight: "700",
      marginTop: -2,
    },
    heading: {
      fontWeight: "800",
      lineHeight: fs(30),
    },
    subheading: {
      fontSize: fs(14),
      lineHeight: fs(20),
      marginTop: 4,
      marginBottom: 10,
    },
    statusText: {
      marginBottom: 8,
      fontSize: fs(12),
      fontWeight: "700",
    },
    errorText: {
      marginBottom: 8,
      fontSize: fs(12),
      fontWeight: "700",
      color: colors.error,
    },
    scrollContent: {
      paddingBottom: 14,
    },
    formAnimated: {
      marginTop: 12,
    },
    form: {
      paddingBottom: 8,
    },
    stepHint: {
      marginBottom: 12,
      fontSize: fs(12),
      lineHeight: fs(18),
      fontWeight: "600",
      color: colors.textSecondary,
    },
    otpInfoCard: {
      marginBottom: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.82)",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    otpInfoLabel: {
      fontSize: fs(11),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textSecondary,
    },
    otpInfoEmail: {
      marginTop: 3,
      fontSize: fs(14),
      fontWeight: "800",
      color: colors.text,
    },
    otpInfoMeta: {
      marginTop: 3,
      fontSize: fs(12),
      fontWeight: "600",
      color: colors.textSecondary,
    },
    inputFieldWrap: {
      marginBottom: 16,
    },
    nameRow: {
      flexDirection: "row",
    },
    nameField: {
      flex: 1,
      minWidth: 0,
    },
    nameFieldFirst: {
      marginRight: 10,
    },
    fieldLabel: {
      fontSize: fs(13),
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    requiredMark: {
      color: colors.error,
      fontWeight: "800",
    },
    inputWrapper: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.82)",
      minHeight: 58,
      paddingHorizontal: 16,
      justifyContent: "center",
    },
    inputWrapperError: {
      borderColor: colors.error,
    },
    input: {
      fontSize: fs(16),
      fontWeight: "600",
      color: colors.text,
      paddingVertical: 16,
    },
    inputWithAccessory: {
      paddingRight: 68,
    },
    inputAccessory: {
      position: "absolute",
      right: 16,
      top: 0,
      bottom: 0,
      justifyContent: "center",
    },
    fieldError: {
      marginTop: 7,
      fontSize: fs(12),
      fontWeight: "700",
      color: colors.error,
    },
    fieldHelper: {
      marginTop: 7,
      fontSize: fs(12),
      fontWeight: "600",
      color: colors.textSecondary,
    },
    otpActionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 14,
      gap: 12,
      minWidth: 0,
    },
    otpEditEmail: {
      fontSize: fs(13),
      fontWeight: "800",
      color: colors.primary,
    },
    otpResendButton: {
      marginLeft: "auto",
      borderWidth: 1,
      borderColor: colors.borderPrimary,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: isDark ? "rgba(25,184,230,0.1)" : "rgba(20,141,178,0.08)",
    },
    otpResendButtonDisabled: {
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,36,0.04)",
    },
    otpResendButtonText: {
      fontSize: fs(12),
      fontWeight: "800",
      color: colors.primary,
    },
    otpResendButtonTextDisabled: {
      color: colors.textMuted,
    },
    sectionLabel: {
      fontSize: fs(13),
      fontWeight: "800",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
      marginTop: 4,
    },
    sectionLabelTight: {
      marginBottom: 0,
      marginTop: 0,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
      gap: 10,
    },
    sectionMetaText: {
      fontSize: fs(12),
      fontWeight: "700",
      color: colors.textSecondary,
    },
    sectionHelper: {
      marginBottom: 10,
      fontSize: fs(12),
      fontWeight: "600",
      color: colors.textSecondary,
    },
    accountTypeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 18,
    },
    accountChip: {
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.82)",
    },
    accountChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "16",
    },
    accountChipText: {
      fontSize: fs(13),
      fontWeight: "700",
      color: colors.textSecondary,
    },
    accountChipTextActive: {
      color: colors.primary,
    },
    categorySearchWrap: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.82)",
      marginBottom: 12,
      paddingHorizontal: 14,
    },
    categorySearch: {
      fontSize: fs(15),
      color: colors.text,
      paddingVertical: 14,
    },
    categoryListWrap: {
      gap: 8,
    },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.74)",
    },
    categoryRowActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "14",
    },
    categoryIndicator: {
      width: 18,
      height: 18,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,36,0.04)",
    },
    categoryIndicatorActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "1f",
    },
    categoryIndicatorDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    categoryRowText: {
      flex: 1,
      fontSize: fs(13),
      fontWeight: "700",
      color: colors.textSecondary,
    },
    categoryRowTextActive: {
      color: colors.text,
    },
    categoryEmpty: {
      fontSize: fs(12),
      fontWeight: "600",
      color: colors.textMuted,
      marginTop: 6,
    },
    helperCopy: {
      fontSize: fs(14),
      lineHeight: fs(21),
      color: colors.textSecondary,
      marginTop: 8,
    },
    eyeText: {
      fontSize: fs(13),
      fontWeight: "800",
      color: colors.primary,
    },
    primaryButtonWrapper: {
      marginTop: 16,
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    primaryButtonText: {
      fontSize: fs(15),
      fontWeight: "800",
      color: colors.textOnPrimary,
      letterSpacing: 0.3,
    },
    loginLinkWrap: {
      marginTop: 18,
      alignItems: "center",
    },
    loginLink: {
      fontSize: fs(13),
      fontWeight: "600",
      textAlign: "center",
    },
    loginLinkHighlight: {
      fontWeight: "800",
    },
  });
