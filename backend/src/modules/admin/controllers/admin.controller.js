const {
  getAdminStats,
  getAdminOverview,
  getAdminUserOverview,
  listAllCompanies,
  listAllUsers,
  setCompanyStatus,
  archiveCompany,
  deleteCompany,
  hardDeleteCompany,
  listAdminAuditEvents,
  requestDocuments
} = require('../services/admin.service');
const {
  listServiceRequestsAdmin,
  getServiceRequestAdminById,
  updateServiceRequestWorkflowAdmin,
  updateServiceRequestContentAdmin
} = require('../../services/services/serviceRequest.service');
const {
  listBusinessSetupRequestsAdmin,
  getBusinessSetupRequestAdminById,
  updateBusinessSetupRequestWorkflowAdmin,
  listOpsRequestsAdmin
} = require('../../businessSetup/services/businessSetup.service');
const {
  listConversationsAdmin,
  listCallLogsAdmin
} = require('../../chat/services/chat.service');
const {
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
} = require('../../product/services/adminInhouseProduct.service');
const {
  ADMIN_PERMISSIONS,
  assertAdminPermission,
  validateMutationContext
} = require('../permissions');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');

const recordAdminActivity = async ({
  req,
  action,
  label,
  description,
  companyId,
  companyName,
  meta
}) => {
  await recordActivitySafe({
    userId: req.user?.id,
    action,
    label,
    description,
    category: 'admin',
    companyId,
    companyName,
    meta,
    context: extractRequestContext(req)
  });
};

const parseBooleanQuery = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return value.toLowerCase() === 'true';
};

/**
 * GET /api/admin/stats
 */
const getAdminStatsController = async (_req, res, next) => {
  try {
    const stats = await getAdminStats();
    return res.json({ stats });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/overview
 */
const getAdminOverviewController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_OVERVIEW);
    const overview = await getAdminOverview();
    return res.json({ overview });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/companies
 */
const listAllCompaniesController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_COMPANIES);
    const { status, search, limit, offset, sort } = req.query;
    const result = await listAllCompanies({
      status,
      search,
      limit,
      offset,
      sort
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/users
 */
const listAllUsersController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_USERS);
    const { status, search, limit, offset, sort, companyId } = req.query;
    const result = await listAllUsers({
      status,
      search,
      limit,
      offset,
      sort,
      companyId
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/users/:userId/overview
 */
const getAdminUserOverviewController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_USER_OVERVIEW);
    const { userId } = req.params;
    const { limit } = req.query;
    const overview = await getAdminUserOverview({ userId, limit });
    return res.json({ overview });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/audit-events
 */
const listAdminAuditEventsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_AUDIT_EVENTS);
    const result = await listAdminAuditEvents(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/service-requests
 */
const listAdminServiceRequestsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_SERVICE_REQUESTS);
    const result = await listServiceRequestsAdmin(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/ops-requests
 */
const listAdminOpsRequestsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_SERVICE_REQUESTS);
    const result = await listOpsRequestsAdmin(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/service-requests/:serviceRequestId
 */
const getAdminServiceRequestController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_SERVICE_REQUESTS);
    const request = await getServiceRequestAdminById(req.params.serviceRequestId);
    if (!request) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    return res.json({ request });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/business-setup-requests
 */
const listAdminBusinessSetupRequestsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_SERVICE_REQUESTS);
    const result = await listBusinessSetupRequestsAdmin(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/business-setup-requests/:requestId
 */
const getAdminBusinessSetupRequestController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_SERVICE_REQUESTS);
    const request = await getBusinessSetupRequestAdminById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Business setup request not found' });
    }
    return res.json({ request });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/admin/service-requests/:serviceRequestId/workflow
 */
const updateAdminServiceRequestWorkflowController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_SERVICE_REQUEST_WORKFLOW);
    const { serviceRequestId } = req.params;
    const {
      status,
      priority,
      assignedTo,
      slaDueAt,
      note,
      reason,
      contextCompanyId,
      expectedUpdatedAt
    } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId
    });

    const request = await updateServiceRequestWorkflowAdmin({
      serviceRequestId,
      actorId: req.user.id,
      actorRole: req.user.role,
      contextCompanyId,
      status,
      priority,
      assignedTo,
      slaDueAt,
      note,
      reason,
      expectedUpdatedAt
    });

    if (!request) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_SERVICE_REQUEST_WORKFLOW_UPDATED,
      label: 'Service workflow updated',
      description: `Service request ${serviceRequestId} workflow updated`,
      companyId: request.company?.id,
      companyName: request.company?.displayName,
      meta: {
        serviceRequestId,
        status,
        priority,
        assignedTo,
        slaDueAt,
        reason,
        note
      }
    });

    return res.json({ request, message: 'Service request workflow updated' });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/admin/service-requests/:serviceRequestId/content
 */
