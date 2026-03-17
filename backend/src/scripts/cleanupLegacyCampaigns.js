const mongoose = require('mongoose');
const config = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/database');

const CAMPAIGN_EVENT_TYPES = [
  'campaign_impression',
  'campaign_click',
  'campaign_message',
  'campaign_call'
];

const shouldApply = process.argv.includes('--apply') || String(process.env.APPLY || '').toLowerCase() === 'true';

const run = async () => {
  await connectDatabase(config.mongoUri);
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Database connection is not initialized');
  }

  const offersCollection = db.collection('userpersonalizedoffers');
  const eventsCollection = db.collection('userpreferenceevents');

  const [offersCount, campaignEventCount] = await Promise.all([
    offersCollection.countDocuments({}),
    eventsCollection.countDocuments({ type: { $in: CAMPAIGN_EVENT_TYPES } })
  ]);

  console.log('[cleanup:legacy-campaigns] Legacy campaign documents:', offersCount);
  console.log('[cleanup:legacy-campaigns] Campaign preference events:', campaignEventCount);

  if (!shouldApply) {
    console.log('[cleanup:legacy-campaigns] Dry-run mode. No data deleted.');
    console.log('[cleanup:legacy-campaigns] Re-run with --apply to execute deletion.');
    return;
  }

  const [offersDeleteResult, eventsDeleteResult] = await Promise.all([
    offersCollection.deleteMany({}),
    eventsCollection.deleteMany({ type: { $in: CAMPAIGN_EVENT_TYPES } })
  ]);

  console.log('[cleanup:legacy-campaigns] Deleted legacy campaign documents:', offersDeleteResult.deletedCount || 0);
  console.log('[cleanup:legacy-campaigns] Deleted campaign preference events:', eventsDeleteResult.deletedCount || 0);
};

run()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('[cleanup:legacy-campaigns] Failed:', error?.message || error);
    await disconnectDatabase();
    process.exit(1);
  });
