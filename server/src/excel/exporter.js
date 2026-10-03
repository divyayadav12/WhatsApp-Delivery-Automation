const xlsx = require('xlsx');

/**
 * Generates an Excel workbook buffer from messages list
 */
function generateReportExcel(messages, campaignName = 'Campaign Report') {
  const exportData = messages.map((m, index) => ({
    'S.No': index + 1,
    'Customer Name': m.customerName,
    'Phone': m.phone,
    'Product Name': m.productName,
    'Tracking Number': m.trackingNumber,
    'Dispatch Date': m.dispatchDate,
    'Courier': m.courier,
    'Status': m.status,
    'WhatsApp Message ID': m.messageId || 'N/A',
    'Error / Remarks': m.error || m.validationError || 'N/A',
    'Sent At': m.sentAt ? new Date(m.sentAt).toLocaleString() : 'N/A',
    'Delivered At': m.deliveredAt ? new Date(m.deliveredAt).toLocaleString() : 'N/A',
    'Read At': m.readAt ? new Date(m.readAt).toLocaleString() : 'N/A',
  }));

  const worksheet = xlsx.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Name
    { wch: 15 }, // Phone
    { wch: 30 }, // Product
    { wch: 20 }, // Tracking
    { wch: 15 }, // Dispatch Date
    { wch: 15 }, // Courier
    { wch: 12 }, // Status
    { wch: 35 }, // Message ID
    { wch: 30 }, // Error
    { wch: 22 }, // Sent At
    { wch: 22 }, // Delivered At
    { wch: 22 }, // Read At
  ];
  worksheet['!cols'] = colWidths;

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Delivery Report');

  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

/**
 * Generates a sample template Excel file for users to download
 */
function generateSampleTemplateExcel() {
  const sampleData = [
    {
      'name': 'Rahul Sharma',
      'phone': '919584510000',
      'product_name': 'CA Inter IDT Full Book Set 8.0',
      'tracking_number': 'C1144011340IN',
      'dispatch_date': '03-10-2026',
      'courier': 'India Post'
    },
    {
      'name': 'Priya Patel',
      'phone': '918889888034',
      'product_name': 'CA Final Tax Fast Track Book',
      'tracking_number': 'DT987654321IN',
      'dispatch_date': '03-10-2026',
      'courier': 'DTDC Courier'
    },
    {
      'name': 'Garv Joshi',
      'phone': '918839250427',
      'product_name': 'CA Foundation Accounting Module',
      'tracking_number': 'BLR123456789',
      'dispatch_date': '03-10-2026',
      'courier': 'Blue Dart'
    }
  ];

  const worksheet = xlsx.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 16 }
  ];

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Dispatch Template');

  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  generateReportExcel,
  generateSampleTemplateExcel
};
