const {
  submitCompanyVerificationRequest,
  getLatestCompanyVerificationRequest,
  listVerificationRequests,
  decideVerificationRequest
} = require('../services/companyVerification.service');

const submitCompanyVerificationRequestController = async (req, res, next) => {
  try {
    const request = await submitCompanyVerificationRequest(req.user.id, req.params.companyId, req.body);
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
