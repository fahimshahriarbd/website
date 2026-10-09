const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        if (key && !(key in process.env)) process.env[key] = val;
      }
    }
  } catch (e) {
    console.warn('Could not load .env file:', e.message);
  }
}

loadEnv();

// Prevent direct public browsing of data directory
app.use('/data', (req, res) => res.status(403).json({ error: 'Access denied' }));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Admin Credentials & Token Secret
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@fahimshahriar.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Fahim#Secure@2025';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fahim-admin-jwt-token-secret-key-928374';

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

  // Compare using timing-safe buffer comparison to prevent timing attacks
  const emailMatch = cleanEmail === ADMIN_EMAIL;
  let passMatch = false;
  try {
    const passBuf = Buffer.from(cleanPassword);
    const expectedPassBuf = Buffer.from(ADMIN_PASSWORD);
    if (passBuf.length === expectedPassBuf.length && crypto.timingSafeEqual(passBuf, expectedPassBuf)) {
      passMatch = true;
    }
  } catch (e) {}

  if (!emailMatch || !passMatch) {
    rec.count += 1;
    if (rec.count >= 5) {
      rec.lockUntil = Date.now() + 5 * 60 * 1000; // 5 min lockout
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

function readJsonFile(filename, fallback = []) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return fallback;
  }
}

function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

// API: Config — provides Supabase & Google Script public configuration
app.get('/api/config', (req, res) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwFIJVTNzF50zCcv6Ppk2n041_tXHFEWcKM1ouSQsCQ-HzcNUkjUTjNvesNnN_KZ38ovg/exec';
  res.json({ supabaseUrl, supabaseAnonKey, googleScriptUrl, mode: 'google_sheets' });
});

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFIJVTNzF50zCcv6Ppk2n041_tXHFEWcKM1ouSQsCQ-HzcNUkjUTjNvesNnN_KZ38ovg/exec';

async function syncRowToGoogleSheet(sheetName, data) {
  const targetScriptUrl = process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
  try {
    const res = await fetch(targetScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3500),
      body: JSON.stringify({
        sheet: sheetName,
        action: 'insert',
        data: data
      })
    });
    return res.ok;
  } catch (err) {
    console.error(`[Google Sheet Sync Error] ${sheetName}:`, err.message);
    return false;
  }
}

// Proxy to Google Apps Script (handles CORS, redirects, and clean JSON parsing)
app.all('/api/sheet-proxy', async (req, res) => {
  const targetScriptUrl = process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
  try {
    const url = new URL(targetScriptUrl);
    // Forward all query parameters
    for (const [key, val] of Object.entries(req.query)) {
      url.searchParams.set(key, val);
    }

    const fetchOptions = {
      method: req.method,
      redirect: 'follow',
      signal: AbortSignal.timeout(4000),
      headers: {
        'Accept': 'application/json'
      }
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(req.body);
    }

    const scriptRes = await fetch(url.toString(), fetchOptions);
    const rawText = await scriptRes.text();

    try {
      const data = JSON.parse(rawText);
      return res.status(scriptRes.status).json(data);
    } catch {
      return res.status(scriptRes.status).send(rawText);
    }
  } catch (err) {
    console.error('[Sheet Proxy Error]:', err.message);
    return res.status(502).json({ error: 'Failed to communicate with Google Sheets script: ' + err.message });
  }
});

// API: Contact messages (reads live from Google Sheet, falls back to local JSON)
app.get('/api/messages', async (req, res) => {
  const targetScriptUrl = process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
  try {
    const sheetRes = await fetch(`${targetScriptUrl}?sheet=messages`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500),
      redirect: 'follow'
    });
    if (sheetRes.ok) {
      const sheetData = await sheetRes.json();
      if (Array.isArray(sheetData) && sheetData.length > 0) {
        const mapped = sheetData.map((row, idx) => ({
          id: row.id || ('row-' + (idx + 1)),
          _rowIndex: row._rowIndex || (idx + 2),
          name: row.Name || row.name || 'Anonymous',
          email: row.Email || row.email || '',
          subject: row.Subject || row.subject || '',
          message: row.Message || row.message || '',
          status: 'new',
          created_at: row.Time || row.time || new Date().toISOString()
        })).filter(m => m.name || m.email || m.message);
        return res.json(mapped);
      }
    }
  } catch (e) {
    console.warn('[Sheet fetch messages fallback]:', e.message);
  }
  res.json(readJsonFile('messages.json', []));
});

const handleContactSubmission = (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim();
  const cleanSubject = String(subject || '').trim();
  const cleanMessage = String(message || '').trim();
  const nowIso = new Date().toISOString();

  const messages = readJsonFile('messages.json', []);
  const newMsg = {
    id: 'msg-' + Date.now(),
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMessage,
    status: 'new',
    created_at: nowIso
  };
  messages.unshift(newMsg);
  writeJsonFile('messages.json', messages);

  // Sync to Google Sheet
  syncRowToGoogleSheet('messages', {
    Time: nowIso,
    Name: cleanName,
    Email: cleanEmail,
    Subject: cleanSubject,
    Message: cleanMessage
  });

  res.json({ success: true, message: 'Message saved successfully.', data: newMsg });
};

