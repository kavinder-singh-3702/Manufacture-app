const mongoose = require("mongoose");
const { BUSINESS_ACCOUNT_TYPES, BUSINESS_CATEGORIES } = require("../constants/business");

const { Schema } = mongoose;

const COMPANY_STATUS = ["pending-verification", "active", "inactive", "suspended", "archived"];
const COMPANY_SIZE_BUCKETS = ["1-10", "11-50", "51-200", "201-500", "500+"];
const COMPANY_CATEGORY_SET = new Set(BUSINESS_CATEGORIES);

const ADDRESS_SCHEMA = new Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  { _id: false }
);

const CONTACT_SCHEMA = new Schema(
  {
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    supportEmail: { type: String, lowercase: true, trim: true },
    supportPhone: { type: String, trim: true },
  },
  { _id: false }
);

const SOCIAL_LINKS_SCHEMA = new Schema(
  {
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true },
    youtube: { type: String, trim: true },
  },
  { _id: false }
);

const DOCUMENTS_SCHEMA = new Schema(
  {
    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    cinNumber: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    attachments: [
      {
        name: { type: String, trim: true },
        url: String,
        type: { type: String, trim: true },
        verifiedAt: Date,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);

const COMPANY_SETTINGS_SCHEMA = new Schema(
  {
    timezone: { type: String, default: "UTC" },
    locale: { type: String, default: "en" },
    currency: { type: String, default: "INR" },
    fiscalYearStartMonth: { type: Number, min: 0, max: 11, default: 3 },
    weekStartsOn: { type: Number, min: 0, max: 6, default: 1 },
    notificationEmail: { type: String, lowercase: true, trim: true },
  },
  { _id: false }
);

const companySchema = new Schema(
  {
    displayName: { type: String, required: true, trim: true }, // Friendly label selectable via UI switcher.
    legalName: { type: String, trim: true }, // Government registered entity name for invoicing/compliance.
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true }, // Vanity slug for sharing public storefronts.
    type: {
      type: String,
      enum: BUSINESS_ACCOUNT_TYPES,
      default: "normal",
    }, // Business persona used to adapt flows per organization.
    categories: {
      type: [String],
      default: [],
      set: (values) => {
        const list = Array.isArray(values) ? values : [];
        const normalized = list
          .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
          .filter(Boolean);
        return [...new Set(normalized)];
      },
      validate: {
        validator(values) {
          return values.every((category) => COMPANY_CATEGORY_SET.has(category));
        },
        message: "One or more categories are not supported",
      },
    }, // Domain verticals powering discovery & segmentation.
    description: { type: String, trim: true, maxlength: 2000 }, // Rich description shown on public marketplace profile.
    foundedAt: Date, // Optional inception date for storytelling and compliance contexts.
    sizeBucket: { type: String, enum: COMPANY_SIZE_BUCKETS }, // Employee band to tailor pricing/UX.
    logoUrl: String,
    coverImageUrl: String,
    contact: CONTACT_SCHEMA, // Default communication touchpoints for the organization.
    headquarters: ADDRESS_SCHEMA, // Registered office/hub location.
    locations: { type: [ADDRESS_SCHEMA], default: [] }, // Additional operational sites for logistics flows.
    socialLinks: SOCIAL_LINKS_SCHEMA, // Outbound marketing handles.
    documents: DOCUMENTS_SCHEMA, // Stored entity-level compliance artifacts.
    complianceStatus: {
      type: String,
      enum: ["pending", "submitted", "approved", "rejected"],
      default: "pending",
    }, // Review state of the submitted compliance documents.
    ownerIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    }, // Quick lookup for users with immutable ownership rights.
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // User who originally provisioned the company.
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }, // Last user to change profile metadata.
    status: {
      type: String,
      enum: COMPANY_STATUS,
      default: "pending-verification",
    }, // Operational state toggled by admins/moderators.
    lastActivityAt: Date, // Recently tracked company-level activity to sort switcher lists.
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({}),
    }, // Extension point for integrations/feature flags.
    settings: {
      type: COMPANY_SETTINGS_SCHEMA,
      default: () => ({}),
    }, // Org-level preferences for timezone, currency, etc.
  },
  { timestamps: true }
);

companySchema.index({ displayName: 1, createdBy: 1 });

module.exports = mongoose.model("Company", companySchema);
