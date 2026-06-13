const createLogger = require('../../../utils/logger');
const { sweepExpiredCampaigns } = require('./ad.service');

const logger = createLogger('ad-scheduler');

// How often to flip ended campaigns to "completed". 15 minutes is plenty —
// the feed already hides expired campaigns in real time; this only keeps the
// stored status (and admin portfolio counts) honest.
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

let timer = null;

const runSweep = async () => {
  try {
    const completed = await sweepExpiredCampaigns({ now: new Date() });
    if (completed > 0) {
      logger.info(`Auto-completed ${completed} expired ad campaign(s)`);
    }
  } catch (error) {
    logger.error('Ad campaign sweep failed', error?.message || error);
  }
};

const startAdScheduler = () => {
  if (timer) return;
  // Run once shortly after boot, then on a fixed interval.
  runSweep();
  timer = setInterval(runSweep, SWEEP_INTERVAL_MS);
  if (typeof timer.unref === 'function') timer.unref();
};

const stopAdScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  startAdScheduler,
  stopAdScheduler,
  runSweep
};