app.post('/api/messages', handleContactSubmission);
app.post('/api/contact-message', handleContactSubmission);

// API: Service bookings (reads live from Google Sheet, falls back to local JSON)
app.get('/api/bookings', async (req, res) => {
  const targetScriptUrl = process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
  try {
    const sheetRes = await fetch(`${targetScriptUrl}?sheet=bookings`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500),
      redirect: 'follow'
    });
    if (sheetRes.ok) {
      const sheetData = await sheetRes.json();
      if (Array.isArray(sheetData) && sheetData.length > 0) {
        const mapped = sheetData.map((row, idx) => ({
          id: row.id || ('row-' + (idx + 1)),
          _rowIndex: row._rowIndex || (idx + 2),
          name: row.Name || row.name || 'Anonymous',
          mobile: row.Mobile || row.mobile || '',
          location: row.Location || row.location || '',
          service_title: row.Service || row.service || row.Service_Title || row.service_title || 'Service',
          amount: row.Amount || row.amount || '',
          payment_gateway: row.Gateway || row.gateway || row.Payment_Gateway || row.payment_gateway || 'bKash',
          payment_number: row.Payment_Number || row.payment_number || '',
          trx_id: row.TrxID || row.trx_id || row.Trx_Id || '',
          notes: row.Notes || row.notes || '',
          status: 'pending',
          created_at: row.Time || row.time || new Date().toISOString()
        })).filter(b => b.name || b.mobile);
        return res.json(mapped);
      }
    }
  } catch (e) {
    console.warn('[Sheet fetch bookings fallback]:', e.message);
  }
  res.json(readJsonFile('bookings.json', []));
});

// Delete message or booking
app.delete('/api/messages/:id', async (req, res) => {
  const targetId = String(req.params.id);
  const targetScriptUrl = process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;

  let rowIndex = req.query.rowIndex ? parseInt(req.query.rowIndex, 10) : null;
  if (!rowIndex && targetId.startsWith('row-')) {
    const num = parseInt(targetId.replace('row-', ''), 10);
    if (!isNaN(num)) rowIndex = num + 1;
  }

  if (rowIndex) {
    try {
      await fetch(targetScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3500),
        body: JSON.stringify({ sheet: 'messages', action: 'delete', rowIndex })
      });
    } catch (err) {
      console.warn('[Sheet delete error]:', err.message);
    }
  }

  const messages = readJsonFile('messages.json', []);
  const updated = messages.filter(m => String(m.id) !== targetId);
  writeJsonFile('messages.json', updated);
  res.json({ success: true, count: messages.length - updated.length });
});

app.delete('/api/bookings/:id', async (req, res) => {
  const targetId = String(req.params.id);
  const targetScriptUrl = process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;

  let rowIndex = req.query.rowIndex ? parseInt(req.query.rowIndex, 10) : null;
  if (!rowIndex && targetId.startsWith('row-')) {
    const num = parseInt(targetId.replace('row-', ''), 10);
    if (!isNaN(num)) rowIndex = num + 1;
  }

  if (rowIndex) {
    try {
      await fetch(targetScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3500),
        body: JSON.stringify({ sheet: 'bookings', action: 'delete', rowIndex })
      });
    } catch (err) {
      console.warn('[Sheet delete error]:', err.message);
    }
  }

  const bookings = readJsonFile('bookings.json', []);
  const updated = bookings.filter(b => String(b.id) !== targetId);
  writeJsonFile('bookings.json', updated);
  res.json({ success: true, count: bookings.length - updated.length });
});

const handleBookingSubmission = (req, res) => {
  const { name, mobile, location, service_title, amount, payment_gateway, payment_number, trx_id, notes } = req.body || {};
  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile are required.' });
  }
  const cleanName = String(name).trim();
  const cleanMobile = String(mobile).trim();
  const cleanLoc = String(location || '').trim();
  const cleanService = String(service_title || 'Service').trim();
  const cleanAmount = String(amount || '').trim();
  const cleanGw = String(payment_gateway || 'bKash').trim();
  const cleanNum = String(payment_number || '').trim();
  const cleanTrx = String(trx_id || '').trim();
  const cleanNotes = String(notes || '').trim();
  const nowIso = new Date().toISOString();

  const bookings = readJsonFile('bookings.json', []);
  const newBooking = {
    id: 'book-' + Date.now(),
    name: cleanName,
    mobile: cleanMobile,
    location: cleanLoc,
    service_title: cleanService,
    amount: cleanAmount,
    payment_gateway: cleanGw,
    payment_number: cleanNum,
    trx_id: cleanTrx,
    notes: cleanNotes,
    status: 'pending',
    created_at: nowIso
  };
  bookings.unshift(newBooking);
  writeJsonFile('bookings.json', bookings);

  // Sync to Google Sheet
  syncRowToGoogleSheet('bookings', {
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
  });

  res.json({ success: true, message: 'Booking received successfully.', data: newBooking });
};

app.post('/api/bookings', handleBookingSubmission);
app.post('/api/book-service', handleBookingSubmission);

// Serve static assets from project root
app.use(express.static(__dirname));

// Fallback to index.html for client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
