/**
 * ============================================================
 * GOOGLE APPS SCRIPT — FAHIM SHAHRIAR WEBSITE DATABASE
 * ============================================================
 *
 * এই কোডটি আপনার গুগল শীট (Google Sheet)-এর Extensions > Apps Script-এ পেস্ট করুন
 * এবং Deploy > New deployment (বা Manage deployments > Edit > New version) হিসেবে
 * Web App মোডে (Execute as: Me, Who has access: Anyone) ডিপ্লয় করুন।
 *
 * সমর্থিত শীট ট্যাবসমূহ (Tabs):
 * 1. blog          (Blog Posts)
 * 2. projects      (Projects)
 * 3. services      (Services)
 * 4. testimonials  (Testimonials)
 * 5. achievements  (Achievements)
 * 6. gallery       (Gallery Photos)
 * 7. cv            (CV Documents)
 * 8. messages      (Contact Form Messages)
 * 9. bookings      (Service Bookings)
 */

const DEFAULT_HEADERS = {
  blog: ['id', 'Title', 'Category', 'Image', 'Date', 'ReadTime', 'Summary', 'Content', 'Link', 'Sort_Order', 'Published', 'Created_At'],
  projects: ['id', 'Title', 'Icon', 'Category', 'Description', 'Link', 'Sort_Order', 'Published', 'Created_At'],
  services: ['id', 'Title', 'Icon', 'Category', 'Price', 'Fee', 'Description', 'Sort_Order', 'Active', 'Created_At'],
  achievements: ['id', 'Title', 'Icon', 'Description', 'Sort_Order', 'Published', 'Created_At'],
  testimonials: ['id', 'Name', 'Relation', 'About', 'Feedback', 'Image', 'Link', 'Sort_Order', 'Published', 'Created_At'],
  gallery: ['id', 'Image_URL', 'Caption', 'Category', 'Sort_Order', 'Created_At'],
  cv: ['id', 'Title', 'Download_Link', 'Password', 'Sort_Order', 'Created_At'],
  messages: ['id', 'Time', 'Name', 'Email', 'Subject', 'Message', 'Status'],
  bookings: ['id', 'Time', 'Name', 'Mobile', 'Location', 'Service', 'Amount', 'Gateway', 'Payment_Number', 'TrxID', 'Notes', 'Status']
};

