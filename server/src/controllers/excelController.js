const path = require('path');
const fs = require('fs');
const { parseAndValidateExcel } = require('../excel/parser');
const { generateSampleTemplateExcel } = require('../excel/exporter');
const Campaign = require('../models/Campaign');
const Message = require('../models/Message');
const whatsappClient = require('../whatsapp/client');

/**
 * Handle Excel/CSV upload, parse, validate, and create Campaign & Messages
 */
async function uploadAndValidateExcel(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a valid .xlsx, .xls, or .csv file.',
      });
    }

    const file = req.file;
    const campaignName = req.body.campaignName || `Campaign ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`;

    let parsedResult;
    try {
      parsedResult = parseAndValidateExcel(file.path);
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        error: `Excel Parsing Error: ${parseErr.message}`,
      });
    }

    const { totalRows, validCount, invalidCount, duplicateCount, detectedColumns, rows } = parsedResult;

    // Create Campaign record in MongoDB
    const campaign = new Campaign({
      name: campaignName,
      uploadedFile: {
        originalName: file.originalname,
        storedName: file.filename,
        size: file.size,
        path: file.path,
      },
      totalCustomers: totalRows,
      validCount,
      invalidCount,
      duplicateCount,
      pending: validCount,
      status: 'DRAFT',
    });

    await campaign.save();

    // Create Message records for all rows
    const messagesToInsert = rows.map((r) => ({
      campaignId: campaign._id,
      customerName: r.name || 'N/A',
      phone: r.phone || r.rawPhone || 'N/A',
      productName: r.productName || 'N/A',
      trackingNumber: r.trackingNumber || 'N/A',
      dispatchDate: r.dispatchDate || 'N/A',
      courier: r.courier || 'N/A',
      status: r.isValid ? 'PENDING' : 'SKIPPED',
      isValid: r.isValid,
      validationError: r.validationError,
      error: r.isValid ? null : r.validationError,
    }));

    await Message.insertMany(messagesToInsert);

    return res.status(201).json({
      success: true,
      message: 'Excel file uploaded and validated successfully.',
      data: {
        campaignId: campaign._id,
        campaignName: campaign.name,
        totalRows,
        validCount,
        invalidCount,
        duplicateCount,
        detectedColumns,
        summary: {
          VALID: validCount,
          INVALID: invalidCount,
          DUPLICATE: duplicateCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get customers/messages list with search, filter, pagination
 */
async function getCustomers(req, res, next) {
  try {
    const { campaignId, search, status, page = 1, limit = 50 } = req.query;

    const query = {};

    if (campaignId) {
      query.campaignId = campaignId;
    }

    if (status && status !== 'ALL') {
      if (status === 'INVALID') {
        query.isValid = false;
      } else {
        query.status = status;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { phone: searchRegex },
        { trackingNumber: searchRegex },
        { productName: searchRegex },
        { courier: searchRegex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Message.countDocuments(query);
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Generate sample Excel template download
 */
function downloadSampleTemplate(req, res) {
  try {
    const buffer = generateSampleTemplateExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="FAST_Book_Dispatch_Sample_Template.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  uploadAndValidateExcel,
  getCustomers,
  downloadSampleTemplate,
};
