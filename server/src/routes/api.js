const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const excelController = require('../controllers/excelController');
const campaignController = require('../controllers/campaignController');
const whatsappController = require('../controllers/whatsappController');
const webhookController = require('../controllers/webhookController');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `excel-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx, .xls, and .csv files are supported.'));
    }
  },
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'FAST Education WhatsApp Delivery Automation API',
    timestamp: new Date().toISOString(),
  });
});

// Excel Endpoints
router.post('/excel/upload', upload.single('file'), excelController.uploadAndValidateExcel);
router.get('/excel/template', excelController.downloadSampleTemplate);
router.get('/customers', excelController.getCustomers);

// WhatsApp Message Endpoints
router.get('/messages/preview', whatsappController.getMessagePreview);
router.post('/whatsapp/test', whatsappController.sendTestMessage);

// Campaign Endpoints
router.get('/campaigns', campaignController.getCampaigns);
router.get('/campaigns/:id', campaignController.getCampaignById);
router.get('/campaigns/:id/messages', campaignController.getCampaignMessages);
router.post('/campaigns/:id/start', campaignController.startCampaign);
router.post('/campaigns/:id/cancel', campaignController.cancelCampaign);
router.get('/campaigns/:id/report', campaignController.getCampaignReport);
router.get('/campaigns/:id/report/download', campaignController.downloadCampaignReport);

// Webhook Endpoints
router.get('/webhooks/whatsapp', webhookController.verifyWebhook);
router.post('/webhooks/whatsapp', webhookController.handleWebhookEvent);

// Settings Endpoints
router.get('/settings/status', settingsController.getSettingsStatus);
router.get('/settings/test-connection', settingsController.testConnection);

module.exports = router;
