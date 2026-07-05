// Thin helpers around SpreadsheetApp. Row 1 is treated as headers.

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('server not configured: SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  const sh = getSpreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('sheet not found: ' + name);
  return sh;
}

function readSheetAsObjects_(name) {
  const sh = getSheet_(name);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(function (h) { return String(h).trim(); });
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (row.every(function (c) { return c === '' || c === null; })) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c]] = row[c];
    obj.__row = r + 1;
    out.push(obj);
  }
  return out;
}

function appendObject_(name, obj) {
  const sh = getSheet_(name);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const row = headers.map(function (h) {
    const v = obj[String(h).trim()];
    return v === undefined ? '' : v;
  });
  sh.appendRow(row);
}

function updateRowById_(name, id, patch) {
  const sh = getSheet_(name);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(function (h) { return String(h).trim(); });
  const idCol = headers.indexOf('id');
  if (idCol < 0) throw new Error('sheet has no id column: ' + name);

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      for (const k of Object.keys(patch)) {
        const c = headers.indexOf(k);
        if (c >= 0) values[r][c] = patch[k];
      }
      sh.getRange(r + 1, 1, 1, headers.length).setValues([values[r]]);
      const obj = {};
      for (let c = 0; c < headers.length; c++) obj[headers[c]] = values[r][c];
      return obj;
    }
  }
  throw new Error('id not found: ' + id);
}

function deleteRowById_(name, id) {
  const sh = getSheet_(name);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(function (h) { return String(h).trim(); });
  const idCol = headers.indexOf('id');
  if (idCol < 0) throw new Error('sheet has no id column: ' + name);

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      sh.deleteRow(r + 1);
      return true;
    }
  }
  throw new Error('id not found: ' + id);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function uuid_() {
  return Utilities.getUuid();
}
