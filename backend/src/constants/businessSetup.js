const BUSINESS_SETUP_STATUSES = Object.freeze([
  'new',
  'contacted',
  'planning',
  'onboarding',
  'launched',
  'closed',
  'rejected'
]);

const BUSINESS_SETUP_PRIORITIES = Object.freeze(['low', 'normal', 'high', 'urgent']);

const WORK_MODE_OPTIONS = Object.freeze([
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'trading', label: 'Trading' },
  { id: 'services', label: 'Services' },
  { id: 'online', label: 'Online / E-commerce' },
  { id: 'hybrid', label: 'Hybrid model' },
  { id: 'other', label: 'Other' }
]);

const BUDGET_RANGE_OPTIONS = Object.freeze([
  { id: 'under_5_lakh', label: 'Under 5 lakh' },
  { id: '5_10_lakh', label: '5 to 10 lakh' },
  { id: '10_25_lakh', label: '10 to 25 lakh' },
  { id: '25_50_lakh', label: '25 to 50 lakh' },
  { id: '50_lakh_1_cr', label: '50 lakh to 1 crore' },
  { id: 'above_1_cr', label: 'Above 1 crore' },
  { id: 'undisclosed', label: 'Prefer not to share' }
]);

const START_TIMELINE_OPTIONS = Object.freeze([
  { id: 'immediately', label: 'Immediately' },
  { id: 'within_1_month', label: 'Within 1 month' },
  { id: '1_3_months', label: '1 to 3 months' },
  { id: '3_6_months', label: '3 to 6 months' },
  { id: '6_plus_months', label: '6+ months' }
]);

const SUPPORT_AREA_OPTIONS = Object.freeze([
  { id: 'business_plan', label: 'Business plan' },
  { id: 'company_registration', label: 'Company registration' },
  { id: 'licenses', label: 'Licenses and approvals' },
  { id: 'factory_setup', label: 'Factory/infrastructure setup' },
  { id: 'vendor_sourcing', label: 'Vendor sourcing' },
  { id: 'finance_funding', label: 'Finance and funding' },
  { id: 'compliance_tax', label: 'Compliance and tax' },
  { id: 'hiring_training', label: 'Hiring and training' },
  { id: 'technology_setup', label: 'Technology setup' },
  { id: 'go_to_market', label: 'Go-to-market and sales' }
]);

const FOUNDER_EXPERIENCE_OPTIONS = Object.freeze([
  'first_time',
  'under_2_years',
  '2_to_5_years',
  '5_plus_years'
]);

const CONTACT_CHANNEL_OPTIONS = Object.freeze(['phone', 'email', 'whatsapp', 'chat']);

const REQUEST_SOURCE_OPTIONS = Object.freeze(['authenticated', 'guest']);

const WORK_MODE_IDS = WORK_MODE_OPTIONS.map((item) => item.id);
const BUDGET_RANGE_IDS = BUDGET_RANGE_OPTIONS.map((item) => item.id);
const START_TIMELINE_IDS = START_TIMELINE_OPTIONS.map((item) => item.id);
const SUPPORT_AREA_IDS = SUPPORT_AREA_OPTIONS.map((item) => item.id);

module.exports = {
  BUSINESS_SETUP_STATUSES,
  BUSINESS_SETUP_PRIORITIES,
  WORK_MODE_OPTIONS,
  WORK_MODE_IDS,
  BUDGET_RANGE_OPTIONS,
  BUDGET_RANGE_IDS,
  START_TIMELINE_OPTIONS,
  START_TIMELINE_IDS,
  SUPPORT_AREA_OPTIONS,
  SUPPORT_AREA_IDS,
  FOUNDER_EXPERIENCE_OPTIONS,
  CONTACT_CHANNEL_OPTIONS,
  REQUEST_SOURCE_OPTIONS
};
