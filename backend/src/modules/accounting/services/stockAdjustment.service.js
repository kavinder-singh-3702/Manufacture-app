const createError = require('http-errors');
const Product = require('../../../models/product.model');
const ProductVariant = require('../../../models/productVariant.model');
const { createVoucher } = require('./voucher.service');

const createStockAdjustmentForItem = async ({
  companyId,
  userId,
  productId,
  variantId,
  adjustment,
  narration
}) => {
  const adjustmentValue = Number(adjustment || 0);
  if (!adjustmentValue) {
    return null;
  }

  const product = await Product.findOne({
    _id: productId,
    company: companyId,
    deletedAt: { $exists: false }
  }).lean();
  if (!product) {
    throw createError(404, 'Product not found');
  }

  if (variantId) {
    const variant = await ProductVariant.findOne({
      _id: variantId,
      product: productId,
      company: companyId,
      deletedAt: { $exists: false }
    }).lean();
    if (!variant) {
      throw createError(404, 'Variant not found');
    }
  }

  const voucher = await createVoucher(
    companyId,
    userId,
    {
      voucherType: 'stock_adjustment',
      status: 'posted',
      date: new Date().toISOString(),
      narration:
        narration || `Stock adjusted by ${adjustmentValue} for ${variantId ? 'variant' : 'product'} from product module`,
      lines: {
        items: [
          {
            product: productId,
            variant: variantId,
            adjustment: adjustmentValue,
            quantity: Math.abs(adjustmentValue),
            rate: 0
          }
        ]
      },
      meta: {
        source: variantId ? 'product_variant_quantity_adjust' : 'product_quantity_adjust',
        sourceType: 'product-module'
      }
    },
    { status: 'posted' }
  );

  return voucher;
};

module.exports = {
  createStockAdjustmentForItem
};