const updateAdminServiceRequestContentController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_SERVICE_REQUEST_CONTENT);
    const { serviceRequestId } = req.params;
    const { updates, reason, contextCompanyId, expectedUpdatedAt } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId
    });

    const request = await updateServiceRequestContentAdmin({
      serviceRequestId,
      actorId: req.user.id,
      actorRole: req.user.role,
      contextCompanyId,
      updates,
      reason,
      expectedUpdatedAt
    });

    if (!request) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_SERVICE_REQUEST_CONTENT_UPDATED,
      label: 'Service content updated',
      description: `Service request ${serviceRequestId} content updated`,
      companyId: request.company?.id,
      companyName: request.company?.displayName,
      meta: {
        serviceRequestId,
        reason,
        fields: Object.keys(updates || {})
      }
    });

    return res.json({ request, message: 'Service request content updated' });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/admin/business-setup-requests/:requestId/workflow
 */
const updateAdminBusinessSetupRequestWorkflowController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_SERVICE_REQUEST_WORKFLOW);
    const { requestId } = req.params;
    const {
      status,
      priority,
      assignedTo,
      slaDueAt,
      note,
      reason,
      contextCompanyId,
      expectedUpdatedAt
    } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId
    });

    const request = await updateBusinessSetupRequestWorkflowAdmin({
      requestId,
      actorId: req.user.id,
      actorRole: req.user.role,
      contextCompanyId,
      status,
      priority,
      assignedTo,
      slaDueAt,
      note,
      reason,
      expectedUpdatedAt
    });

    if (!request) {
      return res.status(404).json({ error: 'Business setup request not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_BUSINESS_SETUP_WORKFLOW_UPDATED,
      label: 'Business setup workflow updated',
      description: `Business setup request ${requestId} workflow updated`,
      companyId: request.company?.id,
      companyName: request.company?.displayName,
      meta: {
        requestId,
        status,
        priority,
        assignedTo,
        slaDueAt,
        reason,
        note
      }
    });

    return res.json({ request, message: 'Business setup workflow updated' });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/inhouse-products/categories
 */
const listAdminInhouseProductCategoriesController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_INHOUSE_PRODUCTS);
    const result = await listInhouseCategoryStats({ actorUserId: req.user.id });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/inhouse-products
 */
const listAdminInhouseProductsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_INHOUSE_PRODUCTS);
    const { limit, offset, category, status, visibility, search, sort, minPrice, maxPrice, includeVariantSummary } = req.query;
    const result = await listInhouseProducts({
      actorUserId: req.user.id,
      query: {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        category,
        status,
        visibility,
        search,
        sort,
        minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
        includeVariantSummary: parseBooleanQuery(includeVariantSummary)
      }
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/inhouse-products/:productId
 */
const getAdminInhouseProductController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_INHOUSE_PRODUCTS);
    const product = await getInhouseProductById({
      actorUserId: req.user.id,
      productId: req.params.productId,
      includeVariantSummary: parseBooleanQuery(req.query.includeVariantSummary)
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/inhouse-products
 */
const createAdminInhouseProductController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS);
    const product = await createInhouseProduct({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      payload: req.body
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_INHOUSE_PRODUCT_CREATED,
      label: 'In-house product created',
      description: `Created in-house product ${product.name}`,
      companyId: product.company,
      meta: { productId: product._id?.toString?.() || product._id, name: product.name }
    });

    return res.status(201).json({ product, message: 'In-house product created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A product with this SKU already exists' });
    }
    return next(error);
  }
};

/**
 * PUT /api/admin/inhouse-products/:productId
 */
const updateAdminInhouseProductController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS);
    const product = await updateInhouseProduct({
      actorUserId: req.user.id,
      productId: req.params.productId,
      updates: req.body
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_INHOUSE_PRODUCT_UPDATED,
      label: 'In-house product updated',
      description: `Updated in-house product ${product.name}`,
      companyId: product.company,
      meta: {
        productId: product._id?.toString?.() || product._id,
        fields: Object.keys(req.body || {})
      }
    });

    return res.json({ product, message: 'In-house product updated successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A product with this SKU already exists' });
    }
    return next(error);
  }
};

/**
 * PATCH /api/admin/inhouse-products/:productId/quantity
 */
