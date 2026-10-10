/* ============================================================
   GOOGLE DATABASE & RESILIENT DATA STORE
   Fahim Shahriar Website

   Loads and syncs live content across:
   1. Google Sheets (via server proxy & direct Apps Script fallback)
   2. Server-side JSON Database (/api/db/:table -> data/*.json)
   3. Browser Persistent LocalStorage Cache
   ============================================================ */

let supabaseInstance = null;

const DEFAULT_DATABASE = {
  "blog_posts": [
    {
      "id": "b-sheet-1",
      "title": "প্রতিদিন দাঁত ব্রাশ না করলে কী হয়?",
      "category": "Oral Care",
      "image": "https://i.postimg.cc/7Pz8X31R/screenshot-13.png",
      "date": "2026-10-10",
      "read_time": "5",
      "summary": "নিয়মিত দাঁত ব্রাশ না করার ফলে ডেন্টাল প্লাক, মাড়ির প্রদাহ (জিঞ্জিভাইটিস), মুখে দুর্গন্ধ এবং দাঁতের ক্ষয়রোগের ঝুঁকি বহুগুণ বেড়ে যায়। জেনে নিন সঠিক উপায়ে দাঁত পরিষ্কার রাখার প্রয়োজনীয় কৌশল।",
      "content": "নিয়মিত দাঁত ব্রাশ না করার ফলে ডেন্টাল প্লাক জমে পাথর বা টার্টারে পরিণত হয়। এর ফলে মাড়ি থেকে রক্ত পড়া, জিঞ্জিভাইটিস এবং মারাত্মক পেরিওডন্টাইটিস হতে পারে।\n\nপ্রতিদিন অন্তত দু'বার ২ মিনিট করে ফ্লুরাইডযুক্ত টুথপেস্ট দিয়ে সঠিক পদ্ধতিতে ব্রাশ করা উচিত। রাতে ঘুমানোর আগে ব্রাশ করা সবচেয়ে বেশি গুরুত্বপূর্ণ।",
      "link": "#",
      "published": true,
      "sort_order": 1,
      "created_at": "2026-10-09T00:00:00.000Z"
    }
  ],
  "gallery_photos": [
    {
      "id": "g-sheet-1",
      "image_url": "https://res.cloudinary.com/ltd7gw9d/image/upload/fahim200KB.png",
      "caption": "Chattogram Medical College — Dental Unit Campus",
      "category": "Campus",
      "sort_order": 1,
      "created_at": "2026-10-09T00:00:00.000Z"
    }
  ],
  "services": [
    {
      "id": "s-sheet-1",
      "icon": "🏠",
      "title": "Home Tutoring - HSC",
      "category": "Tuition",
      "price": "9,000 BDT",
      "description": "Days: 3 Days/Week, Subjects: Biology, Chemistry, Duration: 1 hour",
      "is_active": true,
      "sort_order": 1,
      "created_at": "2026-10-09T00:00:00.000Z"
    }
  ],
  "achievements": [
    {
      "id": "a-sheet-1",
      "icon": "🎓",
      "title": "Admission to CMC",
      "description": "Secured admission to the Dental Unit of Chittagong Medical College in 2024, achieving 285 out of 300 marks (95%) in the competitive national admission process.",
      "published": true,
      "sort_order": 1,
      "created_at": "2026-10-09T00:00:00.000Z"
    }
  ],
  "projects": [
    {
      "id": "p-sheet-1",
      "icon": "🎓",
      "title": "DTC Web App",
      "category": "Education",
      "description": "A question-card system to save studied topics, revisit important questions, and refresh forgotten knowledge through quick revision.",
      "link": "https://bds-to-bcs.vercel.app/",
      "published": true,
      "sort_order": 1,
      "created_at": "2026-10-09T00:00:00.000Z"
    },
    {
      "id": "p-sheet-2",
      "icon": "🎓",
      "title": "StudyWise App",
      "category": "Education",
      "description": "StudyWise helps students access daily lessons, download notes, and practice topic-based quizzes.",
      "link": "https://fahimshahriar.com.bd",
      "published": true,
      "sort_order": 2,
      "created_at": "2026-10-09T00:00:00.000Z"
    },
    {
      "id": "p-sheet-3",
      "icon": "Ω",
      "title": "Omega Tuition Media",
      "category": "Business",
      "description": "Connecting students with suitable tutors and helping build reliable tuition opportunities through a simple and trusted platform.",
      "link": "https://www.facebook.com/omega.tuition.media",
      "published": true,
      "sort_order": 3,
      "created_at": "2026-10-09T00:00:00.000Z"
    },
    {
      "id": "p-sheet-4",
      "icon": "🎯",
      "title": "MediXm",
      "category": "Education",
      "description": "Created 8,000+ original questions from core textbooks and organized free study materials, videos, and PDFs for medical and dental admission candidates.",
      "link": "https://sites.google.com/view/medixm/home",
      "published": true,
      "sort_order": 4,
      "created_at": "2026-10-09T00:00:00.000Z"
    },
    {
      "id": "p-sheet-5",
      "icon": "🍱",
      "title": "Food Order Web App",
      "category": "Automation",
      "description": "A digital Sehri food-ordering system that collects orders from students and sends organized data directly to dining authorities, eliminating tokens and manual hassle.",
      "link": "https://food-peach-three-45.vercel.app/",
      "published": true,
      "sort_order": 5,
      "created_at": "2026-10-09T00:00:00.000Z"
    }
  ],
  "testimonials": [
    {
      "id": "t-sheet-1",
      "name": "Nahomir Islam Chowdhury",
      "tag": "Friend",
      "about": "Website",
      "feedback": "Exceptionally well conceived and meticulously executed. The seamless interplay of contemporary design, intuitive navigation, and purposeful functionality creates a digital experience that is both sophisticated and engaging, particularly well suited to presenting medical and research-oriented content with clarity and credibility. I truly appreciate the thought, effort, and attention to detail invested in transforming complex professional work into such an accessible and compelling digital platform. A truly distinctive piece of work that reflects creativity, precision, technical expertise, and a strong sense of vision.",
      "image": "https://media.licdn.com/dms/image/v2/D4E03AQGN605C8Vp12A/profile-displayphoto-scale_400_400/B4EZqsGV3LKMAg-/0/1763823938540?e=1792627200&v=beta&t=XQKmfSFFITO7sTIrZ9Ft54rjl8t72kmS2BHD05OtxFY",
      "link": "https://www.linkedin.com/in/nahomirislamchowdhury/",
      "published": true,
      "sort_order": 1,
      "created_at": "2026-10-09T00:00:00.000Z"
    }
  ],
  "cvs": [
    {
      "id": "c-sheet-1",
      "title": "Student CV",
      "download_link": "https://i.postimg.cc/3JZxV4yk/screenshot-10.png",
      "password": "12",
      "sort_order": 1,
      "created_at": "2026-10-09T00:00:00.000Z"
    },
    {
      "id": "c-sheet-2",
      "title": "Tuition CV",
      "download_link": "https://i.postimg.cc/3JZxV4yk/screenshot-10.png",
      "password": "12",
      "sort_order": 2,
      "created_at": "2026-10-09T00:00:00.000Z"
    },
    {
      "id": "c-sheet-3",
      "title": "Marrige CV",
      "download_link": "https://i.postimg.cc/3JZxV4yk/screenshot-10.png",
      "password": "12",
      "sort_order": 3,
      "created_at": "2026-10-09T00:00:00.000Z"
    },
    {
      "id": "c-sheet-4",
      "title": "Career CV",
      "download_link": "https://i.postimg.cc/3JZxV4yk/screenshot-10.png",
      "password": "12",
      "sort_order": 4,
      "created_at": "2026-10-09T00:00:00.000Z"
    }
  ],
  "dental_tips": [],
  "faq": [],
  "messages": [],
  "bookings": []
};

