const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key) process.env[key] = val;
      }
    }
  } catch (e) {
    console.warn('Could not load .env file:', e.message);
  }
}

loadEnv();

// Prevent direct public browsing of server-side code, configuration, and data
app.use((req, res, next) => {
  const reqPath = (req.path || '').toLowerCase();
  const blockedPaths = [
    '/data', '/server.js', '/.env', '/.env.example', '/package.json',
    '/package-lock.json', '/metadata.json', '/.git', '/google-apps-script.js'
  ];
  if (blockedPaths.some(p => reqPath === p || reqPath.startsWith(p + '/'))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
});

// Admin Credentials & Token Secret
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@fahimshahriar.com.bd').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '3778788467';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fahim-admin-jwt-token-secret-key-928374';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFIJVTNzF50zCcv6Ppk2n041_tXHFEWcKM1ouSQsCQ-HzcNUkjUTjNvesNnN_KZ38ovg/exec';

function getGoogleScriptUrl() {
  return process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
}

function generateAdminToken(email) {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours validity
  const payload = `${email}:${expiry}`;
  const hmac = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

function verifyAdminToken(token) {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [email, expiryStr, hmac] = decoded.split(':');
    if (!email || !expiryStr || !hmac) return null;
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) return null;
    const expectedPayload = `${email}:${expiryStr}`;
    const expectedHmac = crypto.createHmac('sha256', ADMIN_SECRET).update(expectedPayload).digest('hex');
    const hmacBuf = Buffer.from(hmac);
    const expBuf = Buffer.from(expectedHmac);
    if (hmacBuf.length === expBuf.length && crypto.timingSafeEqual(hmacBuf, expBuf)) {
      return { email };
    }
  } catch (e) {}
  return null;
}

