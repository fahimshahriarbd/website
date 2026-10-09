/* ============================================================
   FAHIM SHAHRIAR — WEBSITE MAIN SCRIPT
   Data source: Supabase database
   ============================================================ */

let supabase = null;

/* ---- UTILITY HELPERS ---- */
function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function openExternalUrl(url) {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function formatDateValue(val) {
  if (!val) return 'Today';
  const str = String(val).trim();
  const iso = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) return `${iso[3].padStart(2,'0')}-${iso[2].padStart(2,'0')}-${iso[1]}`;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990)
    return `${String(parsed.getDate()).padStart(2,'0')}-${String(parsed.getMonth()+1).padStart(2,'0')}-${parsed.getFullYear()}`;
  return str;
}

function toggleCardDesc(btn, evt) {
  if (evt) { evt.preventDefault?.(); evt.stopPropagation?.(); }
  const c = btn?.closest('.expandable-desc'); if (!c) return;
  const full = c.querySelector('.desc-full'); const dots = c.querySelector('.desc-dots');
  const exp = btn.getAttribute('aria-expanded') === 'true';
  if (exp) { if(full) full.style.display='none'; if(dots) dots.style.display='inline'; btn.textContent='See more'; btn.setAttribute('aria-expanded','false'); }
  else { if(full) full.style.display='inline'; if(dots) dots.style.display='none'; btn.textContent='See less'; btn.setAttribute('aria-expanded','true'); }
}
window.toggleCardDesc = toggleCardDesc;

function formatTruncatedDesc(text, maxWords = 22) {
  const str = String(text || '').trim();
  if (!str) return '';
  const words = str.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return `<p class="card-desc">${escapeHtml(str)}</p>`;
  return `<p class="card-desc expandable-desc"><span class="desc-short">${escapeHtml(words.slice(0,maxWords).join(' '))}</span><span class="desc-dots">...</span><span class="desc-full" style="display:none;"> ${escapeHtml(words.slice(maxWords).join(' '))}</span><button type="button" class="desc-toggle-btn" aria-expanded="false" onclick="toggleCardDesc(this, event)">See more</button></p>`;
}

/* ---- SECTION LOADER ---- */
async function loadSections(){
  const slots = [...document.querySelectorAll('[data-section]')];
  for (const slot of slots) {
    const name = slot.dataset.section;
    try {
      const r = await fetch(`sections/${name}.html`, { cache:'no-store' });
      if (!r.ok) throw new Error(`Section not found: ${name}`);
      slot.outerHTML = await r.text();
    } catch(err) {
      console.warn(`Skipping section: ${name}`, err);
      slot.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">Section not available</div>';
    }
  }
}

/* ---- SEARCH SYSTEM ---- */
let searchItems = [];
function highlightMatch(text, query) {
  if (!text) return '';
  const str = String(text); if (!query) return escapeHtml(str);
  const terms = query.trim().split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  if (!terms.length) return escapeHtml(str);
  const regex = new RegExp(`(${terms.join('|')})`,'gi');
  const testR = new RegExp(`^(?:${terms.join('|')})$`,'i');
  return str.split(regex).map(p => testR.test(p) ? `<mark>${escapeHtml(p)}</mark>` : escapeHtml(p)).join('');
}
function getSnippet(text, query) {
  if (!text) return '';
  const str = String(text).trim();
  if (str.length <= 130) return highlightMatch(str, query);
  const lower = str.toLowerCase(); const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let idx = lower.indexOf(words[0] || query.trim().toLowerCase());
  if (idx === -1) return highlightMatch(str.slice(0,120)+'...', query);
  const s = Math.max(0, idx-40); const e = Math.min(str.length, idx+80);
  return highlightMatch((s>0?'...':'')+str.slice(s,e)+(e<str.length?'...':''), query);
}
function buildSearchIndex() {
  const items = []; let c = 0;
  document.querySelectorAll('main section').forEach(section => {
    const secId = section.id || '';
    const eyebrow = section.querySelector('.eyebrow')?.textContent.trim() || '';
    const heading = section.querySelector('.section-head h4, .section-head h2')?.textContent.trim() || '';
    const sName = eyebrow || heading || secId || 'Section';
    section.querySelectorAll('.card').forEach(card => {
      c++; if (!card.id) card.id = `card-${secId}-${c}`;
      const t = card.querySelector('h3, h4')?.textContent.trim() || '';
      const txt = card.querySelector('p')?.textContent.trim() || '';
      if (t || txt) items.push({id:card.id, title:t||sName, text:txt, meta:sName, sectionId:secId});
    });
    if (secId === 'journey') {
      section.querySelectorAll('.info-row').forEach(row => {
        c++; if (!row.id) row.id = `journey-${c}`;
        const t = row.querySelector('b')?.textContent.trim() || '';
        const txt = row.querySelector('.muted, span')?.textContent.trim() || '';
        if (t || txt) items.push({id:row.id, title:t||'Milestone', text:txt, meta:'Journey', sectionId:'journey'});
      });
    }
  });
  document.querySelectorAll('#blogGrid .blog-card').forEach(card => {
    c++; if (!card.id) card.id = `blog-${c}`;
    items.push({id:card.id, title:card.querySelector('h4,h3')?.textContent.trim()||'', text:card.querySelector('p')?.textContent.trim()||'', meta:'Blog', sectionId:'blog'});
  });
  document.querySelectorAll('#galleryGrid .gallery-item').forEach(item => {
    c++; if (!item.id) item.id = `gallery-${c}`;
    items.push({id:item.id, title:item.querySelector('.gallery-caption')?.textContent.trim()||'Photo', text:'Gallery photo', meta:'Gallery', sectionId:'gallery'});
  });
  document.querySelectorAll('#projectsGrid .project-card').forEach(card => {
    c++; if (!card.id) card.id = `project-${c}`;
    items.push({id:card.id, title:card.querySelector('h4,h3')?.textContent.trim()||'Project', text:card.querySelector('p')?.textContent.trim()||'', meta:'Projects', sectionId:'projects'});
  });
  document.querySelectorAll('#servicesGrid .service-card').forEach(card => {
    c++; if (!card.id) card.id = `service-${c}`;
    items.push({id:card.id, title:card.querySelector('h4,h3')?.textContent.trim()||'Service', text:card.querySelector('p')?.textContent.trim()||'', meta:'Services', sectionId:'services'});
  });
  document.querySelectorAll('#testimonialsGrid .testimonial-card').forEach(card => {
    c++; if (!card.id) card.id = `testimonial-${c}`;
    items.push({id:card.id, title:card.querySelector('b')?.textContent.trim()||'', text:card.querySelector('.card-desc')?.textContent.trim()||'', meta:'Testimonials', sectionId:'testimonials'});
  });
  searchItems = items;
}
window.updateSearchIndex = buildSearchIndex;

