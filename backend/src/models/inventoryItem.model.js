const mongoose = require("mongoose");
const { INVENTORY_CATEGORIES } = require("../constants/business");

const { Schema } = mongoose;

const CATEGORY_IDS = INVENTORY_CATEGORIES.map((c) => c.id);
const ITEM_STATUSES = ["active", "low_stock", "out_of_stock", "discontinued"];
const UNIT_TYPES = ["pieces", "kg", "liters", "meters", "boxes", "pallets", "units"];

const inventoryItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORY_IDS,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      enum: UNIT_TYPES,
      default: "pieces",
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    maxStockLevel: {
      type: Number,
      default: 1000,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ITEM_STATUSES,
      default: "active",
    },
    location: {
      warehouse: { type: String, trim: true },
      rack: { type: String, trim: true },
      bin: { type: String, trim: true },
    },
    supplier: {
      name: { type: String, trim: true },
      contact: { type: String, trim: true },
      leadTimeDays: { type: Number, default: 7 },
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    imageUrl: String,
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({}),
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

// Compound index for company + category queries
inventoryItemSchema.index({ company: 1, category: 1 });
inventoryItemSchema.index({ company: 1, sku: 1 }, { unique: true, sparse: true });

// Virtual for stock health
inventoryItemSchema.virtual("stockHealth").get(function () {
  if (this.quantity <= 0) return "critical";
  if (this.quantity <= this.minStockLevel) return "low";
  if (this.quantity >= this.maxStockLevel * 0.9) return "overstocked";
  return "healthy";
});

// Pre-save hook to auto-update status based on quantity
inventoryItemSchema.pre("save", function (next) {
  if (this.isModified("quantity")) {
    if (this.quantity <= 0) {
      this.status = "out_of_stock";
    } else if (this.quantity <= this.minStockLevel) {
      this.status = "low_stock";
    } else if (this.status !== "discontinued") {
      this.status = "active";
    }
  }
  next();
});

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