function doGet(e) {
  try {
    const rawSheet = (e && e.parameter && e.parameter.sheet) ? String(e.parameter.sheet).trim().toLowerCase() : '';
    if (!rawSheet) {
      return jsonResponse({
        status: 'ok',
        message: 'Fahim Shahriar Website — Google Sheets Database API is active.',
        supportedSheets: Object.keys(DEFAULT_HEADERS)
      });
    }

    const sheetName = normalizeSheetName(rawSheet);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = findSheetCaseInsensitive(ss, sheetName);
    if (!sheet) {
      return jsonResponse([]);
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) {
      return jsonResponse([]);
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    const result = [];
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const isBlank = row.every(cell => cell === '' || cell === null || cell === undefined);
      if (isBlank) continue;

      const rowNumber = i + 2;
      const obj = {
        _rowIndex: rowNumber
      };

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (header) {
          let cellVal = row[j];
          if (cellVal instanceof Date) {
            const fmt = (header.toLowerCase().includes('time') || header.toLowerCase().includes('created'))
              ? "yyyy-MM-dd'T'HH:mm:ss'Z'"
              : "yyyy-MM-dd";
            cellVal = Utilities.formatDate(cellVal, ss.getSpreadsheetTimeZone() || "GMT+6", fmt);
          }
          obj[header] = cellVal;
        }
      }

      if (!obj.id) {
        obj.id = 'row-' + (i + 1);
      }

      result.push(obj);
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(12000);

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (ex) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const rawSheet = payload.sheet || (e && e.parameter && e.parameter.sheet) || '';
    const sheetName = normalizeSheetName(rawSheet);
    if (!sheetName) {
      return jsonResponse({ success: false, error: 'Sheet name is required.' });
    }

    const action = String(payload.action || 'insert').trim().toLowerCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = findSheetCaseInsensitive(ss, sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (DEFAULT_HEADERS[sheetName]) {
        sheet.getRange(1, 1, 1, DEFAULT_HEADERS[sheetName].length).setValues([DEFAULT_HEADERS[sheetName]]);
      }
    }

    const headers = ensureSheetHeaders(sheet, sheetName, payload.data || payload);
    const dataObj = payload.data || payload;
    const targetId = payload.id || (dataObj && dataObj.id) || '';
    const targetRowIndex = findTargetRowIndex(sheet, headers, payload.rowIndex, targetId);

    // --- ACTION: DELETE ---
    if (action === 'delete') {
      if (targetRowIndex && targetRowIndex >= 2 && targetRowIndex <= sheet.getLastRow()) {
        sheet.deleteRow(targetRowIndex);
        return jsonResponse({
          success: true,
          message: 'Row ' + targetRowIndex + ' deleted successfully',
          deletedRowIndex: targetRowIndex
        });
      }
      return jsonResponse({ success: false, error: 'Target row not found for deletion' });
    }

    // --- ACTION: UPDATE ---
    if (action === 'update') {
      if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > sheet.getLastRow()) {
        // যদি রো খুঁজে না পাওয়া যায়, তাহলে নতুন রো হিসেবে ইনসার্ট করে দিবে যেন ডেটা হারিয়ে না যায়
        return insertRowIntoSheet(sheet, headers, dataObj);
      }

      const currentRowValues = sheet.getRange(targetRowIndex, 1, 1, headers.length).getValues()[0];
      const updatedRow = headers.map((header, idx) => {
        const matchedVal = getMatchingProperty(dataObj, header);
        return matchedVal !== undefined ? matchedVal : currentRowValues[idx];
      });

      sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([updatedRow]);
      return jsonResponse({
        success: true,
        message: 'Row updated successfully',
        rowIndex: targetRowIndex
      });
    }

    // --- ACTION: INSERT (default) ---
    return insertRowIntoSheet(sheet, headers, dataObj);

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function insertRowIntoSheet(sheet, headers, dataObj) {
  const newRow = headers.map(header => {
    const val = getMatchingProperty(dataObj, header);
    return val !== undefined && val !== null ? val : '';
  });

  sheet.appendRow(newRow);
  const newRowIndex = sheet.getLastRow();

  return jsonResponse({
    success: true,
    message: 'Row inserted successfully',
    rowIndex: newRowIndex
  });
}

function ensureSheetHeaders(sheet, sheetName, dataObj) {
  let lastCol = sheet.getLastColumn();
  let headers = [];

  if (lastCol > 0 && sheet.getLastRow() > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
  }

  if (headers.length === 0 || headers.every(h => !h)) {
    headers = DEFAULT_HEADERS[sheetName] || Object.keys(dataObj || {}).filter(k => !['_rowIndex', 'sheet', 'action'].includes(k));
    if (headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    return headers;
  }

  // যদি নতুন কোনো কলাম ডেটাতে থাকে যা শিটে নেই, তা স্বয়ংক্রিয়ভাবে যুক্ত করবে
  if (dataObj && typeof dataObj === 'object') {
    const existingLower = headers.map(h => h.toLowerCase());
    const extraKeys = Object.keys(dataObj).filter(k => {
      if (['_rowIndex', 'sheet', 'action'].includes(k)) return false;
      return !existingLower.includes(k.toLowerCase());
    });

    if (extraKeys.length > 0) {
      const startCol = headers.length + 1;
      sheet.getRange(1, startCol, 1, extraKeys.length).setValues([extraKeys]);
      headers = headers.concat(extraKeys);
    }
  }

  return headers;
}

function findTargetRowIndex(sheet, headers, explicitRowIndex, targetId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  // ১. প্রথমে id কলাম দিয়ে খোঁজা হবে (সবচেয়ে নির্ভুল পদ্ধতি)
  if (targetId) {
    const idColIdx = headers.findIndex(h => h.toLowerCase() === 'id');
    if (idColIdx !== -1) {
      const idValues = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < idValues.length; i++) {
        if (String(idValues[i][0] || '').trim() === String(targetId).trim()) {
          return i + 2;
        }
      }
    }
  }

  // ২. id না মিললে বা না থাকলে rowIndex ব্যবহার করা হবে
  const parsedIdx = parseInt(explicitRowIndex, 10);
  if (!isNaN(parsedIdx) && parsedIdx >= 2 && parsedIdx <= lastRow) {
    return parsedIdx;
  }

  // ৩. id যদি 'row-X' ফরম্যাটে হয়
  if (targetId && String(targetId).startsWith('row-')) {
    const num = parseInt(String(targetId).replace('row-', ''), 10);
    if (!isNaN(num) && (num + 1) >= 2 && (num + 1) <= lastRow) {
      return num + 1;
    }
  }

  return null;
}

function getMatchingProperty(obj, header) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, header)) return obj[header];

  const lowerH = header.toLowerCase().replace(/[\s_]+/g, '');
  for (const key of Object.keys(obj)) {
    const lowerK = key.toLowerCase().replace(/[\s_]+/g, '');
    if (lowerK === lowerH) {
      return obj[key];
    }
  }
  return undefined;
}

function normalizeSheetName(name) {
  const clean = String(name || '').trim().toLowerCase();
  const map = {
    blog_posts: 'blog',
    gallery_photos: 'gallery',
    cvs: 'cv',
    blog: 'blog',
    gallery: 'gallery',
    cv: 'cv'
  };
  return map[clean] || clean;
}

function findSheetCaseInsensitive(ss, name) {
  const sheets = ss.getSheets();
  const lower = String(name || '').trim().toLowerCase();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().trim().toLowerCase() === lower) {
      return sheets[i];
    }
  }
  return null;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