function renderSearch(query) {
  const sr = document.getElementById('searchResults'); if (!sr) return;
  const q = String(query||'').trim().toLowerCase();
  if (!q) { sr.innerHTML = '<div class="search-empty">Search blogs, projects, services and more.</div>'; return; }
  if (!searchItems.length) buildSearchIndex();
  const words = q.split(/\s+/).filter(Boolean);
  const matches = searchItems.map(item => {
    let s = 0; const t = item.title.toLowerCase(), tx = item.text.toLowerCase(), m = item.meta.toLowerCase();
    if (t===q) s+=100; else if (t.includes(q)) s+=60;
    if (m.includes(q)) s+=35; if (tx.includes(q)) s+=25;
    if (words.length>1) words.forEach(w => { if(t.includes(w)) s+=20; if(tx.includes(w)) s+=10; });
    return {item, s};
  }).filter(e => e.s > 0).sort((a,b) => b.s-a.s).map(e => e.item);
  if (!matches.length) { sr.innerHTML = `<div class="search-empty">No matches for "<b>${escapeHtml(query)}</b>".</div>`; return; }
  sr.innerHTML = matches.slice(0,12).map(item => `<div class="search-result" data-target-id="${escapeHtml(item.id)}" role="button" tabindex="0"><span class="search-result-meta">${escapeHtml(item.meta)}</span><strong class="search-result-title">${highlightMatch(item.title,q)}</strong><span class="search-snippet">${getSnippet(item.text,q)}</span></div>`).join('');
}

function initSearch() {
  const btn = document.getElementById('searchBtn'); const box = document.getElementById('searchBox');
  const close = document.getElementById('closeSearch'); const input = document.getElementById('siteSearch');
  const results = document.getElementById('searchResults');
  if (!btn || !box || !input || !results) return;
  btn.addEventListener('click', () => { const o = box.classList.toggle('open'); btn.classList.toggle('active',o); if(o){input.focus(); renderSearch(input.value);} });
  close?.addEventListener('click', () => { box.classList.remove('open'); btn.classList.remove('active'); });
  input.addEventListener('input', () => renderSearch(input.value));
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k') { e.preventDefault(); box.classList.add('open'); btn.classList.add('active'); input.focus(); renderSearch(input.value); }
    if (e.key==='Escape') { box.classList.remove('open'); btn.classList.remove('active'); }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrap')) { box.classList.remove('open'); btn.classList.remove('active'); } });
  results.addEventListener('click', (e) => {
    const card = e.target.closest('.search-result'); if (!card) return;
    const el = document.getElementById(card.dataset.targetId); if (!el) return;
    box.classList.remove('open'); btn.classList.remove('active');
    el.scrollIntoView({behavior:'smooth',block:'center'});
    el.classList.remove('search-hit'); void el.offsetWidth; el.classList.add('search-hit');
    setTimeout(() => el.classList.remove('search-hit'), 2500);
  });
  buildSearchIndex();
}

/* ---- UI: MENU, THEME, TOP BTN, SCROLL, NAV ---- */
function initUI() {
  const menuBtn = document.getElementById('menuBtn'); const navLinks = document.getElementById('navLinks'); const backdrop = document.getElementById('mobileNavBackdrop');
  function open(){ navLinks?.classList.add('open'); backdrop?.classList.add('open'); if(menuBtn){menuBtn.classList.add('active');menuBtn.textContent='✕';} }
  function close(){ navLinks?.classList.remove('open'); backdrop?.classList.remove('open'); if(menuBtn){menuBtn.classList.remove('active');menuBtn.textContent='☰';} }
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', (e) => { e.stopPropagation(); navLinks.classList.contains('open')?close():open(); });
    backdrop?.addEventListener('click', close);
    document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('click', (e) => { if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) close(); });
  }
  const themeBtn = document.getElementById('themeBtn'); const saved = localStorage.getItem('fahim-theme');
  if (themeBtn) {
    if (saved) { document.documentElement.setAttribute('data-theme', saved); themeBtn.textContent = saved==='dark'?'☀':'☾'; }
    themeBtn.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme')==='dark';
      document.documentElement.setAttribute('data-theme', dark?'light':'dark');
      localStorage.setItem('fahim-theme', dark?'light':'dark');
      themeBtn.textContent = dark?'☾':'☀';
    });
  }
  const topBtn = document.getElementById('topBtn');
  if (topBtn) { window.addEventListener('scroll', () => topBtn.classList.toggle('show', window.scrollY>500), {passive:true}); topBtn.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'})); }
  const sp = document.getElementById('scrollProgress');
  if (sp) { const upd = () => { const h = document.documentElement.scrollHeight-window.innerHeight; sp.style.width = (h>0?(window.scrollY/h)*100:0)+'%'; }; window.addEventListener('scroll', upd, {passive:true}); upd(); }
  const navSecs = [...document.querySelectorAll('main section[id]')];
  if (navSecs.length) {
    const obs = new IntersectionObserver(entries => { entries.forEach(en => { if (en.isIntersecting) { document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active')); document.querySelector(`.nav-links a[href="#${en.target.id}"]`)?.classList.add('active'); } }); }, {rootMargin:'-35% 0px -55% 0px', threshold:0});
    navSecs.forEach(s => obs.observe(s));
  }
  const yr = document.getElementById('year'); if (yr) yr.textContent = new Date().getFullYear();
  const ro = new IntersectionObserver(entries => { entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); ro.unobserve(en.target); } }); }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
  document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
  window.refreshReveal = () => document.querySelectorAll('.reveal:not(.visible)').forEach(el => ro.observe(el));
  document.addEventListener('click', (e) => { const b = e.target.closest('.desc-toggle-btn'); if (b) toggleCardDesc(b, e); });
}

/* ---- CONTACT FORM ---- */
function initContactForm() {
  const form = document.getElementById('contactForm'); const btn = document.getElementById('submitBtn'); const status = document.getElementById('formStatus');
  if (!form || !btn || !status) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); btn.disabled = true; btn.textContent = 'Sending...'; status.style.display = 'none';
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();
    try {
      const { error } = await supabase.from('messages').insert({ name, email, subject, message });
      if (error) throw error;
      status.style.display = 'block'; status.textContent = '✓ Message sent successfully. Thank you!'; status.style.color = '#16a34a';
      form.reset();
    } catch { status.style.display = 'block'; status.textContent = 'Something went wrong. Please try again.'; status.style.color = '#dc2626'; }
    btn.disabled = false; btn.textContent = 'Send Message →';
  });
}