const STORAGE_KEY = 'fahim_website_db_v5';
const AUTH_STORAGE_KEY = 'fahim_website_auth_v2';

function getLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [tName, defaultRows] of Object.entries(DEFAULT_DATABASE)) {
        if (!Array.isArray(parsed[tName])) {
          parsed[tName] = defaultRows;
        }
      }
      return parsed;
    }
  } catch (e) {}

  const fresh = JSON.parse(JSON.stringify(DEFAULT_DATABASE));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch (e) {}
  return fresh;
}

function saveLocalStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {}
}

function parseBoolFlag(val, defaultVal = true) {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (['yes', 'true', '1', 'active', 'published'].includes(s)) return true;
  if (['no', 'false', '0', 'inactive', 'hidden', 'unpublished'].includes(s)) return false;
  return defaultVal;
}

/* ---- GOOGLE SHEET TO MODEL CONVERTERS ---- */
function mapSheetRowToModel(tableName, row, idx) {
  const id = String(row.id || ('row-' + (idx + 1)));
  const _rowIndex = Number(row._rowIndex || (idx + 2));
  const sortOrder = Number(row.Sort_Order ?? row.sort_order ?? (idx + 1)) || (idx + 1);
  const createdAt = row.Created_At || row.created_at || row.Time || row.time || new Date().toISOString();

  if (tableName === 'projects') {
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? 'Project').trim(),
      icon: String(row.Icon ?? row.icon ?? '🚀').trim(),
      category: String(row.Category ?? row.category ?? 'General').trim(),
      description: String(row.Description ?? row.description ?? '').trim(),
      link: String(row.Link ?? row.link ?? '#').trim(),
      sort_order: sortOrder,
      published: parseBoolFlag(row.Published ?? row.published, true),
      created_at: createdAt
    };
  }
  if (tableName === 'services') {
    const rawPrice = String(row.Fee ?? row.fee ?? row.Price ?? row.price ?? '1,000').trim();
    const formattedPrice = rawPrice.toUpperCase().includes('BDT') ? rawPrice : `${rawPrice} BDT`;
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? 'Service').trim(),
      icon: String(row.Icon ?? row.icon ?? '💼').trim(),
      category: String(row.Catagory ?? row.Category ?? row.category ?? 'General').trim(),
      price: formattedPrice,
      description: String(row.Description ?? row.description ?? '').trim(),
      sort_order: sortOrder,
      is_active: parseBoolFlag(row.Active ?? row.active ?? row.is_active, true),
      created_at: createdAt
    };
  }
  if (tableName === 'testimonials') {
    return {
      id,
      _rowIndex,
      name: String(row.Name ?? row.name ?? 'Anonymous').trim(),
      tag: String(row.Relation ?? row.relation ?? row.tag ?? 'Friend').trim(),
      about: String(row.About ?? row.about ?? 'Website').trim(),
      feedback: String(row.Feedback ?? row.feedback ?? '').trim(),
      image: String(row.Image ?? row.image ?? '').trim(),
      link: String(row.Link ?? row.link ?? '#').trim(),
      sort_order: sortOrder,
      published: parseBoolFlag(row.Published ?? row.published, true),
      created_at: createdAt
    };
  }
  if (tableName === 'blog_posts' || tableName === 'blog') {
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? 'Blog Post').trim(),
      category: String(row.Category ?? row.category ?? 'Blog').trim(),
      image: String(row.Image ?? row.image ?? '').trim(),
      date: String(row.Date ?? row.date ?? '').trim(),
      read_time: String(row.ReadTime ?? row['Read Time'] ?? row.read_time ?? '5').trim(),
      summary: String(row.Summary ?? row.summary ?? '').trim(),
      content: String(row.Content ?? row.content ?? row.Summary ?? row.summary ?? '').trim(),
      link: String(row.Link ?? row.link ?? '#').trim(),
      sort_order: sortOrder,
      published: parseBoolFlag(row.Published ?? row.published, true),
      created_at: createdAt
    };
  }
  if (tableName === 'achievements') {
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? '').trim(),
      icon: String(row.Icon ?? row.icon ?? '🏆').trim(),
      description: String(row.Description ?? row.description ?? '').trim(),
      sort_order: sortOrder,
      published: parseBoolFlag(row.Published ?? row.published, true),
      created_at: createdAt
    };
  }
  if (tableName === 'gallery_photos' || tableName === 'gallery') {
    return {
      id,
      _rowIndex,
      image_url: String(row.Image_URL ?? row.image_url ?? row.Image ?? row.image ?? '').trim(),
      caption: String(row.Caption ?? row.caption ?? row.Title ?? row.title ?? '').trim(),
      category: String(row.Category ?? row.category ?? 'General').trim(),
      sort_order: sortOrder,
      created_at: createdAt
    };
  }
  if (tableName === 'cvs' || tableName === 'cv') {
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? '').trim(),
      download_link: String(row.Download_Link ?? row.download_link ?? row['Download Link'] ?? row.Link ?? row.link ?? '').trim(),
      password: row.Password !== undefined ? String(row.Password) : (row.password !== undefined ? String(row.password) : '0'),
      sort_order: sortOrder,
      created_at: createdAt
    };
  }
  if (tableName === 'messages') {
    return {
      id,
      _rowIndex,
      name: String(row.Name ?? row.name ?? 'Anonymous').trim(),
      email: String(row.Email ?? row.email ?? '').trim(),
      subject: String(row.Subject ?? row.subject ?? '').trim(),
      message: String(row.Message ?? row.message ?? '').trim(),
      status: String(row.Status ?? row.status ?? 'new').trim(),
      created_at: createdAt
    };
  }
  if (tableName === 'bookings') {
    return {
      id,
      _rowIndex,
      name: String(row.Name ?? row.name ?? 'Anonymous').trim(),
      mobile: String(row.Mobile ?? row.mobile ?? '').trim(),
      location: String(row.Location ?? row.location ?? '').trim(),
      service_title: String(row.Service ?? row.service ?? row.Service_Title ?? row.service_title ?? 'Service').trim(),
      amount: String(row.Amount ?? row.amount ?? '').trim(),
      payment_gateway: String(row.Gateway ?? row.gateway ?? row.Payment_Gateway ?? row.payment_gateway ?? 'bKash').trim(),
      payment_number: String(row.Payment_Number ?? row.payment_number ?? '').trim(),
      trx_id: String(row.TrxID ?? row.trx_id ?? row.Trx_Id ?? '').trim(),
      notes: String(row.Notes ?? row.notes ?? '').trim(),
      status: String(row.Status ?? row.status ?? 'pending').trim(),
      created_at: createdAt
    };
  }
  return { id, _rowIndex, ...row };
}

