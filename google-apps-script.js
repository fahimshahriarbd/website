/**
 * ============================================================
 * GOOGLE APPS SCRIPT — FAHIM SHAHRIAR WEBSITE DATABASE
 * ============================================================
 * 
 * এই কোডটি আপনার গুগল শীট (Google Sheet)-এর Apps Script-এ পেস্ট করতে হবে।
 * 
 * সমর্থিত শীট ট্যাবসমূহ (Tabs):
 * 1. blog
 * 2. projects
 * 3. services
 * 4. testimonials
 * 5. achievements
 * 6. gallery
 * 7. cv
 * 8. messages
 * 9. bookings
 */

function doGet(e) {
  try {
    const sheetName = (e && e.parameter && e.parameter.sheet) ? String(e.parameter.sheet).trim().toLowerCase() : '';
    if (!sheetName) {
      return jsonResponse({
        status: 'ok',
        message: 'Google Apps Script Database API is running. Specify a sheet tab, e.g. ?sheet=services'
      });
    }

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
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    const values = dataRange.getValues();

    const result = [];
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const isBlank = row.every(cell => cell === '' || cell === null || cell === undefined);
      if (isBlank) continue;

      const obj = {
        _rowIndex: i + 2, // ২ নম্বর রো থেকে ডেটা শুরু
        id: 'row-' + (i + 1)
      };

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (header) {
          let cellVal = row[j];
          if (cellVal instanceof Date) {
            cellVal = Utilities.formatDate(cellVal, ss.getSpreadsheetTimeZone() || "GMT+6", "yyyy-MM-dd");
          }
          obj[header] = cellVal;
        }
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
    // একই সাথে একাধিক রিকোয়েস্ট আসলে হ্যান্ডেল করার জন্য লক
    lock.waitLock(10000);

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
    const sheetName = String(rawSheet).trim().toLowerCase();
    if (!sheetName) {
      return jsonResponse({ success: false, error: 'Sheet name is required.' });
    }

    const action = String(payload.action || 'insert').trim().toLowerCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = findSheetCaseInsensitive(ss, sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // --- ACTION: DELETE ---
    if (action === 'delete') {
      const rowIndex = parseInt(payload.rowIndex, 10);
      if (rowIndex && rowIndex > 1 && rowIndex <= sheet.getLastRow()) {
        sheet.deleteRow(rowIndex);
        return jsonResponse({ success: true, message: 'Row ' + rowIndex + ' deleted successfully' });
      }
      return jsonResponse({ success: false, error: 'Invalid rowIndex for deletion' });
    }

    // হেডারের তালিকা সংগ্রহ করা
    let lastCol = sheet.getLastColumn();
    let headers = [];
    if (lastCol > 0 && sheet.getLastRow() > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
    }

    const dataObj = payload.data || payload;

    // যদি শিটে কোনো হেডার না থাকে, ডেটার কি (keys) থেকে হেডার তৈরি করবে
    if (headers.length === 0 || headers.every(h => !h)) {
      headers = Object.keys(dataObj).filter(k => !['_rowIndex', 'id', 'sheet', 'action'].includes(k));
      if (headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
    }

    // --- ACTION: UPDATE ---
    if (action === 'update') {
      const rowIndex = parseInt(payload.rowIndex, 10);
      if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
        return jsonResponse({ success: false, error: 'Invalid rowIndex for update: ' + rowIndex });
      }

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (header && dataObj.hasOwnProperty(header)) {
          sheet.getRange(rowIndex, j + 1).setValue(dataObj[header]);
        }
      }
      return jsonResponse({ success: true, message: 'Row updated successfully', rowIndex: rowIndex });
    }

    // --- ACTION: INSERT (default) ---
    const newRow = [];
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      let val = dataObj[header];
      if (val === undefined) {
        const lowerH = header.toLowerCase();
        for (const k of Object.keys(dataObj)) {
          if (k.toLowerCase() === lowerH) {
            val = dataObj[k];
            break;
          }
        }
      }
      newRow.push(val !== undefined && val !== null ? val : '');
    }

    sheet.appendRow(newRow);
    const newRowIndex = sheet.getLastRow();

    return jsonResponse({
      success: true,
      message: 'Row inserted successfully',
      rowIndex: newRowIndex
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

// ছোট-বড় হাতের অক্ষরের পার্থক্যে যেন সমস্যা না হয়
function findSheetCaseInsensitive(ss, name) {
  const sheets = ss.getSheets();
  const lower = name.toLowerCase();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().trim().toLowerCase() === lower) {
      return sheets[i];
    }
  }
  return null;
}

// JSON আউটপুট প্রদান
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