/* ---- BLOG ---- */
let allBlogPosts = [], activeFilteredBlog = [];
const BLOG_PG = 4; let blogVis = 4, blogInit = false;
function blogCardHtml(p) {
  const cat = String(p.category||'Blog').trim();
  const img = String(p.image||'').trim() || 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1000&q=85';
  const date = formatDateValue(p.date); const rt = String(p.read_time||'5').trim();
  const sum = String(p.summary||p.content||'...').trim();
  return `<article class="card blog-card" data-category="${escapeHtml(cat.toLowerCase())}"><img class="blog-cover" src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" loading="lazy"><div class="blog-body"><div class="blog-meta"><span>${escapeHtml(cat)}</span><span>${escapeHtml(date)} · ${escapeHtml(rt)} min</span></div><h4>${escapeHtml(p.title)}</h4>${formatTruncatedDesc(sum,22)}<a class="read-more" href="${escapeHtml(p.link||'#')}">Read article →</a></div></article>`;
}
function renderBlog(append=false) {
  const g = document.getElementById('blogGrid'); const sw = document.getElementById('blogSeeMoreWrap'); const sb = document.getElementById('blogSeeMoreBtn');
  if (!g) return;
  if (!activeFilteredBlog.length) { g.innerHTML = '<div style="grid-column:1/-1;padding:36px;text-align:center;color:var(--muted);border:1px dashed var(--border);border-radius:16px;">No blog posts yet.</div>'; if(sw) sw.style.display='none'; return; }
  const vis = activeFilteredBlog.slice(0, blogVis);
  if (!append) g.innerHTML = vis.map(blogCardHtml).join('');
  else { const si = blogVis-BLOG_PG; g.insertAdjacentHTML('beforeend', activeFilteredBlog.slice(si,blogVis).map(blogCardHtml).join('')); }
  if (sw) { if (blogVis < activeFilteredBlog.length) { sw.style.display='flex'; if(sb) sb.innerHTML=`See More (${activeFilteredBlog.length-blogVis} remaining) ↓`; } else sw.style.display='none'; }
  window.updateSearchIndex?.();
}
async function loadBlog() {
  const g = document.getElementById('blogGrid'); if (!g) return;
  try { const {data,error} = await supabase.from('blog_posts').select('*').eq('published',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false}); if(error) throw error; allBlogPosts = data||[]; } catch { allBlogPosts = []; }
  activeFilteredBlog = [...allBlogPosts]; blogVis = BLOG_PG;
  const tb = document.getElementById('blogToolbar');
  if (tb && allBlogPosts.length) {
    const cats = [...new Set(allBlogPosts.map(p => (p.category||'Blog').trim()).filter(Boolean))];
    tb.innerHTML = `<button class="filter-btn active" data-filter="all">All (${allBlogPosts.length})</button>${cats.map(c => `<button class="filter-btn" data-filter="${escapeHtml(c)}">${escapeHtml(c)} (${allBlogPosts.filter(p => (p.category||'').toLowerCase()===c.toLowerCase()).length})</button>`).join('')}`;
    tb.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => { tb.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); const f = b.dataset.filter; activeFilteredBlog = f==='all'?[...allBlogPosts]:allBlogPosts.filter(p => (p.category||'').toLowerCase()===f.toLowerCase()); blogVis=BLOG_PG; renderBlog(); }));
  }
  const sb = document.getElementById('blogSeeMoreBtn');
  if (sb && !blogInit) { blogInit=true; sb.addEventListener('click', () => { blogVis+=BLOG_PG; renderBlog(true); }); }
  renderBlog();
}

