const { recordPreferenceEvent, aggregateSummary, getHomeFeedForUser } = require('../services/preferences.service');

const logPreferenceEventController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const { type, productId, category, searchTerm, quantity, meta } = req.body;

    await recordPreferenceEvent({
      userId,
      companyId,
      type,
      productId,
      category,
      searchTerm,
      quantity,
      meta
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

const getUserPreferenceSummaryController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { companyId, days, limit } = req.query;

    const summary = await aggregateSummary({
      userId,
      companyId,
      days: days ? Number(days) : undefined,
      limit: limit ? Number(limit) : undefined
    });

    return res.json({ summary });
  } catch (error) {
    return next(error);
  }
};

const getHomeFeedController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const { campaignLimit, recommendationLimit } = req.query;

    const feed = await getHomeFeedForUser({
      userId,
      companyId,
      campaignLimit: campaignLimit ? Number(campaignLimit) : undefined,
      recommendationLimit: recommendationLimit ? Number(recommendationLimit) : undefined
    });

    return res.json(feed);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  logPreferenceEventController,
  getUserPreferenceSummaryController,
  getHomeFeedController
};
