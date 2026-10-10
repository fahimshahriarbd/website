/* ============================================================
   GOOGLE SHEETS DATABASE CLIENT
   Fahim Shahriar Website

   Loads and syncs all live content directly with Google Sheets
   via server proxy (/api/sheet-proxy) and direct Apps Script URL.
   ============================================================ */

let supabaseInstance = null;

const DEFAULT_DATABASE = {
  blog_posts: [],
  gallery_photos: [],
  services: [],
  achievements: [],
  projects: [],
  testimonials: [],
  cvs: [],
  messages: [],
  bookings: []
};

const STORAGE_KEY = 'fahim_website_sheet_cache_v1';
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
  return JSON.parse(JSON.stringify(DEFAULT_DATABASE));
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

/* ---- GOOGLE SHEET TO MODEL CONVERTERS (Matches deployed Google Sheet headers) ---- */
function mapSheetRowToModel(tableName, row, idx) {
  const _rowIndex = Number(row._rowIndex || (idx + 2));
  const id = String(row.id || ('row-' + (_rowIndex - 1)));
  const sortOrder = Number(row.Sort_Order ?? row.sort_order ?? (idx + 1)) || (idx + 1);
  const createdAt = row.Time || row.time || row.Created_At || row.created_at || new Date().toISOString();

  if (tableName === 'projects') {
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? 'Project').trim(),
      icon: String(row.Icon ?? row.icon ?? '🚀').trim(),
      category: String(row.Category ?? row.category ?? 'General').trim(),
      description: String(row.Description ?? row.description ?? '').trim(),
      link: String(row.Link ?? row.link ?? '#').trim(),
      tags: String(row.Tags ?? row.tags ?? '').trim(),
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
      tag: String(row.Tag ?? row.Relation ?? row.relation ?? row.tag ?? 'Friend').trim(),
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
      download_link: String(row['Download Link'] ?? row.Download_Link ?? row.download_link ?? row.Link ?? row.link ?? '').trim(),
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
      created_at: createdAt
    };
  }
  return { id, _rowIndex, ...row };
}

