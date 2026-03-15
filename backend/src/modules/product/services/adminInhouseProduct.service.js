const { isAdminRole } = require('../../../utils/roles');
const {
  getCategoryStats,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustQuantity,
  deleteProduct,
  addProductImage
} = require('./product.service');
const {
  listVariants,
  getVariantById,
  createVariant,
  updateVariant,
  adjustVariantQuantity,
  deleteVariant
} = require('./productVariant.service');
const { getOrCreateInhouseCatalogCompany } = require('./inhouseCatalog.service');

const resolveInhouseCompanyId = async (actorUserId) => {
  const company = await getOrCreateInhouseCatalogCompany({ actorUserId });
  return company._id;
};

const mapCreatorRole = (actorRole) => (isAdminRole(actorRole) ? 'admin' : 'user');

const listInhouseCategoryStats = async ({ actorUserId } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return getCategoryStats(companyId);
};

const listInhouseProducts = async ({ actorUserId, query = {} } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return getAllProducts(companyId, query);
};

const getInhouseProductById = async ({ actorUserId, productId, includeVariantSummary } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return getProductById(productId, companyId, { includeVariantSummary });
};

const createInhouseProduct = async ({ actorUserId, actorRole, payload } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  const normalizedPayload = {
    ...payload,
    visibility: payload?.visibility || 'public',
    status: payload?.status || 'active'
  };
  return createProduct(normalizedPayload, actorUserId, companyId, mapCreatorRole(actorRole));
};

const updateInhouseProduct = async ({ actorUserId, productId, updates } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return updateProduct(productId, updates, actorUserId, companyId);
};

const adjustInhouseProductQuantity = async ({ actorUserId, productId, adjustment } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return adjustQuantity(productId, adjustment, actorUserId, companyId);
};

const deleteInhouseProduct = async ({ actorUserId, productId } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return deleteProduct(productId, companyId);
};

const addInhouseProductImage = async ({ actorUserId, productId, filePayload } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return addProductImage(productId, companyId, filePayload, actorUserId);
};

const listInhouseVariants = async ({ actorUserId, productId, query = {} } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return listVariants(productId, companyId, query);
};

const getInhouseVariantById = async ({ actorUserId, productId, variantId } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return getVariantById(productId, variantId, companyId);
};

const createInhouseVariant = async ({ actorUserId, productId, payload } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return createVariant(productId, companyId, payload, actorUserId);
};

const updateInhouseVariant = async ({ actorUserId, productId, variantId, updates } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return updateVariant(productId, variantId, updates, actorUserId, companyId);
};

const adjustInhouseVariantQuantity = async ({ actorUserId, productId, variantId, adjustment } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return adjustVariantQuantity(productId, variantId, adjustment, actorUserId, companyId);
};

const deleteInhouseVariant = async ({ actorUserId, productId, variantId } = {}) => {
  const companyId = await resolveInhouseCompanyId(actorUserId);
  return deleteVariant(productId, variantId, actorUserId, companyId);
};

module.exports = {
  listInhouseCategoryStats,
  listInhouseProducts,
  getInhouseProductById,
  createInhouseProduct,
  updateInhouseProduct,
  adjustInhouseProductQuantity,
  deleteInhouseProduct,
  addInhouseProductImage,
  listInhouseVariants,
  getInhouseVariantById,
  createInhouseVariant,
  updateInhouseVariant,
  adjustInhouseVariantQuantity,
  deleteInhouseVariant
};
