const createError = require('http-errors');
const Company = require('../../../models/company.model');
const User = require('../../../models/user.model');
const { normalizeCategories, buildCompanyResponse } = require('../utils/company.util');

const pruneUndefined = (obj = {}) =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    acc[key] = value;
    return acc;
  }, {});

const ensureUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createError(404, 'User not found');
  }
  return user;
};

const ensureOwnedCompany = async (ownerId, companyId) => {
  const company = await Company.findOne({ _id: companyId, owner: ownerId });
  if (!company) {
    throw createError(404, 'Company not found');
  }
  return company;
};

const createCompany = async (ownerId, payload) => {
  const user = await ensureUser(ownerId);
  const categories = normalizeCategories(payload.categories);

  const companyData = pruneUndefined({
    displayName: payload.displayName.trim(),
    legalName: payload.legalName?.trim(),
    type: payload.type || user.accountType || 'normal',
    categories,
    description: payload.description,
    foundedAt: payload.foundedAt,
    sizeBucket: payload.sizeBucket,
    logoUrl: payload.logoUrl,
    coverImageUrl: payload.coverImageUrl,
    contact: payload.contact,
    headquarters: payload.headquarters,
    locations: payload.locations,
    socialLinks: payload.socialLinks,
    documents: payload.documents,
    complianceStatus: payload.complianceStatus,
    metadata: payload.metadata,
    settings: payload.settings,
    metadata: payload.metadata,
    settings: payload.settings,
    slug: payload.slug?.trim().toLowerCase(),
    owner: ownerId,
    createdBy: ownerId,
    updatedBy: ownerId
  });

  if (!Array.isArray(user.companies)) {
    user.companies = [];
  }

  const company = await Company.create(companyData);

  const companyId = company._id;
  const alreadyLinked = user.companies?.some((id) => id.toString() === companyId.toString());
  if (!alreadyLinked) {
    user.companies.push(companyId);
  }
  user.activeCompany = companyId;
  await user.save();

  return buildCompanyResponse(company);
};

const listCompanies = async (ownerId) => {
  const companies = await Company.find({ owner: ownerId }).sort({ createdAt: -1 });
  return companies.map(buildCompanyResponse);
};

const getCompany = async (ownerId, companyId) => {
  const company = await ensureOwnedCompany(ownerId, companyId);
  return buildCompanyResponse(company);
};

const updateCompany = async (ownerId, companyId, payload) => {
  const company = await ensureOwnedCompany(ownerId, companyId);
  const categories = normalizeCategories(payload.categories);

  const nextValues = pruneUndefined({
    displayName: payload.displayName?.trim(),
    legalName: payload.legalName?.trim(),
    description: payload.description,
    foundedAt: payload.foundedAt,
    sizeBucket: payload.sizeBucket,
    slug: payload.slug?.trim().toLowerCase(),
    type: payload.type,
    categories,
    logoUrl: payload.logoUrl,
    coverImageUrl: payload.coverImageUrl,
    contact: payload.contact,
    headquarters: payload.headquarters,
    locations: payload.locations,
    socialLinks: payload.socialLinks
  });

  Object.assign(company, nextValues, { updatedBy: ownerId });
  await company.save();

  return buildCompanyResponse(company);
};

const switchActiveCompany = async (ownerId, companyId) => {
  const company = await ensureOwnedCompany(ownerId, companyId);

  const user = await User.findByIdAndUpdate(
    ownerId,
    {
      $set: { activeCompany: companyId },
      $addToSet: { companies: companyId }
    },
    { new: true, select: 'activeCompany' }
  );

  return {
    activeCompany: user.activeCompany?.toString(),
    company: buildCompanyResponse(company)
  };
};

module.exports = {
  createCompany,
  listCompanies,
  getCompany,
  switchActiveCompany,
  updateCompany
};
