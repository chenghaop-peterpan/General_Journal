const SHEET_TX = 'Transactions';

function listTransactions(payload, _user) {
  const rows = readSheetAsObjects_(SHEET_TX);
  const from = payload.from ? String(payload.from) : null;
  const to = payload.to ? String(payload.to) : null;
  const limit = Number(payload.limit) || 500;

  const filtered = rows.filter(function (r) {
    const d = normalizeDate_(r.date);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  filtered.sort(function (a, b) {
    const ad = normalizeDate_(a.date);
    const bd = normalizeDate_(b.date);
    if (ad !== bd) return ad < bd ? 1 : -1;
    return (a.createdAt < b.createdAt) ? 1 : -1;
  });

  return filtered.slice(0, limit).map(toWireTx_);
}

function createTransaction(payload, user) {
  requireFields_(payload, ['date', 'type', 'category', 'amount']);
  if (payload.type !== 'income' && payload.type !== 'expense') {
    throw new Error('type must be income or expense');
  }
  const amount = Number(payload.amount);
  if (!isFinite(amount) || amount <= 0) throw new Error('amount must be > 0');

  const row = {
    id: uuid_(),
    createdAt: new Date().toISOString(),
    date: normalizeDate_(payload.date),
    type: payload.type,
    category: String(payload.category),
    amount: amount,
    note: payload.note ? String(payload.note) : '',
    userEmail: user.email,
  };

  withLock_(function () { appendObject_(SHEET_TX, row); });
  return toWireTx_(row);
}

function updateTransaction(payload, _user) {
  requireFields_(payload, ['id']);
  const patch = {};
  const allowed = ['date', 'type', 'category', 'amount', 'note'];
  for (const k of allowed) {
    if (payload[k] !== undefined) patch[k] = k === 'amount' ? Number(payload[k]) : payload[k];
  }
  if (patch.date) patch.date = normalizeDate_(patch.date);
  const updated = withLock_(function () { return updateRowById_(SHEET_TX, payload.id, patch); });
  return toWireTx_(updated);
}

function deleteTransaction(payload, _user) {
  requireFields_(payload, ['id']);
  withLock_(function () { deleteRowById_(SHEET_TX, payload.id); });
  return { id: payload.id };
}

function listCategories(_payload, _user) {
  return readSheetAsObjects_('Categories').map(function (r) {
    return { name: r.name, type: r.type, icon: r.icon || '' };
  });
}

// --- helpers ---

function requireFields_(obj, keys) {
  for (const k of keys) {
    if (obj[k] === undefined || obj[k] === null || obj[k] === '') {
      throw new Error('missing field: ' + k);
    }
  }
}

function normalizeDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const s = String(v);
  return s.slice(0, 10);
}

function toWireTx_(r) {
  return {
    id: r.id,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    date: normalizeDate_(r.date),
    type: r.type,
    category: r.category,
    amount: Number(r.amount),
    note: r.note || '',
    userEmail: r.userEmail,
  };
}