/* ---- MODEL TO GOOGLE SHEET CONVERTERS (Matches deployed Google Sheet headers) ---- */
function mapModelToSheetRow(tableName, item) {
  if (tableName === 'projects') {
    return {
      Title: item.title || '',
      Icon: item.icon || '🚀',
      Category: item.category || 'General',
      Description: item.description || '',
      Link: item.link || '#',
      Tags: item.tags || item.category || '',
      Published: item.published !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'services') {
    const cleanNumPrice = String(item.price || '1000').replace(/bdt/gi, '').replace(/,/g, '').trim();
    return {
      Title: item.title || '',
      Icon: item.icon || '💼',
      Catagory: item.category || 'General',
      Category: item.category || 'General',
      Fee: cleanNumPrice,
      Price: cleanNumPrice,
      Description: item.description || '',
      Active: item.is_active !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'testimonials') {
    return {
      Name: item.name || '',
      Tag: item.tag || 'Friend',
      Relation: item.tag || 'Friend',
      About: item.about || 'Website',
      Feedback: item.feedback || '',
      Image: item.image || '',
      Link: item.link || '#',
      Published: item.published !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'blog_posts' || tableName === 'blog') {
    return {
      Title: item.title || '',
      Category: item.category || 'Blog',
      Image: item.image || '',
      Date: item.date || new Date().toISOString().split('T')[0],
      ReadTime: item.read_time || '5',
      Summary: item.summary || '',
      Content: item.content || '',
      Link: item.link || '#',
      Published: item.published !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'achievements') {
    return {
      Title: item.title || '',
      Icon: item.icon || '🏆',
      Description: item.description || '',
      Published: item.published !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'gallery_photos' || tableName === 'gallery') {
    return {
      Image_URL: item.image_url || '',
      Image: item.image_url || '',
      Caption: item.caption || '',
      Category: item.category || 'General'
    };
  }
  if (tableName === 'cvs' || tableName === 'cv') {
    return {
      Title: item.title || '',
      'Download Link': item.download_link || '',
      Download_Link: item.download_link || '',
      Password: item.password !== undefined ? String(item.password) : '0'
    };
  }
  if (tableName === 'messages') {
    return {
      Time: item.created_at || new Date().toISOString(),
      Name: item.name || '',
      Email: item.email || '',
      Subject: item.subject || '',
      Message: item.message || ''
    };
  }
  if (tableName === 'bookings') {
    return {
      Time: item.created_at || new Date().toISOString(),
      Name: item.name || '',
      Mobile: item.mobile || '',
      Location: item.location || '',
      Service: item.service_title || 'Service',
      Amount: item.amount || '',
      Gateway: item.payment_gateway || 'bKash',
      Payment_Number: item.payment_number || '',
      TrxID: item.trx_id || '',
      Notes: item.notes || ''
    };
  }
  return item;
}

let DIRECT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFIJVTNzF50zCcv6Ppk2n041_tXHFEWcKM1ouSQsCQ-HzcNUkjUTjNvesNnN_KZ38ovg/exec';

try {
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
  const m = {
    blog_posts: 'blog',
    gallery_photos: 'gallery',
    cvs: 'cv',
    blog: 'blog',
    gallery: 'gallery',
    cv: 'cv'
  };
  return m[tn] || tn;
}

async function syncToSheet(tableName, action, data, rowIndex) {
  const sheetTab = getSheetTabName(tableName);
  const payload = {
    sheet: sheetTab,
    action: action,
    data: data
  };
  if (rowIndex) payload.rowIndex = Number(rowIndex);

  // 1. Primary: Server-side Google Sheet proxy (handles redirects & CORS cleanly)
  try {
    const res = await fetch('/api/sheet-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        return JSON.parse(text);
      }
    }
  } catch (e) {}

  // 2. Fallback: Direct browser call to Google Apps Script (for static hosting / GitHub Pages)
  try {
    const res = await fetch(DIRECT_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
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
  const refreshQuery = forceRefresh ? '&refresh=1' : '';

  // 1. Primary: Server proxy
  try {
    const res = await fetch(`/api/sheet-proxy?sheet=${encodeURIComponent(sheetTab)}${refreshQuery}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        if (Array.isArray(data)) return data;
      }
    }
  } catch (e) {}

  // 2. Fallback: Direct call to Google Apps Script
  try {
    const res = await fetch(`${DIRECT_SCRIPT_URL}?sheet=${encodeURIComponent(sheetTab)}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        if (Array.isArray(data)) return data;
      }
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

      // 2. Fallback SHA-256 verification for static hosting
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
          // --- INSERT INTO GOOGLE SHEET ---
          if (operation === 'insert') {
            const store = getLocalStore();
            if (!store[tableName]) store[tableName] = [];

            const items = Array.isArray(insertPayload) ? insertPayload : [insertPayload];
            const inserted = [];

            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              const createdAt = item.created_at || new Date().toISOString();
              const tempRowIndex = store[tableName].length + i + 2;
              const newItem = {
                id: item.id || ('row-' + (tempRowIndex - 1)),
                _rowIndex: tempRowIndex,
                created_at: createdAt,
                ...item
              };

              const sheetPayload = mapModelToSheetRow(tableName, newItem);
              const sheetRes = await syncToSheet(tableName, 'insert', sheetPayload);
              if (sheetRes && sheetRes.rowIndex) {
                newItem._rowIndex = Number(sheetRes.rowIndex);
                newItem.id = 'row-' + (Number(sheetRes.rowIndex) - 1);
              }
              inserted.push(newItem);
            }

            store[tableName].push(...inserted);
            saveLocalStore(store);

            const resData = Array.isArray(insertPayload) ? inserted : inserted[0];
            return { data: resData, error: null };
          }

          // --- UPDATE IN GOOGLE SHEET ---
          if (operation === 'update') {
            const store = getLocalStore();
            if (!store[tableName]) store[tableName] = [];

            let count = 0;
            const updatedRows = [];
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
              const sheetPayload = mapModelToSheetRow(tableName, row);
              if (rowIndex) {
                await syncToSheet(tableName, 'update', sheetPayload, rowIndex);
              } else {
                await syncToSheet(tableName, 'insert', sheetPayload);
              }
            }

            return { data: updatedRows, count, error: null };
          }

          // --- DELETE FROM GOOGLE SHEET ---
          if (operation === 'delete') {
            const store = getLocalStore();
            if (!store[tableName]) store[tableName] = [];

            const deletedRows = [];
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
              if (rowIndex) {
                await syncToSheet(tableName, 'delete', null, rowIndex);
              }
            }

            return { data: deletedRows, error: null };
          }

          // --- SELECT FROM GOOGLE SHEET ---
          let sheetRows = null;
          try {
            const rawData = await fetchSheetRows(tableName);
            if (Array.isArray(rawData)) {
              sheetRows = rawData.map((row, idx) => mapSheetRowToModel(tableName, row, idx));
            }
          } catch (e) {}

          const store = getLocalStore();
          let rows;
          if (Array.isArray(sheetRows)) {
            rows = sheetRows.slice();
            store[tableName] = sheetRows;
            saveLocalStore(store);
          } else {
            rows = (store[tableName] || []).slice();
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
