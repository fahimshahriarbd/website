/* ============================================================
   SUPABASE CLIENT & RESILIENT DATA STORE
   Fahim Shahriar Website

   Connects to Supabase when environment configuration is provided.
   When remote credentials are not set, smoothly activates a
   self-contained, persistent local database engine with complete
   CRUD and auth support matching the Supabase JS interface.
   ============================================================ */

let supabaseInstance = null;

const DEFAULT_DATABASE = {
  "blog_posts": [],
  "gallery_photos": [],
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

const STORAGE_KEY = 'fahim_website_db_v4';
const AUTH_STORAGE_KEY = 'fahim_website_auth_v2';

function getLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all tables exist
      for (const [tName, defaultRows] of Object.entries(DEFAULT_DATABASE)) {
        if (!Array.isArray(parsed[tName])) {
          parsed[tName] = defaultRows;
        }
      }
      return parsed;
    }
  } catch (e) {
    // ignore parse error and reset
  }

  // Clone defaults
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

/* ---- GOOGLE SHEET TO MODEL CONVERTERS ---- */
function mapSheetRowToModel(tableName, row, idx) {
  const id = row.id || ('row-' + (idx + 1));
  const _rowIndex = row._rowIndex || (idx + 2);
  if (tableName === 'projects') {
    return {
      id,
      _rowIndex,
      title: row.Title || row.title || 'Project',
      icon: row.Icon || row.icon || '🚀',
      category: row.Category || row.category || 'General',
      description: row.Description || row.description || '',
      link: row.Link || row.link || '#',
      sort_order: idx + 1,
      published: String(row.Published || row.published || 'yes').toLowerCase() === 'yes',
      created_at: new Date().toISOString()
    };
  }
  if (tableName === 'services') {
    return {
      id,
      _rowIndex,
      title: row.Title || row.title || 'Service',
      icon: row.Icon || row.icon || '💼',
      category: row.Catagory || row.Category || row.category || 'General',
      price: (row.Fee || row.fee || row.Price || row.price || '1,000') + (String(row.Fee||row.Price||'').includes('BDT') ? '' : ' BDT'),
      description: row.Description || row.description || '',
      sort_order: idx + 1,
      is_active: String(row.Active || row.active || 'yes').toLowerCase() === 'yes',
      created_at: new Date().toISOString()
    };
  }
  if (tableName === 'testimonials') {
    return {
      id,
      _rowIndex,
      name: String(row.Name || row.name || 'Anonymous').trim(),
      tag: String(row.Relation || row.relation || row.tag || 'Friend').trim(),
      about: String(row.About || row.about || 'Website').trim(),
      feedback: String(row.Feedback || row.feedback || '').trim(),
      image: String(row.Image || row.image || '').trim(),
      link: String(row.Link || row.link || '#').trim(),
      sort_order: idx + 1,
      published: String(row.Published || row.published || 'yes').toLowerCase() === 'yes',
      created_at: new Date().toISOString()
    };
  }
  if (tableName === 'messages') {
    return {
      id,
      _rowIndex,
      name: row.Name || row.name || 'Anonymous',
      email: row.Email || row.email || '',
      subject: row.Subject || row.subject || '',
      message: row.Message || row.message || '',
      created_at: row.Time || row.time || new Date().toISOString()
    };
  }
  if (tableName === 'bookings') {
    return {
      id,
      _rowIndex,
      name: row.Name || row.name || 'Anonymous',
      mobile: row.Mobile || row.mobile || '',
      location: row.Location || row.location || '',
      service_title: row.Service || row.service || row.Service_Title || row.service_title || 'Service',
      amount: row.Amount || row.amount || '',
      payment_gateway: row.Gateway || row.gateway || row.Payment_Gateway || row.payment_gateway || 'bKash',
      payment_number: row.Payment_Number || row.payment_number || '',
      trx_id: row.TrxID || row.trx_id || row.Trx_Id || '',
      notes: row.Notes || row.notes || '',
      created_at: row.Time || row.time || new Date().toISOString()
    };
  }
  if (tableName === 'blog_posts') {
    return {
      id,
      _rowIndex,
      title: row.Title || row.title || 'Blog Post',
      category: row.Category || row.category || 'Blog',
      image: row.Image || row.image || '',
      date: row.Date || row.date || '',
      read_time: row.ReadTime || row.read_time || '5',
      summary: row.Summary || row.summary || '',
      content: row.Content || row.content || '',
      link: row.Link || row.link || '#',
      sort_order: idx + 1,
      published: String(row.Published || row.published || 'yes').toLowerCase() === 'yes',
      created_at: new Date().toISOString()
    };
  }
  if (tableName === 'achievements') {
    return {
      id,
      _rowIndex,
      title: row.Title || row.title || '',
      icon: row.Icon || row.icon || '🏆',
      description: row.Description || row.description || '',
      sort_order: idx + 1,
      published: String(row.Published || row.published || 'yes').toLowerCase() === 'yes',
      created_at: new Date().toISOString()
    };
  }
  if (tableName === 'gallery_photos') {
    return {
      id,
      _rowIndex,
      image_url: row.Image_URL || row.image_url || row.Image || row.image || '',
      caption: row.Caption || row.caption || '',
      category: row.Category || row.category || 'General',
      sort_order: idx + 1,
      created_at: new Date().toISOString()
    };
  }
  if (tableName === 'cvs') {
    return {
      id,
      _rowIndex,
      title: row.Title || row.title || '',
      download_link: row.Download_Link || row.download_link || row['Download Link'] || '',
      password: row.Password || row.password || '0',
      sort_order: idx + 1,
      created_at: new Date().toISOString()
    };
  }
  return { id, _rowIndex, ...row };
}

