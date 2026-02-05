const createError = require('http-errors');
const {
  listParties,
  getPartyById,
  createParty,
  updateParty,
  deleteParty
} = require('../services/party.service');
const { ensureAccountingSetup } = require('../services/bootstrap.service');

const requireCompanyId = (req) => {
  const companyId = req.user?.activeCompany;
  if (!companyId) {
    throw createError(400, 'No active company selected');
  }
  return companyId;
};

const listPartiesController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    await ensureAccountingSetup(companyId);
    const result = await listParties(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getPartyController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const party = await getPartyById(companyId, req.params.partyId);
    if (!party) {
      throw createError(404, 'Party not found');
    }
    return res.json({ party });
  } catch (error) {
    return next(error);
  }
};

const createPartyController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const party = await createParty(companyId, req.body);
    return res.status(201).json({ party });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Party with same name already exists' });
    }
    return next(error);
  }
};

const updatePartyController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const party = await updateParty(companyId, req.params.partyId, req.body);
    if (!party) {
      throw createError(404, 'Party not found');
    }
    return res.json({ party });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Party with same name already exists' });
    }
    return next(error);
  }
};

const deletePartyController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const deleted = await deleteParty(companyId, req.params.partyId, { force: req.query.force });
    if (!deleted) {
      throw createError(404, 'Party not found');
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listPartiesController,
  getPartyController,
  createPartyController,
  updatePartyController,
  deletePartyController
};

