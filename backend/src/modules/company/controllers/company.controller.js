const {
  createCompany,
  listCompanies,
  getCompany,
  switchActiveCompany,
  updateCompany,
  uploadCompanyFile
} = require('../services/company.service');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');

const createCompanyController = async (req, res, next) => {
  try {
    const company = await createCompany(req.user.id, req.body);

    await recordActivitySafe({
      userId: req.user.id,
      action: ACTIVITY_ACTIONS.COMPANY_CREATED,
      label: 'Company created',
      description: `Created company "${company.displayName}"`,
      companyId: company.id,
      companyName: company.displayName,
      meta: { type: company.type, categories: company.categories },
      context: extractRequestContext(req)
    });

    return res.status(201).json({ company });
  } catch (error) {
    return next(error);
  }
};

const listCompaniesController = async (req, res, next) => {
  try {
    const companies = await listCompanies(req.user.id);
    return res.json({ companies });
  } catch (error) {
    return next(error);
  }
};

const getCompanyController = async (req, res, next) => {
  try {
    const company = await getCompany(req.user.id, req.params.companyId);
    return res.json({ company });
  } catch (error) {
    return next(error);
  }
};

const switchCompanyController = async (req, res, next) => {
  try {
    const result = await switchActiveCompany(req.user.id, req.params.companyId);

    await recordActivitySafe({
      userId: req.user.id,
      action: ACTIVITY_ACTIONS.COMPANY_SWITCHED,
      label: 'Switched workspace',
      description: `Switched to ${result.company.displayName}`,
      companyId: result.company.id,
      companyName: result.company.displayName,
      context: extractRequestContext(req)
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const updateCompanyController = async (req, res, next) => {
  try {
    const company = await updateCompany(req.user.id, req.params.companyId, req.body);

    const updatedFields = Object.keys(req.body || {});
    await recordActivitySafe({
      userId: req.user.id,
      action: ACTIVITY_ACTIONS.COMPANY_UPDATED,
      label: 'Company updated',
      description: updatedFields.length
        ? `Updated ${updatedFields.join(', ')} for ${company.displayName}`
        : `Updated ${company.displayName}`,
      companyId: company.id,
      companyName: company.displayName,
      meta: { fields: updatedFields },
      context: extractRequestContext(req)
    });

    return res.json({ company });
  } catch (error) {
    return next(error);
  }
};

const uploadCompanyFileController = async (req, res, next) => {
  try {
    const result = await uploadCompanyFile(req.user.id, req.params.companyId, req.body);

    await recordActivitySafe({
      userId: req.user.id,
      action: ACTIVITY_ACTIONS.COMPANY_UPDATED,
      label: result.purpose === 'logo' ? 'Company logo updated' : 'Company asset uploaded',
      description: req.body.fileName ? `Uploaded ${req.body.fileName}` : 'Uploaded company asset',
      companyId: result.company?.id,
      companyName: result.company?.displayName,
      meta: { purpose: result.purpose, fileName: req.body.fileName },
      context: extractRequestContext(req)
    });

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCompanyController,
  listCompaniesController,
  getCompanyController,
  switchCompanyController,
  updateCompanyController,
  uploadCompanyFileController
};
