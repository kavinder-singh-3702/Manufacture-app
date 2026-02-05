const { connectDatabase, disconnectDatabase } = require('../../../config/database');
const config = require('../../../config/env');
const Company = require('../../../models/company.model');
const Product = require('../../../models/product.model');
const ProductVariant = require('../../../models/productVariant.model');
const InventoryBalance = require('../../../models/inventoryBalance.model');
const { ensureAccountingSetup } = require('../services/bootstrap.service');

const bootstrap = async () => {
  await connectDatabase(config.mongoUri);

  const companies = await Company.find({}).select('_id').lean();
  let balancesInitialized = 0;

  for (const company of companies) {
    await ensureAccountingSetup(company._id);

    const products = await Product.find({
      company: company._id,
      deletedAt: { $exists: false }
    })
      .select('_id availableQuantity')
      .lean();

    for (const product of products) {
      await InventoryBalance.findOneAndUpdate(
        {
          company: company._id,
          product: product._id,
          variant: null
        },
        {
          $setOnInsert: {
            company: company._id,
            product: product._id,
            variant: null,
            onHandQtyBase: Number(product.availableQuantity || 0),
            onHandValue: 0,
            avgCost: 0
          }
        },
        {
          upsert: true,
          setDefaultsOnInsert: true
        }
      );
      balancesInitialized += 1;
    }

    const variants = await ProductVariant.find({
      company: company._id,
      deletedAt: { $exists: false }
    })
      .select('_id product availableQuantity')
      .lean();

    for (const variant of variants) {
      await InventoryBalance.findOneAndUpdate(
        {
          company: company._id,
          product: variant.product,
          variant: variant._id
        },
        {
          $setOnInsert: {
            company: company._id,
            product: variant.product,
            variant: variant._id,
            onHandQtyBase: Number(variant.availableQuantity || 0),
            onHandValue: 0,
            avgCost: 0
          }
        },
        {
          upsert: true,
          setDefaultsOnInsert: true
        }
      );
      balancesInitialized += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        success: true,
        companiesProcessed: companies.length,
        balancesInitialized
      },
      null,
      2
    )
  );
};

bootstrap()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to bootstrap accounting books', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });

