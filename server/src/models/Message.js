const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    dispatchDate: {
      type: String,
      required: true,
      trim: true,
    },
    courier: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED'],
      default: 'PENDING',
      index: true,
    },
    messageId: {
      type: String,
      index: true,
      sparse: true,
    },
    error: {
      type: String,
      default: null,
    },
    validationError: {
      type: String,
      default: null,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
  },
  { timestamps: true }
);

// Prevent duplicate campaign-phone pairs if status is SENT
MessageSchema.index({ campaignId: 1, phone: 1 });

module.exports = mongoose.model('Message', MessageSchema);
