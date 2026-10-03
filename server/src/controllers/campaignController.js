const Campaign = require('../models/Campaign');
const Message = require('../models/Message');
const { processCampaignQueue, requestCampaignCancellation } = require('../services/queue');
const { generateReportExcel } = require('../excel/exporter');

/**
 * Get list of all campaigns
 */
async function getCampaigns(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};
    if (search) {
      query.name = new RegExp(search.trim(), 'i');
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Campaign.countDocuments(query);
    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.json({
      success: true,
      data: campaigns,
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
 * Get single campaign by ID
 */
async function getCampaignById(req, res, next) {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found.',
      });
    }

    // Refresh live counts from database
    const sent = await Message.countDocuments({ campaignId: id, status: 'SENT' });
    const delivered = await Message.countDocuments({ campaignId: id, status: 'DELIVERED' });
    const read = await Message.countDocuments({ campaignId: id, status: 'READ' });
    const failed = await Message.countDocuments({ campaignId: id, status: 'FAILED' });
    const pending = await Message.countDocuments({ campaignId: id, status: 'PENDING' });
    const skipped = await Message.countDocuments({ campaignId: id, status: 'SKIPPED' });

    campaign.sent = sent;
    campaign.delivered = delivered;
    campaign.read = read;
    campaign.failed = failed;
    campaign.pending = pending;
    campaign.skipped = skipped;

    return res.json({
      success: true,
      data: campaign,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get messages for campaign
 */
async function getCampaignMessages(req, res, next) {
  try {
    const { id } = req.params;
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = { campaignId: id };

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
      .sort({ createdAt: 1 })
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
 * Start sending campaign messages
 */
async function startCampaign(req, res, next) {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found.',
      });
    }

    if (campaign.status === 'SENDING') {
      return res.status(400).json({
        success: false,
        error: 'Campaign is already actively sending messages.',
      });
    }

    if (campaign.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Campaign has already completed.',
      });
    }

    const io = req.app.get('io');

    // Trigger async processing in background queue
    processCampaignQueue(campaign._id, io).catch((err) => {
      console.error(`[ERROR] Background campaign queue error: ${err.message}`);
    });

    return res.json({
      success: true,
      message: 'Campaign sending process started successfully.',
      data: {
        campaignId: campaign._id,
        status: 'SENDING',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel campaign sending process
 */
async function cancelCampaign(req, res, next) {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found.',
      });
    }

    requestCampaignCancellation(id);

    return res.json({
      success: true,
      message: 'Campaign cancellation requested. Remaining queued messages will be skipped.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get detailed campaign report statistics
 */
async function getCampaignReport(req, res, next) {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found.',
      });
    }

    const total = await Message.countDocuments({ campaignId: id });
    const sent = await Message.countDocuments({ campaignId: id, status: 'SENT' });
    const delivered = await Message.countDocuments({ campaignId: id, status: 'DELIVERED' });
    const read = await Message.countDocuments({ campaignId: id, status: 'READ' });
    const failed = await Message.countDocuments({ campaignId: id, status: 'FAILED' });
    const skipped = await Message.countDocuments({ campaignId: id, status: 'SKIPPED' });
    const pending = await Message.countDocuments({ campaignId: id, status: 'PENDING' });

    return res.json({
      success: true,
      data: {
        campaign,
        summary: {
          total,
          sent,
          delivered,
          read,
          failed,
          skipped,
          pending,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Download Excel / CSV report for campaign
 */
async function downloadCampaignReport(req, res, next) {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found.',
      });
    }

    const messages = await Message.find({ campaignId: id }).sort({ createdAt: 1 });
    const excelBuffer = generateReportExcel(messages, campaign.name);

    const safeFilename = campaign.name.replace(/[^a-zA-Z0-9_\-]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="FAST_Delivery_Report_${safeFilename}.xlsx"`);
    return res.send(excelBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCampaigns,
  getCampaignById,
  getCampaignMessages,
  startCampaign,
  cancelCampaign,
  getCampaignReport,
  downloadCampaignReport,
};
