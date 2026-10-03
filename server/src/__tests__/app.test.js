const { parseAndValidateExcel, normalizePhone, isValidPhone } = require('../excel/parser');
const whatsappClient = require('../whatsapp/client');
const xlsx = require('xlsx');

describe('FAST WhatsApp Automation Core Logic Tests', () => {
  describe('Phone Number Normalization & Validation', () => {
    test('Normalizes Indian mobile numbers correctly', () => {
      expect(normalizePhone('+91 98765 43210')).toBe('919876543210');
      expect(normalizePhone('9876543210')).toBe('919876543210');
      expect(normalizePhone('09876543210')).toBe('919876543210');
      expect(normalizePhone('91-98765-43210')).toBe('919876543210');
    });

    test('Validates valid and invalid phone numbers', () => {
      expect(isValidPhone('919876543210')).toBe(true);
      expect(isValidPhone('919812345678')).toBe(true);
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('Excel Parsing & Duplicate Detection', () => {
    test('Parses Excel buffer and validates rows correctly', () => {
      const sampleRows = [
        {
          'Name': 'Rahul Sharma',
          'Phone': '9876543210',
          'Product': 'CA Inter IDT Full Book Set 8.0',
          'Tracking Number': 'C1144011340IN',
          'Dispatch Date': '30-09-2026',
          'Courier': 'India Post',
        },
        {
          'Name': 'Invalid Phone User',
          'Phone': '123',
          'Product': 'CA Inter Tax',
          'Tracking Number': 'TRK99999',
          'Dispatch Date': '30-09-2026',
          'Courier': 'DTDC',
        },
        {
          'Name': 'Duplicate Phone User',
          'Phone': '9876543210',
          'Product': 'CA Final Law',
          'Tracking Number': 'TRK88888',
          'Dispatch Date': '30-09-2026',
          'Courier': 'Blue Dart',
        }
      ];

      const worksheet = xlsx.utils.json_to_sheet(sampleRows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = parseAndValidateExcel(buffer);

      expect(result.totalRows).toBe(3);
      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(2);
      expect(result.duplicateCount).toBe(1);

      expect(result.rows[0].isValid).toBe(true);
      expect(result.rows[0].phone).toBe('919876543210');
      expect(result.rows[1].isValid).toBe(false);
      expect(result.rows[1].validationError).toContain('Invalid phone number format');
      expect(result.rows[2].isValid).toBe(false);
      expect(result.rows[2].validationError).toContain('Duplicate phone number');
    });
  });

  describe('WhatsApp Payload Builder & Message Text Generator', () => {
    test('Builds Meta WhatsApp Cloud API template payload correctly', () => {
      const payload = whatsappClient.buildMessagePayload(
        '919876543210',
        'Rahul Sharma',
        'CA Inter IDT Book',
        'TRACK123',
        '30-09-2026',
        'India Post'
      );

      expect(payload.messaging_product).toBe('whatsapp');
      expect(payload.recipient_type).toBe('individual');
      expect(payload.to).toBe('919876543210');
      expect(payload.type).toBe('template');
      expect(payload.template.name).toBe('fast_book_dispatch');
      expect(payload.template.language.code).toBe('en_US');
      expect(payload.template.components[0].parameters).toHaveLength(5);
      expect(payload.template.components[0].parameters[0].text).toBe('Rahul Sharma');
      expect(payload.template.components[0].parameters[1].text).toBe('CA Inter IDT Book');
      expect(payload.template.components[0].parameters[2].text).toBe('TRACK123');
      expect(payload.template.components[0].parameters[3].text).toBe('30-09-2026');
      expect(payload.template.components[0].parameters[4].text).toBe('India Post');
    });

    test('Generates personalized message text containing all details', () => {
      const text = whatsappClient.generatePersonalizedMessageText(
        'Garv Joshi',
        'CA Inter IDT Full Book Set 8.0',
        'C1144011340IN',
        '30-09-26',
        'India Post'
      );

      expect(text).toContain('Hello Garv Joshi,');
      expect(text).toContain('CA Inter IDT Full Book Set 8.0');
      expect(text).toContain('C1144011340IN');
      expect(text).toContain('30-09-26');
      expect(text).toContain('India Post');
      expect(text).toContain('FAST Education');
    });
  });
});
