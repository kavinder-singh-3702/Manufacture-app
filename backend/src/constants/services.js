const SERVICE_TYPES = Object.freeze(['machine_repair', 'worker', 'transport']);

const SERVICE_STATUSES = Object.freeze([
  'pending', // captured but not yet reviewed by admin
  'in_review',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
]);

const SERVICE_PRIORITIES = Object.freeze(['low', 'normal', 'high', 'urgent']);

const MACHINE_REPAIR_TYPES = Object.freeze([
  { id: 'cnc', label: 'CNC / Precision Machines' },
  { id: 'lathe', label: 'Lathe / Turning Machines' },
  { id: 'press', label: 'Presses / Forming Machines' },
  { id: 'conveyor', label: 'Conveyors / Material Handling' },
  { id: 'hydraulic', label: 'Hydraulic & Pneumatic Systems' },
  { id: 'boiler_generator', label: 'Boilers / Generators' },
  { id: 'packaging', label: 'Packaging Lines' },
  { id: 'custom', label: 'Custom / Other' }
]);

const WORKER_INDUSTRIES = Object.freeze([
  { id: 'automotive', label: 'Automotive & Auto Components' },
  { id: 'textile', label: 'Textile & Apparel' },
  { id: 'packaging', label: 'Packaging & Printing' },
  { id: 'logistics', label: 'Logistics & Warehousing' },
  { id: 'electronics', label: 'Electronics & Electrical' },
  { id: 'chemical', label: 'Chemical & Process' },
  { id: 'fmcg', label: 'FMCG / Consumer Goods' },
  { id: 'heavy_machinery', label: 'Heavy Machinery & Fabrication' },
  { id: 'construction', label: 'Construction Materials' },
  { id: 'pharma', label: 'Pharma & Medical' },
  { id: 'general', label: 'General Manufacturing' }
]);

const WORKER_EXPERIENCE_LEVELS = Object.freeze(['entry', 'mid', 'senior', 'expert']);
const SHIFT_TYPES = Object.freeze(['day', 'night', 'rotational', 'flexible']);
const CONTRACT_TYPES = Object.freeze(['one_time', 'short_term', 'long_term']);

const TRANSPORT_MODES = Object.freeze(['road', 'rail', 'air', 'sea']);

const MACHINE_TYPE_IDS = MACHINE_REPAIR_TYPES.map((item) => item.id);
const WORKER_INDUSTRY_IDS = WORKER_INDUSTRIES.map((item) => item.id);

module.exports = {
  SERVICE_TYPES,
  SERVICE_STATUSES,
  SERVICE_PRIORITIES,
  MACHINE_REPAIR_TYPES,
  MACHINE_TYPE_IDS,
  WORKER_INDUSTRIES,
  WORKER_INDUSTRY_IDS,
  WORKER_EXPERIENCE_LEVELS,
  SHIFT_TYPES,
  CONTRACT_TYPES,
  TRANSPORT_MODES
};