function mapModelToSheetRow(tableName, item) {
  const baseId = item.id || '';
  const sortOrder = item.sort_order ?? 1;
  const createdAt = item.created_at || new Date().toISOString();

  if (tableName === 'projects') {
    return {
      id: baseId,
      Title: item.title || '',
      Icon: item.icon || '🚀',
      Category: item.category || 'General',
      Description: item.description || '',
      Link: item.link || '#',
      Sort_Order: sortOrder,
      Published: item.published !== false ? 'yes' : 'no',
      Created_At: createdAt
    };
  }
  if (tableName === 'services') {
    const cleanNumPrice = String(item.price || '1,000').replace(/bdt/gi, '').trim();
    return {
      id: baseId,
      Title: item.title || '',
      Icon: item.icon || '💼',
      Category: item.category || 'General',
      Catagory: item.category || 'General',
      Price: cleanNumPrice,
      Fee: cleanNumPrice,
      Description: item.description || '',
      Sort_Order: sortOrder,
      Active: item.is_active !== false ? 'yes' : 'no',
      Created_At: createdAt
    };
  }
  if (tableName === 'testimonials') {
    return {
      id: baseId,
      Name: item.name || '',
      Relation: item.tag || 'Friend',
      About: item.about || 'Website',
      Feedback: item.feedback || '',
      Image: item.image || '',
      Link: item.link || '#',
      Sort_Order: sortOrder,
      Published: item.published !== false ? 'yes' : 'no',
      Created_At: createdAt
    };
  }
  if (tableName === 'blog_posts' || tableName === 'blog') {
    return {
      id: baseId,
      Title: item.title || '',
      Category: item.category || 'Blog',
      Image: item.image || '',
      Date: item.date || '',
      ReadTime: item.read_time || '5',
      Summary: item.summary || '',
      Content: item.content || '',
      Link: item.link || '#',
      Sort_Order: sortOrder,
      Published: item.published !== false ? 'yes' : 'no',
      Created_At: createdAt
    };
  }
  if (tableName === 'achievements') {
    return {
      id: baseId,
      Title: item.title || '',
      Icon: item.icon || '🏆',
      Description: item.description || '',
      Sort_Order: sortOrder,
      Published: item.published !== false ? 'yes' : 'no',
      Created_At: createdAt
    };
  }
  if (tableName === 'gallery_photos' || tableName === 'gallery') {
    return {
      id: baseId,
      Image_URL: item.image_url || '',
      Image: item.image_url || '',
      Caption: item.caption || '',
      Category: item.category || 'General',
      Sort_Order: sortOrder,
      Created_At: createdAt
    };
  }
  if (tableName === 'cvs' || tableName === 'cv') {
    return {
      id: baseId,
      Title: item.title || '',
      Download_Link: item.download_link || '',
      'Download Link': item.download_link || '',
      Password: item.password !== undefined ? String(item.password) : '0',
      Sort_Order: sortOrder,
      Created_At: createdAt
    };
  }
  if (tableName === 'messages') {
    return {
      id: baseId,
      Time: createdAt,
      Name: item.name || '',
      Email: item.email || '',
      Subject: item.subject || '',
      Message: item.message || '',
      Status: item.status || 'new'
    };
  }
  if (tableName === 'bookings') {
    return {
      id: baseId,
      Time: createdAt,
      Name: item.name || '',
      Mobile: item.mobile || '',
      Location: item.location || '',
      Service: item.service_title || 'Service',
      Amount: item.amount || '',
      Gateway: item.payment_gateway || 'bKash',
      Payment_Number: item.payment_number || '',
      TrxID: item.trx_id || '',
      Notes: item.notes || '',
      Status: item.status || 'pending'
    };
  }
  return item;
}

