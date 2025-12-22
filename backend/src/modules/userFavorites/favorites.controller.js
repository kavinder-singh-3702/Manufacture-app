const createError = require('http-errors');
const UserFavorite = require('../../models/userFavorite.model');
const Product = require('../../models/product.model');

const listFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const favorites = await UserFavorite.find({ user: userId }).select('product').lean();
    const productIds = favorites.map((f) => f.product?.toString()).filter(Boolean);
    return res.json({ favorites: productIds });
  } catch (error) {
    return next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const exists = await Product.exists({ _id: productId, deletedAt: { $exists: false } });
    if (!exists) {
      throw createError(404, 'Product not found');
    }

    await UserFavorite.findOneAndUpdate(
      { user: userId, product: productId },
      { user: userId, product: productId },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    await UserFavorite.findOneAndDelete({ user: userId, product: productId });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite
};
