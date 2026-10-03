const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedFile: {
      originalName: String,
      storedName: String,
      size: Number,
      path: String,
    },
    totalCustomers: {
      type: Number,
      default: 0,
    },
    validCount: {
      type: Number,
      default: 0,
    },
    invalidCount: {
      type: Number,
      default: 0,
    },
    duplicateCount: {
      type: Number,
      default: 0,
    },
    pending: {
      type: Number,
      default: 0,
    },
    sending: {
      type: Number,
      default: 0,
    },
    sent: {
      type: Number,
      default: 0,
    },
    delivered: {
      type: Number,
      default: 0,
    },
    read: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    skipped: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'READY', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', CampaignSchema);
