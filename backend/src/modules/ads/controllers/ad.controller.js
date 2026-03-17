const createError = require('http-errors');
const {
  listAdminCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaign,
  activateCampaign,
  pauseCampaign,
  getFeed,
  recordAdEvent,
  getCampaignInsights,
  createCampaignFromServiceRequest
} = require('../services/ad.service');

const getAdFeedController = async (req, res, next) => {
  try {
    const feed = await getFeed({
      userId: req.user?.id,
      placement: req.query.placement,
      limit: req.query.limit
    });
    return res.json(feed);
  } catch (error) {
    return next(error);
  }
};

const recordAdEventController = async (req, res, next) => {
  try {
    const event = await recordAdEvent({
      campaignId: req.body.campaignId,
      userId: req.user?.id,
      type: req.body.type,
      placement: req.body.placement,
      sessionId: req.body.sessionId,
      metadata: req.body.metadata
    });
    return res.status(201).json({ event, success: true });
  } catch (error) {
    return next(error);
  }
};

const listAdminCampaignsController = async (req, res, next) => {
  try {
    const result = await listAdminCampaigns(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const createCampaignController = async (req, res, next) => {
  try {
    const campaign = await createCampaign({
      payload: req.body,
      actorId: req.user?.id
    });
    return res.status(201).json({ campaign, message: 'Campaign created' });
  } catch (error) {
    return next(error);
  }
};

const getCampaignController = async (req, res, next) => {
  try {
    const campaign = await getCampaignById(req.params.campaignId);
    if (!campaign) {
      return next(createError(404, 'Campaign not found'));
    }
    return res.json({ campaign });
  } catch (error) {
    return next(error);
  }
};

const updateCampaignController = async (req, res, next) => {
  try {
    const campaign = await updateCampaign({
      campaignId: req.params.campaignId,
      payload: req.body,
      actorId: req.user?.id
    });
    if (!campaign) {
      return next(createError(404, 'Campaign not found'));
    }
    return res.json({ campaign, message: 'Campaign updated' });
  } catch (error) {
    return next(error);
  }
};

const activateCampaignController = async (req, res, next) => {
  try {
    const campaign = await activateCampaign({
      campaignId: req.params.campaignId,
      actorId: req.user?.id
    });
    if (!campaign) {
      return next(createError(404, 'Campaign not found'));
    }
    return res.json({ campaign, message: 'Campaign activated' });
  } catch (error) {
    return next(error);
  }
};

const pauseCampaignController = async (req, res, next) => {
  try {
    const campaign = await pauseCampaign({
      campaignId: req.params.campaignId,
      actorId: req.user?.id
    });
    if (!campaign) {
      return next(createError(404, 'Campaign not found'));
    }
    return res.json({ campaign, message: 'Campaign paused' });
  } catch (error) {
    return next(error);
  }
};

const getCampaignInsightsController = async (req, res, next) => {
  try {
    const insights = await getCampaignInsights({
      campaignId: req.params.campaignId
    });
    if (!insights) {
      return next(createError(404, 'Campaign not found'));
    }
    return res.json({ insights });
  } catch (error) {
    return next(error);
  }
};

const createCampaignFromRequestController = async (req, res, next) => {
  try {
    const result = await createCampaignFromServiceRequest({
      serviceRequestId: req.params.serviceRequestId,
      actorId: req.user?.id,
      activate: Boolean(req.body?.activate),
      prefillOnly: req.body?.prefillOnly !== undefined ? Boolean(req.body.prefillOnly) : false
    });
    return res.status(201).json({
      ...result,
      message: result.campaign ? 'Campaign created from request' : 'Prefill generated from request'
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdFeedController,
  recordAdEventController,
  listAdminCampaignsController,
  createCampaignController,
  getCampaignController,
  updateCampaignController,
  activateCampaignController,
  pauseCampaignController,
  getCampaignInsightsController,
  createCampaignFromRequestController
};
