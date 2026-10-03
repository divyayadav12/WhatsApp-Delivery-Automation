const axios = require('axios');
const https = require('https');
const { getWhatsAppConfig } = require('../whatsapp/client');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Get system & WhatsApp configuration status (without exposing secrets)
 */
async function getSettingsStatus(req, res) {
  const config = getWhatsAppConfig();

  const tokenMasked = config.token && config.token !== 'YOUR_META_WHATSAPP_ACCESS_TOKEN'
    ? `${config.token.substring(0, 6)}...${config.token.substring(config.token.length - 4)}`
    : 'Not Configured';

  return res.json({
    success: true,
    data: {
      whatsapp: {
        isConfigured: config.isConfigured,
        phoneNumberId: config.phoneNumberId || 'Missing',
        businessAccountId: config.businessAccountId || 'Missing',
        apiVersion: config.version,
        templateName: config.templateName,
        templateLanguage: config.templateLanguage,
        tokenMasked,
      },
      queue: {
        concurrency: parseInt(process.env.MESSAGE_CONCURRENCY || '1', 10),
        delayMs: parseInt(process.env.MESSAGE_DELAY_MS || '1000', 10),
      },
      webhook: {
        verifyTokenConfigured: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
      },
    },
  });
}

/**
 * Test WhatsApp Meta Cloud API Connection
 */
async function testConnection(req, res) {
  const config = getWhatsAppConfig();

  if (!config.isConfigured) {
    return res.status(400).json({
      success: false,
      connected: false,
      error: 'WhatsApp credentials are incomplete. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables.',
    });
  }

  try {
    // Query Phone Number endpoint on Meta Graph API
    const response = await axios.get(
      `https://graph.facebook.com/${config.version}/${config.phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
        httpsAgent,
        timeout: 10000,
      }
    );

    return res.json({
      success: true,
      connected: true,
      message: 'Successfully connected to Meta WhatsApp Business Cloud API!',
      data: {
        verifiedName: response.data.verified_name || response.data.display_phone_number || 'Meta Verified Account',
        displayPhoneNumber: response.data.display_phone_number || 'Configured',
        qualityRating: response.data.quality_rating || 'UNKNOWN',
      },
    });
  } catch (err) {
    let errorMsg = 'Failed to connect to Meta API.';
    if (err.response) {
      const metaError = err.response.data && err.response.data.error;
      errorMsg = metaError ? metaError.message : `HTTP ${err.response.status}: Connection failed`;
    } else if (err.message) {
      errorMsg = err.message;
    }

    return res.status(400).json({
      success: false,
      connected: false,
      error: errorMsg,
    });
  }
}

module.exports = {
  getSettingsStatus,
  testConnection,
};