// Brute-force rate limiting
const loginAttempts = new Map();

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  const rec = loginAttempts.get(clientIp) || { count: 0, lockUntil: 0 };
  if (Date.now() < rec.lockUntil) {
    const waitSec = Math.ceil((rec.lockUntil - Date.now()) / 1000);
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${waitSec} seconds.` });
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  const validAccounts = [
    { email: 'admin@fahimshahriar.com.bd', pass: '3778788467' },
    { email: ADMIN_EMAIL, pass: ADMIN_PASSWORD }
  ];

  const matchedAccount = validAccounts.find(acc => {
    if (acc.email !== cleanEmail) return false;
    try {
      const passBuf = Buffer.from(cleanPassword);
      const expectedPassBuf = Buffer.from(acc.pass);
      return passBuf.length === expectedPassBuf.length && crypto.timingSafeEqual(passBuf, expectedPassBuf);
    } catch {
      return false;
    }
  });

  if (!matchedAccount) {
    rec.count += 1;
    if (rec.count >= 5) {
      rec.lockUntil = Date.now() + 5 * 60 * 1000;
    }
    loginAttempts.set(clientIp, rec);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  loginAttempts.delete(clientIp);
  const token = generateAdminToken(cleanEmail);
  res.json({ success: true, token, email: cleanEmail });
});

app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const user = verifyAdminToken(token);
  if (!user) {
    return res.status(401).json({ valid: false, error: 'Session expired or invalid.' });
  }
  res.json({ valid: true, user });
});

// API: Config — provides Google Script public configuration
app.get('/api/config', (req, res) => {
  res.json({ googleScriptUrl: getGoogleScriptUrl(), mode: 'google_sheets' });
});

const SHEET_ALIAS_MAP = {
  blog_posts: 'blog',
  gallery_photos: 'gallery',
  cvs: 'cv',
  blog: 'blog',
  gallery: 'gallery',
  cv: 'cv',
  projects: 'projects',
  services: 'services',
  achievements: 'achievements',
  testimonials: 'testimonials',
  messages: 'messages',
  bookings: 'bookings'
};

function normalizeSheetParam(s) {
  if (!s) return '';
  const k = String(s).trim().toLowerCase();
  return SHEET_ALIAS_MAP[k] || k;
}

// Short in-memory cache for GET requests to prevent Google Apps Script rate limits
const sheetCache = new Map();
const SHEET_CACHE_TTL = 25 * 1000; // 25 seconds TTL

function invalidateSheetCache(sheetName) {
  const norm = normalizeSheetParam(sheetName);
  for (const k of sheetCache.keys()) {
    if (!norm || k.startsWith(norm + ':')) {
      sheetCache.delete(k);
    }
  }
}

async function callGoogleScript(method, queryParams = {}, bodyPayload = null) {
  const targetScriptUrl = getGoogleScriptUrl();
  const url = new URL(targetScriptUrl);

  for (const [key, val] of Object.entries(queryParams)) {
    if (key === 'refresh' || key === 'nocache') continue;
    const finalVal = (key === 'sheet') ? normalizeSheetParam(val) : val;
    url.searchParams.set(key, finalVal);
  }

  const fetchOptions = {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
    headers: {
      'Accept': 'application/json'
    }
  };

  if (method === 'POST' && bodyPayload) {
    const payload = { ...bodyPayload };
    if (payload.sheet) {
      payload.sheet = normalizeSheetParam(payload.sheet);
    }
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(payload);
  }

  const scriptRes = await fetch(url.toString(), fetchOptions);
  const rawText = await scriptRes.text();
  return { status: scriptRes.status, ok: scriptRes.ok, rawText };
}

// Proxy to Google Apps Script (handles CORS, redirects, and clean JSON parsing)
app.all('/api/sheet-proxy', async (req, res) => {
  const isRead = req.method === 'GET';
  const targetSheet = normalizeSheetParam(req.query.sheet || (req.body && req.body.sheet) || '');
  const forceRefresh = req.query.refresh === '1' || req.query.nocache === '1';
  const cacheKey = `${targetSheet}:${JSON.stringify({ sheet: targetSheet })}`;

  if (isRead && !forceRefresh && targetSheet && sheetCache.has(cacheKey)) {
    const cached = sheetCache.get(cacheKey);
    if (Date.now() - cached.timestamp < SHEET_CACHE_TTL) {
      return res.json(cached.data);
    }
  }

  try {
    const { status, ok, rawText } = await callGoogleScript(req.method, req.query, req.body);
    try {
      const data = JSON.parse(rawText);
      if (isRead && targetSheet && ok && Array.isArray(data)) {
        sheetCache.set(cacheKey, { data, timestamp: Date.now() });
      } else if (!isRead && targetSheet) {
        invalidateSheetCache(targetSheet);
      }
      return res.status(status).json(data);
    } catch {
      if (isRead && sheetCache.has(cacheKey)) {
        return res.json(sheetCache.get(cacheKey).data);
      }
      return res.status(502).json({ error: 'Google Sheet returned non-JSON response' });
    }
  } catch (err) {
    if (isRead && sheetCache.has(cacheKey)) {
      return res.json(sheetCache.get(cacheKey).data);
    }
    return res.status(502).json({ error: 'Failed to communicate with Google Sheets: ' + err.message });
  }
});

// API: Contact messages — reads & writes directly to Google Sheet "messages" tab
app.get('/api/messages', async (req, res) => {
  try {
    const { ok, rawText } = await callGoogleScript('GET', { sheet: 'messages' });
    if (ok) {
      const sheetData = JSON.parse(rawText);
      if (Array.isArray(sheetData)) {
        const mapped = sheetData.map((row, idx) => ({
          id: row.id || ('row-' + (idx + 1)),
          _rowIndex: row._rowIndex || (idx + 2),
          name: String(row.Name ?? row.name ?? 'Anonymous').trim(),
          email: String(row.Email ?? row.email ?? '').trim(),
          subject: String(row.Subject ?? row.subject ?? '').trim(),
          message: String(row.Message ?? row.message ?? '').trim(),
          created_at: row.Time || row.time || new Date().toISOString()
        })).filter(m => m.name || m.email || m.message);
        return res.json(mapped);
      }
    }
  } catch (e) {}
  res.json([]);
});

const handleContactSubmission = async (req, res) => {
  const { name, email, subject, message, Time, Name, Email, Subject, Message } = req.body || {};
  const cleanName = String(name || Name || '').trim();
  const cleanEmail = String(email || Email || '').trim();
  const cleanSubject = String(subject || Subject || 'General Inquiry').trim();
  const cleanMessage = String(message || Message || '').trim();
  const nowIso = Time || new Date().toISOString();

  if (!cleanName || !cleanEmail) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  invalidateSheetCache('messages');

  try {
    const { ok, rawText } = await callGoogleScript('POST', {}, {
      sheet: 'messages',
      action: 'insert',
      data: {
        Time: nowIso,
        Name: cleanName,
        Email: cleanEmail,
        Subject: cleanSubject,
        Message: cleanMessage
      }
    });

    let parsed = { success: ok };
    try { parsed = JSON.parse(rawText); } catch {}
    return res.json({
      success: true,
      message: 'Message saved to Google Sheet successfully.',
      rowIndex: parsed.rowIndex || null
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to save message to Google Sheet: ' + err.message });
  }
};

app.post('/api/messages', handleContactSubmission);
app.post('/api/contact-message', handleContactSubmission);

// API: Service bookings — reads & writes directly to Google Sheet "bookings" tab
app.get('/api/bookings', async (req, res) => {
  try {
    const { ok, rawText } = await callGoogleScript('GET', { sheet: 'bookings' });
    if (ok) {
      const sheetData = JSON.parse(rawText);
      if (Array.isArray(sheetData)) {
        const mapped = sheetData.map((row, idx) => ({
          id: row.id || ('row-' + (idx + 1)),
          _rowIndex: row._rowIndex || (idx + 2),
          name: String(row.Name ?? row.name ?? 'Anonymous').trim(),
          mobile: String(row.Mobile ?? row.mobile ?? '').trim(),
          location: String(row.Location ?? row.location ?? '').trim(),
          service_title: String(row.Service ?? row.service ?? row.Service_Title ?? row.service_title ?? 'Service').trim(),
          amount: String(row.Amount ?? row.amount ?? '').trim(),
          payment_gateway: String(row.Gateway ?? row.gateway ?? row.Payment_Gateway ?? row.payment_gateway ?? 'bKash').trim(),
          payment_number: String(row.Payment_Number ?? row.payment_number ?? '').trim(),
          trx_id: String(row.TrxID ?? row.trx_id ?? row.Trx_Id ?? '').trim(),
          notes: String(row.Notes ?? row.notes ?? '').trim(),
          created_at: row.Time || row.time || new Date().toISOString()
        })).filter(b => b.name || b.mobile);
        return res.json(mapped);
      }
    }
  } catch (e) {}
  res.json([]);
});

const handleBookingSubmission = async (req, res) => {
  const { name, mobile, location, service_title, amount, payment_gateway, payment_number, trx_id, notes } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanMobile = String(mobile || '').trim();
  const cleanLoc = String(location || '').trim();
  const cleanService = String(service_title || 'Service').trim();
  const cleanAmount = String(amount || '').trim();
  const cleanGw = String(payment_gateway || 'bKash').trim();
  const cleanNum = String(payment_number || '').trim();
  const cleanTrx = String(trx_id || '').trim();
  const cleanNotes = String(notes || '').trim();
  const nowIso = new Date().toISOString();

  if (!cleanName || !cleanMobile) {
    return res.status(400).json({ error: 'Name and mobile are required.' });
  }

  invalidateSheetCache('bookings');

  try {
    const { ok, rawText } = await callGoogleScript('POST', {}, {
      sheet: 'bookings',
      action: 'insert',
      data: {
        Time: nowIso,
        Name: cleanName,
        Mobile: cleanMobile,
        Location: cleanLoc,
        Service: cleanService,
        Amount: cleanAmount,
        Gateway: cleanGw,
        Payment_Number: cleanNum,
        TrxID: cleanTrx,
        Notes: cleanNotes
      }
    });

    let parsed = { success: ok };
    try { parsed = JSON.parse(rawText); } catch {}
    return res.json({
      success: true,
      message: 'Booking saved to Google Sheet successfully.',
      rowIndex: parsed.rowIndex || null
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to save booking to Google Sheet: ' + err.message });
  }
};

app.post('/api/bookings', handleBookingSubmission);
app.post('/api/book-service', handleBookingSubmission);

// Delete message or booking from Google Sheet
app.delete('/api/messages/:id', async (req, res) => {
  const targetId = String(req.params.id);
  let rowIndex = req.query.rowIndex ? parseInt(req.query.rowIndex, 10) : null;
  if (!rowIndex && targetId.startsWith('row-')) {
    const num = parseInt(targetId.replace('row-', ''), 10);
    if (!isNaN(num)) rowIndex = num + 1;
  }

  invalidateSheetCache('messages');
  if (rowIndex) {
    try {
      await callGoogleScript('POST', {}, { sheet: 'messages', action: 'delete', rowIndex });
    } catch (err) {}
  }
  res.json({ success: true });
});

app.delete('/api/bookings/:id', async (req, res) => {
  const targetId = String(req.params.id);
  let rowIndex = req.query.rowIndex ? parseInt(req.query.rowIndex, 10) : null;
  if (!rowIndex && targetId.startsWith('row-')) {
    const num = parseInt(targetId.replace('row-', ''), 10);
    if (!isNaN(num)) rowIndex = num + 1;
  }

  invalidateSheetCache('bookings');
  if (rowIndex) {
    try {
      await callGoogleScript('POST', {}, { sheet: 'bookings', action: 'delete', rowIndex });
    } catch (err) {}
  }
  res.json({ success: true });
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Fallback to index.html for client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
