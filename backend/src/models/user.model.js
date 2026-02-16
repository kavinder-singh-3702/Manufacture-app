const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { BUSINESS_ACCOUNT_TYPES } = require("../constants/business");

const { Schema } = mongoose;

const USER_ROLES = ["super-admin", "admin", "user"];
const ACCOUNT_STATUSES = ["active", "inactive", "suspended", "deleted"];
const GENDER_OPTIONS = ["male", "female", "non-binary", "prefer-not-to-say"];
const THEME_OPTIONS = ["system", "light", "dark"];

const ADDRESS_SCHEMA = new Schema(
  {
    line1: { type: String, trim: true }, // Primary street address for billing and shipping flows.
    line2: { type: String, trim: true }, // Additional address information like apartment or suite.
    city: { type: String, trim: true }, // City used for localization and tax calculations.
    state: { type: String, trim: true }, // State/region for compliance and reporting filters.
    postalCode: { type: String, trim: true }, // Postal code to support courier integrations.
    country: { type: String, trim: true }, // Country selector for geo-based feature toggles.
  },
  { _id: false }
);

const SOCIAL_LINKS_SCHEMA = new Schema(
  {
    website: { type: String, trim: true }, // Public site link for discovery and networking.
    linkedin: { type: String, trim: true }, // LinkedIn profile to add professional context.
    twitter: { type: String, trim: true }, // Twitter/X handle for marketing engagement.
    github: { type: String, trim: true }, // GitHub link for engineering-focused communities.
  },
  { _id: false }
);

const COMMUNICATION_PREFS_SCHEMA = new Schema(
  {
    email: { type: Boolean, default: true }, // Toggle transactional + marketing emails.
    sms: { type: Boolean, default: false }, // Toggle SMS for urgent alerts/OTP delivery.
    push: { type: Boolean, default: true }, // Toggle push notifications on mobile/web clients.
  },
  { _id: false }
);

const NOTIFICATION_CHANNEL_OVERRIDE_SCHEMA = new Schema(
  {
    inApp: { type: Boolean },
    push: { type: Boolean },
    email: { type: Boolean },
    sms: { type: Boolean },
  },
  { _id: false }
);

const QUIET_HOURS_SCHEMA = new Schema(
  {
    enabled: { type: Boolean, default: false },
    start: { type: String, trim: true, default: "22:00" },
    end: { type: String, trim: true, default: "08:00" },
    timezone: { type: String, trim: true, default: "UTC" },
  },
  { _id: false }
);

const NOTIFICATION_PREFS_SCHEMA = new Schema(
  {
    masterEnabled: { type: Boolean, default: true },
    inAppEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    quietHours: { type: QUIET_HOURS_SCHEMA, default: () => ({}) },
    topicOverrides: {
      type: Map,
      of: NOTIFICATION_CHANNEL_OVERRIDE_SCHEMA,
      default: () => ({}),
    },
    priorityOverrides: {
      type: Map,
      of: NOTIFICATION_CHANNEL_OVERRIDE_SCHEMA,
      default: () => ({}),
    },
  },
  { _id: false }
);

const PREFERENCES_SCHEMA = new Schema(
  {
    locale: { type: String, default: "en" }, // Preferred translation locale for the UI.
    timezone: { type: String, default: "UTC" }, // Time zone for scheduling and logging accuracy.
    theme: {
      type: String,
      enum: THEME_OPTIONS,
      default: "system",
    }, // UI theme preference respecting light/dark/system.
    communications: {
      type: COMMUNICATION_PREFS_SCHEMA,
      default: () => ({}),
    }, // Granular notification delivery configuration.
    notifications: {
      type: NOTIFICATION_PREFS_SCHEMA,
      default: () => ({}),
    }, // Advanced notification routing preferences.
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    firstName: { type: String, trim: true }, // Legal given name for personalization.
    lastName: { type: String, trim: true }, // Family name for invoicing and KYC requirements.
    displayName: { type: String, trim: true }, // Public friendly name shown across the UI.
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    }, // Unique handle for vanity URLs and @mentions.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    }, // Primary login identifier and transactional email target.
    secondaryEmails: { type: [String], default: [] }, // Backup communication emails for escalations.
    emailVerifiedAt: Date, // Timestamp proving the email address is confirmed.
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    }, // Phone number for SMS alerts and two-factor flows.
    phoneVerifiedAt: Date, // Timestamp once the phone number is validated.
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    }, // Bcrypted hash used for credential-based logins.
    passwordChangedAt: Date, // Records when the password was last rotated for auditing.
    passwordResetToken: { type: String, select: false }, // Token hash for password recovery flow.
    passwordResetExpires: Date, // Expiry timestamp for the reset token.
    twoFactorEnabled: { type: Boolean, default: false }, // Indicates if an extra OTP factor is enforced.
    twoFactorSecret: { type: String, select: false }, // Encrypted TOTP secret for MFA apps.
    loginAttempts: { type: Number, default: 0 }, // Failed login counter to help detect brute force attacks.
    lockUntil: Date, // Future timestamp until which the account stays locked.
    accountType: {
      type: String,
      enum: BUSINESS_ACCOUNT_TYPES,
      default: "normal",
    }, // Determines whether the user is a consumer, trader, or manufacturer.
    role: {
      type: String,
      enum: USER_ROLES,
      default: "user",
    }, // Access tier limited to admin or normal user roles.
    status: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: "active",
    }, // Soft lifecycle state that controls platform access.
    onboardingCompletedAt: Date, // Marks the end of the onboarding checklist wizard.
    avatarUrl: String, // Profile image displayed in navigation and collaboration UIs.
    coverImageUrl: String, // Cover/banner image for richer profile experiences.
    bio: { type: String, trim: true, maxlength: 500 }, // Short biography or “about me” text.
    dateOfBirth: Date, // DOB for age-gated experiences or personalization.
    gender: {
      type: String,
      enum: GENDER_OPTIONS,
      default: "prefer-not-to-say",
    }, // Optional gender field for analytics and inclusive messaging.
    address: ADDRESS_SCHEMA, // Structured mailing address shared across logistics flows.
    socialLinks: SOCIAL_LINKS_SCHEMA, // Reference links to external social profiles.
    acceptedTermsAt: Date, // Timestamp when the user accepted the latest ToS.
    marketingOptInAt: Date, // Timestamp when marketing consent was granted.
    preferences: {
      type: PREFERENCES_SCHEMA,
      default: () => ({}),
    }, // Persisted UI + notification preferences.
    lastLoginAt: Date, // Last successful authentication timestamp.
    lastLoginIp: String, // IP address used during the last login to help detect anomalies.
    sessionInvalidBefore: Date, // Forces logout of sessions issued before the stored date.
    activityTags: { type: [String], default: [] }, // Flexible segmentation tags for feature targeting.
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({}),
    }, // Flexible key/value map for integrations and feature flags.
    companies: {
      type: [{ type: Schema.Types.ObjectId, ref: "Company" }],
      default: [],
    }, // Company ids owned/managed solely by this user.
    activeCompany: { type: Schema.Types.ObjectId, ref: "Company" }, // Company currently selected in the UI.
    deletedAt: Date, // Soft delete marker to support delayed purging.
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