const adjustAdminInhouseProductQuantityController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS);
    const parsedAdjustment = Number(req.body?.adjustment);
    if (Number.isNaN(parsedAdjustment)) {
      return res.status(400).json({ error: 'Adjustment must be a number' });
    }

    const product = await adjustInhouseProductQuantity({
      actorUserId: req.user.id,
      productId: req.params.productId,
      adjustment: parsedAdjustment
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_INHOUSE_PRODUCT_QUANTITY_ADJUSTED,
      label: 'In-house product quantity adjusted',
      description: `Adjusted quantity for ${product.name} by ${parsedAdjustment}`,
      companyId: product.company,
      meta: { productId: product._id?.toString?.() || product._id, adjustment: parsedAdjustment }
    });

    return res.json({ product });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/admin/inhouse-products/:productId
 */
const deleteAdminInhouseProductController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS);
    const deleted = await deleteInhouseProduct({
      actorUserId: req.user.id,
      productId: req.params.productId
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_INHOUSE_PRODUCT_DELETED,
      label: 'In-house product archived',
      description: `Archived in-house product ${req.params.productId}`,
      meta: { productId: req.params.productId }
    });

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/inhouse-products/:productId/images
 */
const uploadAdminInhouseProductImageController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS);
    const result = await addInhouseProductImage({
      actorUserId: req.user.id,
      productId: req.params.productId,
      filePayload: req.body
    });

    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_INHOUSE_PRODUCT_IMAGE_UPLOADED,
      label: 'In-house product image uploaded',
      description: `Uploaded image for in-house product ${req.params.productId}`,
      companyId: result.product?.company,
      meta: { productId: req.params.productId, fileName: req.body?.fileName }
    });

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/inhouse-products/:productId/variants
 */
const listAdminInhouseVariantsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_INHOUSE_PRODUCTS);
    const result = await listInhouseVariants({
      actorUserId: req.user.id,
      productId: req.params.productId,
      query: {
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
        status: req.query.status
      }
    });
    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/inhouse-products/:productId/variants/:variantId
 */
const getAdminInhouseVariantController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_INHOUSE_PRODUCTS);
    const variant = await getInhouseVariantById({
      actorUserId: req.user.id,
      productId: req.params.productId,
      variantId: req.params.variantId
    });
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    return res.json({ variant });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/inhouse-products/:productId/variants
 */
const createAdminInhouseVariantController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS);
    const variant = await createInhouseVariant({
      actorUserId: req.user.id,
      productId: req.params.productId,
      payload: req.body
    });

    if (!variant) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_INHOUSE_VARIANT_CREATED,
      label: 'In-house variant created',
      description: `Created variant for product ${req.params.productId}`,
      companyId: variant.company,
      meta: { productId: req.params.productId, variantId: variant._id?.toString?.() || variant._id }
    });

    return res.status(201).json({ variant, message: 'Variant created successfully' });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Variant already exists (duplicate SKU or option combination)' });
    }
    return next(error);
  }
};

/**
 * PUT /api/admin/inhouse-products/:productId/variants/:variantId
 */
const updateAdminInhouseVariantController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS);
    const variant = await updateInhouseVariant({
      actorUserId: req.user.id,
      productId: req.params.productId,
      variantId: req.params.variantId,
      updates: req.body
    });

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_INHOUSE_VARIANT_UPDATED,
      label: 'In-house variant updated',
      description: `Updated variant ${req.params.variantId}`,
      companyId: variant.company,
      meta: {
        productId: req.params.productId,
        variantId: req.params.variantId,
        fields: Object.keys(req.body || {})
      }
    });

    return res.json({ variant, message: 'Variant updated successfully' });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Variant already exists (duplicate SKU or option combination)' });
    }
    return next(error);
  }
};

/**
 * PATCH /api/admin/inhouse-products/:productId/variants/:variantId/quantity
 */
const adjustAdminInhouseVariantQuantityController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS);
    const parsedAdjustment = Number(req.body?.adjustment);
    if (Number.isNaN(parsedAdjustment)) {
      return res.status(400).json({ error: 'Adjustment must be a number' });
    }

    const variant = await adjustInhouseVariantQuantity({
      actorUserId: req.user.id,
      productId: req.params.productId,
      variantId: req.params.variantId,
      adjustment: parsedAdjustment
    });

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_INHOUSE_VARIANT_QUANTITY_ADJUSTED,
      label: 'In-house variant quantity adjusted',
      description: `Adjusted quantity for variant ${req.params.variantId} by ${parsedAdjustment}`,
      companyId: variant.company,
      meta: {
        productId: req.params.productId,
        variantId: req.params.variantId,
        adjustment: parsedAdjustment
      }
    });

    return res.json({ variant });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/admin/inhouse-products/:productId/variants/:variantId
 */
