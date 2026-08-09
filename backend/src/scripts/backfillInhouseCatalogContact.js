/**
 * One-time backfill: set `contact.phone` on the ARVANN in-house catalog company.
 *
 * Background: the in-house catalog company was originally upserted with no
 * `contact` sub-document at all (inhouseCatalog.service.js), so every
 * ARVANN-owned product served through the product API returned
 * `company.contact === undefined`. Both frontends read the Call target from
 * `product.company.contact.phone`, so the app's "Call" button on admin
 * products toasted "This seller hasn't shared a phone number" and the web PDP
 * had no phone path at all.
 *
 * `getOrCreateInhouseCatalogCompany` now writes `contact.phone` in its `$set`
 * block, but it only runs when an admin creates or edits an in-house product —
 * so deployed environments would otherwise keep the stale (empty) contact
 * until the next such write. This script closes that gap immediately.
 *
 * The number comes from config (SUPPORT_PHONE), so this stays correct if the
 * ARVANN contact number ever changes — just re-run it after updating the env.
 *
 * Dry-run:
 *   node src/scripts/backfillInhouseCatalogContact.js
 *
 * Apply for real:
 *   node src/scripts/backfillInhouseCatalogContact.js --apply
 *
 * Idempotent. Safe to re-run.
 */

const mongoose = require('mongoose');
const config = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const Company = require('../models/company.model');
const { INHOUSE_COMPANY_SLUG } = require('../modules/company/utils/inhouseCatalog.util');

const shouldApply = process.argv.includes('--apply') || String(process.env.APPLY || '').toLowerCase() === 'true';

const log = (...args) => console.log('[backfill-inhouse-contact]', ...args);

const run = async () => {
  await connectDatabase(config.mongoUri);

  const targetPhone = config.supportPhone;
  if (!targetPhone) {
    throw new Error('config.supportPhone is empty — set SUPPORT_PHONE before running this script.');
  }

  const company = await Company.findOne({ slug: INHOUSE_COMPANY_SLUG })
    .select('_id displayName slug contact')
    .lean();

  if (!company) {
    // Not an error: the company is provisioned lazily on the first in-house
    // product write, and that write now sets contact.phone itself.
    log(`No company with slug "${INHOUSE_COMPANY_SLUG}" exists yet — nothing to backfill.`);
    await disconnectDatabase();
    return;
  }

  const currentPhone = company.contact?.phone || null;
  log(`Company ${company._id} ("${company.displayName}")`);
  log(`  current contact.phone: ${currentPhone ?? '(unset)'}`);
  log(`  target  contact.phone: ${targetPhone}`);

  if (currentPhone === targetPhone) {
    log('Already up to date. Nothing to do.');
    await disconnectDatabase();
    return;
  }

  if (!shouldApply) {
    log('Would update. [DRY RUN — re-run with --apply]');
    await disconnectDatabase();
    return;
  }

  await Company.updateOne({ _id: company._id }, { $set: { 'contact.phone': targetPhone } });
  log('Updated.');

  await disconnectDatabase();
};

run().catch(async (err) => {
  console.error('[backfill-inhouse-contact] FAILED:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
