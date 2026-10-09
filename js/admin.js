/* ============================================================
   ADMIN PANEL — Fahim Shahriar Website
   Login + Full CRUD for all content tables via Supabase
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
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: '0' },
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
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: '0' },
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
      { name: 'price', label: 'Price (BDT)', type: 'text', default: '1,000 BDT' },
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: '0' },
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
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: '0' },
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
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: '0' },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
  gallery_photos: {
    label: 'Gallery',
    canEdit: true,
    display: ['caption', 'category'],
    columns: [
      { name: 'image_url', label: 'Image URL', type: 'url', required: true },
      { name: 'caption', label: 'Caption', type: 'text' },
      { name: 'category', label: 'Category', type: 'text', default: 'General' },
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: '0' },
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
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: '0' },
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
    display: ['name', 'service_title', 'amount', 'payment_gateway', 'created_at'],
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
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return String(ts); }
}

function getEditableColumns() {
  return TABLE_CONFIG[currentTable].columns.filter(c => !['id', 'created_at'].includes(c.name));
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
  loadTable(currentTable);
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
  btn.textContent = 'Sign In →';
}

async function handleLogout() {
  if (db) await db.auth.signOut();
  showLogin();
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

/* ---- TABLE LOADING ---- */
async function loadTable(tableName) {
  currentTable = tableName;
  const config = TABLE_CONFIG[tableName];

  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.table === tableName);
  });

  document.getElementById('adminTableTitle').textContent = config.label;
  const addBtn = document.getElementById('adminAddBtn');
  addBtn.style.display = config.canEdit ? 'inline-block' : 'none';

  const wrap = document.getElementById('adminTableWrap');
  wrap.innerHTML = '<div class="admin-loading">Loading...</div>';

  try {
    const { data, error } = await db
      .from(tableName)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      allCurrentData = [];
      wrap.innerHTML = `<div class="admin-empty"><p>No ${config.label.toLowerCase()} yet.</p>${config.canEdit ? '<button class="btn btn-primary admin-add-btn" onclick="openAddModal()">+ Add your first entry</button>' : ''}</div>`;
      return;
    }

    allCurrentData = data;
    renderTable(data, config);
  } catch (err) {
    wrap.innerHTML = `<div class="admin-empty"><p style="color:var(--admin-danger);">Error loading data: ${esc(err.message)}</p><p style="font-size:0.8rem;color:var(--admin-muted);">Make sure you are logged in and RLS policies allow access.</p></div>`;
  }
}

function renderTable(data, config) {
  const wrap = document.getElementById('adminTableWrap');

  if (!config.canEdit) {
    // Read-only tables: messages & bookings — render detail view
    wrap.innerHTML = renderReadOnlyTable(data, config);
    return;
  }

  const displayCols = config.display;
  const hasImage = displayCols.includes('image') || displayCols.includes('image_url');

  let html = '<table class="admin-table"><thead><tr>';
  if (hasImage) html += '<th class="col-thumb"></th>';
  displayCols.forEach(col => {
    html += `<th>${esc(prettyHeader(col))}</th>`;
  });
  html += '<th class="col-actions">Actions</th>';
  html += '</tr></thead><tbody>';

  data.forEach(row => {
    html += '<tr>';
    if (hasImage) {
      const imgVal = row.image || row.image_url || '';
      html += `<td class="col-thumb">${imgVal ? `<img src="${esc(imgVal)}" alt="" onerror="this.style.display='none'">` : ''}</td>`;
    }
    displayCols.forEach(col => {
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
        html += `<td>${isProtected ? '🔒 Protected' : '✓ Free'}</td>`;
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
  };
  return map[col] || col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ---- DETAIL VIEW (messages/bookings) ---- */
let allCurrentData = [];

async function viewDetail(id) {
  const row = allCurrentData.find(r => r.id === id);
  if (!row) return;

  const config = TABLE_CONFIG[currentTable];
  const title = config.label === 'Messages' ? `Message from ${row.name || 'Unknown'}` : `Booking: ${row.service_title || row.name || 'Unknown'}`;

  const modal = document.getElementById('adminModal');
  document.getElementById('adminModalTitle').textContent = title;
  const fieldsEl = document.getElementById('adminFormFields');

  let html = '<div class="admin-detail">';
  for (const [key, val] of Object.entries(row)) {
    if (key === 'id') continue;
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

  // Fetch the specific row
  try {
    const { data, error } = await db.from(currentTable).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    renderFormFields(data);
    document.getElementById('adminModal').classList.add('open');
  } catch (err) {
    alert('Error loading entry: ' + err.message);
  }
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
      const dateVal = val ? String(val).split('T')[0] : '';
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
      data[col.name] = el.value ? parseInt(el.value, 10) : 0;
    } else {
      data[col.name] = el.value.trim();
    }
  });
  return data;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('adminSaveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

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
    if (currentEditId) {
      const { error } = await db.from(currentTable).update(data).eq('id', currentEditId);
      if (error) throw error;
    } else {
      const { error } = await db.from(currentTable).insert(data);
      if (error) throw error;
    }
    closeModal();
    loadTable(currentTable);
  } catch (err) {
    alert('Error saving: ' + err.message);
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save';
}

function closeModal() {
  document.getElementById('adminModal').classList.remove('open');
  currentEditId = null;
}

/* ---- DELETE ---- */
async function confirmDelete(id) {
  if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) return;
  try {
    const { error } = await db.from(currentTable).delete().eq('id', id);
    if (error) throw error;
    loadTable(currentTable);
  } catch (err) {
    alert('Error deleting: ' + err.message);
  }
}

/* ---- STORE DATA FOR DETAIL VIEW ---- */

/* ---- INIT ---- */
window.addEventListener('DOMContentLoaded', async () => {
  // Wait for supabase-client.js to load
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

  // Check existing session
  const session = await checkSession();
  if (session) {
    showDashboard(session.user?.email || '');
  } else {
    showLogin();
  }

  // Event listeners
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('adminAddBtn').addEventListener('click', openAddModal);
  document.getElementById('adminForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('adminCancelBtn').addEventListener('click', closeModal);
  document.getElementById('adminModalClose').addEventListener('click', closeModal);
  document.getElementById('adminModalOverlay').addEventListener('click', closeModal);

  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loadTable(btn.dataset.table);
      // Close mobile sidebar
      document.getElementById('adminSidebar').classList.remove('open');
    });
  });

  // Sidebar toggle (mobile)
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
  });

  // Google Sheet Guide modal listeners
  const guideModal = document.getElementById('sheetGuideModal');
  const openGuideBtn = document.getElementById('openSheetGuideBtn');
  const closeGuideBtn = document.getElementById('sheetGuideClose');
  const okGuideBtn = document.getElementById('sheetGuideOkBtn');
  const guideOverlay = document.getElementById('sheetGuideOverlay');

  const openGuide = () => { if (guideModal) guideModal.classList.add('open'); };
  const closeGuide = () => { if (guideModal) guideModal.classList.remove('open'); };

  if (openGuideBtn) openGuideBtn.addEventListener('click', openGuide);
  if (closeGuideBtn) closeGuideBtn.addEventListener('click', closeGuide);
  if (okGuideBtn) okGuideBtn.addEventListener('click', closeGuide);
  if (guideOverlay) guideOverlay.addEventListener('click', closeGuide);

  // Escape to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeGuide();
    }
  });

  // Listen for auth state changes
  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      showLogin();
    } else if (event === 'SIGNED_IN' && session && !isAdminLoggedIn) {
      showDashboard(session.user?.email || '');
    }
  });
});
