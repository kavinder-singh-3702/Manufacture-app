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
  getProductsByCategoryController
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
});