/* ---- GALLERY ---- */
let allGallery = [], activeGallery = [];
const GAL_PG = 8; let galVis = 8, galInit = false, lbIdx = 0;
function galItemHtml(p, i) {
  return `<div class="gallery-item" data-category="${escapeHtml(p.category)}" data-index="${i}" role="button" tabindex="0"><img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.caption||p.category)}" loading="lazy"/><span class="gallery-badge">${escapeHtml(p.category)}</span><div class="gallery-overlay"><span class="gallery-zoom-icon">🔍</span><span class="gallery-caption">${escapeHtml(p.caption||p.category)}</span></div></div>`;
}
function renderGallery(append=false) {
  const g = document.getElementById('galleryGrid'); const sw = document.getElementById('gallerySeeMoreWrap'); const sb = document.getElementById('gallerySeeMoreBtn');
  if (!g) return;
  if (!activeGallery.length) { g.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No photos found.</div>'; if(sw) sw.style.display='none'; return; }
  const vis = activeGallery.slice(0, galVis);
  if (!append) g.innerHTML = vis.map((p,i) => galItemHtml(p,i)).join('');
  else { const si = galVis-GAL_PG; g.insertAdjacentHTML('beforeend', activeGallery.slice(si,galVis).map((p,i) => galItemHtml(p,si+i)).join('')); }
  g.querySelectorAll('.gallery-item').forEach(item => { if(item.dataset.hl) return; item.dataset.hl='1'; item.addEventListener('click', () => openLightbox(parseInt(item.dataset.index,10))); item.addEventListener('keydown', e => { if(e.key==='Enter') openLightbox(parseInt(item.dataset.index,10)); }); });
  if (sw) { if (galVis < activeGallery.length) { sw.style.display='flex'; if(sb) sb.innerHTML=`See More (${activeGallery.length-galVis} remaining) ↓`; } else sw.style.display='none'; }
}
function renderGallerySection() {
  const tb = document.getElementById('galleryToolbar'); activeGallery = [...allGallery]; galVis = GAL_PG;
  if (tb) { const cats = [...new Set(allGallery.map(p => p.category.trim()).filter(Boolean))]; tb.innerHTML = `<button class="filter-btn active" data-gallery-filter="all">All (${allGallery.length})</button>${cats.map(c => `<button class="filter-btn" data-gallery-filter="${escapeHtml(c)}">${escapeHtml(c)} (${allGallery.filter(p => p.category.toLowerCase()===c.toLowerCase()).length})</button>`).join('')}`; tb.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => { tb.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); const f = b.dataset.galleryFilter; activeGallery = f==='all'?[...allGallery]:allGallery.filter(p => p.category.toLowerCase()===f.toLowerCase()); galVis=GAL_PG; renderGallery(); })); }
  const sb = document.getElementById('gallerySeeMoreBtn');
  if (sb && !galInit) { galInit=true; sb.addEventListener('click', () => { galVis+=GAL_PG; renderGallery(true); }); }
  renderGallery();
}
function openLightbox(i) { const lb = document.getElementById('galleryLightbox'); if(!lb||!activeGallery.length) return; lbIdx=(i+activeGallery.length)%activeGallery.length; updateLb(); lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
function closeLightbox() { const lb = document.getElementById('galleryLightbox'); if(!lb) return; lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
function prevLb() { if(!activeGallery.length) return; lbIdx=(lbIdx-1+activeGallery.length)%activeGallery.length; updateLb(); }
function nextLb() { if(!activeGallery.length) return; lbIdx=(lbIdx+1)%activeGallery.length; updateLb(); }
function updateLb() { const p = activeGallery[lbIdx]; if(!p) return; const img = document.getElementById('lightboxImg'); if(img){img.classList.add('switching');setTimeout(()=>{img.src=p.image_url;img.alt=p.caption||p.category;img.classList.remove('switching');},150);} document.getElementById('lightboxCategory').textContent=p.category; document.getElementById('lightboxCounter').textContent=`${lbIdx+1} / ${activeGallery.length}`; document.getElementById('lightboxCaption').textContent=p.caption||p.category; }
function initLightbox() {
  const lb = document.getElementById('galleryLightbox'); if(!lb) return;
  document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxOverlay')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev')?.addEventListener('click', prevLb);
  document.getElementById('lightboxNext')?.addEventListener('click', nextLb);
  document.getElementById('lightboxDownload')?.addEventListener('click', () => { const p=activeGallery[lbIdx]; if(!p) return; downloadImg(p.image_url, `fahim-${(p.category||'photo').toLowerCase()}-${lbIdx+1}.jpg`); });
  document.addEventListener('keydown', e => { if(!lb.classList.contains('open')) return; if(e.key==='Escape') closeLightbox(); if(e.key==='ArrowLeft') prevLb(); if(e.key==='ArrowRight') nextLb(); });
}
async function downloadImg(url, fn) {
  try { const r = await fetch(url,{mode:'cors'}); if(!r.ok) throw 0; const b = await r.blob(); const u = URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=fn||'photo.jpg'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),1500); }
  catch { const a=document.createElement('a'); a.href=url; a.target='_blank'; a.download=fn||'photo.jpg'; document.body.appendChild(a); a.click(); a.remove(); }
}
async function loadGallery() {
  const g = document.getElementById('galleryGrid'); if(!g) return;
  try { const {data,error} = await supabase.from('gallery_photos').select('*').order('sort_order',{ascending:true}); if(error) throw error; allGallery = data||[]; } catch { allGallery = []; }
  if (!allGallery.length) { g.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No photos available.</div>'; return; }
  renderGallerySection(); initLightbox(); window.updateSearchIndex?.();
}

/* ---- SERVICES ---- */
let allServices = []; let curSvcCat = 'All';
const SVC_PG = 6; let svcVis = 6, svcInit = false;
function fmtFee(v) { let c = String(v||'1,000 BDT').replace(/bdt/gi,'').replace(/[৳,]/g,'').replace(/taka/gi,'').trim(); const n = parseInt(c,10); return !isNaN(n) ? `${n.toLocaleString('en-US')} BDT` : (c?`${c} BDT`:'1,000 BDT'); }
function svcCardHtml(s) {
  const isImg = s.icon && (s.icon.startsWith('http')||s.icon.startsWith('//')||s.icon.startsWith('data:'));
  const icon = isImg ? `<img src="${escapeHtml(s.icon)}" alt="${escapeHtml(s.title)}" style="width:36px;height:36px;object-fit:contain;"/>` : escapeHtml(s.icon||'💼');
  const fee = fmtFee(s.price);
  return `<article class="card service-card"><div class="service-card-body"><div class="card-header"><div class="card-icon">${icon}</div><h4>${escapeHtml(s.title)}</h4></div>${formatTruncatedDesc(s.description,22)}</div><div class="service-footer"><div class="service-price-block"><span class="service-price-label">Charge:</span><span class="service-price-value">${escapeHtml(fee)}</span></div><button type="button" class="service-request-btn" data-service-title="${escapeHtml(s.title)}" data-service-price="${escapeHtml(fee)}">I need this Service →</button></div></article>`;
}
function renderSvcFilter() {
  const fw = document.getElementById('servicesFilterWrap'); if(!fw) return;
  const cats = ['All', ...new Set(allServices.map(s => s.category).filter(Boolean))];
  if (cats.length <= 2) { fw.style.display='none'; return; }
  fw.style.display='flex';
  fw.innerHTML = cats.map(c => { const cnt = c==='All'?allServices.length:allServices.filter(s => s.category===c).length; return `<button type="button" class="services-filter-btn ${c===curSvcCat?'active':''}" data-category="${escapeHtml(c)}">${escapeHtml(c)} <span class="services-filter-count">${cnt}</span></button>`; }).join('');
  fw.querySelectorAll('.services-filter-btn').forEach(b => b.onclick = () => { curSvcCat = b.dataset.category||'All'; svcVis=SVC_PG; renderSvcFilter(); renderSvc(false); });
}
function renderSvc(append=false) {
  const g = document.getElementById('servicesGrid'); const sw = document.getElementById('servicesSeeMoreWrap'); const sb = document.getElementById('servicesSeeMoreBtn');
  if(!g) return;
  const f = curSvcCat==='All' ? allServices : allServices.filter(s => s.category===curSvcCat);
  const vis = f.slice(0, svcVis);
  if(!append) g.innerHTML = vis.map(svcCardHtml).join('');
  else { const si = svcVis-SVC_PG; g.insertAdjacentHTML('beforeend', f.slice(si,svcVis).map(svcCardHtml).join('')); }
  document.querySelectorAll('.service-request-btn').forEach(b => { if(b.dataset.hl) return; b.dataset.hl='1'; b.addEventListener('click', () => openSvcModal(b.dataset.serviceTitle||'Service', b.dataset.servicePrice||'1,000 BDT')); });
  if(sw) { if(svcVis<f.length) { sw.style.display='flex'; if(sb) sb.innerHTML=`See More Services (${f.length-svcVis} remaining) ↓`; } else sw.style.display='none'; }
}
async function loadServices() {
  const g = document.getElementById('servicesGrid'); if(!g) return;
  try { const {data,error} = await supabase.from('services').select('*').eq('is_active',true).order('sort_order',{ascending:true}); if(error) throw error; allServices = data||[]; } catch { allServices = []; }
  if(!allServices.length) { g.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No services available.</div>'; return; }
  renderSvcFilter(); svcVis=SVC_PG;
  const sb = document.getElementById('servicesSeeMoreBtn');
  if(sb && !svcInit) { svcInit=true; sb.addEventListener('click', () => { svcVis+=SVC_PG; renderSvc(true); }); }
  renderSvc(); initSvcModal(); window.updateSearchIndex?.();
}

/* ---- SERVICE BOOKING MODAL ---- */
let curSvc = '', curSvcPrice = '1,000 BDT', curGw = 'bKash'; let svcModalInit = false;
function gwNum(gw) { return String(gw||'').toLowerCase().includes('rocket') ? '013168311990' : '01316831199'; }
function openSvcModal(title, price) {
  const m = document.getElementById('serviceModal'); if(!m) return;
  curSvc = title; curSvcPrice = price || '1,000 BDT';
  document.getElementById('serviceModalSelectedTitle').innerHTML = `📌 <strong>${escapeHtml(title)}</strong> <span class="service-modal-price-pill">Charge: ${escapeHtml(curSvcPrice)}</span>`;
  document.getElementById('summaryServiceTitle').textContent = title;
  document.getElementById('summaryServicePrice').textContent = curSvcPrice;
  document.getElementById('serviceStep1').style.display='block';
  document.getElementById('serviceStep2').style.display='none';
  document.getElementById('serviceStep3').style.display='none';
  document.getElementById('serviceStepSuccess').style.display='none';
  document.getElementById('serviceSubmitStatus').style.display='none';
  m.classList.add('open'); m.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  setTimeout(() => document.getElementById('serviceName')?.focus(), 100);
}
function initSvcModal() {
  if(svcModalInit) return; const m = document.getElementById('serviceModal'); if(!m) return; svcModalInit=true;
  const close = () => { m.classList.remove('open'); m.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
  document.getElementById('serviceModalOverlay')?.addEventListener('click', close);
  document.getElementById('serviceModalClose')?.addEventListener('click', close);
  document.getElementById('serviceSuccessDoneBtn')?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key==='Escape' && m.classList.contains('open')) close(); });
  ['serviceName','serviceMobile','serviceLocation'].forEach(id => document.getElementById(id)?.addEventListener('input', () => { const err = document.getElementById('serviceStep1Error'); if(err) err.style.display='none'; }));
  document.getElementById('serviceGoToPaymentBtn').onclick = (e) => {
    e.preventDefault();
    const name = document.getElementById('serviceName')?.value.trim();
    const mobile = document.getElementById('serviceMobile')?.value.trim();
    const loc = document.getElementById('serviceLocation')?.value.trim();
    const err = document.getElementById('serviceStep1Error'); if(err) err.style.display='none';
    if(!name) { if(err){err.textContent='Please enter your full name.';err.style.display='block';} document.getElementById('serviceName')?.focus(); return; }
    if(!mobile) { if(err){err.textContent='Please enter your phone number.';err.style.display='block';} document.getElementById('serviceMobile')?.focus(); return; }
    if(!loc) { if(err){err.textContent='Please enter your address.';err.style.display='block';} document.getElementById('serviceLocation')?.focus(); return; }
    document.getElementById('serviceStep1').style.display='none'; document.getElementById('serviceStep2').style.display='block'; document.getElementById('serviceStep3').style.display='none'; document.getElementById('serviceStepSuccess').style.display='none';
    updGw();
  };
  document.getElementById('serviceBackToStep1Btn').onclick = () => { document.getElementById('serviceStep2').style.display='none'; document.getElementById('serviceStep3').style.display='none'; document.getElementById('serviceStep1').style.display='block'; };
  document.getElementById('serviceGoToStep3Btn').onclick = () => { document.getElementById('serviceStep2').style.display='none'; document.getElementById('serviceStep3').style.display='block'; updGw(); setTimeout(() => document.getElementById('servicePaymentNumber')?.focus(), 50); };
  document.getElementById('serviceBackToStep2Btn').onclick = () => { document.getElementById('serviceStep3').style.display='none'; document.getElementById('serviceStep2').style.display='block'; };
  m.querySelectorAll('.gateway-card').forEach(b => b.onclick = () => { m.querySelectorAll('.gateway-card').forEach(x => x.classList.remove('active')); b.classList.add('active'); curGw = b.dataset.gateway||'bKash'; updGw(); });
  function updGw() { const n = gwNum(curGw); document.getElementById('gatewaySelectedLabel').textContent=`${curGw} Personal Number:`; document.getElementById('personalNumberText').textContent=n; document.getElementById('gatewayNameInDesc').textContent=curGw; document.getElementById('gatewayInstructions').innerHTML=`Send Money <span class="instruct-price">${escapeHtml(curSvcPrice)}</span> to <strong>${n}</strong> from your <strong>${curGw}</strong> account. After sending, enter your sender number below.`; }
  const cpb = document.getElementById('copyNumberBtn');
  cpb?.addEventListener('click', () => { const n = gwNum(curGw); if(navigator.clipboard?.writeText) navigator.clipboard.writeText(n).then(() => { cpb.classList.add('copied'); document.getElementById('copyIconDefault').style.display='none'; document.getElementById('copyIconSuccess').style.display='block'; setTimeout(()=>{cpb.classList.remove('copied');document.getElementById('copyIconDefault').style.display='block';document.getElementById('copyIconSuccess').style.display='none';},2000); }).catch(() => {}); });
  document.getElementById('serviceFinalSubmitBtn').onclick = async (e) => {
    e.preventDefault();
    const name = document.getElementById('serviceName')?.value.trim();
    const mobile = document.getElementById('serviceMobile')?.value.trim();
    const loc = document.getElementById('serviceLocation')?.value.trim();
    const notes = document.getElementById('serviceNotes')?.value.trim();
    const pnum = document.getElementById('servicePaymentNumber')?.value.trim();
    const trx = document.getElementById('servicePaymentTrx')?.value.trim();
    const st = document.getElementById('serviceSubmitStatus');
    if(!pnum) { if(st){st.style.display='block';st.style.background='#fef2f2';st.style.color='#dc2626';st.style.border='1px solid #fecaca';st.textContent='Please enter the sender phone number you paid from.';} document.getElementById('servicePaymentNumber')?.focus(); return; }
    const fb = document.getElementById('serviceFinalSubmitBtn'); fb.disabled=true; fb.textContent='Submitting...'; if(st) st.style.display='none';
    try {
      const { error } = await supabase.from('bookings').insert({ name, mobile, location:loc, service_title:curSvc, amount:curSvcPrice, payment_gateway:curGw, payment_number:pnum, trx_id:trx||'', notes:notes||'' });
      if(error) throw error;
      document.getElementById('serviceStep1').style.display='none'; document.getElementById('serviceStep2').style.display='none'; document.getElementById('serviceStep3').style.display='none'; document.getElementById('serviceStepSuccess').style.display='block';
      document.getElementById('serviceSuccessMsg').innerHTML = `Thank you <strong>${escapeHtml(name)}</strong>! Your request for "<strong>${escapeHtml(curSvc)}</strong>" (Charge: <strong>${escapeHtml(curSvcPrice)}</strong>) has been received.`;
      document.getElementById('serviceClientForm')?.reset(); document.getElementById('servicePaymentForm')?.reset();
    } catch { if(st){st.style.display='block';st.style.background='#fef2f2';st.style.color='#dc2626';st.textContent='Something went wrong. Please try again.';} }
    finally { fb.disabled=false; fb.textContent='Confirm'; }
  };
}