const deleteAdminInhouseVariantController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS);
    const deleted = await deleteInhouseVariant({
      actorUserId: req.user.id,
      productId: req.params.productId,
      variantId: req.params.variantId
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_INHOUSE_VARIANT_DELETED,
      label: 'In-house variant archived',
      description: `Archived in-house variant ${req.params.variantId}`,
      meta: { productId: req.params.productId, variantId: req.params.variantId }
    });

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/conversations
 */
const listAdminConversationsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_CONVERSATIONS);
    const result = await listConversationsAdmin(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/call-logs
 */
const listAdminCallLogsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_CALL_LOGS);
    const result = await listCallLogsAdmin(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/admin/companies/:companyId/status
 */
const setCompanyStatusController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_COMPANY_STATUS);
    const { companyId } = req.params;
    const { status, reason, contextCompanyId } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await setCompanyStatus({
      companyId,
      actorId: req.user.id,
      status,
      reason
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_COMPANY_STATUS_CHANGED,
      label: 'Company status changed',
      description: `${result.company.displayName} moved to ${status}`,
      companyId,
      companyName: result.company.displayName,
      meta: { status, reason }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/companies/:companyId/archive
 */
const archiveCompanyController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_COMPANY_STATUS);
    const { companyId } = req.params;
    const { reason, contextCompanyId } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await archiveCompany({
      companyId,
      actorId: req.user.id,
      reason
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_COMPANY_ARCHIVED,
      label: 'Company archived',
      description: `${result.company.displayName} archived`,
      companyId,
      companyName: result.company.displayName,
      meta: { reason }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/admin/companies/:companyId (deprecated -> archive)
 */
const deleteCompanyController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_COMPANY_STATUS);
    const { companyId } = req.params;
    const { reason, contextCompanyId } = req.body || {};

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await deleteCompany({
      companyId,
      actorId: req.user.id,
      reason
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_COMPANY_ARCHIVED,
      label: 'Company archived (legacy delete route)',
      description: `${result.company.displayName} archived via deprecated delete route`,
      companyId,
      companyName: result.company.displayName,
      meta: { reason, deprecated: true }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/companies/:companyId/hard-delete
 */
const hardDeleteCompanyController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.HARD_DELETE_COMPANY);
    const { companyId } = req.params;
    const { reason, contextCompanyId } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await hardDeleteCompany({
      companyId,
      actorId: req.user.id,
      reason
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_COMPANY_HARD_DELETE_REQUESTED,
      label: 'Company hard delete requested',
      description: `Hard delete job queued for company ${companyId}`,
      companyId,
      meta: { reason, jobId: result.job?.id }
    });

    return res.status(202).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/companies/:companyId/request-documents
 */
const requestDocumentsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.REQUEST_COMPANY_DOCUMENTS);
    const { companyId } = req.params;
    const { message, sendEmail, sendNotification, contextCompanyId } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await requestDocuments(companyId, req.user.id, {
      message,
      sendEmail: sendEmail !== false,
      sendNotification: sendNotification !== false
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_DOCUMENTS_REQUESTED,
      label: 'Company documents requested',
      description: `Requested documents for company ${companyId}`,
      companyId,
      meta: {
        sendEmail: sendEmail !== false,
        sendNotification: sendNotification !== false,
        message: message || null
      }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdminStatsController,
  getAdminOverviewController,
  getAdminUserOverviewController,
  listAllCompaniesController,
  listAllUsersController,
  listAdminAuditEventsController,
  listAdminOpsRequestsController,
  listAdminServiceRequestsController,
  listAdminBusinessSetupRequestsController,
  getAdminServiceRequestController,
  getAdminBusinessSetupRequestController,
  updateAdminServiceRequestWorkflowController,
  updateAdminServiceRequestContentController,
  updateAdminBusinessSetupRequestWorkflowController,
  listAdminInhouseProductCategoriesController,
  listAdminInhouseProductsController,
  getAdminInhouseProductController,
  createAdminInhouseProductController,
  updateAdminInhouseProductController,
  adjustAdminInhouseProductQuantityController,
  deleteAdminInhouseProductController,
  uploadAdminInhouseProductImageController,
  listAdminInhouseVariantsController,
  getAdminInhouseVariantController,
  createAdminInhouseVariantController,
  updateAdminInhouseVariantController,
  adjustAdminInhouseVariantQuantityController,
  deleteAdminInhouseVariantController,
  listAdminConversationsController,
  listAdminCallLogsController,
  setCompanyStatusController,
  archiveCompanyController,
  deleteCompanyController,
  hardDeleteCompanyController,
  requestDocumentsController
};
