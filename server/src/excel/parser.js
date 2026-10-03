const xlsx = require('xlsx');

/**
 * Normalizes phone numbers to standard international format without '+' sign.
 * E.g., "+91 98765 43210" -> "919876543210"
 * "9876543210" -> "919876543210"
 */
function normalizePhone(phone) {
  if (!phone) return '';
  let str = String(phone).trim().replace(/[\s\-\+\(\)]/g, '');

  // Remove leading zeroes
  str = str.replace(/^0+/, '');

  // If 10 digits starting with 6-9 (Indian mobile format), add country code 91
  if (/^[6-9]\d{9}$/.test(str)) {
    return `91${str}`;
  }

  return str;
}

/**
 * Validates normalized phone number
 */
function isValidPhone(phone) {
  if (!phone) return false;
  // Indian mobile: 91 followed by 10 digits starting with 6-9
  if (/^91[6-9]\d{9}$/.test(phone)) return true;
  // Generic international mobile number: 10 to 15 digits
  if (/^\d{10,15}$/.test(phone)) return true;
  return false;
}

/**
 * Normalizes date format to clean string
 */
function normalizeDate(dateVal) {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  if (typeof dateVal === 'number') {
    // XLSX date serial number format conversion
    const parsedDate = xlsx.SSF.parse_date_code(dateVal);
    if (parsedDate) {
      const y = parsedDate.y;
      const m = String(parsedDate.m).padStart(2, '0');
      const d = String(parsedDate.d).padStart(2, '0');
      return `${d}-${m}-${y}`;
    }
  }
  return String(dateVal).trim();
}

/**
 * Map flexible column headers to expected standardized keys
 */
function normalizeHeaderKey(key) {
  const clean = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');

  // Exact check for product name first
  if (clean.includes('product') || clean.includes('book') || clean.includes('course') || clean.includes('item') || clean.includes('material')) {
    return 'product_name';
  }

  // Exact check for customer/student name (excluding product name)
  if (clean === 'name' || clean === 'studentname' || clean === 'customername' || clean === 'student' || clean === 'customer' || (clean.includes('name') && !clean.includes('product'))) {
    return 'name';
  }

  if (clean.includes('phone') || clean.includes('mobile') || clean.includes('contact') || (clean.includes('number') && !clean.includes('track'))) {
    return 'phone';
  }

  if (clean.includes('track') || clean.includes('consignment') || clean.includes('awb') || clean.includes('docket')) {
    return 'tracking_number';
  }

  if (clean.includes('date') || clean.includes('dispatch')) {
    return 'dispatch_date';
  }

  if (clean.includes('courier') || clean.includes('partner') || clean.includes('post') || clean.includes('vendor')) {
    return 'courier';
  }

  return clean;
}

/**
 * Parses buffer or file path of Excel / CSV and validates every row
 */
function parseAndValidateExcel(fileInput) {
  let workbook;
  if (Buffer.isBuffer(fileInput)) {
    workbook = xlsx.read(fileInput, { type: 'buffer', cellDates: true });
  } else {
    workbook = xlsx.readFile(fileInput, { cellDates: true });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel file contains no readable sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Uploaded file is empty.');
  }

  // Detect and normalize headers
  const detectedColumns = Object.keys(rawRows[0]);
  const mappedColumns = detectedColumns.map(col => ({
    original: col,
    mappedKey: normalizeHeaderKey(col)
  }));

  const phoneTracker = new Map();
  const trackingNumberTracker = new Map();

  const validatedRows = rawRows.map((row, index) => {
    const rowNum = index + 2; // 1-based indexing including header row
    const normalizedData = {};

    mappedColumns.forEach(({ original, mappedKey }) => {
      normalizedData[mappedKey] = row[original];
    });

    const name = String(normalizedData.name || '').trim();
    const rawPhone = normalizedData.phone;
    const phone = normalizePhone(rawPhone);
    const trackingNumber = String(normalizedData.tracking_number || '').trim();
    const dispatchDate = normalizeDate(normalizedData.dispatch_date);
    const courier = String(normalizedData.courier || '').trim();
    const productName = String(normalizedData.product_name || '').trim();

    const errors = [];

    if (!name) errors.push('Missing customer name');
    if (!rawPhone) {
      errors.push('Missing phone number');
    } else if (!isValidPhone(phone)) {
      errors.push(`Invalid phone number format (${rawPhone})`);
    }

    if (!trackingNumber) errors.push('Missing tracking number');
    if (!dispatchDate) errors.push('Missing dispatch date');
    if (!courier) errors.push('Missing courier name');
    if (!productName) errors.push('Missing product name');

    // Duplicate detection in file
    let isDuplicatePhone = false;
    let isDuplicateTracking = false;

    if (phone && isValidPhone(phone)) {
      if (phoneTracker.has(phone)) {
        isDuplicatePhone = true;
        errors.push(`Duplicate phone number in row ${phoneTracker.get(phone)}`);
      } else {
        phoneTracker.set(phone, rowNum);
      }
    }

    if (trackingNumber) {
      if (trackingNumberTracker.has(trackingNumber)) {
        isDuplicateTracking = true;
        errors.push(`Duplicate tracking number in row ${trackingNumberTracker.get(trackingNumber)}`);
      } else {
        trackingNumberTracker.set(trackingNumber, rowNum);
      }
    }

    const isValid = errors.length === 0;

    return {
      rowIndex: rowNum,
      name,
      phone,
      rawPhone: String(rawPhone || ''),
      trackingNumber,
      dispatchDate,
      courier,
      productName,
      isValid,
      errors,
      validationError: errors.length > 0 ? errors.join('; ') : null,
      isDuplicate: isDuplicatePhone || isDuplicateTracking,
    };
  });

  const validRows = validatedRows.filter(r => r.isValid);
  const invalidRows = validatedRows.filter(r => !r.isValid);
  const duplicateRows = validatedRows.filter(r => r.isDuplicate);

  return {
    totalRows: validatedRows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    duplicateCount: duplicateRows.length,
    detectedColumns,
    rows: validatedRows
  };
}

module.exports = {
  parseAndValidateExcel,
  normalizePhone,
  isValidPhone,
  normalizeDate,
};