/* ---- ACHIEVEMENTS ---- */
let allAch = []; const ACH_PG = 4; let achVis = 4, achInit = false;
function achCardHtml(a) {
  const isImg = a.icon && (a.icon.startsWith('http')||a.icon.startsWith('//')||a.icon.startsWith('data:'));
  const icon = isImg ? `<img src="${escapeHtml(a.icon)}" alt="${escapeHtml(a.title)}" style="width:36px;height:36px;object-fit:contain;"/>` : escapeHtml(a.icon||'🏆');
  return `<article class="card"><div class="card-header"><div class="card-icon">${icon}</div><h4>${escapeHtml(a.title)}</h4></div>${formatTruncatedDesc(a.description,22)}</article>`;
}
function renderAch(append=false) {
  const g = document.getElementById('achievementsGrid'); const sw = document.getElementById('achievementsSeeMoreWrap'); const sb = document.getElementById('achievementsSeeMoreBtn');
  if(!g) return; const vis = allAch.slice(0, achVis);
  if(!append) g.innerHTML = vis.map(achCardHtml).join('');
  else { const si = achVis-ACH_PG; g.insertAdjacentHTML('beforeend', allAch.slice(si,achVis).map(achCardHtml).join('')); }
  if(sw) { if(achVis<allAch.length) { sw.style.display='flex'; if(sb) sb.innerHTML=`See More (${allAch.length-achVis} remaining) ↓`; } else sw.style.display='none'; }
}
async function loadAchievements() {
  const g = document.getElementById('achievementsGrid'); if(!g) return;
  try { const {data,error} = await supabase.from('achievements').select('*').eq('published',true).order('sort_order',{ascending:true}); if(error) throw error; allAch = data||[]; } catch { allAch = []; }
  achVis = ACH_PG;
  const sb = document.getElementById('achievementsSeeMoreBtn');
  if(sb && !achInit) { achInit=true; sb.addEventListener('click', () => { achVis+=ACH_PG; renderAch(true); }); }
  renderAch(); window.updateSearchIndex?.();
}

