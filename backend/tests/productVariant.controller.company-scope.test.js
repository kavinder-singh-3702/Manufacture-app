jest.mock('../src/modules/product/services/productVariant.service', () => ({
  listVariants: jest.fn(),
  getVariantById: jest.fn(),
  createVariant: jest.fn(),
  updateVariant: jest.fn(),
  adjustVariantQuantity: jest.fn(),
  deleteVariant: jest.fn(),
  listVariantLogs: jest.fn()
}));

const {
  listProductVariantsController,
  getProductVariantController
} = require('../src/modules/product/controllers/productVariant.controller');
const variantService = require('../src/modules/product/services/productVariant.service');

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('Product variant controller company scope guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requires active company for list when scope=company', async () => {
    const req = {
      params: { productId: 'product1' },
      query: { scope: 'company' },
      user: undefined
    };
    const res = createRes();
    const next = jest.fn();

    await listProductVariantsController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode || error.status).toBe(400);
    expect(error.code).toBe('ACTIVE_COMPANY_REQUIRED');
    expect(variantService.listVariants).not.toHaveBeenCalled();
  });

  test('requires active company for get when scope=company', async () => {
    const req = {
      params: { productId: 'product1', variantId: 'variant1' },
      query: { scope: 'company' },
      user: { id: 'user1', role: 'user', activeCompany: null }
    };
    const res = createRes();
    const next = jest.fn();

    await getProductVariantController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode || error.status).toBe(400);
    expect(error.code).toBe('ACTIVE_COMPANY_REQUIRED');
    expect(variantService.getVariantById).not.toHaveBeenCalled();
  });
});
