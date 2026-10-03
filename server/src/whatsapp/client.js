const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Returns configured Meta WhatsApp and Teleobi environment values
 */
function getWhatsAppConfig() {
  const teleobiUrl = process.env.TELEOBI_WEBHOOK_URL || 'https://dash.teleobi.com/webhook/whatsapp-workflow/61602.183817.306288.1785566380';
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'fast_book_dispatch';
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';

  const isTeleobiEnabled = Boolean(teleobiUrl);
  const isMockMode = process.env.MOCK_MODE === 'true';

  const isConfigured = Boolean(
    isTeleobiEnabled ||
    (token && token !== 'YOUR_META_WHATSAPP_ACCESS_TOKEN' && phoneNumberId && phoneNumberId !== 'YOUR_PHONE_NUMBER_ID')
  );

  return {
    teleobiUrl,
    token,
    phoneNumberId,
    businessAccountId,
    version,
    templateName,
    templateLanguage,
    isTeleobiEnabled,
    isConfigured,
    isMockMode,
    apiUrl: `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
  };
}

/**
 * Generates local message body text preview for display in the dashboard
 */
function generatePersonalizedMessageText(name, productName, trackingNumber, dispatchDate, courier) {
  return `Hello ${name || 'Student'},

Your FAST Education book consignment has been dispatched.

📦 Tracking Details
Product: ${productName || 'N/A'}
Tracking Number: ${trackingNumber || 'N/A'}
Dispatch Date: ${dispatchDate || 'N/A'}
Courier: ${courier || 'N/A'}

You can track your package using the Dak Seva App.

Please note: The books are picked up by the courier partner today. Tracking status may take 1–2 days to update.

For assistance:
9584510000
9522564050

Regards,
FAST Education
Delivery Team`;
}

/**
 * Builds Meta WhatsApp Cloud API request payload
 */
function buildMessagePayload(phone, name, productName, trackingNumber, dispatchDate, courier) {
  const config = getWhatsAppConfig();
  
  if (config.templateName === 'hello_world') {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US',
        },
      },
    };
  }

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'template',
    template: {
      name: config.templateName,
      language: {
        code: config.templateLanguage,
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(name || '').trim() },
            { type: 'text', text: String(productName || '').trim() },
            { type: 'text', text: String(trackingNumber || '').trim() },
            { type: 'text', text: String(dispatchDate || '').trim() },
            { type: 'text', text: String(courier || '').trim() },
          ],
        },
      ],
    },
  };
}

/**
 * Sends a single WhatsApp message via Teleobi Webhook or Meta Cloud API
 */
async function sendTemplateMessage({ phone, customerName, productName, trackingNumber, dispatchDate, courier }) {
  const config = getWhatsAppConfig();

  // If Mock Mode is enabled in .env
  if (config.isMockMode) {
    const mockMessageId = `wamid.HBgL${Math.random().toString(36).substring(2, 12).toUpperCase()}==`;
    return {
      success: true,
      messageId: mockMessageId,
      isMock: true,
    };
  }

  // Priority 1: Teleobi Webhook URL provided by Sir
  if (config.teleobiUrl) {
    try {
      const cleanPhone = String(phone).trim();
      const cleanName = String(customerName || '').trim();
      const cleanProduct = String(productName || '').trim();
      const cleanTracking = String(trackingNumber || '').trim();
      const cleanDate = String(dispatchDate || '').trim();
      const cleanCourier = String(courier || '').trim();

      // Exhaustive payload covering all standard Teleobi workflow variable keys
      const payload = {
        phone: cleanPhone,
        to: cleanPhone,
        mobile: cleanPhone,
        name: cleanName,
        customerName: cleanName,
        customer_name: cleanName,
        product_name: cleanProduct,
        productName: cleanProduct,
        tracking_number: cleanTracking,
        trackingNumber: cleanTracking,
        dispatch_date: cleanDate,
        dispatchDate: cleanDate,
        courier: cleanCourier,
        var1: cleanName,
        var2: cleanProduct,
        var3: cleanTracking,
        var4: cleanDate,
        var5: cleanCourier,
        param1: cleanName,
        param2: cleanProduct,
        param3: cleanTracking,
        param4: cleanDate,
        param5: cleanCourier,
      };

      const response = await axios.post(config.teleobiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        httpsAgent,
        timeout: 15000,
      });

      const data = response.data;
      const teleobiId = data?.message_id || data?.id || data?.msgId || `teleobi_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      return {
        success: true,
        messageId: teleobiId,
        provider: 'teleobi',
        rawResponse: data,
      };
    } catch (err) {
      let errorMsg = 'Teleobi Webhook Dispatch Error';
      if (err.response) {
        errorMsg = `Teleobi HTTP ${err.response.status}: ${JSON.stringify(err.response.data || err.message)}`;
      } else if (err.message) {
        errorMsg = err.message;
      }

      console.error(`[ERROR] Teleobi send error for ${phone}:`, errorMsg);

      if (!config.isConfigured) {
        return {
          success: false,
          error: `Teleobi Dispatch Error: ${errorMsg}`,
        };
      }
    }
  }

  // Priority 2: Standard Meta Cloud API
  if (!config.isConfigured) {
    return {
      success: false,
      error: 'WhatsApp credentials or Teleobi webhook are not configured in environment variables.',
      isConfigError: true,
    };
  }

  const payload = buildMessagePayload(phone, customerName, productName, trackingNumber, dispatchDate, courier);

  try {
    const response = await axios.post(config.apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      httpsAgent,
      timeout: 15000,
    });

    const data = response.data;
    if (data && data.messages && data.messages.length > 0) {
      return {
        success: true,
        messageId: data.messages[0].id,
        rawResponse: data,
      };
    }

    return {
      success: false,
      error: 'Meta API returned an empty message response.',
      rawResponse: data,
    };
  } catch (err) {
    let errorMessage = 'Failed to connect to Meta WhatsApp API.';

    if (err.response) {
      const status = err.response.status;
      const metaError = err.response.data && err.response.data.error;

      if (metaError) {
        const code = metaError.code;
        const msg = metaError.message;
        const details = metaError.error_user_title || metaError.error_user_msg || msg;

        if (code === 190) {
          errorMessage = 'WhatsApp Access Token has expired or is invalid. Please update WHATSAPP_ACCESS_TOKEN in settings.';
        } else if (code === 100) {
          errorMessage = `Invalid request payload or template parameter: ${details}`;
        } else if (code === 132001) {
          errorMessage = `Template '${config.templateName}' (${config.templateLanguage}) was not found or is not approved in Meta WhatsApp Manager.`;
        } else if (code === 131030) {
          errorMessage = 'Recipient phone number is not registered on WhatsApp or cannot receive messages.';
        } else if (code === 131026) {
          errorMessage = 'Message undeliverable to recipient phone number.';
        } else {
          errorMessage = `Meta API Error (${code || status}): ${details}`;
        }
      } else {
        errorMessage = `Meta HTTP Error ${status}: ${err.message}`;
      }
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'Meta WhatsApp API request timed out after 15 seconds.';
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      success: false,
      error: errorMessage,
      rawError: err.response ? err.response.data : null,
    };
  }
}

module.exports = {
  getWhatsAppConfig,
  generatePersonalizedMessageText,
  buildMessagePayload,
  sendTemplateMessage,
};
