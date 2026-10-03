const Campaign = require('../models/Campaign');
const Message = require('../models/Message');
const whatsappClient = require('../whatsapp/client');

// Active running campaign cancellation flags map
const activeCampaignsCancellationMap = new Map();

/**
 * Delay helper
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Cancels a running campaign
 */
function requestCampaignCancellation(campaignId) {
  activeCampaignsCancellationMap.set(String(campaignId), true);
}

/**
 * Checks if a campaign has been cancelled
 */
function isCampaignCancelled(campaignId) {
  return Boolean(activeCampaignsCancellationMap.get(String(campaignId)));
}

/**
 * Processes a campaign queue with controlled concurrency and delay
 */
async function processCampaignQueue(campaignId, io = null) {
  const cId = String(campaignId);
  activeCampaignsCancellationMap.set(cId, false);

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new Error(`Campaign with ID ${campaignId} not found.`);
  }

  // Guard: Protect against duplicate campaign execution
  if (campaign.status === 'SENDING' || campaign.status === 'COMPLETED') {
    throw new Error(`Campaign ${campaignId} is already in state ${campaign.status}.`);
  }

  campaign.status = 'SENDING';
  campaign.startedAt = campaign.startedAt || new Date();
  await campaign.save();

  // Fetch pending valid messages for campaign
  const pendingMessages = await Message.find({
    campaignId: campaign._id,
    status: { $in: ['PENDING', 'FAILED'] },
    isValid: true,
  }).sort({ createdAt: 1 });

  const delayMs = parseInt(process.env.MESSAGE_DELAY_MS || '1000', 10);
  const concurrency = parseInt(process.env.MESSAGE_CONCURRENCY || '1', 10);

  let processedCount = 0;
  const totalToProcess = pendingMessages.length;

  console.log(`[INFO] Starting Campaign ${campaign.name} (${cId}) processing. Total messages: ${totalToProcess}`);

  for (let i = 0; i < pendingMessages.length; i += concurrency) {
    // Check if cancellation was requested
    if (isCampaignCancelled(cId)) {
      console.log(`[INFO] Campaign ${cId} cancelled by user.`);

      // Mark remaining pending messages as SKIPPED
      const remainingMessages = pendingMessages.slice(i);
      const remainingIds = remainingMessages.map(m => m._id);
      
      await Message.updateMany(
        { _id: { $in: remainingIds } },
        { status: 'SKIPPED', error: 'Campaign cancelled by user' }
      );

      const skippedCount = remainingIds.length;
      campaign.skipped = (campaign.skipped || 0) + skippedCount;
      campaign.pending = Math.max(0, (campaign.pending || 0) - skippedCount);
      campaign.status = 'CANCELLED';
      campaign.completedAt = new Date();
      await campaign.save();

      if (io) {
        io.emit('campaign:cancelled', {
          campaignId: cId,
          campaign,
          message: 'Campaign has been cancelled successfully.',
        });
      }
      activeCampaignsCancellationMap.delete(cId);
      return campaign;
    }

    const batch = pendingMessages.slice(i, i + concurrency);

    await Promise.all(
      batch.map(async (msg) => {
        // Double check atomic status before sending (DUPLICATE PROTECTION)
        const currentMsg = await Message.findById(msg._id);
        if (!currentMsg || currentMsg.status === 'SENT') {
          console.log(`[INFO] Skipping message ${msg._id} for ${msg.phone} (Already SENT)`);
          return;
        }

        currentMsg.status = 'SENDING';
        await currentMsg.save();

        const result = await whatsappClient.sendTemplateMessage({
          phone: currentMsg.phone,
          customerName: currentMsg.customerName,
          productName: currentMsg.productName,
          trackingNumber: currentMsg.trackingNumber,
          dispatchDate: currentMsg.dispatchDate,
          courier: currentMsg.courier,
        });

        if (result.success) {
          currentMsg.status = 'SENT';
          currentMsg.messageId = result.messageId;
          currentMsg.sentAt = new Date();
          currentMsg.error = null;
          await currentMsg.save();

          console.log(`[INFO] Message sent to ${currentMsg.phone}: ${result.messageId}`);
        } else {
          currentMsg.status = 'FAILED';
          currentMsg.error = result.error;
          await currentMsg.save();

          console.log(`[ERROR] Failed to send to ${currentMsg.phone}: ${result.error}`);
        }
      })
    );

    // Recalculate counts dynamically from DB
    const sentCount = await Message.countDocuments({ campaignId: campaign._id, status: 'SENT' });
    const failedCount = await Message.countDocuments({ campaignId: campaign._id, status: 'FAILED' });
    const pendingCount = await Message.countDocuments({ campaignId: campaign._id, status: 'PENDING' });
    const skippedCount = await Message.countDocuments({ campaignId: campaign._id, status: 'SKIPPED' });
    const sendingCount = await Message.countDocuments({ campaignId: campaign._id, status: 'SENDING' });

    campaign.sent = sentCount;
    campaign.failed = failedCount;
    campaign.pending = pendingCount;
    campaign.skipped = skippedCount;
    campaign.sending = sendingCount;
    await campaign.save();

    processedCount += batch.length;

    // Emit live progress via Socket.io
    if (io) {
      io.emit('campaign:progress', {
        campaignId: cId,
        totalCustomers: campaign.totalCustomers,
        processedCount,
        sent: sentCount,
        failed: failedCount,
        pending: pendingCount,
        skipped: skippedCount,
        progressPercent: Math.round((processedCount / totalToProcess) * 100),
        status: campaign.status,
      });
    }

    // Rate limiting pacing delay
    if (i + concurrency < pendingMessages.length) {
      await sleep(delayMs);
    }
  }

  // Finalize campaign
  const finalSent = await Message.countDocuments({ campaignId: campaign._id, status: 'SENT' });
  const finalFailed = await Message.countDocuments({ campaignId: campaign._id, status: 'FAILED' });
  const finalPending = await Message.countDocuments({ campaignId: campaign._id, status: 'PENDING' });

  campaign.sent = finalSent;
  campaign.failed = finalFailed;
  campaign.pending = finalPending;
  campaign.sending = 0;
  campaign.status = 'COMPLETED';
  campaign.completedAt = new Date();
  await campaign.save();

  activeCampaignsCancellationMap.delete(cId);

  if (io) {
    io.emit('campaign:completed', {
      campaignId: cId,
      campaign,
    });
  }

  console.log(`[INFO] Campaign ${cId} completed successfully. Sent: ${finalSent}, Failed: ${finalFailed}`);
  return campaign;
}

module.exports = {
  processCampaignQueue,
  requestCampaignCancellation,
  isCampaignCancelled,
};
