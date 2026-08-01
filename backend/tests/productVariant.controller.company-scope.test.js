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

  // Regression coverage: a missing scope must resolve owner-or-public (the
  // viewer's own company plus anyone's published products), not default to
  // the viewer's own company — that default is what 404'd the variant panel
  // on any product the viewer didn't own.
  test('list with no scope resolves owner-or-public, not the viewer\'s own company', async () => {
    variantService.listVariants.mockResolvedValue({ variants: [], pagination: { total: 0, hasMore: false } });

    const req = {
      params: { productId: 'product1' },
      query: {},
      user: { id: 'user1', role: 'user', activeCompany: 'viewerCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await listProductVariantsController(req, res, next);

    expect(variantService.listVariants).toHaveBeenCalledWith('product1', {
      viewerCompanyId: 'viewerCo',
      ownerOnly: false,
      limit: undefined,
      offset: undefined,
      status: undefined
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('get with scope=company restricts strictly to the viewer\'s own company', async () => {
    variantService.getVariantById.mockResolvedValue({ _id: 'variant1' });

    const req = {
      params: { productId: 'product1', variantId: 'variant1' },
      query: { scope: 'company' },
      user: { id: 'user1', role: 'user', activeCompany: 'viewerCo' }
    };
    const res = createRes();
    const next = jest.fn();

    await getProductVariantController(req, res, next);

    expect(variantService.getVariantById).toHaveBeenCalledWith('product1', 'variant1', {
      viewerCompanyId: 'viewerCo',
      ownerOnly: true
    });
    expect(next).not.toHaveBeenCalled();
  });
});