/* ---- PROJECTS ---- */
let allProj = []; let curProjCat = 'All';
const PROJ_PG = 6; let projVis = 6, projInit = false;
function fmtCat(c) { if(!c) return 'General'; const s = String(c).trim(); if(['commerce','ecommerce','e-commerce'].includes(s.toLowerCase())) return 'Commerce'; return s.charAt(0).toUpperCase()+s.slice(1); }
function projCardHtml(p, i) {
  const isImg = p.icon && (p.icon.startsWith('http')||p.icon.startsWith('//')||p.icon.startsWith('data:'));
  const icon = isImg ? `<img src="${escapeHtml(p.icon)}" alt="${escapeHtml(p.title)}" style="width:36px;height:36px;object-fit:contain;"/>` : escapeHtml(p.icon||'🚀');
  const has = p.link && p.link.trim() && p.link !== '#';
  const tgt = has && !p.link.startsWith('#') ? '_blank' : '_self';
  const rel = tgt==='_blank' ? 'rel="noopener noreferrer"' : '';
  return `<article class="card project-card" data-project-index="${i}" data-project-link="${has?escapeHtml(p.link):''}"><div><div class="card-header"><div class="card-icon">${icon}</div><h4>${escapeHtml(p.title)}</h4></div>${formatTruncatedDesc(p.description,22)}</div><div class="project-card-footer">${has?`<a href="${escapeHtml(p.link)}" target="${tgt}" ${rel} class="project-view-details-btn">View details →</a>`:`<span class="project-view-details-btn" style="opacity:0.6;cursor:default;">View details →</span>`}</div></article>`;
}
function renderProjFilter() {
  const fw = document.getElementById('projectsFilterWrap'); if(!fw) return;
  const cats = ['All', ...new Set(allProj.map(p => fmtCat(p.category)).filter(Boolean))];
  if(cats.length <= 1) { fw.style.display='none'; return; }
  fw.style.display='flex';
  fw.innerHTML = cats.map(c => { const cnt = c==='All'?allProj.length:allProj.filter(p => fmtCat(p.category).toLowerCase()===c.toLowerCase()).length; return `<button type="button" class="projects-filter-btn ${c.toLowerCase()===curProjCat.toLowerCase()?'active':''}" data-category="${escapeHtml(c)}">${escapeHtml(c)} <span class="projects-filter-count">${cnt}</span></button>`; }).join('');
  fw.querySelectorAll('.projects-filter-btn').forEach(b => b.onclick = () => { curProjCat = b.dataset.category||'All'; projVis=PROJ_PG; renderProjFilter(); renderProj(false); });
}
function renderProj(append=false) {
  const g = document.getElementById('projectsGrid'); const sw = document.getElementById('projectsSeeMoreWrap'); const sb = document.getElementById('projectsSeeMoreBtn');
  if(!g) return;
  const f = curProjCat==='All' ? allProj : allProj.filter(p => fmtCat(p.category).toLowerCase()===curProjCat.toLowerCase());
  if(!f.length) { g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">No projects available yet.</div>'; if(sw) sw.style.display='none'; return; }
  const vis = f.slice(0, projVis);
  if(!append) g.innerHTML = vis.map((p,i) => projCardHtml(p,i)).join('');
  else { const si = projVis-PROJ_PG; g.insertAdjacentHTML('beforeend', f.slice(si,projVis).map((p,i) => projCardHtml(p,si+i)).join('')); }
  if(!g.dataset.pd) { g.dataset.pd='1'; g.addEventListener('click', e => { if(e.target.closest('.desc-toggle-btn')||e.target.closest('a')) return; const c = e.target.closest('.project-card'); if(!c) return; const l = c.dataset.projectLink; if(l && l.trim() && l !== '#') { l.startsWith('#') ? window.location.hash=l : openExternalUrl(l); } }); }
  if(sw) { if(projVis<f.length) { sw.style.display='flex'; if(sb) sb.innerHTML=`See More (${f.length-projVis} remaining) ↓`; } else sw.style.display='none'; }
}
async function loadProjects() {
  const g = document.getElementById('projectsGrid'); if(!g) return;
  try { const {data,error} = await supabase.from('projects').select('*').eq('published',true).order('sort_order',{ascending:true}); if(error) throw error; allProj = data||[]; } catch { allProj = []; }
  renderProjFilter(); projVis = PROJ_PG;
  const sb = document.getElementById('projectsSeeMoreBtn');
  if(sb && !projInit) { projInit=true; sb.addEventListener('click', () => { projVis+=PROJ_PG; renderProj(true); }); }
  renderProj(); window.updateSearchIndex?.();
}

/* ---- TESTIMONIALS ---- */
let allTesti = [];
function testiCardHtml(t) {
  const name = String(t.name||'Anonymous').trim();
  const tag = String(t.tag||'Friend').trim();
  const about = String(t.about||'Website').trim();
  const fb = String(t.feedback||'').trim().replace(/^[""']+|[""']+$/g,'').trim();
  const img = String(t.image||'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=85').trim();
  const link = String(t.link||'#').trim();
  const ext = link.startsWith('http://')||link.startsWith('https://');
  const ta = ext ? 'target="_blank" rel="noopener noreferrer"' : '';
  return `<article class="card testimonial-card"><div class="testimonial-header"><a href="${escapeHtml(link)}" ${ta} class="person-avatar-link"><img class="avatar" src="${escapeHtml(img)}" alt="${escapeHtml(name)}" loading="lazy"/></a><div class="person-info"><a href="${escapeHtml(link)}" ${ta} class="person-name-link"><b>${escapeHtml(name)}</b></a><div class="testimonial-meta-row">${tag?`<span class="person-relation-tag tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`:''}${about?`<span class="testimonial-about-badge">About: ${escapeHtml(about)}</span>`:''}</div></div></div><div class="testimonial-content">${formatTruncatedDesc(fb,22)}</div></article>`;
}
async function loadTestimonials() {
  const g = document.getElementById('testimonialsGrid'); if(!g) return;
  try { const {data,error} = await supabase.from('testimonials').select('*').eq('published',true).order('sort_order',{ascending:true}); if(error) throw error; allTesti = data||[]; } catch { allTesti = []; }
  g.innerHTML = allTesti.length ? allTesti.map(testiCardHtml).join('') : '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No testimonials yet.</div>';
  window.updateSearchIndex?.();
}

/* ---- CV SYSTEM ---- */
let allCvs = []; let curCv = null;
function renderCvList() {
  const c = document.getElementById('cvListContainer'); if(!c) return;
  if(!allCvs.length) { c.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);">No CV documents available.</div>'; return; }
  c.innerHTML = allCvs.map((cv, i) => { const pwd = String(cv.password ?? '').trim(); const prot = pwd !== '0' && pwd !== '' && pwd !== 'null'; return `<div class="cv-item"><div class="cv-item-left"><div class="cv-item-icon">📄</div><div class="cv-item-info"><h4 class="cv-item-title">${escapeHtml(cv.title)}</h4><span class="cv-item-badge ${prot?'protected':'free'}">${prot?'🔒 Password Protected':'✓ Direct Download'}</span></div></div><button type="button" class="cv-download-btn" data-cv-index="${i}" aria-label="Download ${escapeHtml(cv.title)}"><span style="font-size:1.25rem;">↓</span></button></div>`; }).join('');
}
async function loadCvs() {
  try { const {data,error} = await supabase.from('cvs').select('*').order('sort_order',{ascending:true}); if(error) throw error; allCvs = data||[]; renderCvList(); } catch {}
}
function openCvModal() { const m = document.getElementById('cvModal'); if(!m) return; document.getElementById('cvStepList').style.display='block'; document.getElementById('cvStepPassword').style.display='none'; renderCvList(); m.classList.add('open'); m.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; loadCvs(); }
function closeCvModal() { const m = document.getElementById('cvModal'); if(!m) return; m.classList.remove('open'); m.setAttribute('aria-hidden','true'); document.body.style.overflow=''; curCv = null; }
function handleCvDl(i) {
  const cv = allCvs[i]; if(!cv) return;
  const pwd = String(cv.password ?? '').trim(); const prot = pwd !== '0' && pwd !== '' && pwd !== 'null';
  if(!prot) { if(cv.download_link) openExternalUrl(cv.download_link); return; }
  curCv = cv; document.getElementById('cvStepList').style.display='none'; document.getElementById('cvStepPassword').style.display='block';
  document.getElementById('cvPasswordTitle').textContent = cv.title || 'Enter CV Password';
  document.getElementById('cvPasswordSubtitle').textContent = `"${cv.title||'This CV'}" is protected with a password. Please enter the password to download.`;
  const pi = document.getElementById('cvPasswordInput'); if(pi) { pi.value=''; pi.type='password'; setTimeout(() => pi.focus(), 60); }
  const err = document.getElementById('cvPasswordError'); if(err) { err.style.display='none'; err.textContent=''; }
}
function verifyCvPw() {
  if(!curCv) return;
  const input = document.getElementById('cvPasswordInput'); const err = document.getElementById('cvPasswordError');
  const entered = String(input?.value||'').trim(); const expected = String(curCv.password ?? '').trim();
  if(entered === expected) { if(err) err.style.display='none'; if(curCv.download_link) openExternalUrl(curCv.download_link); closeCvModal(); }
  else { if(err){err.style.display='block';err.textContent='❌ Incorrect password. Please try again or contact Fahim.';} input?.select(); input?.focus(); }
}
function initCvModal() {
  renderCvList();
  document.addEventListener('click', e => {
    const trig = e.target.closest('#openCvModalBtn, .open-cv-modal-btn, [data-action="download-cv"], a[href="#cv-download"], a[href="#download-cv"]');
    if(trig) { e.preventDefault(); openCvModal(); return; }
    const dl = e.target.closest('.cv-download-btn'); if(dl && dl.dataset.cvIndex !== undefined) { e.preventDefault(); handleCvDl(parseInt(dl.dataset.cvIndex,10)); return; }
  });
  document.getElementById('cvModalClose')?.addEventListener('click', closeCvModal);
  document.getElementById('cvModalOverlay')?.addEventListener('click', closeCvModal);
  document.getElementById('cvBackToListBtn')?.addEventListener('click', () => { document.getElementById('cvStepList').style.display='block'; document.getElementById('cvStepPassword').style.display='none'; curCv = null; });
  document.getElementById('cvPasswordForm')?.addEventListener('submit', e => { e.preventDefault(); verifyCvPw(); });
  const tb = document.getElementById('cvTogglePasswordVisibility'); const pi = document.getElementById('cvPasswordInput');
  if(tb && pi) tb.addEventListener('click', () => { if(pi.type==='password'){pi.type='text';tb.textContent='🙈';} else {pi.type='password';tb.textContent='👁';} });
  document.getElementById('cvContactRedirectBtn')?.addEventListener('click', e => { e.preventDefault(); const cn = curCv?curCv.title:'Curriculum Vitae'; closeCvModal(); document.getElementById('contact')?.scrollIntoView({behavior:'smooth'}); setTimeout(() => { const sf = document.getElementById('subject'); const mf = document.getElementById('message'); if(sf) sf.value = `Request Access Password: ${cn}`; if(mf && !mf.value.trim()) mf.value = `Hi Fahim,\n\nI would like to request the password to download your "${cn}".\n\nThank you!`; document.getElementById('name')?.focus(); }, 400); });
  document.addEventListener('keydown', e => { if(e.key==='Escape') { const m = document.getElementById('cvModal'); if(m && m.classList.contains('open')) closeCvModal(); } });
}

/* ---- BACKGROUND AUDIO ---- */
function initAudio() {
  const a = document.getElementById('bgMusic'); if(!a || !a.getAttribute('src')) return;
  a.loop = true; a.volume = 0.45; let started = false;
  const tryPlay = () => { if(started) return; a.play()?.then(() => { started = true; ['click','touchstart','scroll','keydown'].forEach(e => { window.removeEventListener(e,tryPlay); document.removeEventListener(e,tryPlay); }); }).catch(() => {}); };
  tryPlay(); ['click','touchstart','scroll','keydown'].forEach(e => { window.addEventListener(e,tryPlay,{passive:true}); document.addEventListener(e,tryPlay,{passive:true}); });
}

/* ---- MAIN INIT ---- */
async function initSite() {
  initUI(); initSearch(); initContactForm();
  ['blogGrid','galleryGrid','servicesGrid','achievementsGrid','projectsGrid','testimonialsGrid'].forEach(id => {
    const g = document.getElementById(id); if(!g) return;
    const cnt = id==='galleryGrid'?8 : id==='blogGrid'?4 : 6;
    g.innerHTML = Array.from({length:cnt}, () => id==='galleryGrid' ? '<div style="border-radius:18px;aspect-ratio:1/1;background:linear-gradient(90deg,var(--surface2) 25%,var(--border) 50%,var(--surface2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border:1px solid var(--border);"></div>' : '<div class="skeleton-card"><div class="skeleton-line icon"></div><div class="skeleton-line medium"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>').join('');
  });
  await Promise.allSettled([ loadBlog(), loadGallery(), loadServices(), loadAchievements(), loadProjects(), loadTestimonials(), loadCvs() ]);
  window.refreshReveal?.(); initCvModal();
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    supabase = await initSupabase();
    if (!supabase) { console.error('Supabase not initialized — content will not load.'); return; }
    initAudio();
    await loadSections();
    await initSite();
  } catch(error) { console.error('Site initialization failed:', error); }
});