let DIRECT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFIJVTNzF50zCcv6Ppk2n041_tXHFEWcKM1ouSQsCQ-HzcNUkjUTjNvesNnN_KZ38ovg/exec';

try {
  const savedScriptUrl = localStorage.getItem('fahim_custom_google_script_url');
  if (savedScriptUrl && savedScriptUrl.startsWith('https://script.google.com/')) {
    DIRECT_SCRIPT_URL = savedScriptUrl;
  }
  fetch('/api/config')
    .then(res => res.json())
    .then(cfg => {
      if (cfg && cfg.googleScriptUrl) {
        DIRECT_SCRIPT_URL = cfg.googleScriptUrl;
      }
    })
    .catch(() => {});
} catch (e) {}

function getSheetTabName(tn) {
  const m = { blog_posts: 'blog', gallery_photos: 'gallery', cvs: 'cv', blog: 'blog', gallery: 'gallery', cv: 'cv' };
  return m[tn] || tn;
}

async function syncWithServerAndSheet(tableName, action, itemData, rowIndex, id) {
  const sheetTab = getSheetTabName(tableName);
  const sheetPayload = itemData ? mapModelToSheetRow(tableName, itemData) : null;

  // 1. Sync via unified Server Database API (saves to /data/<tableName>.json + syncs to Google Sheets)
  try {
    const res = await fetch(`/api/db/${encodeURIComponent(tableName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        data: itemData,
        id,
        rowIndex,
        sheetPayload
      })
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (e) {}

  // 2. Fallback: Try /api/sheet-proxy directly
  const proxyPayload = {
    sheet: sheetTab,
    action,
    data: sheetPayload,
    id,
    rowIndex
  };
  try {
    const res = await fetch('/api/sheet-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proxyPayload)
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        return JSON.parse(text);
      }
    }
  } catch (e) {}

  // 3. Fallback: Direct browser call to Google Apps Script (for GitHub Pages / static hosting)
  try {
    const res = await fetch(DIRECT_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(proxyPayload)
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        return JSON.parse(text);
      }
    }
  } catch (e) {}

  return null;
}

async function fetchSheetRows(tableName, forceRefresh = false) {
  const sheetTab = getSheetTabName(tableName);
  const refreshParam = forceRefresh ? '&refresh=1' : '';

  // 1. Try server proxy first
  try {
    const res = await fetch(`/api/sheet-proxy?sheet=${encodeURIComponent(sheetTab)}${refreshParam}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }
  } catch (e) {}

  // 2. Try direct Google Script URL (works on static hosting)
  try {
    const res = await fetch(`${DIRECT_SCRIPT_URL}?sheet=${encodeURIComponent(sheetTab)}`);
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }
  } catch (e) {}

  return null;
}

