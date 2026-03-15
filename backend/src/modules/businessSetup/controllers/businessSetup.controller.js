const {
  createBusinessSetupRequest,
  listBusinessSetupRequestsForUser
} = require('../services/businessSetup.service');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');

const createBusinessSetupRequestController = async (req, res, next) => {
  try {
    const request = await createBusinessSetupRequest(req.body, req.user);

    if (req.user?.id) {
      await recordActivitySafe({
        userId: req.user.id,
        action: ACTIVITY_ACTIONS.BUSINESS_SETUP_REQUEST_SUBMITTED,
        label: 'Business setup request submitted',
        description: `${request.referenceCode} submitted for ${request.businessType}`,
        companyId: req.user.activeCompany,
        meta: {
          requestId: request.id,
          referenceCode: request.referenceCode,
          workModel: request.workModel,
          startTimeline: request.startTimeline
        },
        context: extractRequestContext(req)
      });
    }

    return res.status(201).json({
      request,
      message: 'Business setup request captured successfully',
      trackingReference: request.referenceCode
    });
  } catch (error) {
    return next(error);
  }
};

const listMyBusinessSetupRequestsController = async (req, res, next) => {
  try {
    const result = await listBusinessSetupRequestsForUser(req.user, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBusinessSetupRequestController,
  listMyBusinessSetupRequestsController
};
