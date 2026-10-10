/* ============================================================
   ADMIN PANEL — Fahim Shahriar Website
   Login + Full CRUD for all content tables via Google Sheets
   ============================================================ */

let db = null;
let currentTable = 'blog_posts';
let currentEditId = null;
let isAdminLoggedIn = false;

/* ---- TABLE CONFIG ---- */
const TABLE_CONFIG = {
  blog_posts: {
    label: 'Blog Posts',
    canEdit: true,
    display: ['title', 'category', 'date', 'published'],
    columns: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text', default: 'Blog' },
      { name: 'image', label: 'Cover Image URL', type: 'url', hint: 'Full image URL' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'read_time', label: 'Read Time (min)', type: 'text', default: '5' },
      { name: 'summary', label: 'Summary', type: 'textarea' },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'link', label: 'Article Link', type: 'url', default: '#' },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
  projects: {
    label: 'Projects',
    canEdit: true,
    display: ['title', 'category', 'published'],
    columns: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'icon', label: 'Icon (emoji or URL)', type: 'text', default: '🚀' },
      { name: 'category', label: 'Category', type: 'text', default: 'General' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'link', label: 'Project Link', type: 'url', default: '#' },
      { name: 'tags', label: 'Tags (comma separated)', type: 'text', default: '' },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
  services: {
    label: 'Services',
    canEdit: true,
    display: ['title', 'category', 'price', 'is_active'],
    columns: [
      { name: 'title', label: 'Service Title', type: 'text', required: true },
      { name: 'icon', label: 'Icon (emoji or URL)', type: 'text', default: '💼' },
      { name: 'category', label: 'Category', type: 'text', default: 'General' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'price', label: 'Price / Fee (BDT)', type: 'text', default: '1,000 BDT' },
      { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
    ],
  },
  achievements: {
    label: 'Achievements',
    canEdit: true,
    display: ['title', 'published'],
    columns: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'icon', label: 'Icon (emoji or URL)', type: 'text', default: '🏆' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
  testimonials: {
    label: 'Testimonials',
    canEdit: true,
    display: ['name', 'tag', 'published'],
    columns: [
      { name: 'name', label: 'Person Name', type: 'text', required: true },
      { name: 'tag', label: 'Relation Tag', type: 'text', default: 'Friend', hint: 'e.g. Friend, Client, Colleague' },
      { name: 'about', label: 'About', type: 'text', default: 'Website' },
      { name: 'feedback', label: 'Feedback / Quote', type: 'textarea' },
      { name: 'image', label: 'Avatar Image URL', type: 'url' },
      { name: 'link', label: 'Profile Link', type: 'url', default: '#' },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
  gallery_photos: {
    label: 'Gallery',
    canEdit: true,
    display: ['image_url', 'caption', 'category'],
    columns: [
      { name: 'image_url', label: 'Image URL', type: 'url', required: true },
      { name: 'caption', label: 'Caption', type: 'text' },
      { name: 'category', label: 'Category', type: 'text', default: 'General' },
    ],
  },
  cvs: {
    label: 'CVs',
    canEdit: true,
    display: ['title', 'password'],
    columns: [
      { name: 'title', label: 'CV Title', type: 'text', required: true },
      { name: 'download_link', label: 'Download Link (URL)', type: 'url', required: true },
      { name: 'password', label: 'Password (0 = free)', type: 'text', default: '0', hint: 'Enter 0 for free download, or any text for password protection' },
    ],
  },
  messages: {
    label: 'Messages',
    canEdit: false,
    display: ['name', 'email', 'subject', 'created_at'],
    columns: [],
  },
  bookings: {
    label: 'Bookings',
    canEdit: false,
    display: ['name', 'mobile', 'service_title', 'amount', 'payment_gateway', 'created_at'],
    columns: [],
  },
};

/* ---- HELPERS ---- */
function esc(val) {
  return String(val ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatDate(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return String(ts); }
}

function getEditableColumns() {
  return TABLE_CONFIG[currentTable].columns.filter(c => !['id', 'created_at', '_rowIndex'].includes(c.name));
}

/* ---- AUTH ---- */
async function checkSession() {
  if (!db) return null;
  const { data: { session } } = await db.auth.getSession();
  return session;
}

function showDashboard(email) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';
  document.getElementById('adminUserEmail').textContent = email || '';
  isAdminLoggedIn = true;
  updateAdminStats();
  loadTable(currentTable);
}

async function updateAdminStats() {
  const statKeys = [
    { table: 'blog_posts', elId: 'statCountBlogs' },
    { table: 'projects', elId: 'statCountProjects' },
    { table: 'services', elId: 'statCountServices' },
    { table: 'messages', elId: 'statCountMessages' },
    { table: 'bookings', elId: 'statCountBookings' },
  ];
  for (const item of statKeys) {
    try {
      const { data } = await db.from(item.table).select('id');
      const count = Array.isArray(data) ? data.length : 0;
      const el = document.getElementById(item.elId);
      if (el) el.textContent = count;
    } catch {}
  }
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  isAdminLoggedIn = false;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginSubmitBtn');

  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showDashboard(data.user?.email || email);
  } catch (err) {
    errEl.textContent = err.message || 'Login failed. Check your email and password.';
    errEl.style.display = 'block';
  }

  btn.disabled = false;
  btn.textContent = 'Access Admin Panel →';
}

async function handleLogout() {
  if (db) await db.auth.signOut();
  showLogin();
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

/* ---- TABLE LOADING ---- */
async function loadTable(tableName, forceRefresh = false) {
  currentTable = tableName;
  const config = TABLE_CONFIG[tableName];

  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.table === tableName);
  });

  document.getElementById('adminTableTitle').textContent = config.label;
  const addBtn = document.getElementById('adminAddBtn');
  addBtn.style.display = config.canEdit ? 'inline-block' : 'none';

  const wrap = document.getElementById('adminTableWrap');
  wrap.innerHTML = '<div class="admin-loading">Loading from Google Sheet...</div>';

  try {
    if (forceRefresh && typeof fetchSheetRows === 'function') {
      await fetchSheetRows(tableName, true).catch(() => {});
    }

    const { data, error } = await db
      .from(tableName)
      .select('*');

    if (error) throw error;

    if (!data || data.length === 0) {
      allCurrentData = [];
      const badge = document.getElementById('adminTableCountBadge');
      if (badge) badge.textContent = '0 items';
      wrap.innerHTML = `<div class="admin-empty"><p>No ${config.label.toLowerCase()} yet in Google Sheet.</p>${config.canEdit ? '<button class="btn btn-primary admin-add-btn" onclick="openAddModal()">+ Add your first entry</button>' : ''}</div>`;
      return;
    }

    allCurrentData = data;
    const badge = document.getElementById('adminTableCountBadge');
    if (badge) badge.textContent = `${data.length} ${data.length === 1 ? 'item' : 'items'}`;
    const sInput = document.getElementById('adminSearchInput');
    if (sInput) sInput.value = '';
    renderTable(data, config);
    updateAdminStats();
  } catch (err) {
    wrap.innerHTML = `<div class="admin-empty"><p style="color:var(--admin-danger);">Error loading data: ${esc(err.message)}</p><p style="font-size:0.8rem;color:var(--admin-muted);">Check your connection or click Refresh.</p></div>`;
  }
}

function renderTable(data, config) {
  const wrap = document.getElementById('adminTableWrap');

  if (!config.canEdit) {
    wrap.innerHTML = renderReadOnlyTable(data, config);
    return;
  }

  const displayCols = config.display;
  const hasImage = displayCols.includes('image') || displayCols.includes('image_url');

  let html = '<table class="admin-table"><thead><tr>';
  if (hasImage) html += '<th class="col-thumb">Preview</th>';
  displayCols.filter(c => c !== 'image' && c !== 'image_url').forEach(col => {
    html += `<th>${esc(prettyHeader(col))}</th>`;
  });
  html += '<th class="col-actions">Actions</th>';
  html += '</tr></thead><tbody>';

  data.forEach(row => {
    html += '<tr>';
    if (hasImage) {
      const imgVal = row.image || row.image_url || '';
      html += `<td class="col-thumb">${imgVal ? `<img src="${esc(imgVal)}" alt="" onerror="this.style.display='none'">` : '—'}</td>`;
    }
    displayCols.filter(c => c !== 'image' && c !== 'image_url').forEach(col => {
      const val = row[col];
      if (col === 'published' || col === 'is_active') {
        const isOn = val !== false;
        const label = col === 'is_active' ? (isOn ? 'Active' : 'Inactive') : (isOn ? 'Published' : 'Hidden');
        html += `<td><span class="admin-badge ${isOn ? 'published' : 'unpublished'} ${col === 'is_active' ? (isOn ? 'active' : 'inactive') : ''}">${label}</span></td>`;
      } else if (col === 'date' || col === 'created_at') {
        html += `<td>${esc(formatDate(val))}</td>`;
      } else if (col === 'password') {
        const pwd = String(val ?? '').trim();
        const isProtected = pwd && pwd !== '0' && pwd !== 'null';
        html += `<td>${isProtected ? `🔒 Protected (${esc(pwd)})` : '✓ Free'}</td>`;
      } else {
        html += `<td title="${esc(val)}">${esc(val ?? '—')}</td>`;
      }
    });
    html += `<td class="col-actions">
      <button class="admin-action-btn edit" onclick="openEditModal('${esc(row.id)}')">Edit</button>
      <button class="admin-action-btn delete" onclick="confirmDelete('${esc(row.id)}')">Delete</button>
    </td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}

function renderReadOnlyTable(data, config) {
  const displayCols = config.display;
  let html = '<table class="admin-table"><thead><tr>';
  displayCols.forEach(col => { html += `<th>${esc(prettyHeader(col))}</th>`; });
  html += '<th class="col-actions">Actions</th>';
  html += '</tr></thead><tbody>';

  data.forEach(row => {
    html += '<tr>';
    displayCols.forEach(col => {
      const val = row[col];
      if (col === 'created_at' || col === 'date') {
        html += `<td>${esc(formatDate(val))}</td>`;
      } else {
        html += `<td title="${esc(val)}">${esc(val ?? '—')}</td>`;
      }
    });
    html += `<td class="col-actions">
      <button class="admin-action-btn view" onclick="viewDetail('${esc(row.id)}')">View</button>
      <button class="admin-action-btn delete" onclick="confirmDelete('${esc(row.id)}')">Delete</button>
    </td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

function prettyHeader(col) {
  const map = {
    title: 'Title', category: 'Category', date: 'Date', published: 'Status',
    is_active: 'Status', price: 'Price', name: 'Name', email: 'Email',
    subject: 'Subject', created_at: 'Date', tag: 'Tag', caption: 'Caption',
    password: 'Protection', service_title: 'Service', amount: 'Amount',
    payment_gateway: 'Gateway', image: 'Image', image_url: 'Image',
    read_time: 'Read Time', mobile: 'Phone', location: 'Location',
    payment_number: 'Sender Number', trx_id: 'TrxID', notes: 'Notes'
  };
  return map[col] || col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ---- DETAIL VIEW (messages/bookings) ---- */
let allCurrentData = [];

async function viewDetail(id) {
  const row = allCurrentData.find(r => String(r.id) === String(id));
  if (!row) return;

  const config = TABLE_CONFIG[currentTable];
  const title = config.label === 'Messages' ? `Message from ${row.name || 'Unknown'}` : `Booking: ${row.service_title || row.name || 'Unknown'}`;

  const modal = document.getElementById('adminModal');
  document.getElementById('adminModalTitle').textContent = title;
  const fieldsEl = document.getElementById('adminFormFields');

  let html = '<div class="admin-detail">';
  for (const [key, val] of Object.entries(row)) {
    if (key === 'id' || key === '_rowIndex' || key === 'sort_order') continue;
    const label = prettyHeader(key);
    const display = (key === 'created_at') ? formatDate(val) : (val === null ? '—' : String(val));
    html += `<div class="admin-detail-row"><div class="admin-detail-label">${esc(label)}</div><div class="admin-detail-value">${esc(display)}</div></div>`;
  }
  html += '</div>';
  fieldsEl.innerHTML = html;

  const actionsEl = document.getElementById('adminFormActions');
  if (actionsEl) actionsEl.style.display = 'none';
  if (modal) modal.classList.add('open');
}

/* ---- ADD / EDIT MODAL ---- */
function openAddModal() {
  currentEditId = null;
  const config = TABLE_CONFIG[currentTable];
  const titleEl = document.getElementById('adminModalTitle');
  if (titleEl && config) titleEl.textContent = `Add New ${config.label.replace(/s$/, '')}`;
  const actionsEl = document.getElementById('adminFormActions');
  if (actionsEl) actionsEl.style.display = 'flex';
  renderFormFields(null);
  const modal = document.getElementById('adminModal');
  if (modal) modal.classList.add('open');
}

async function openEditModal(id) {
  currentEditId = id;
  const config = TABLE_CONFIG[currentTable];
  const titleEl = document.getElementById('adminModalTitle');
  if (titleEl && config) titleEl.textContent = `Edit ${config.label.replace(/s$/, '')}`;
  const actionsEl = document.getElementById('adminFormActions');
  if (actionsEl) actionsEl.style.display = 'flex';

  let row = allCurrentData.find(r => String(r.id) === String(id));
  if (!row) {
    try {
      const { data } = await db.from(currentTable).select('*').eq('id', id).maybeSingle();
      if (data) row = data;
    } catch (err) {}
  }

  if (row) {
    renderFormFields(row);
    document.getElementById('adminModal').classList.add('open');
  } else {
    showAdminToast('Entry not found: ' + id, 'error');
  }
}

function showAdminToast(message, type = 'info') {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:12px;font-weight:700;font-size:0.92rem;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,0.3);transition:all 0.3s ease;';
    document.body.appendChild(toast);
  }
  toast.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#0284c7';
  toast.style.color = '#ffffff';
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
  }, 3500);
}

function renderFormFields(row) {
  const cols = getEditableColumns();
  const fieldsEl = document.getElementById('adminFormFields');
  let html = '';

  cols.forEach(col => {
    const val = row ? row[col.name] : (col.default ?? '');
    const fieldId = `field_${col.name}`;

    if (col.type === 'checkbox') {
      const checked = val === true || val === 'true' ? 'checked' : '';
      html += `<div class="admin-form-field admin-checkbox-field">
        <input type="checkbox" id="${fieldId}" name="${col.name}" ${checked} />
        <label for="${fieldId}">${esc(col.label)}</label>
      </div>`;
    } else if (col.type === 'textarea') {
      html += `<div class="admin-form-field">
        <label for="${fieldId}">${esc(col.label)}${col.required ? ' <span style="color:var(--admin-danger)">*</span>' : ''}</label>
        <textarea id="${fieldId}" name="${col.name}" rows="4" placeholder="${esc(col.label)}">${esc(val)}</textarea>
        ${col.hint ? `<span class="field-hint">${esc(col.hint)}</span>` : ''}
      </div>`;
    } else if (col.type === 'number') {
      html += `<div class="admin-form-field">
        <label for="${fieldId}">${esc(col.label)}</label>
        <input type="number" id="${fieldId}" name="${col.name}" value="${esc(val)}" />
      </div>`;
    } else if (col.type === 'date') {
      const dateVal = val ? String(val).split('T')[0] : new Date().toISOString().split('T')[0];
      html += `<div class="admin-form-field">
        <label for="${fieldId}">${esc(col.label)}</label>
        <input type="date" id="${fieldId}" name="${col.name}" value="${esc(dateVal)}" />
      </div>`;
    } else {
      html += `<div class="admin-form-field">
        <label for="${fieldId}">${esc(col.label)}${col.required ? ' <span style="color:var(--admin-danger)">*</span>' : ''}</label>
        <input type="text" id="${fieldId}" name="${col.name}" value="${esc(val)}" placeholder="${esc(col.label)}" />
        ${col.hint ? `<span class="field-hint">${esc(col.hint)}</span>` : ''}
      </div>`;
    }
  });

  fieldsEl.innerHTML = html;
}

function collectFormData() {
  const cols = getEditableColumns();
  const data = {};
  cols.forEach(col => {
    const el = document.getElementById(`field_${col.name}`);
    if (!el) return;
    if (col.type === 'checkbox') {
      data[col.name] = el.checked;
    } else if (col.type === 'number') {
      data[col.name] = el.value ? parseInt(el.value, 10) : 1;
    } else {
      data[col.name] = el.value.trim();
    }
  });
  return data;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('adminSaveBtn');
  if (!saveBtn) return;

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving to Sheet...';

  const data = collectFormData();

  // Validate required fields
  const cols = getEditableColumns();
  for (const col of cols) {
    if (col.required && !data[col.name]) {
      const el = document.getElementById(`field_${col.name}`);
      if (el) { el.style.borderColor = 'var(--admin-danger)'; el.focus(); }
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
      return;
    }
  }

  try {
    const config = TABLE_CONFIG[currentTable];
    if (currentEditId) {
      const res = await db.from(currentTable).update(data).eq('id', currentEditId);
      if (res && res.error) throw res.error;
      const idx = allCurrentData.findIndex(r => String(r.id) === String(currentEditId));
      if (idx !== -1) {
        allCurrentData[idx] = { ...allCurrentData[idx], ...data };
      }
    } else {
      const res = await db.from(currentTable).insert(data);
      if (res && res.error) throw res.error;
      if (res && res.data) {
        const item = Array.isArray(res.data) ? res.data[0] : res.data;
        allCurrentData.push(item);
      }
    }
    closeModal();
    showAdminToast('Saved to Google Sheet!', 'success');
    renderTable(allCurrentData, config);
    await loadTable(currentTable, true);
  } catch (err) {
    showAdminToast('Error saving: ' + err.message, 'error');
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save';
}

function closeModal() {
  document.getElementById('adminModal')?.classList.remove('open');
  currentEditId = null;
}

/* ---- DELETE ---- */
async function confirmDelete(id) {
  try {
    showAdminToast('Deleting from Google Sheet...', 'info');
    const res = await db.from(currentTable).delete().eq('id', id);
    if (res && res.error) throw res.error;
    allCurrentData = allCurrentData.filter(r => String(r.id) !== String(id));
    renderTable(allCurrentData, TABLE_CONFIG[currentTable]);
    showAdminToast('Deleted from Google Sheet!', 'success');
    await loadTable(currentTable, true);
  } catch (err) {
    showAdminToast('Error deleting: ' + err.message, 'error');
  }
}

// Expose handlers globally for inline HTML onclick attributes
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.confirmDelete = confirmDelete;
window.viewDetail = viewDetail;
window.closeModal = closeModal;

/* ---- INIT ---- */
window.addEventListener('DOMContentLoaded', async () => {
  try {
    db = await initSupabase();
    if (!db) {
      document.getElementById('loginError').textContent = 'Cannot connect to database. Please try again later.';
      document.getElementById('loginError').style.display = 'block';
      return;
    }
  } catch {
    document.getElementById('loginError').textContent = 'Database connection failed.';
    document.getElementById('loginError').style.display = 'block';
    return;
  }

  const session = await checkSession();
  if (session) {
    showDashboard(session.user?.email || '');
  } else {
    showLogin();
  }

  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('adminAddBtn')?.addEventListener('click', openAddModal);
  document.getElementById('adminForm')?.addEventListener('submit', handleFormSubmit);
  document.getElementById('adminCancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('adminModalClose')?.addEventListener('click', closeModal);
  document.getElementById('adminModalOverlay')?.addEventListener('click', closeModal);

  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loadTable(btn.dataset.table);
      document.getElementById('adminSidebar')?.classList.remove('open');
    });
  });

  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('adminSidebar')?.classList.toggle('open');
  });

  const themeToggle = document.getElementById('adminThemeToggle');
  const savedTheme = localStorage.getItem('fahim-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) themeToggle.textContent = savedTheme === 'dark' ? '☀' : '☾';
  }
  themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('fahim-theme', nextTheme);
    themeToggle.textContent = nextTheme === 'dark' ? '☀' : '☾';
  });

  document.querySelectorAll('.admin-stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetTable = card.dataset.table;
      if (targetTable) {
        loadTable(targetTable);
        document.getElementById('adminSidebar')?.classList.remove('open');
      }
    });
  });

  document.getElementById('adminRefreshBtn')?.addEventListener('click', () => {
    showAdminToast('Reloading from Google Sheet...', 'info');
    loadTable(currentTable, true);
  });

  const searchInput = document.getElementById('adminSearchInput');
  searchInput?.addEventListener('input', (e) => {
    const query = String(e.target.value || '').trim().toLowerCase();
    if (!query) {
      renderTable(allCurrentData, TABLE_CONFIG[currentTable]);
      const badge = document.getElementById('adminTableCountBadge');
      if (badge) badge.textContent = `${allCurrentData.length} items`;
      return;
    }
    const filtered = allCurrentData.filter(row => {
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
    renderTable(filtered, TABLE_CONFIG[currentTable]);
    const badge = document.getElementById('adminTableCountBadge');
    if (badge) badge.textContent = `${filtered.length} matched`;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      showLogin();
    } else if (event === 'SIGNED_IN' && session && !isAdminLoggedIn) {
      showDashboard(session.user?.email || '');
    }
  });
});
