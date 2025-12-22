const mongoose = require('mongoose');

const { Schema } = mongoose;

const userFavoriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true }
  },
  { timestamps: true }
);

userFavoriteSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('UserFavorite', userFavoriteSchema);