async function fetchServerDbRows(tableName) {
  try {
    if (tableName === 'messages' || tableName === 'bookings') {
      const res = await fetch(`/api/${tableName}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    }
    const res = await fetch(`/api/db/${encodeURIComponent(tableName)}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data)) return json.data;
    }
  } catch (e) {}
  return null;
}

function createLocalSupabaseClient() {
  const authListeners = [];

  const auth = {
    async getSession() {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          return { data: { session }, error: null };
        }
      } catch (e) {}
      return { data: { session: null }, error: null };
    },
    async signInWithPassword({ email, password }) {
      if (!email || !password) {
        return { data: { user: null, session: null }, error: new Error('Email and password are required.') };
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanPassword = String(password).trim();

      let loginSuccess = false;
      let userEmail = cleanEmail;
      let token = 'admin_session_' + Date.now();

      // 1. Try server endpoint first
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
        });
        const text = await res.text();
        if (text && !text.trim().startsWith('<')) {
          try {
            const result = JSON.parse(text);
            if (res.ok && result.success) {
              loginSuccess = true;
              token = result.token || token;
              userEmail = result.email || cleanEmail;
            } else if (result && result.error) {
              return { data: { user: null, session: null }, error: new Error(result.error) };
            }
          } catch (e) {}
        }
      } catch (err) {}

      // 2. Fallback cryptographic SHA-256 verification for static hosting
      if (!loginSuccess) {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(cleanPassword);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const passHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          const authorizedAccounts = [
            { email: 'admin@fahimshahriar.com.bd', hash: '3ff079a374fde5672c297e589940eef0b28c6af353854be19da6a54d18141206' },
            { email: 'admin@fahimshahriar.com', hash: '1d43be89254b53dc6ec82c6e9710874251893571704b4e7ccf41ebd10ac1f842' }
          ];

          const isMatch = authorizedAccounts.some(acc => acc.email === cleanEmail && acc.hash === passHash);
          if (isMatch) {
            loginSuccess = true;
            userEmail = cleanEmail;
          } else {
            return { data: { user: null, session: null }, error: new Error('Invalid email or password.') };
          }
        } catch (hashErr) {
          return { data: { user: null, session: null }, error: new Error('Invalid email or password.') };
        }
      }

      const session = {
        access_token: token,
        user: {
          id: 'admin-1',
          email: userEmail,
          role: 'authenticated'
        }
      };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } catch (e) {}
      authListeners.forEach(cb => {
        try { cb('SIGNED_IN', session); } catch (e) {}
      });
      return { data: { user: session.user, session }, error: null };
    },
    async signOut() {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (e) {}
      authListeners.forEach(cb => {
        try { cb('SIGNED_OUT', null); } catch (e) {}
      });
      return { error: null };
    },
    onAuthStateChange(callback) {
      if (typeof callback === 'function') {
        authListeners.push(callback);
      }
      return {
        data: {
          subscription: {
            unsubscribe() {
              const idx = authListeners.indexOf(callback);
              if (idx !== -1) authListeners.splice(idx, 1);
            }
          }
        }
      };
    }
  };

  function from(tableName) {
    const filters = [];
    const sorts = [];
    let limitCount = null;
    let isSingle = false;
    let maybeSingleMode = false;
    let operation = 'select';
    let updatePayload = null;
    let insertPayload = null;

    const builder = {
      select() {
        if (operation !== 'update' && operation !== 'delete' && operation !== 'insert') {
          operation = 'select';
        }
        return builder;
      },
      eq(column, value) {
        filters.push(row => {
          if (typeof value === 'boolean') {
            return Boolean(row[column]) === value;
          }
          return String(row[column] ?? '').toLowerCase() === String(value ?? '').toLowerCase();
        });
        return builder;
      },
      neq(column, value) {
        filters.push(row => {
          if (typeof value === 'boolean') {
            return Boolean(row[column]) !== value;
          }
          return String(row[column] ?? '').toLowerCase() !== String(value ?? '').toLowerCase();
        });
        return builder;
      },
      order(column, options = {}) {
        const ascending = options.ascending !== false;
        sorts.push({ column, ascending });
        return builder;
      },
      limit(count) {
        limitCount = count;
        return builder;
      },
      single() {
        isSingle = true;
        return builder;
      },
      maybeSingle() {
        maybeSingleMode = true;
        return builder;
      },
      insert(dataOrArray) {
        operation = 'insert';
        insertPayload = dataOrArray;
        return builder;
      },
      update(updateFields) {
        operation = 'update';
        updatePayload = updateFields;
        return builder;
      },
      delete() {
        operation = 'delete';
        return builder;
      },

      then(onFulfilled, onRejected) {
        const execute = async () => {
          // --- INSERT OPERATION ---
          if (operation === 'insert') {
            const store = getLocalStore();
            if (!store[tableName]) store[tableName] = [];

            const items = Array.isArray(insertPayload) ? insertPayload : [insertPayload];
            const inserted = items.map((item, i) => ({
              id: item.id || (`${tableName.charAt(0)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
              _rowIndex: (store[tableName].length + i + 2),
              created_at: item.created_at || new Date().toISOString(),
              ...item
            }));

            if (['messages', 'bookings'].includes(tableName)) {
              store[tableName].unshift(...inserted);
            } else {
              store[tableName].push(...inserted);
            }
            saveLocalStore(store);

            for (const item of inserted) {
              if (tableName === 'messages') {
                await fetch('/api/contact-message', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(item)
                }).catch(() => {});
              } else if (tableName === 'bookings') {
                await fetch('/api/book-service', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(item)
                }).catch(() => {});
              } else {
                const syncRes = await syncWithServerAndSheet(tableName, 'insert', item, item._rowIndex, item.id);
                if (syncRes && syncRes.data && syncRes.data._rowIndex) {
                  item._rowIndex = syncRes.data._rowIndex;
                }
              }
            }

            const resData = Array.isArray(insertPayload) ? inserted : inserted[0];
            return { data: resData, error: null };
          }

          // --- UPDATE OPERATION ---
          if (operation === 'update') {
            const store = getLocalStore();
            if (!store[tableName]) store[tableName] = [];

            let count = 0;
            let updatedRows = [];
            store[tableName] = store[tableName].map(row => {
              let matches = true;
              for (const fn of filters) {
                if (!fn(row)) { matches = false; break; }
              }
              if (matches) {
                count++;
                const merged = { ...row, ...updatePayload };
                updatedRows.push(merged);
                return merged;
              }
              return row;
            });

            saveLocalStore(store);

            for (const row of updatedRows) {
              let rowIndex = row._rowIndex;
              if (!rowIndex && String(row.id).startsWith('row-')) {
                rowIndex = parseInt(String(row.id).replace('row-', ''), 10) + 1;
              }
              await syncWithServerAndSheet(tableName, 'update', row, rowIndex, row.id);
            }

            return { data: updatedRows, count, error: null };
          }

          // --- DELETE OPERATION ---
          if (operation === 'delete') {
            const store = getLocalStore();
            if (!store[tableName]) store[tableName] = [];

            let deletedRows = [];
            store[tableName] = store[tableName].filter(row => {
              let matches = true;
              for (const fn of filters) {
                if (!fn(row)) { matches = false; break; }
              }
              if (matches) {
                deletedRows.push(row);
                return false;
              }
              return true;
            });

            saveLocalStore(store);

            for (const row of deletedRows) {
              let rowIndex = row._rowIndex;
              if (!rowIndex && String(row.id).startsWith('row-')) {
                rowIndex = parseInt(String(row.id).replace('row-', ''), 10) + 1;
              }
              if (['messages', 'bookings'].includes(tableName)) {
                const q = rowIndex ? `?rowIndex=${rowIndex}` : '';
                await fetch(`/api/${tableName}/${encodeURIComponent(row.id)}${q}`, { method: 'DELETE' }).catch(() => {});
              } else {
                await syncWithServerAndSheet(tableName, 'delete', null, rowIndex, row.id);
              }
            }

            return { data: deletedRows, error: null };
          }

          // --- SELECT OPERATION ---
          let finalRows = null;

          // For messages & bookings, use dedicated server endpoints that merge Google Sheets + local JSON
          if (tableName === 'messages' || tableName === 'bookings') {
            const serverRows = await fetchServerDbRows(tableName);
            if (Array.isArray(serverRows) && serverRows.length > 0) {
              finalRows = serverRows;
            }
          }

          // 1. Try loading from live Google Sheet
          if (!finalRows) {
            try {
              const rawSheet = await fetchSheetRows(tableName);
              if (Array.isArray(rawSheet) && rawSheet.length > 0) {
                finalRows = rawSheet.map((row, idx) => mapSheetRowToModel(tableName, row, idx));
                // Save latest sheet snapshot to server JSON DB for offline resilience
                fetch(`/api/db/${encodeURIComponent(tableName)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'replace_all', data: finalRows })
                }).catch(() => {});
              }
            } catch (e) {}
          }

          // 2. Fallback to Server JSON Database (/api/db/:table)
          if (!finalRows) {
            const serverDbRows = await fetchServerDbRows(tableName);
            if (Array.isArray(serverDbRows) && serverDbRows.length > 0) {
              finalRows = serverDbRows;
            }
          }

          // 3. Fallback to Browser LocalStorage store
          const store = getLocalStore();
          let rows = (finalRows && Array.isArray(finalRows)) ? finalRows.slice() : ((store[tableName] || []).slice());

          if (finalRows && Array.isArray(finalRows) && finalRows.length > 0) {
            store[tableName] = finalRows;
            saveLocalStore(store);
          }

          // Apply filters
          for (const fn of filters) {
            rows = rows.filter(fn);
          }

          // Apply sorts
          if (sorts.length) {
            rows.sort((a, b) => {
              for (const { column, ascending } of sorts) {
                const valA = a[column];
                const valB = b[column];
                if (valA === valB) continue;
                if (valA === undefined || valA === null) return ascending ? 1 : -1;
                if (valB === undefined || valB === null) return ascending ? -1 : 1;
                if (valA < valB) return ascending ? -1 : 1;
                if (valA > valB) return ascending ? 1 : -1;
              }
              return 0;
            });
          }

          if (limitCount !== null) {
            rows = rows.slice(0, limitCount);
          }

          let result = rows;
          if (isSingle || maybeSingleMode) {
            result = rows[0] || null;
          }

          return { data: result, error: null };
        };

        return execute().then(onFulfilled, onRejected);
      }
    };

    return builder;
  }

  return {
    auth,
    from
  };
}

async function initSupabase() {
  if (supabaseInstance) return supabaseInstance;
  supabaseInstance = createLocalSupabaseClient();
  return supabaseInstance;
}

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createLocalSupabaseClient();
  }
  return supabaseInstance;
}

// Aliases for modern DB interface
const initDb = initSupabase;
const getDb = getSupabase;
