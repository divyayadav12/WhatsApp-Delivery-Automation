const whatsappClient = require('../whatsapp/client');
const Message = require('../models/Message');

/**
 * Get personalized message preview for customer or message
 */
async function getMessagePreview(req, res, next) {
  try {
    const { messageId, name, productName, trackingNumber, dispatchDate, courier } = req.query;

    if (messageId) {
      const msg = await Message.findById(messageId);
      if (msg) {
        const text = whatsappClient.generatePersonalizedMessageText(
          msg.customerName,
          msg.productName,
          msg.trackingNumber,
          msg.dispatchDate,
          msg.courier
        );
        const payload = whatsappClient.buildMessagePayload(
          msg.phone,
          msg.customerName,
          msg.productName,
          msg.trackingNumber,
          msg.dispatchDate,
          msg.courier
        );
        return res.json({
          success: true,
          data: {
            text,
            payload,
            customerName: msg.customerName,
            phone: msg.phone,
          },
        });
      }
    }

    // Default or query-based preview
    const sampleName = name || 'Garv Joshi';
    const sampleProduct = productName || 'CA Inter IDT Full Book Set 8.0';
    const sampleTracking = trackingNumber || 'C1144011340IN';
    const sampleDate = dispatchDate || '30-09-2026';
    const sampleCourier = courier || 'India Post';

    const text = whatsappClient.generatePersonalizedMessageText(
      sampleName,
      sampleProduct,
      sampleTracking,
      sampleDate,
      sampleCourier
    );

    const payload = whatsappClient.buildMessagePayload(
      '919876543210',
      sampleName,
      sampleProduct,
      sampleTracking,
      sampleDate,
      sampleCourier
    );

    return res.json({
      success: true,
      data: {
        text,
        payload,
        customerName: sampleName,
        phone: '919876543210',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Send a single test WhatsApp message using approved Meta template
 */
async function sendTestMessage(req, res, next) {
  try {
    const { phone, name, productName, trackingNumber, dispatchDate, courier } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Test WhatsApp phone number is required.',
      });
    }

    // Normalize phone number
    const normalizedPhone = whatsappClient.getWhatsAppConfig ? 
      require('../excel/parser').normalizePhone(phone) : phone;

    if (!require('../excel/parser').isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid test phone number format (${phone}). Please provide a valid 10 to 12 digit number.`,
      });
    }

    const testData = {
      phone: normalizedPhone,
      customerName: name || 'Test Recipient',
      productName: productName || 'CA Inter IDT Full Book Set 8.0',
      trackingNumber: trackingNumber || 'TEST123456IN',
      dispatchDate: dispatchDate || '30-09-2026',
      courier: courier || 'India Post (Test)',
    };

    console.log(`[INFO] Sending test WhatsApp message to ${normalizedPhone}`);

    const result = await whatsappClient.sendTemplateMessage(testData);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Test WhatsApp message sent successfully!',
        data: {
          messageId: result.messageId,
          recipient: normalizedPhone,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        isConfigError: result.isConfigError,
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMessagePreview,
  sendTestMessage,
};
