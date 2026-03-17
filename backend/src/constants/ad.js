const AD_CAMPAIGN_STATUSES = Object.freeze([
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
]);

const AD_PLACEMENTS = Object.freeze([
  'dashboard_home'
]);

const AD_TARGETING_MODES = Object.freeze([
  'any',
  'all'
]);

const AD_EVENT_TYPES = Object.freeze([
  'impression',
  'click',
  'dismiss'
]);

module.exports = {
  AD_CAMPAIGN_STATUSES,
  AD_PLACEMENTS,
  AD_TARGETING_MODES,
  AD_EVENT_TYPES
};
