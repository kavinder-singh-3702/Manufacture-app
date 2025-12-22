const {
  createOfferForUser,
  listOffersForUserAdmin,
  getActiveOffersForUser
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
    const includeExpired = req.query.includeExpired !== 'false';

    const offers = await listOffersForUserAdmin(userId, { companyId, includeExpired });
    return res.json({ offers });
  } catch (error) {
    return next(error);
  }
};

const listMyOffersController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const offers = await getActiveOffersForUser(userId, { companyId });
    return res.json({ offers });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPersonalizedOfferController,
  listUserOffersAdminController,
  listMyOffersController
};
