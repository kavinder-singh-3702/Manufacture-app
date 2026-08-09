const createError = require('http-errors');
const Company = require('../../../models/company.model');
const User = require('../../../models/user.model');
const config = require('../../../config/env');
const {
  INHOUSE_COMPANY_SLUG,
  buildInhouseCompanyMetadata
} = require('../../company/utils/inhouseCatalog.util');

const DEFAULT_INHOUSE_DISPLAY_NAME = 'ARVANN In-house Catalog';

const resolveOwnerId = async (actorUserId) => {
  if (actorUserId) {
    const actor = await User.findById(actorUserId).select('_id').lean();
    if (actor?._id) return actor._id;
  }

  const preferredOwner = await User.findOne({ role: { $in: ['super-admin', 'admin'] } })
    .select('_id')
    .sort({ createdAt: 1 })
    .lean();
  if (preferredOwner?._id) return preferredOwner._id;

  const fallbackOwner = await User.findOne({})
    .select('_id')
    .sort({ createdAt: 1 })
    .lean();
  if (fallbackOwner?._id) return fallbackOwner._id;

  throw createError(500, 'Unable to provision in-house catalog company: no users available');
};

const getOrCreateInhouseCatalogCompany = async ({ actorUserId } = {}) => {
  const ownerId = await resolveOwnerId(actorUserId);
  const metadata = buildInhouseCompanyMetadata();

  const company = await Company.findOneAndUpdate(
    { slug: INHOUSE_COMPANY_SLUG },
    {
      $setOnInsert: {
        displayName: DEFAULT_INHOUSE_DISPLAY_NAME,
        legalName: DEFAULT_INHOUSE_DISPLAY_NAME,
        slug: INHOUSE_COMPANY_SLUG,
        type: 'normal',
        complianceStatus: 'approved',
        owner: ownerId,
        createdBy: ownerId,
        updatedBy: ownerId,
        categories: []
      },
      // `contact.phone` belongs in $set, not $setOnInsert: this company already
      // exists in every deployed environment, so $setOnInsert would never fire
      // and ARVANN-owned products would keep shipping with no Call target.
      // Keeping it in $set also makes the value self-healing if SUPPORT_PHONE
      // ever changes. (Existing installs still need the one-off
      // scripts/backfillInhouseCatalogContact.js — this only runs when an admin
      // creates or edits an in-house product.)
      $set: {
        status: 'active',
        metadata,
        'contact.phone': config.supportPhone
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  return company;
};

module.exports = {
  getOrCreateInhouseCatalogCompany
};
