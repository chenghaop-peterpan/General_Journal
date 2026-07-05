// Verify a Google ID token by calling Google's tokeninfo endpoint,
// then check the resolved email against the AllowedUsers sheet.

function verifyIdToken_(idToken) {
  if (!idToken) throw new Error('missing idToken');

  const props = PropertiesService.getScriptProperties();
  const expectedAud = props.getProperty('OAUTH_CLIENT_ID');
  if (!expectedAud) throw new Error('server not configured: OAUTH_CLIENT_ID');

  const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) {
    throw new Error('invalid idToken');
  }
  const info = JSON.parse(resp.getContentText());

  if (info.aud !== expectedAud) throw new Error('token audience mismatch');
  if (Number(info.exp) * 1000 < Date.now()) throw new Error('token expired');
  if (info.email_verified !== 'true' && info.email_verified !== true) {
    throw new Error('email not verified');
  }

  const email = String(info.email || '').toLowerCase();
  const allowed = getAllowedUser_(email);
  if (!allowed) throw new Error('not authorized: ' + email);

  return {
    email: email,
    displayName: allowed.displayName || info.name || email,
    role: allowed.role || 'member',
  };
}

function getAllowedUser_(email) {
  const rows = readSheetAsObjects_('AllowedUsers');
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].email || '').toLowerCase() === email) return rows[i];
  }
  return null;
}
