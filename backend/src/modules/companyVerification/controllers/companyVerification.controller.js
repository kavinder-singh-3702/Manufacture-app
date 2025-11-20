const {
  submitCompanyVerificationRequest,
  getLatestCompanyVerificationRequest,
  listVerificationRequests,
  decideVerificationRequest
} = require('../services/companyVerification.service');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');

const submitCompanyVerificationRequestController = async (req, res, next) => {
  try {
    const request = await submitCompanyVerificationRequest(req.user.id, req.params.companyId, req.body);

    if (request?.company) {
      await recordActivitySafe({
        userId: req.user.id,
        action: ACTIVITY_ACTIONS.COMPANY_VERIFICATION_SUBMITTED,
        label: 'Submitted verification',
        description: `Submitted verification for ${request.company.displayName}`,
        companyId: request.company.id,
        companyName: request.company.displayName,
        meta: { companyId: request.company.id },
        context: extractRequestContext(req)
      });
    }

    return res.status(201).json({ request });
  } catch (error) {
    return next(error);
  }
};

const getLatestCompanyVerificationRequestController = async (req, res, next) => {
  try {
    const payload = await getLatestCompanyVerificationRequest(req.user.id, req.params.companyId);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

const listCompanyVerificationRequestsController = async (req, res, next) => {
  try {
    const requests = await listVerificationRequests({ status: req.query.status });
    return res.json({ requests });
  } catch (error) {
    return next(error);
  }
};

const decideCompanyVerificationRequestController = async (req, res, next) => {
  try {
    const request = await decideVerificationRequest({
      adminId: req.user.id,
      requestId: req.params.requestId,
      action: req.body.action,
      notes: req.body.notes,
      rejectionReason: req.body.rejectionReason
    });

    if (request?.company) {
      await recordActivitySafe({
        userId: req.user.id,
        action: ACTIVITY_ACTIONS.COMPANY_VERIFICATION_DECIDED,
        label: `Verification ${request.status}`,
        description: `${request.company.displayName} marked ${request.status}`,
        companyId: request.company.id,
        companyName: request.company.displayName,
        meta: { requestId: request.id, status: request.status },
        context: extractRequestContext(req)
      });
    }

    return res.json({ request });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  submitCompanyVerificationRequestController,
  getLatestCompanyVerificationRequestController,
  listCompanyVerificationRequestsController,
  decideCompanyVerificationRequestController
};
