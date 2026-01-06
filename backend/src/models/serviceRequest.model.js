const mongoose = require('mongoose');
const {
  SERVICE_TYPES,
  SERVICE_STATUSES,
  SERVICE_PRIORITIES,
  MACHINE_TYPE_IDS,
  WORKER_INDUSTRY_IDS,
  WORKER_EXPERIENCE_LEVELS,
  SHIFT_TYPES,
  CONTRACT_TYPES,
  TRANSPORT_MODES
} = require('../constants/services');

const { Schema } = mongoose;

const LocationSchema = new Schema(
  {
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 120 },
    state: { type: String, trim: true, maxlength: 120 },
    country: { type: String, trim: true, maxlength: 120 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  { _id: false }
);

const AvailabilityWindowSchema = new Schema(
  {
    startDate: Date,
    endDate: Date,
    isFlexible: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const ContactSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    email: { type: String, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 50 },
    preferredChannel: { type: String, enum: ['phone', 'email', 'chat'] }
  },
  { _id: false }
);

const MachineRepairDetailsSchema = new Schema(
  {
    machineType: { type: String, enum: MACHINE_TYPE_IDS },
    machineName: { type: String, trim: true, maxlength: 200 },
    manufacturer: { type: String, trim: true, maxlength: 120 },
    model: { type: String, trim: true, maxlength: 120 },
    issueSummary: { type: String, trim: true, maxlength: 300 },
    issueDetails: { type: String, trim: true, maxlength: 2000 },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    requiresDowntime: { type: Boolean, default: true },
    warrantyStatus: { type: String, enum: ['in_warranty', 'out_of_warranty', 'unknown'], default: 'unknown' },
    preferredSchedule: AvailabilityWindowSchema
  },
  { _id: false }
);

const WorkerRequestDetailsSchema = new Schema(
  {
    industry: { type: String, enum: WORKER_INDUSTRY_IDS },
    roles: { type: [String], default: [] },
    headcount: { type: Number, min: 1, default: 1 },
    experienceLevel: { type: String, enum: WORKER_EXPERIENCE_LEVELS, default: 'mid' },
    shiftType: { type: String, enum: SHIFT_TYPES, default: 'day' },
    contractType: { type: String, enum: CONTRACT_TYPES, default: 'one_time' },
    startDate: Date,
    durationWeeks: { type: Number, min: 0 },
    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    safetyClearances: { type: [String], default: [] },
    languagePreferences: { type: [String], default: [] },
    budgetPerWorker: {
      amount: { type: Number, min: 0 },
      currency: { type: String, trim: true, uppercase: true, default: 'USD' }
    }
  },
  { _id: false }
);

const TransportDetailsSchema = new Schema(
  {
    mode: { type: String, enum: TRANSPORT_MODES, default: 'road' },
    pickupLocation: LocationSchema,
    dropLocation: LocationSchema,
    loadType: { type: String, trim: true, maxlength: 200 },
    loadWeightTons: { type: Number, min: 0 },
    vehicleType: { type: String, trim: true, maxlength: 120 },
    requiresReturnTrip: { type: Boolean, default: false },
    availability: AvailabilityWindowSchema,
    specialHandling: { type: String, trim: true, maxlength: 500 },
    insuranceNeeded: { type: Boolean, default: false }
  },
  { _id: false }
);

const serviceRequestSchema = new Schema(
  {
    serviceType: { type: String, enum: SERVICE_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: SERVICE_STATUSES, default: 'pending', index: true },
    priority: { type: String, enum: SERVICE_PRIORITIES, default: 'normal' },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdByRole: { type: String, enum: ['admin', 'user'], default: 'user' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    contact: ContactSchema,
    location: LocationSchema,
    schedule: AvailabilityWindowSchema,
    budget: {
      estimatedCost: { type: Number, min: 0 },
      currency: { type: String, trim: true, uppercase: true, default: 'USD' },
      notes: { type: String, trim: true, maxlength: 300 }
    },
    machineRepairDetails: MachineRepairDetailsSchema,
    workerDetails: WorkerRequestDetailsSchema,
    transportDetails: TransportDetailsSchema,
    notes: { type: String, trim: true, maxlength: 2000 },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    deletedAt: Date
  },
  { timestamps: true }
);

serviceRequestSchema.index({ serviceType: 1, status: 1, createdAt: -1 });
serviceRequestSchema.index({ company: 1, serviceType: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
