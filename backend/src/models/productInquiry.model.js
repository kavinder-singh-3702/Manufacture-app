const mongoose = require('mongoose');
const { PRODUCT_INQUIRY_STATUSES } = require('../constants/productInquiry');
const { DEFAULT_CURRENCY } = require('../constants/product');

const { Schema } = mongoose;

const BuyerSnapshotSchema = new Schema(
  {
    name:  { type: String, trim: true, maxlength: 120 },
    email: { type: String, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 50  }
  },
  { _id: false }
);

const ProductSnapshotSchema = new Schema(
  {
    name:     { type: String, trim: true, maxlength: 200 },
    amount:   { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, default: DEFAULT_CURRENCY }
  },
  { _id: false }
);

const productInquirySchema = new Schema(
  {
    product:         { type: Schema.Types.ObjectId, ref: 'Product',        required: true, index: true },
    variant:         { type: Schema.Types.ObjectId, ref: 'ProductVariant'                              },
    buyer:           { type: Schema.Types.ObjectId, ref: 'User',           required: true, index: true },
    buyerSnapshot:   { type: BuyerSnapshotSchema  },
    productSnapshot: { type: ProductSnapshotSchema },
    quantity:        { type: Number, min: 1        },
    location:        { type: String, trim: true, maxlength: 500  },
    message:         { type: String, trim: true, maxlength: 2000 },
    status:          { type: String, enum: PRODUCT_INQUIRY_STATUSES, default: 'pending', index: true },
    adminNotes:      { type: String, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

productInquirySchema.index({ buyer: 1, status: 1, createdAt: -1 });
productInquirySchema.index({ product: 1, createdAt: -1 });
productInquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ProductInquiry', productInquirySchema);
