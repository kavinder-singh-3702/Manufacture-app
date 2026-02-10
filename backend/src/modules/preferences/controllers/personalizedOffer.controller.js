const {
  createOfferForUser,
  listOffersForUserAdmin,
  listCampaignsAdmin,
  getActiveOffersForUser,
  updateCampaignForUser
} = require('../services/personalizedOffer.service');

const createPersonalizedOfferController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const companyId = req.user?.activeCompany;
    const createdBy = req.user?.id;

    const offer = await createOfferForUser({
      userId,
      companyId,
      createdBy,
      ...req.body
    });

    return res.status(201).json({ offer });
  } catch (error) {
    return next(error);
  }
};

const listUserOffersAdminController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const companyId = req.user?.activeCompany;
    const includeExpired = req.query.includeExpired === undefined
      ? true
      : !(req.query.includeExpired === false || req.query.includeExpired === 'false');
    const { status, contentType, limit, offset } = req.query;

    const result = await listOffersForUserAdmin(userId, {
      companyId,
      includeExpired,
      status,
      contentType,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const listCampaignsAdminController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const { userId, status, contentType, limit, offset, includeExpired } = req.query;

    const result = await listCampaignsAdmin({
      companyId,
      userId,
      status,
      contentType,
      includeExpired: includeExpired === undefined
        ? true
        : !(includeExpired === false || includeExpired === 'false'),
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const updateCampaignController = async (req, res, next) => {
  try {
    const { userId, campaignId } = req.params;
    const companyId = req.user?.activeCompany;
    const campaign = await updateCampaignForUser({
      userId,
      campaignId,
      companyId,
      ...req.body
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    return res.json({ campaign });
  } catch (error) {
    return next(error);
  }
};

const listMyOffersController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const offers = await getActiveOffersForUser(userId, {
      companyId,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    });
    return res.json({ offers });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPersonalizedOfferController,
  listUserOffersAdminController,
  listCampaignsAdminController,
  updateCampaignController,
  listMyOffersController
};
