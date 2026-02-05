const createError = require('http-errors');
const mongoose = require('mongoose');
const InventoryBalance = require('../../../models/inventoryBalance.model');
const Product = require('../../../models/product.model');
const ProductVariant = require('../../../models/productVariant.model');
const { roundMoney, roundQuantity, toObjectId, ensureArray } = require('./helpers');

const normalizeVariantId = (value) => {
  const objectId = toObjectId(value);
  return objectId || null;
};

const normalizeMove = (move) => ({
  ...move,
  product: toObjectId(move.product),
  variant: normalizeVariantId(move.variant),
  quantityBase: roundQuantity(move.quantityBase),
  rate: roundMoney(move.rate),
  value: roundMoney(move.value),
  costRate: roundMoney(move.costRate),
  costValue: roundMoney(move.costValue)
});

const buildBalanceQuery = (companyId, move) => ({
  company: toObjectId(companyId),
  product: toObjectId(move.product),
  variant: normalizeVariantId(move.variant)
});

const getOrCreateBalance = async (companyId, move, session) => {
  const query = buildBalanceQuery(companyId, move);
  let balance = await InventoryBalance.findOne(query).session(session);
  if (!balance) {
    balance = new InventoryBalance({
      ...query,
      onHandQtyBase: 0,
      onHandValue: 0,
      avgCost: 0
    });
  }
  return balance;
};

const applySnapshots = async ({ companyId, touchedProducts, touchedVariants, session }) => {
  const companyObjectId = toObjectId(companyId);

  if (touchedVariants.size) {
    const variantIds = [...touchedVariants].map((variantId) => toObjectId(variantId)).filter(Boolean);
    const balances = await InventoryBalance.find({
      company: companyObjectId,
      variant: { $in: variantIds }
    })
      .select('variant onHandQtyBase')
      .session(session)
      .lean();

    const qtyByVariantId = balances.reduce((acc, item) => {
      if (!item.variant) return acc;
      acc[item.variant.toString()] = roundQuantity(item.onHandQtyBase);
      return acc;
    }, {});

    for (const variantId of variantIds) {
      const variantDoc = await ProductVariant.findById(variantId).session(session);
      if (!variantDoc) continue;
      variantDoc.availableQuantity = Math.max(0, Number(qtyByVariantId[variantId.toString()] || 0));
      await variantDoc.save({ session });
    }
  }

  if (touchedProducts.size) {
    const productIds = [...touchedProducts].map((productId) => toObjectId(productId)).filter(Boolean);
    const grouped = await InventoryBalance.aggregate([
      {
        $match: {
          company: companyObjectId,
          product: { $in: productIds }
        }
      },
      {
        $group: {
          _id: '$product',
          qty: { $sum: '$onHandQtyBase' }
        }
      }
    ]).session(session);

    const qtyByProductId = grouped.reduce((acc, item) => {
      if (!item._id) return acc;
      acc[item._id.toString()] = roundQuantity(item.qty);
      return acc;
    }, {});

    for (const productId of productIds) {
      const productDoc = await Product.findById(productId).session(session);
      if (!productDoc) continue;
      productDoc.availableQuantity = Math.max(0, Number(qtyByProductId[productId.toString()] || 0));
      await productDoc.save({ session });
    }
  }
};

const applyStockMoves = async (companyId, moves, { preventNegativeStock = true, session } = {}) => {
  const safeMoves = ensureArray(moves).map(normalizeMove).filter((move) => move.product && move.quantityBase > 0);
  const processedMoves = [];
  const touchedProducts = new Set();
  const touchedVariants = new Set();

  for (const move of safeMoves) {
    const balance = await getOrCreateBalance(companyId, move, session);

    const previousQty = roundQuantity(balance.onHandQtyBase);
    const previousValue = roundMoney(balance.onHandValue);
    const quantity = roundQuantity(move.quantityBase);

    if (move.direction === 'in') {
      const stockInValue = roundMoney(move.value > 0 ? move.value : quantity * move.rate);
      balance.onHandQtyBase = roundQuantity(previousQty + quantity);
      balance.onHandValue = roundMoney(previousValue + stockInValue);
      balance.avgCost = balance.onHandQtyBase > 0 ? roundMoney(balance.onHandValue / balance.onHandQtyBase) : 0;

      move.value = stockInValue;
      move.costRate = 0;
      move.costValue = 0;
    } else {
      if (preventNegativeStock && previousQty < quantity) {
        throw createError(409, 'Insufficient stock for one or more items');
      }

      const costRate = previousQty > 0 ? roundMoney(previousValue / previousQty) : roundMoney(balance.avgCost);
      const costValue = roundMoney(costRate * quantity);
      const nextQty = roundQuantity(previousQty - quantity);
      const nextValue = roundMoney(previousValue - costValue);

      balance.onHandQtyBase = Math.max(0, nextQty);
      balance.onHandValue = Math.max(0, nextValue);
      balance.avgCost = balance.onHandQtyBase > 0 ? roundMoney(balance.onHandValue / balance.onHandQtyBase) : 0;

      move.costRate = costRate;
      move.costValue = costValue;
      move.value = 0;
    }

    await balance.save({ session });

    touchedProducts.add(move.product.toString());
    if (move.variant) {
      touchedVariants.add(move.variant.toString());
    }

    processedMoves.push({
      ...move,
      product: move.product,
      variant: move.variant
    });
  }

  await applySnapshots({
    companyId,
    touchedProducts,
    touchedVariants,
    session
  });

  return processedMoves;
};

const reverseStockMoves = async (companyId, moves, { session } = {}) => {
  const safeMoves = ensureArray(moves).filter((move) => !move.isVoided).map(normalizeMove);
  const touchedProducts = new Set();
  const touchedVariants = new Set();

  for (const move of safeMoves) {
    const balance = await getOrCreateBalance(companyId, move, session);

    const previousQty = roundQuantity(balance.onHandQtyBase);
    const previousValue = roundMoney(balance.onHandValue);
    const quantity = roundQuantity(move.quantityBase);

    if (move.direction === 'in') {
      // Reverse stock-in by reducing quantity and entered value.
      const stockInValue = roundMoney(move.value);
      balance.onHandQtyBase = Math.max(0, roundQuantity(previousQty - quantity));
      balance.onHandValue = Math.max(0, roundMoney(previousValue - stockInValue));
      balance.avgCost = balance.onHandQtyBase > 0 ? roundMoney(balance.onHandValue / balance.onHandQtyBase) : 0;
    } else {
      // Reverse stock-out by adding quantity with historical cost value.
      const stockOutCost = roundMoney(move.costValue);
      balance.onHandQtyBase = roundQuantity(previousQty + quantity);
      balance.onHandValue = roundMoney(previousValue + stockOutCost);
      balance.avgCost = balance.onHandQtyBase > 0 ? roundMoney(balance.onHandValue / balance.onHandQtyBase) : 0;
    }

    await balance.save({ session });

    touchedProducts.add(move.product.toString());
    if (move.variant) {
      touchedVariants.add(move.variant.toString());
    }
  }

  await applySnapshots({
    companyId,
    touchedProducts,
    touchedVariants,
    session
  });
};

module.exports = {
  applyStockMoves,
  reverseStockMoves
};

