/**
 * EXAMSTICK full backup receiver.
 * Update the existing Web app deployment (execute as the owner; access: anyone).
 * Keep the existing spreadsheet and Script Properties:
 * BACKUP_SECRET, BACKUP_SPREADSHEET_ID, and optional BACKUP_SHEET_NAME
 * (defaults to the existing "Backup Archive" tab). No tabs are created/deleted.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const payload = JSON.parse(e && e.postData && e.postData.contents || '{}');
    const properties = PropertiesService.getScriptProperties();
    const expected = properties.getProperty('BACKUP_SECRET');
    const spreadsheetId = properties.getProperty('BACKUP_SPREADSHEET_ID');
    if (!expected || payload.secret !== expected) return output({ success: false, error: 'Unauthorized backup request.' });
    if (!spreadsheetId || !payload.backup || payload.backup.version !== 1 || payload.backup.type !== 'lms-backup' ||
        !payload.backup.tables || Array.isArray(payload.backup.tables) || typeof payload.backup.tables !== 'object' ||
        !Object.keys(payload.backup.tables).length || Object.keys(payload.backup.tables).some(key => !Array.isArray(payload.backup.tables[key]))) {
      return output({ success: false, error: 'Invalid backup payload or missing spreadsheet configuration.' });
    }

    lock.waitLock(30000);
    const sheetName = properties.getProperty('BACKUP_SHEET_NAME') || 'Backup Archive';
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    if (!sheet) throw new Error('The existing backup tab was not found. Set BACKUP_SHEET_NAME to its exact name. No tab was created.');
    const headings = ['Backup ID', 'Created At', 'Part', 'Parts', 'JSON Chunk'];
    if (sheet.getLastRow() === 0) sheet.appendRow(headings);
    else if (sheet.getRange(1, 1, 1, 5).getValues()[0].some((value, i) => value !== headings[i])) {
      throw new Error('The existing backup tab has a different column layout. No data was changed.');
    }

    const backupId = backupContentId(payload.backup);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const matches = sheet.getRange(2, 1, lastRow - 1, 1).createTextFinder(backupId).matchEntireCell(true).findAll().sort((a, b) => a.getRow() - b.getRow());
      if (matches.length) {
        const start = matches[0].getRow();
        const parts = Number(sheet.getRange(start, 4, 1, 1).getValues()[0][0]);
        const rows = sheet.getRange(start, 1, matches.length, 5).getValues();
        if (matches.length !== parts || rows.some((row, i) => row[0] !== backupId || Number(row[2]) !== i + 1 || Number(row[3]) !== parts)) {
          throw new Error('An incomplete copy of this backup already exists. No duplicate rows were added.');
        }
        let stored;
        try { stored = JSON.parse(rows.map(row => row[4]).join('')); } catch (_) {}
        if (!stored || !stored.tables || backupContentId(stored) !== backupId) throw new Error('The existing backup copy is incomplete. No duplicate rows were added.');
        return output({ success: true, duplicate: true, backupId, parts });
      }
      // Recognize the last backup from the older random-ID receiver as well.
      // Existing rows are read only; they are never rewritten or removed.
      const last = sheet.getRange(lastRow, 1, 1, 5).getValues()[0];
      const parts = Number(last[3]);
      if (Number.isInteger(parts) && parts > 0 && parts <= lastRow - 1) {
        const rows = sheet.getRange(lastRow - parts + 1, 1, parts, 5).getValues();
        const complete = rows.every((row, i) => row[0] === last[0] && Number(row[2]) === i + 1 && Number(row[3]) === parts);
        if (complete) {
          let previous;
          try { previous = JSON.parse(rows.map(row => row[4]).join('')); } catch (_) {}
          if (previous && previous.tables && backupContentId(previous) === backupId) {
            return output({ success: true, duplicate: true, backupId: last[0], parts });
          }
        }
      }
    }
    const json = JSON.stringify(payload.backup);
    const chunks = splitForCells(json, 45000);
    const rows = chunks.map((chunk, index) => [backupId, payload.backup.createdAt || new Date().toISOString(), index + 1, chunks.length, chunk]);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    return output({ success: true, duplicate: false, backupId, parts: chunks.length });
  } catch (error) {
    return output({ success: false, error: String(error && error.message || error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

// Compare source records, ignoring capture time and the history records created
// by backups themselves. Updated records still produce a new complete backup.
function backupContentId(backup) {
  const tables = Object.create(null);
  Object.keys(backup.tables).filter(key => key !== 'backup_log').sort().forEach(key => { tables[key] = backup.tables[key]; });
  const value = canonicalJson({ version: backup.version, type: backup.type, tables });
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return 'BK-' + bytes.map(byte => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

function splitForCells(value, maxLength) {
  const chunks = [];
  for (let start = 0; start < value.length;) {
    let end = Math.min(start + maxLength, value.length);
    if (end < value.length) {
      const last = value.charCodeAt(end - 1);
      if (last >= 0xD800 && last <= 0xDBFF) end--;
    }
    chunks.push(value.slice(start, end));
    start = end;
  }
  return chunks.length ? chunks : [''];
}

function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
