jest.mock('../src/modules/product/services/product.service', () => ({
  getCategoryStats: jest.fn(),
  getProductsByCategory: jest.fn(),
  getAllProducts: jest.fn(),
  getProductById: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  adjustQuantity: jest.fn(),
  deleteProduct: jest.fn(),
  getProductStats: jest.fn(),
  applyTargetedDiscount: jest.fn(),
  addProductImage: jest.fn()
}));

const {
  listProductsController,
  getProductsByCategoryController,
  getProductController
} = require('../src/modules/product/controllers/product.controller');
const productService = require('../src/modules/product/services/product.service');

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('Product controller companyId filter rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects companyId filter for non-admin list requests', async () => {
    const req = {
      query: { scope: 'marketplace', companyId: 'company123' },
      user: { id: 'user1', role: 'user', activeCompany: 'ownCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await listProductsController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode || error.status).toBe(403);
    expect(productService.getAllProducts).not.toHaveBeenCalled();
  });

  test('rejects createdBy filter for non-admin list requests', async () => {
    const req = {
      query: { scope: 'marketplace', createdBy: '507f1f77bcf86cd799439011' },
      user: { id: 'user1', role: 'user', activeCompany: 'ownCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await listProductsController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode || error.status).toBe(403);
    expect(productService.getAllProducts).not.toHaveBeenCalled();
  });

  test('requires active company when scope=company on list endpoint', async () => {
    const req = {
      query: { scope: 'company', includeVariantSummary: 'true' },
      user: { id: 'user1', role: 'user', activeCompany: null }
    };
    const res = createRes();
    const next = jest.fn();

    await listProductsController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode || error.status).toBe(400);
    expect(error.code).toBe('ACTIVE_COMPANY_REQUIRED');
    expect(productService.getAllProducts).not.toHaveBeenCalled();
  });

  test('allows admin to query list by explicit companyId', async () => {
    productService.getAllProducts.mockResolvedValue({
      products: [],
      pagination: { total: 0, limit: 20, offset: 0, hasMore: false }
    });

    const req = {
      query: { scope: 'marketplace', companyId: 'targetCo', limit: '20', includeVariantSummary: 'true' },
      user: { id: 'admin1', role: 'admin', activeCompany: 'adminCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await listProductsController(req, res, next);

    expect(productService.getAllProducts).toHaveBeenCalledWith(
      'targetCo',
      expect.objectContaining({
        limit: 20,
        includeVariantSummary: true,
        userId: 'admin1'
      })
    );
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('allows admin to query list by explicit createdBy filter', async () => {
    productService.getAllProducts.mockResolvedValue({
      products: [],
      pagination: { total: 0, limit: 20, offset: 0, hasMore: false }
    });

    const req = {
      query: {
        scope: 'marketplace',
        createdBy: '507f1f77bcf86cd799439011',
        limit: '20',
        includeVariantSummary: 'true'
      },
      user: { id: 'admin1', role: 'admin', activeCompany: 'adminCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await listProductsController(req, res, next);

    expect(productService.getAllProducts).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        limit: 20,
        includeVariantSummary: true,
        userId: 'admin1',
        createdBy: '507f1f77bcf86cd799439011'
      })
    );
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects companyId filter for non-admin category requests', async () => {
    const req = {
      params: { categoryId: 'agri' },
      query: { scope: 'marketplace', companyId: 'company123' },
      user: { id: 'user1', role: 'user', activeCompany: 'ownCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await getProductsByCategoryController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode || error.status).toBe(403);
    expect(productService.getProductsByCategory).not.toHaveBeenCalled();
  });

  test('uses active company fallback when no companyId filter is provided', async () => {
    productService.getProductsByCategory.mockResolvedValue({
      products: [],
      pagination: { total: 0, limit: 20, offset: 0, hasMore: false }
    });

    const req = {
      params: { categoryId: 'agri' },
      query: { scope: 'company', includeVariantSummary: 'true' },
      user: { id: 'user1', role: 'user', activeCompany: 'ownCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await getProductsByCategoryController(req, res, next);

    expect(productService.getProductsByCategory).toHaveBeenCalledWith(
      'ownCo',
      'agri',
      expect.objectContaining({
        includeVariantSummary: true,
        userId: 'user1'
      })
    );
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('requires active company when scope=company on get endpoint', async () => {
    const req = {
      params: { productId: 'product1' },
      query: { scope: 'company', includeVariantSummary: 'true' },
      user: undefined
    };
    const res = createRes();
    const next = jest.fn();

    await getProductController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode || error.status).toBe(400);
    expect(error.code).toBe('ACTIVE_COMPANY_REQUIRED');
    expect(productService.getProductById).not.toHaveBeenCalled();
  });

  // Regression coverage for the reported bug: a signed-in viewer opening a
  // product that belongs to a *different* company than their active one.
  test('get endpoint with no scope resolves owner-or-public, not the viewer\'s own company', async () => {
    productService.getProductById.mockResolvedValue({ _id: 'product1' });

    const req = {
      params: { productId: 'product1' },
      query: { includeVariantSummary: 'true' },
      user: { id: 'user1', role: 'user', activeCompany: 'viewerCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await getProductController(req, res, next);

    expect(productService.getProductById).toHaveBeenCalledWith('product1', {
      viewerCompanyId: 'viewerCo',
      ownerOnly: false,
      includeVariantSummary: true
    });
    expect(res.json).toHaveBeenCalledWith({ product: { _id: 'product1' } });
    expect(next).not.toHaveBeenCalled();
  });

  test('get endpoint with scope=marketplace also resolves owner-or-public', async () => {
    productService.getProductById.mockResolvedValue({ _id: 'product1' });

    const req = {
      params: { productId: 'product1' },
      query: { scope: 'marketplace' },
      user: { id: 'user1', role: 'user', activeCompany: 'viewerCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await getProductController(req, res, next);

    expect(productService.getProductById).toHaveBeenCalledWith('product1', {
      viewerCompanyId: 'viewerCo',
      ownerOnly: false,
      includeVariantSummary: false
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('get endpoint with scope=company restricts strictly to the viewer\'s own company', async () => {
    productService.getProductById.mockResolvedValue({ _id: 'product1' });

    const req = {
      params: { productId: 'product1' },
      query: { scope: 'company' },
      user: { id: 'user1', role: 'user', activeCompany: 'viewerCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await getProductController(req, res, next);

    expect(productService.getProductById).toHaveBeenCalledWith('product1', {
      viewerCompanyId: 'viewerCo',
      ownerOnly: true,
      includeVariantSummary: false
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('get endpoint surfaces a real 404 message (not a bare {error} body) when the product is missing', async () => {
    productService.getProductById.mockResolvedValue(null);

    const req = {
      params: { productId: 'missing1' },
      query: {},
      user: { id: 'user1', role: 'user', activeCompany: 'viewerCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await getProductController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode || error.status).toBe(404);
    expect(error.message).toBe('Product not found');
    expect(res.json).not.toHaveBeenCalled();
  });
});
