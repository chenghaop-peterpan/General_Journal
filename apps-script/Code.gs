// Router. All requests hit doPost with { idToken, action, payload }.
// GET is used only for a health check.

function doGet() {
  return jsonOut({ ok: true, service: 'FundApp API', time: new Date().toISOString() });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const { idToken, action, payload } = body;
    if (!action) throw new Error('missing action');

    const user = verifyIdToken_(idToken);

    const handler = ROUTES_[action];
    if (!handler) throw new Error('unknown action: ' + action);

    const data = handler(payload || {}, user);
    return jsonOut({ ok: true, data });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message || err) });
  }
}

const ROUTES_ = {
  listTransactions: listTransactions,
  createTransaction: createTransaction,
  updateTransaction: updateTransaction,
  deleteTransaction: deleteTransaction,
  listCategories: listCategories,
  whoami: function (_p, user) { return user; },
};

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Manual test helpers (run from Apps Script editor) ---

function test_listCategories_() {
  const res = listCategories({}, { email: 'owner@test' });
  Logger.log(JSON.stringify(res));
}

function test_createTransaction_() {
  const res = createTransaction(
    { date: '2026-07-05', type: 'expense', category: '餐飲', amount: 120, note: 'lunch' },
    { email: 'owner@test' }
  );
  Logger.log(JSON.stringify(res));
}