function mapModelToSheetRow(tableName, item) {
  if (tableName === 'projects') {
    return {
      Title: item.title || '',
      Icon: item.icon || '🚀',
      Category: item.category || 'General',
      Description: item.description || '',
      Link: item.link || '#',
      Published: item.published ? 'yes' : 'no'
    };
  }
  if (tableName === 'services') {
    return {
      Title: item.title || '',
      Icon: item.icon || '💼',
      Catagory: item.category || 'General',
      Price: String(item.price || '1,000').replace(/bdt/gi, '').trim(),
      Fee: String(item.price || '1,000').replace(/bdt/gi, '').trim(),
      Description: item.description || '',
      Active: item.is_active ? 'yes' : 'no'
    };
  }
  if (tableName === 'testimonials') {
    return {
      Name: item.name || '',
      Relation: item.tag || 'Friend',
      About: item.about || 'Website',
      Feedback: item.feedback || '',
      Image: item.image || '',
      Link: item.link || '#',
      Published: item.published ? 'yes' : 'no'
    };
  }
  if (tableName === 'blog_posts') {
    return {
      Title: item.title || '',
      Category: item.category || 'Blog',
      Image: item.image || '',
      Date: item.date || '',
      ReadTime: item.read_time || '5',
      Summary: item.summary || '',
      Content: item.content || '',
      Link: item.link || '#',
      Published: item.published ? 'yes' : 'no'
    };
  }
  if (tableName === 'achievements') {
    return {
      Title: item.title || '',
      Icon: item.icon || '🏆',
      Description: item.description || '',
      Published: item.published ? 'yes' : 'no'
    };
  }
  if (tableName === 'gallery_photos') {
    return {
      Image_URL: item.image_url || '',
      Caption: item.caption || '',
      Category: item.category || 'General'
    };
  }
  if (tableName === 'cvs') {
    return {
      Title: item.title || '',
      'Download Link': item.download_link || '',
      Download_Link: item.download_link || '',
      Password: item.password || '0'
    };
  }
  return item;
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
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          return { data: { user: null, session: null }, error: new Error(result.error || 'Invalid email or password.') };
        }
        const session = {
          access_token: result.token,
          user: {
            id: 'admin-1',
            email: result.email,
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
      } catch (err) {
        return { data: { user: null, session: null }, error: err };
      }
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

    const builder = {
      select() {
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

      then(onFulfilled, onRejected) {
        const fetchRows = async () => {
          let sheetRows = null;

          // Attempt loading from live Google Sheet for all tables
          try {
            const sheetRes = await fetch(`/api/sheet-proxy?sheet=${encodeURIComponent(tableName)}`, {
              cache: 'no-store'
            });
            if (sheetRes.ok) {
              const resData = await sheetRes.json();
              if (Array.isArray(resData) && resData.length > 0) {
                sheetRows = resData.map((row, idx) => mapSheetRowToModel(tableName, row, idx));
              }
            }
          } catch (e) {
            // silent fallback
          }

          // Fallbacks for messages and bookings if sheet proxy was empty
          if (!sheetRows) {
            if (tableName === 'messages') {
              try {
                const res = await fetch('/api/messages');
                if (res.ok) sheetRows = await res.json();
              } catch (e) {}
            } else if (tableName === 'bookings') {
              try {
                const res = await fetch('/api/bookings');
                if (res.ok) sheetRows = await res.json();
              } catch (e) {}
            }
          }

          const store = getLocalStore();
          let rows = (sheetRows && Array.isArray(sheetRows)) ? sheetRows.slice() : ((store[tableName] || []).slice());

          // Keep local store in sync with loaded sheet rows
          if (sheetRows && Array.isArray(sheetRows) && sheetRows.length > 0) {
            store[tableName] = sheetRows;
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

        return fetchRows().then(onFulfilled, onRejected);
      },

      async insert(dataOrArray) {
        const store = getLocalStore();
        if (!store[tableName]) store[tableName] = [];

        const items = Array.isArray(dataOrArray) ? dataOrArray : [dataOrArray];
        const inserted = items.map((item, i) => ({
          id: item.id || ('local-' + Math.random().toString(36).substring(2, 9)),
          _rowIndex: (store[tableName].length + i + 2),
          created_at: item.created_at || new Date().toISOString(),
          ...item
        }));

        store[tableName].push(...inserted);
        saveLocalStore(store);

        // Sync insert to Google Sheet
        for (const item of inserted) {
          const sheetPayload = mapModelToSheetRow(tableName, item);
          fetch('/api/sheet-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sheet: tableName,
              action: 'insert',
              data: sheetPayload
            })
          }).catch(err => console.warn('[Sheet insert sync err]:', err));
        }

        // Also asynchronously notify server endpoints if available
        if (tableName === 'messages' && items[0]) {
          fetch('/api/contact-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items[0])
          }).catch(() => {});
        } else if (tableName === 'bookings' && items[0]) {
          fetch('/api/book-service', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items[0])
          }).catch(() => {});
        }

        return { data: Array.isArray(dataOrArray) ? inserted : inserted[0], error: null };
      },

      async update(updateFields) {
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
            const merged = { ...row, ...updateFields };
            updatedRows.push(merged);
            return merged;
          }
          return row;
        });

        saveLocalStore(store);

        // Sync update to Google Sheet
        for (const row of updatedRows) {
          let rowIndex = row._rowIndex;
          if (!rowIndex && String(row.id).startsWith('row-')) {
            rowIndex = parseInt(String(row.id).replace('row-', ''), 10) + 1;
          }
          if (rowIndex) {
            const sheetPayload = mapModelToSheetRow(tableName, row);
            fetch('/api/sheet-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sheet: tableName,
                action: 'update',
                rowIndex: rowIndex,
                data: sheetPayload
              })
            }).catch(err => console.warn('[Sheet update sync err]:', err));
          }
        }

        return { data: { count }, error: null };
      },

      async delete() {
        const store = getLocalStore();
        if (!store[tableName]) store[tableName] = [];

        let deletedRows = [];
        store[tableName] = store[tableName].filter(row => {
          for (const fn of filters) {
            if (fn(row)) {
              deletedRows.push(row);
              return false; // delete this row
            }
          }
          return true;
        });

        saveLocalStore(store);

        // Sync delete to Google Sheet
        for (const row of deletedRows) {
          let rowIndex = row._rowIndex;
          if (!rowIndex && String(row.id).startsWith('row-')) {
            rowIndex = parseInt(String(row.id).replace('row-', ''), 10) + 1;
          }
          if (rowIndex) {
            fetch('/api/sheet-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sheet: tableName,
                action: 'delete',
                rowIndex: rowIndex
              })
            }).catch(err => console.warn('[Sheet delete sync err]:', err));
          }
        }

        // Also call server DELETE API for messages and bookings
        if (['messages', 'bookings'].includes(tableName) && deletedRows.length) {
          for (const delRow of deletedRows) {
            const delId = delRow.id;
            const rIdx = delRow._rowIndex;
            const q = rIdx ? `?rowIndex=${rIdx}` : '';
            fetch(`/api/${tableName}/${encodeURIComponent(delId)}${q}`, { method: 'DELETE' }).catch(() => {});
          }
        }

        return { data: null, error: null };
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

  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (res.ok) {
      const config = await res.json();
      if (
        config.supabaseUrl &&
        config.supabaseAnonKey &&
        window.supabase &&
        !config.supabaseUrl.includes('placeholder')
      ) {
        supabaseInstance = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true },
        });
        return supabaseInstance;
      }
    }
  } catch (err) {
    // Network or server issues — fall back gracefully
  }

  // Activate resilient local data store
  supabaseInstance = createLocalSupabaseClient();
  return supabaseInstance;
}

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createLocalSupabaseClient();
  }
  return supabaseInstance;
}
