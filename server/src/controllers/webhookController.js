const Message = require('../models/Message');

/**
 * GET Webhook Verification for Meta WhatsApp Cloud API
 */
function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'fast_education_verify_token_12345';

  if (mode && token) {
    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[INFO] Meta Webhook verified successfully.');
      return res.status(200).send(challenge);
    } else {
      console.warn('[WARN] Meta Webhook verification failed. Token mismatch.');
      return res.sendStatus(403);
    }
  }

  return res.sendStatus(400);
}

/**
 * POST Webhook event handler for Meta WhatsApp Cloud API updates
 */
async function handleWebhookEvent(req, res) {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;
          if (!value) continue;

          const statuses = value.statuses || [];
          for (const statusObj of statuses) {
            const messageId = statusObj.id;
            const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
            const timestamp = statusObj.timestamp ? new Date(parseInt(statusObj.timestamp, 10) * 1000) : new Date();

            console.log(`[WEBHOOK] Status update for message ${messageId}: ${status}`);

            const msg = await Message.findOne({ messageId });
            if (msg) {
              if (status === 'delivered') {
                msg.status = 'DELIVERED';
                msg.deliveredAt = timestamp;
              } else if (status === 'read') {
                msg.status = 'READ';
                msg.readAt = timestamp;
              } else if (status === 'sent' && msg.status !== 'DELIVERED' && msg.status !== 'READ') {
                msg.status = 'SENT';
                msg.sentAt = timestamp;
              } else if (status === 'failed') {
                msg.status = 'FAILED';
                const errorDetail = statusObj.errors && statusObj.errors[0] ? statusObj.errors[0].title || statusObj.errors[0].message : 'Delivery failed';
                msg.error = `Meta Webhook Failure: ${errorDetail}`;
              }

              await msg.save();

              // Emit Socket.io event for real-time status update in UI
              const io = req.app.get('io');
              if (io) {
                io.emit('message:status_update', {
                  messageId: msg._id,
                  waMessageId: messageId,
                  campaignId: msg.campaignId,
                  status: msg.status,
                  sentAt: msg.sentAt,
                  deliveredAt: msg.deliveredAt,
                  readAt: msg.readAt,
                  error: msg.error,
                });
              }
            }
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.sendStatus(404);
  } catch (err) {
    console.error('[ERROR] Webhook processing error:', err.message);
    return res.status(500).send('Webhook processing error');
  }
}

module.exports = {
  verifyWebhook,
  handleWebhookEvent,
};
