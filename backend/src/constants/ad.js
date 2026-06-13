const AD_CAMPAIGN_STATUSES = Object.freeze([
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
]);

const AD_PLACEMENTS = Object.freeze([
  'dashboard_home',
  'hero_banner',
  'cart_cross_sell'
]);

const AD_MEDIA_TYPES = Object.freeze([
  'image',
  'video'
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
  AD_MEDIA_TYPES,
  AD_TARGETING_MODES,
  AD_EVENT_TYPES
};
