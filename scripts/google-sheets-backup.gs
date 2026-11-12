/**
 * EXAMSTICK full backup receiver.
 * Deploy as a Web app (execute as the owner; access: anyone), then set these
 * Script Properties: BACKUP_SECRET and BACKUP_SPREADSHEET_ID.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const payload = JSON.parse(e && e.postData && e.postData.contents || '{}');
    const properties = PropertiesService.getScriptProperties();
    const expected = properties.getProperty('BACKUP_SECRET');
    const spreadsheetId = properties.getProperty('BACKUP_SPREADSHEET_ID');
    if (!expected || payload.secret !== expected) return output({ success: false, error: 'Unauthorized backup request.' });
    if (!spreadsheetId || !payload.backup || payload.backup.type !== 'lms-backup' || !payload.backup.tables) {
      return output({ success: false, error: 'Invalid backup payload or missing spreadsheet configuration.' });
    }

    lock.waitLock(30000);
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Backup Archive') ||
      SpreadsheetApp.openById(spreadsheetId).insertSheet('Backup Archive');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Backup ID', 'Created At', 'Part', 'Parts', 'JSON Chunk']);

    const backupId = `${payload.backup.createdAt || new Date().toISOString()}-${Utilities.getUuid()}`;
    const json = JSON.stringify(payload.backup);
    const chunks = splitForCells(json, 45000);
    const rows = chunks.map((chunk, index) => [backupId, payload.backup.createdAt || new Date().toISOString(), index + 1, chunks.length, chunk]);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    return output({ success: true, backupId, parts: chunks.length });
  } catch (error) {
    return output({ success: false, error: String(error && error.message || error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
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
