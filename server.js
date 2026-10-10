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

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_TABLES = {
  blog_posts: [
    {
      id: 'b-sheet-1',
      title: 'প্রতিদিন দাঁত ব্রাশ না করলে কী হয়?',
      category: 'Oral Care',
      image: 'https://i.postimg.cc/7Pz8X31R/screenshot-13.png',
      date: '2026-10-10',
      read_time: '5',
      summary: 'নিয়মিত দাঁত ব্রাশ না করার ফলে ডেন্টাল প্লাক, মাড়ির প্রদাহ (জিঞ্জিভাইটিস), মুখে দুর্গন্ধ এবং দাঁতের ক্ষয়রোগের ঝুঁকি বহুগুণ বেড়ে যায়। জেনে নিন সঠিক উপায়ে দাঁত পরিষ্কার রাখার প্রয়োজনীয় কৌশল।',
      content: 'নিয়মিত দাঁত ব্রাশ না করার ফলে ডেন্টাল প্লাক জমে পাথর বা টার্টারে পরিণত হয়। এর ফলে মাড়ি থেকে রক্ত পড়া, জিঞ্জিভাইটিস এবং মারাত্মক পেরিওডন্টাইটিস হতে পারে।\n\nপ্রতিদিন অন্তত দু\'বার ২ মিনিট করে ফ্লুরাইডযুক্ত টুথপেস্ট দিয়ে সঠিক পদ্ধতিতে ব্রাশ করা উচিত। রাতে ঘুমানোর আগে ব্রাশ করা সবচেয়ে বেশি গুরুত্বপূর্ণ।',
      link: '#',
      published: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  gallery_photos: [
    {
      id: 'g-sheet-1',
      image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/fahim200KB.png',
      caption: 'Chattogram Medical College — Dental Unit Campus',
      category: 'Campus',
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  services: [
    {
      id: 's-sheet-1',
      icon: '🏠',
      title: 'Home Tutoring - HSC',
      category: 'Tuition',
      price: '9,000 BDT',
      description: 'Days: 3 Days/Week, Subjects: Biology, Chemistry, Duration: 1 hour',
      is_active: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  achievements: [
    {
      id: 'a-sheet-1',
      icon: '🎓',
      title: 'Admission to CMC',
      description: 'Secured admission to the Dental Unit of Chittagong Medical College in 2024, achieving 285 out of 300 marks (95%) in the competitive national admission process.',
      published: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  projects: [
    {
      id: 'p-sheet-1',
      icon: '🎓',
      title: 'DTC Web App',
      category: 'Education',
      description: 'A question-card system to save studied topics, revisit important questions, and refresh forgotten knowledge through quick revision.',
      link: 'https://bds-to-bcs.vercel.app/',
      published: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'p-sheet-2',
      icon: '🎓',
      title: 'StudyWise App',
      category: 'Education',
      description: 'StudyWise helps students access daily lessons, download notes, and practice topic-based quizzes.',
      link: 'https://fahimshahriar.com.bd',
      published: true,
      sort_order: 2,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'p-sheet-3',
      icon: 'Ω',
      title: 'Omega Tuition Media',
      category: 'Business',
      description: 'Connecting students with suitable tutors and helping build reliable tuition opportunities through a simple and trusted platform.',
      link: 'https://www.facebook.com/omega.tuition.media',
      published: true,
      sort_order: 3,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'p-sheet-4',
      icon: '🎯',
      title: 'MediXm',
      category: 'Education',
      description: 'Created 8,000+ original questions from core textbooks and organized free study materials, videos, and PDFs for medical and dental admission candidates.',
      link: 'https://sites.google.com/view/medixm/home',
      published: true,
      sort_order: 4,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'p-sheet-5',
      icon: '🍱',
      title: 'Food Order Web App',
      category: 'Automation',
      description: 'A digital Sehri food-ordering system that collects orders from students and sends organized data directly to dining authorities, eliminating tokens and manual hassle.',
      link: 'https://food-peach-three-45.vercel.app/',
      published: true,
      sort_order: 5,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  testimonials: [
    {
      id: 't-sheet-1',
      name: 'Nahomir Islam Chowdhury',
      tag: 'Friend',
      about: 'Website',
      feedback: 'Exceptionally well conceived and meticulously executed. The seamless interplay of contemporary design, intuitive navigation, and purposeful functionality creates a digital experience that is both sophisticated and engaging, particularly well suited to presenting medical and research-oriented content with clarity and credibility. I truly appreciate the thought, effort, and attention to detail invested in transforming complex professional work into such an accessible and compelling digital platform. A truly distinctive piece of work that reflects creativity, precision, technical expertise, and a strong sense of vision.',
      image: 'https://media.licdn.com/dms/image/v2/D4E03AQGN605C8Vp12A/profile-displayphoto-scale_400_400/B4EZqsGV3LKMAg-/0/1763823938540?e=1792627200&v=beta&t=XQKmfSFFITO7sTIrZ9Ft54rjl8t72kmS2BHD05OtxFY',
      link: 'https://www.linkedin.com/in/nahomirislamchowdhury/',
      published: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  cvs: [
    {
      id: 'c-sheet-1',
      title: 'Student CV',
      download_link: 'https://i.postimg.cc/3JZxV4yk/screenshot-10.png',
      password: '12',
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'c-sheet-2',
      title: 'Tuition CV',
      download_link: 'https://i.postimg.cc/3JZxV4yk/screenshot-10.png',
      password: '12',
      sort_order: 2,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'c-sheet-3',
      title: 'Marrige CV',
      download_link: 'https://i.postimg.cc/3JZxV4yk/screenshot-10.png',
      password: '12',
      sort_order: 3,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'c-sheet-4',
      title: 'Career CV',
      download_link: 'https://i.postimg.cc/3JZxV4yk/screenshot-10.png',
      password: '12',
      sort_order: 4,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  messages: [],
  bookings: []
};

const TABLE_NAME_MAP = {
  blog: 'blog_posts',
  blog_posts: 'blog_posts',
  gallery: 'gallery_photos',
  gallery_photos: 'gallery_photos',
  cv: 'cvs',
  cvs: 'cvs',
  projects: 'projects',
  services: 'services',
  achievements: 'achievements',
  testimonials: 'testimonials',
  messages: 'messages',
  bookings: 'bookings'
};

function getCanonicalTableName(name) {
  const k = String(name || '').trim().toLowerCase();
  return TABLE_NAME_MAP[k] || k;
}

function readJsonFile(filename, fallback = []) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : fallback;
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

function readTableData(tableName) {
  const canonical = getCanonicalTableName(tableName);
  const filename = `${canonical}.json`;
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    const initial = DEFAULT_TABLES[canonical] || [];
    writeJsonFile(filename, initial);
    return initial;
  }
  return readJsonFile(filename, DEFAULT_TABLES[canonical] || []);
}

function writeTableData(tableName, rows) {
  const canonical = getCanonicalTableName(tableName);
  const filename = `${canonical}.json`;
  return writeJsonFile(filename, Array.isArray(rows) ? rows : []);
}

// Seed initial table files if missing
for (const tbl of Object.keys(DEFAULT_TABLES)) {
  const fp = path.join(DATA_DIR, `${tbl}.json`);
  if (!fs.existsSync(fp)) {
    writeJsonFile(`${tbl}.json`, DEFAULT_TABLES[tbl]);
  }
}

// Admin Credentials & Token Secret
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@fahimshahriar.com.bd').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '3778788467';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fahim-admin-jwt-token-secret-key-928374';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFIJVTNzF50zCcv6Ppk2n041_tXHFEWcKM1ouSQsCQ-HzcNUkjUTjNvesNnN_KZ38ovg/exec';

function getActiveGoogleScriptUrl() {
  try {
    const cfgPath = path.join(DATA_DIR, 'config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (cfg && cfg.googleScriptUrl) return cfg.googleScriptUrl;
    }
  } catch (e) {}
  return process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;
}

function saveCustomGoogleScriptUrl(url) {
  try {
    const cfgPath = path.join(DATA_DIR, 'config.json');
    fs.writeFileSync(cfgPath, JSON.stringify({ googleScriptUrl: String(url || '').trim(), updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
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

// API: Config — provides Google Script public configuration & allows admin to update it
app.get('/api/config', (req, res) => {
  const googleScriptUrl = getActiveGoogleScriptUrl();
  res.json({ googleScriptUrl, mode: 'hybrid_persistent_and_google_sheets' });
});

app.post('/api/config', (req, res) => {
  const { googleScriptUrl } = req.body || {};
  if (googleScriptUrl && String(googleScriptUrl).startsWith('https://script.google.com/')) {
    saveCustomGoogleScriptUrl(googleScriptUrl);
    sheetCache.clear();
    return res.json({ success: true, googleScriptUrl: getActiveGoogleScriptUrl() });
  }
  return res.status(400).json({ error: 'Please provide a valid Google Apps Script Web App URL.' });
});

// Proxy to Google Apps Script (handles CORS, redirects, and clean JSON parsing)
const SHEET_ALIAS_MAP = {
  blog_posts: 'blog',
  gallery_photos: 'gallery',
  cvs: 'cv',
  blog: 'blog',
  gallery: 'gallery',
  cv: 'cv'
};

function normalizeSheetParam(s) {
  if (!s) return s;
  const k = String(s).trim().toLowerCase();
  return SHEET_ALIAS_MAP[k] || String(s).trim();
}

async function syncRowToGoogleSheet(sheetName, action, data, rowIndex, id) {
  const targetScriptUrl = getActiveGoogleScriptUrl();
  const normalizedSheet = normalizeSheetParam(sheetName);
  try {
    const payload = {
      sheet: normalizedSheet,
      action: action || 'insert',
      data: data || {}
    };
    if (rowIndex) payload.rowIndex = rowIndex;
    if (id) payload.id = id;

    const res = await fetch(targetScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    if (res.ok && text && !text.trim().startsWith('<')) {
      try {
        return JSON.parse(text);
      } catch {
        return { success: true };
      }
    }
    return null;
  } catch (err) {
    console.warn(`[Google Sheet Sync Notice] ${normalizedSheet} (${action}):`, err.message);
    return null;
  }
}

// In-memory cache for Google Sheet responses
const sheetCache = new Map();
const SHEET_CACHE_TTL = 45 * 1000; // 45 seconds TTL for fast updates

function invalidateSheetCache(sheetName) {
  const norm = normalizeSheetParam(sheetName);
  const canon = getCanonicalTableName(sheetName);
  for (const k of sheetCache.keys()) {
    if (k.startsWith(norm + ':') || k.startsWith(canon + ':')) {
      sheetCache.delete(k);
    }
  }
}

// Unified Database API for all tables (local JSON persistence + Google Sheets sync)
app.get('/api/db/:table', async (req, res) => {
  const canonical = getCanonicalTableName(req.params.table);
  const localRows = readTableData(canonical);
  res.json({ data: localRows, table: canonical });
});

app.post('/api/db/:table', async (req, res) => {
  const canonical = getCanonicalTableName(req.params.table);
  const { action = 'insert', data, id, rowIndex, sheetPayload } = req.body || {};
  let rows = readTableData(canonical);

  if (action === 'replace_all' && Array.isArray(data)) {
    writeTableData(canonical, data);
    invalidateSheetCache(canonical);
    return res.json({ success: true, data });
  }

  if (action === 'insert') {
    const items = Array.isArray(data) ? data : [data || {}];
    const inserted = items.map((item, idx) => ({
      id: item.id || (`${canonical.charAt(0)}-${Date.now()}-${idx}`),
      _rowIndex: item._rowIndex || (rows.length + idx + 2),
      created_at: item.created_at || new Date().toISOString(),
      ...item
    }));

    // Avoid duplicate IDs
    for (const newItem of inserted) {
      const existingIdx = rows.findIndex(r => String(r.id) === String(newItem.id));
      if (existingIdx !== -1) {
        rows[existingIdx] = { ...rows[existingIdx], ...newItem };
      } else {
        if (['messages', 'bookings'].includes(canonical)) {
          rows.unshift(newItem);
        } else {
          rows.push(newItem);
        }
      }
    }

    writeTableData(canonical, rows);
    invalidateSheetCache(canonical);

    if (sheetPayload) {
      const firstId = inserted[0]?.id;
      const sheetRes = await syncRowToGoogleSheet(canonical, 'insert', sheetPayload, null, firstId);
      if (sheetRes && sheetRes.rowIndex && inserted[0]) {
        inserted[0]._rowIndex = sheetRes.rowIndex;
        writeTableData(canonical, rows);
      }
    }

    return res.json({ success: true, data: Array.isArray(data) ? inserted : inserted[0] });
  }

  if (action === 'update') {
    const targetId = String(id || (data && data.id) || '');
    let updatedItem = null;
    rows = rows.map((r, i) => {
      const matchById = targetId && String(r.id) === targetId;
      const matchByRow = !matchById && rowIndex && Number(r._rowIndex) === Number(rowIndex);
      if (matchById || matchByRow) {
        updatedItem = { ...r, ...(data || {}), id: r.id };
        return updatedItem;
      }
      return r;
    });

    // If item was from Google Sheet and not yet in local file, add it
    if (!updatedItem && data) {
      updatedItem = {
        id: targetId || (`${canonical.charAt(0)}-${Date.now()}`),
        _rowIndex: rowIndex || (rows.length + 2),
        created_at: new Date().toISOString(),
        ...data
      };
      rows.push(updatedItem);
    }

    writeTableData(canonical, rows);
    invalidateSheetCache(canonical);

    if (sheetPayload) {
      await syncRowToGoogleSheet(canonical, 'update', sheetPayload, rowIndex || updatedItem?._rowIndex, targetId);
    }

    return res.json({ success: true, data: updatedItem });
  }

  if (action === 'delete') {
    const targetId = String(id || '');
    const beforeCount = rows.length;
    rows = rows.filter(r => {
      if (targetId && String(r.id) === targetId) return false;
      if (!targetId && rowIndex && Number(r._rowIndex) === Number(rowIndex)) return false;
      return true;
    });
    writeTableData(canonical, rows);
    invalidateSheetCache(canonical);

    await syncRowToGoogleSheet(canonical, 'delete', null, rowIndex, targetId);

    return res.json({ success: true, deleted: beforeCount - rows.length });
  }

  return res.status(400).json({ error: 'Unsupported action' });
});

app.all('/api/sheet-proxy', async (req, res) => {
  const targetScriptUrl = getActiveGoogleScriptUrl();
  const isRead = req.method === 'GET';
  const targetSheet = normalizeSheetParam(req.query.sheet || (req.body && req.body.sheet) || '');
  const forceRefresh = req.query.refresh === '1' || req.query.nocache === '1';
  const cacheKey = `${targetSheet}:${JSON.stringify(req.query)}`;

  // Serve from cache on GET if fresh and not forced refresh
  if (isRead && !forceRefresh && targetSheet && sheetCache.has(cacheKey)) {
    const cached = sheetCache.get(cacheKey);
    if (Date.now() - cached.timestamp < SHEET_CACHE_TTL) {
      return res.json(cached.data);
    }
  }

  try {
    const url = new URL(targetScriptUrl);
    for (const [key, val] of Object.entries(req.query)) {
      if (key === 'refresh' || key === 'nocache') continue;
      const finalVal = (key === 'sheet') ? normalizeSheetParam(val) : val;
      url.searchParams.set(key, finalVal);
    }

    const fetchOptions = {
      method: req.method,
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json'
      }
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const bodyPayload = { ...req.body };
      if (bodyPayload.sheet) {
        bodyPayload.sheet = normalizeSheetParam(bodyPayload.sheet);
      }
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(bodyPayload);
    }

    const scriptRes = await fetch(url.toString(), fetchOptions);
    const rawText = await scriptRes.text();

    try {
      const data = JSON.parse(rawText);
      if (isRead && targetSheet && scriptRes.ok && Array.isArray(data)) {
        sheetCache.set(cacheKey, { data, timestamp: Date.now() });
      } else if (!isRead && targetSheet) {
        invalidateSheetCache(targetSheet);
      }
      return res.status(scriptRes.status).json(data);
    } catch {
      if (isRead && sheetCache.has(cacheKey)) {
        return res.json(sheetCache.get(cacheKey).data);
      }
      return res.status(502).json({ error: 'Google Sheet returned non-JSON response (HTML)' });
    }
  } catch (err) {
    if (isRead && sheetCache.has(cacheKey)) {
      return res.json(sheetCache.get(cacheKey).data);
    }
    const isTimeout = err.name === 'TimeoutError' || String(err.message).toLowerCase().includes('timeout') || String(err.message).toLowerCase().includes('aborted');
    if (isTimeout) {
      return res.status(504).json({ error: 'Google Sheet operation timed out after 15 seconds', timeout: true });
    }
    return res.status(502).json({ error: 'Failed to communicate with Google Sheets script: ' + err.message });
  }
});

// API: Contact messages (merges live Google Sheet + local JSON)
app.get('/api/messages', async (req, res) => {
  const targetScriptUrl = getActiveGoogleScriptUrl();
  const localMessages = readTableData('messages');
  try {
    const sheetRes = await fetch(`${targetScriptUrl}?sheet=messages`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(12000),
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
          status: row.Status || row.status || 'new',
          created_at: row.Time || row.time || row.Created_At || new Date().toISOString()
        })).filter(m => m.name || m.email || m.message);

        // Merge with any local messages that aren't in sheet yet
        const seenKeys = new Set(mapped.map(m => `${m.email}|${m.message}`.toLowerCase()));
        for (const loc of localMessages) {
          const key = `${loc.email}|${loc.message}`.toLowerCase();
          if (!seenKeys.has(key)) {
            mapped.unshift(loc);
          }
        }
        writeTableData('messages', mapped);
        return res.json(mapped);
      }
    }
  } catch (e) {}
  res.json(localMessages);
});

const handleContactSubmission = async (req, res) => {
  const { id, name, email, subject, message, created_at } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim();
  const cleanSubject = String(subject || '').trim();
  const cleanMessage = String(message || '').trim();
  const nowIso = created_at || new Date().toISOString();
  const msgId = id || ('msg-' + Date.now());

  const messages = readTableData('messages');
  // Prevent duplicate submission within 5 seconds
  const isDuplicate = messages.some(m =>
    String(m.id) === String(msgId) ||
    (m.email === cleanEmail && m.message === cleanMessage && Math.abs(new Date(m.created_at).getTime() - new Date(nowIso).getTime()) < 5000)
  );

  let newMsg = messages.find(m => String(m.id) === String(msgId));
  if (!isDuplicate) {
    newMsg = {
      id: msgId,
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      status: 'new',
      created_at: nowIso
    };
    messages.unshift(newMsg);
    writeTableData('messages', messages);
  }

  invalidateSheetCache('messages');

  const synced = await syncRowToGoogleSheet('messages', 'insert', {
    id: msgId,
    Time: nowIso,
    Name: cleanName,
    Email: cleanEmail,
    Subject: cleanSubject,
    Message: cleanMessage,
    Status: 'new'
  }, null, msgId);

  res.json({ success: true, message: 'Message saved successfully.', data: newMsg, synced: Boolean(synced) });
};

app.post('/api/messages', handleContactSubmission);
app.post('/api/contact-message', handleContactSubmission);

// API: Service bookings (merges live Google Sheet + local JSON)
app.get('/api/bookings', async (req, res) => {
  const targetScriptUrl = getActiveGoogleScriptUrl();
  const localBookings = readTableData('bookings');
  try {
    const sheetRes = await fetch(`${targetScriptUrl}?sheet=bookings`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(12000),
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
          status: row.Status || row.status || 'pending',
          created_at: row.Time || row.time || row.Created_At || new Date().toISOString()
        })).filter(b => b.name || b.mobile);

        const seenKeys = new Set(mapped.map(b => `${b.mobile}|${b.service_title}|${b.trx_id}`.toLowerCase()));
        for (const loc of localBookings) {
          const key = `${loc.mobile}|${loc.service_title}|${loc.trx_id}`.toLowerCase();
          if (!seenKeys.has(key)) {
            mapped.unshift(loc);
          }
        }
        writeTableData('bookings', mapped);
        return res.json(mapped);
      }
    }
  } catch (e) {}
  res.json(localBookings);
});

app.delete('/api/messages/:id', async (req, res) => {
  const targetId = String(req.params.id);
  let rowIndex = req.query.rowIndex ? parseInt(req.query.rowIndex, 10) : null;
  if (!rowIndex && targetId.startsWith('row-')) {
    const num = parseInt(targetId.replace('row-', ''), 10);
    if (!isNaN(num)) rowIndex = num + 1;
  }

  await syncRowToGoogleSheet('messages', 'delete', null, rowIndex, targetId);

  const messages = readTableData('messages');
  const updated = messages.filter(m => String(m.id) !== targetId);
  writeTableData('messages', updated);
  invalidateSheetCache('messages');
  res.json({ success: true, count: messages.length - updated.length });
});

app.delete('/api/bookings/:id', async (req, res) => {
  const targetId = String(req.params.id);
  let rowIndex = req.query.rowIndex ? parseInt(req.query.rowIndex, 10) : null;
  if (!rowIndex && targetId.startsWith('row-')) {
    const num = parseInt(targetId.replace('row-', ''), 10);
    if (!isNaN(num)) rowIndex = num + 1;
  }

  await syncRowToGoogleSheet('bookings', 'delete', null, rowIndex, targetId);

  const bookings = readTableData('bookings');
  const updated = bookings.filter(b => String(b.id) !== targetId);
  writeTableData('bookings', updated);
  invalidateSheetCache('bookings');
  res.json({ success: true, count: bookings.length - updated.length });
});

const handleBookingSubmission = async (req, res) => {
  const { id, name, mobile, location, service_title, amount, payment_gateway, payment_number, trx_id, notes, created_at } = req.body || {};
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
  const nowIso = created_at || new Date().toISOString();
  const bookId = id || ('book-' + Date.now());

  const bookings = readTableData('bookings');
  const isDuplicate = bookings.some(b =>
    String(b.id) === String(bookId) ||
    (b.mobile === cleanMobile && b.service_title === cleanService && b.payment_number === cleanNum && Math.abs(new Date(b.created_at).getTime() - new Date(nowIso).getTime()) < 5000)
  );

  let newBooking = bookings.find(b => String(b.id) === String(bookId));
  if (!isDuplicate) {
    newBooking = {
      id: bookId,
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
    writeTableData('bookings', bookings);
  }

  invalidateSheetCache('bookings');

  const synced = await syncRowToGoogleSheet('bookings', 'insert', {
    id: bookId,
    Time: nowIso,
    Name: cleanName,
    Mobile: cleanMobile,
    Location: cleanLoc,
    Service: cleanService,
    Amount: cleanAmount,
    Gateway: cleanGw,
    Payment_Number: cleanNum,
    TrxID: cleanTrx,
    Notes: cleanNotes,
    Status: 'pending'
  }, null, bookId);

  res.json({ success: true, message: 'Booking received successfully.', data: newBooking, synced: Boolean(synced) });
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
