const createError = require('http-errors');
const Company = require('../../../models/company.model');
const Product = require('../../../models/product.model');
const ProductVariant = require('../../../models/productVariant.model');
const InventoryBalance = require('../../../models/inventoryBalance.model');
const { ensureAccountingSetup } = require('../services/bootstrap.service');
const { isAdminRole } = require('../../../utils/roles');

const bootstrapAllCompanyBooksController = async (req, res, next) => {
  try {
    if (!isAdminRole(req.user?.role)) {
      throw createError(403, 'Only admin can run accounting bootstrap');
    }

    const companies = await Company.find({}).select('_id').lean();
    let balancesCreated = 0;

    for (const company of companies) {
      await ensureAccountingSetup(company._id);

      const products = await Product.find({
        company: company._id,
        deletedAt: { $exists: false }
      })
        .select('_id availableQuantity')
        .lean();

      for (const product of products) {
        const result = await InventoryBalance.findOneAndUpdate(
          {
            company: company._id,
            product: product._id,
            variant: null
          },
          {
            $setOnInsert: {
              onHandQtyBase: Number(product.availableQuantity || 0),
              onHandValue: 0,
              avgCost: 0
            }
          },
          {
            upsert: true,
            new: true
          }
        );

        if (result) balancesCreated += 1;
      }

      const variants = await ProductVariant.find({
        company: company._id,
        deletedAt: { $exists: false }
      })
        .select('_id product availableQuantity')
        .lean();

      for (const variant of variants) {
        const result = await InventoryBalance.findOneAndUpdate(
          {
            company: company._id,
            product: variant.product,
            variant: variant._id
          },
          {
            $setOnInsert: {
              onHandQtyBase: Number(variant.availableQuantity || 0),
              onHandValue: 0,
              avgCost: 0
            }
          },
          {
            upsert: true,
            new: true
          }
        );

        if (result) balancesCreated += 1;
      }
    }

    return res.json({
      success: true,
      companiesProcessed: companies.length,
      balancesCreated
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  bootstrapAllCompanyBooksController
};
