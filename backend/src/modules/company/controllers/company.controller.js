const {
  createCompany,
  listCompanies,
  getCompany,
  switchActiveCompany
} = require('../services/company.service');

const createCompanyController = async (req, res, next) => {
  try {
    const company = await createCompany(req.user.id, req.body);
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
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCompanyController,
  listCompaniesController,
  getCompanyController,
  switchCompanyController
};
