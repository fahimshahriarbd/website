import { initSupabase } from './supabase-client.js';
let supabase = null;

/* ============================================================
   UTILITY HELPERS
   ============================================================ */
function escapeHtml(value){
  return String(value ?? '').replace(
    /[&<>"']/g,
    char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char])
  );
}

function openExternalUrl(url) {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function formatDateValue(val) {
  if (!val) return 'Today';
  const str = String(val).trim();
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[3].padStart(2,'0')}-${isoMatch[2].padStart(2,'0')}-${isoMatch[1]}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990) {
    return `${String(parsed.getDate()).padStart(2,'0')}-${String(parsed.getMonth()+1).padStart(2,'0')}-${parsed.getFullYear()}`;
  }
  return str;
}

function toggleCardDesc(btn, evt) {
  if (evt) { evt.preventDefault?.(); evt.stopPropagation?.(); }
  const container = btn?.closest('.expandable-desc');
  if (!container) return;
  const full = container.querySelector('.desc-full');
  const dots = container.querySelector('.desc-dots');
  const isExpanded = btn.getAttribute('aria-expanded') === 'true';
  if (isExpanded) {
    if (full) full.style.display = 'none';
    if (dots) dots.style.display = 'inline';
    btn.textContent = 'See more';
    btn.setAttribute('aria-expanded','false');
  } else {
    if (full) full.style.display = 'inline';
    if (dots) dots.style.display = 'none';
    btn.textContent = 'See less';
    btn.setAttribute('aria-expanded','true');
  }
}
window.toggleCardDesc = toggleCardDesc;

function formatTruncatedDesc(text, maxWords = 22) {
  const str = String(text || '').trim();
  if (!str) return '';
  const words = str.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return `<p class="card-desc">${escapeHtml(str)}</p>`;
  const shortPart = words.slice(0, maxWords).join(' ');
  const remainingPart = words.slice(maxWords).join(' ');
  return `<p class="card-desc expandable-desc"><span class="desc-short">${escapeHtml(shortPart)}</span><span class="desc-dots">...</span><span class="desc-full" style="display:none;"> ${escapeHtml(remainingPart)}</span><button type="button" class="desc-toggle-btn" aria-expanded="false" onclick="toggleCardDesc(this, event)">See more</button></p>`;
}

/* ============================================================
   SECTION LOADER
   ============================================================ */
async function loadSections(){
  const slots = [...document.querySelectorAll('[data-section]')];
  for (const slot of slots) {
    const name = slot.dataset.section;
    try {
      const response = await fetch(`sections/${name}.html`, { cache:'no-store' });
      if (!response.ok) throw new Error(`Section not found: ${name}`);
      slot.outerHTML = await response.text();
    } catch(error) {
      console.warn(`Skipping section: ${name}`, error);
      slot.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">Section not available</div>';
    }
  }
}

/* ============================================================
   SEARCH SYSTEM
   ============================================================ */
let searchItems = [];

function highlightMatch(text, query) {
  if (!text) return '';
  const str = String(text);
  if (!query) return escapeHtml(str);
  const cleanTerms = query.trim().split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!cleanTerms.length) return escapeHtml(str);
  const regex = new RegExp(`(${cleanTerms.join('|')})`, 'gi');
  const testRegex = new RegExp(`^(?:${cleanTerms.join('|')})$`, 'i');
  return str.split(regex).map(part => testRegex.test(part) ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)).join('');
}

function getSnippet(text, query) {
  if (!text) return '';
  const str = String(text).trim();
  if (str.length <= 130) return highlightMatch(str, query);
  const lower = str.toLowerCase();
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let bestIndex = lower.indexOf(words[0] || query.trim().toLowerCase());
  if (bestIndex === -1) return highlightMatch(str.slice(0, 120) + '...', query);
  const start = Math.max(0, bestIndex - 40);
  const end = Math.min(str.length, bestIndex + 80);
  return highlightMatch((start>0?'...':'') + str.slice(start, end) + (end<str.length?'...':''), query);
}

function buildSearchIndex() {
  const items = [];
  let counter = 0;
  document.querySelectorAll('main section').forEach(section => {
    const secId = section.id || '';
    const eyebrow = section.querySelector('.eyebrow')?.textContent.trim() || '';
    const secHeading = section.querySelector('.section-head h4, .section-head h2')?.textContent.trim() || '';
    const sectionName = eyebrow || secHeading || secId || 'Section';
    section.querySelectorAll('.card').forEach(card => {
      counter++;
      if (!card.id) card.id = `card-item-${secId}-${counter}`;
      const title = card.querySelector('h3, h4')?.textContent.trim() || '';
      const text = card.querySelector('p')?.textContent.trim() || '';
      if (title || text) items.push({ id:card.id, title:title||sectionName, text, meta:sectionName, sectionId:secId });
    });
    if (secId === 'journey') {
      section.querySelectorAll('.info-row').forEach(row => {
        counter++;
        if (!row.id) row.id = `journey-row-${counter}`;
        const title = row.querySelector('b')?.textContent.trim() || '';
        const text = row.querySelector('.muted, span')?.textContent.trim() || '';
        if (title || text) items.push({ id:row.id, title:title||'Academic Milestone', text, meta:'Journey · Education', sectionId:'journey' });
      });
    }
  });
  document.querySelectorAll('#blogGrid .blog-card').forEach(card => {
    counter++;
    if (!card.id) card.id = `blog-item-${counter}`;
    const title = card.querySelector('h4, h3')?.textContent.trim() || '';
    const text = card.querySelector('p')?.textContent.trim() || '';
    const category = card.dataset.category || 'Blog';
    if (title || text) items.push({ id:card.id, title, text, meta:`Blog · ${category}`, sectionId:'blog' });
  });
  document.querySelectorAll('#galleryGrid .gallery-item').forEach(item => {
    counter++;
    if (!item.id) item.id = `gallery-item-${counter}`;
    const caption = item.querySelector('.gallery-caption')?.textContent.trim() || '';
    const category = item.dataset.category || 'Moments';
    items.push({ id:item.id, title:caption||`${category} Photo`, text:`Gallery photo in category ${category}`, meta:`Gallery · ${category}`, sectionId:'gallery' });
  });
  document.querySelectorAll('#projectsGrid .project-card').forEach(card => {
    counter++;
    if (!card.id) card.id = `project-item-${counter}`;
    const title = card.querySelector('h4, h3')?.textContent.trim() || '';
    const text = card.querySelector('p')?.textContent.trim() || '';
    items.push({ id:card.id, title:title||'Project', text, meta:'Projects · Portfolio', sectionId:'projects' });
  });
  document.querySelectorAll('#dentalTipsGrid .card').forEach(card => {
    counter++;
    if (!card.id) card.id = `dental-tip-${counter}`;
    const title = card.querySelector('h4, h3')?.textContent.trim() || '';
    const text = card.querySelector('p')?.textContent.trim() || '';
    items.push({ id:card.id, title:title||'Dental Tip', text, meta:'Dental Tips', sectionId:'dental-tips' });
  });
  document.querySelectorAll('#servicesGrid .service-card').forEach(card => {
    counter++;
    if (!card.id) card.id = `service-item-${counter}`;
    const title = card.querySelector('h4, h3')?.textContent.trim() || '';
    const text = card.querySelector('p')?.textContent.trim() || '';
    const fee = card.querySelector('.service-price-value')?.textContent.trim() || '';
    items.push({ id:card.id, title:title||'Service', text:`${text} (Charge: ${fee})`, meta:`Services · ${fee}`, sectionId:'services' });
  });
  document.querySelectorAll('#testimonialsGrid .testimonial-card').forEach(card => {
    counter++;
    if (!card.id) card.id = `testimonial-item-${counter}`;
    const title = card.querySelector('.person-name-link b')?.textContent.trim() || card.querySelector('b')?.textContent.trim() || '';
    const text = card.querySelector('.testimonial-content p')?.textContent.trim() || card.querySelector('.card-desc')?.textContent.trim() || '';
    items.push({ id:card.id, title:title||'Testimonial', text, meta:'Testimonials', sectionId:'testimonials' });
  });
  searchItems = items;
}
window.updateSearchIndex = buildSearchIndex;

function renderSearch(query) {
  const searchResults = document.getElementById('searchResults');
  if (!searchResults) return;
  const q = String(query || '').trim().toLowerCase();
  if (!q) { searchResults.innerHTML = '<div class="search-empty">Search blogs, projects, dental tips, services and more.</div>'; return; }
  if (searchItems.length === 0) buildSearchIndex();
  const words = q.split(/\s+/).filter(Boolean);
  const matches = searchItems.map(item => {
    let score = 0;
    const title = item.title.toLowerCase(), text = item.text.toLowerCase(), meta = item.meta.toLowerCase();
    if (title === q) score += 100; else if (title.includes(q)) score += 60;
    if (meta.includes(q)) score += 35;
    if (text.includes(q)) score += 25;
    if (words.length > 1) words.forEach(w => { if (title.includes(w)) score += 20; if (text.includes(w)) score += 10; });
    return { item, score };
  }).filter(e => e.score > 0).sort((a,b) => b.score - a.score).map(e => e.item);
  if (matches.length === 0) {
    searchResults.innerHTML = `<div class="search-empty">No matches found for "<b>${escapeHtml(query)}</b>".<br><small style="margin-top:6px;display:block;color:var(--muted)">Try searching for BDS, Dental, Daraz, or Web Development.</small></div>`;
    return;
  }
  searchResults.innerHTML = matches.slice(0, 12).map(item => `
    <div class="search-result" data-target-id="${escapeHtml(item.id)}" role="button" tabindex="0">
      <span class="search-result-meta">${escapeHtml(item.meta)}</span>
      <strong class="search-result-title">${highlightMatch(item.title, q)}</strong>
      <span class="search-snippet">${getSnippet(item.text, q)}</span>
    </div>
  `).join('');
}

function initSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchBox = document.getElementById('searchBox');
  const closeSearch = document.getElementById('closeSearch');
  const siteSearch = document.getElementById('siteSearch');
  const searchResults = document.getElementById('searchResults');
  if (!searchBtn || !searchBox || !siteSearch || !searchResults) return;

  searchBtn.addEventListener('click', () => {
    const isOpen = searchBox.classList.toggle('open');
    searchBtn.classList.toggle('active', isOpen);
    if (isOpen) { siteSearch.focus(); renderSearch(siteSearch.value); }
  });
  closeSearch?.addEventListener('click', () => { searchBox.classList.remove('open'); searchBtn.classList.remove('active'); });
  siteSearch.addEventListener('input', () => renderSearch(siteSearch.value));

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); searchBox.classList.add('open'); searchBtn.classList.add('active'); siteSearch.focus(); renderSearch(siteSearch.value);
    }
    if (e.key === 'Escape') { searchBox.classList.remove('open'); searchBtn.classList.remove('active'); }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && searchBox.classList.contains('open')) {
      e.preventDefault();
      const results = searchResults.querySelectorAll('.search-result');
      if (!results.length) return;
      const currentFocused = searchResults.querySelector('.search-result.focused');
      let newIndex = -1;
      if (currentFocused) {
        const currentIndex = Array.from(results).indexOf(currentFocused);
        newIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
      } else { newIndex = e.key === 'ArrowDown' ? 0 : results.length - 1; }
      if (newIndex >= 0 && newIndex < results.length) {
        currentFocused?.classList.remove('focused');
        results[newIndex].classList.add('focused');
        results[newIndex].focus();
        results[newIndex].scrollIntoView({ block:'nearest' });
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) { searchBox.classList.remove('open'); searchBtn.classList.remove('active'); }
  });

  searchResults.addEventListener('click', (e) => {
    const resultCard = e.target.closest('.search-result');
    if (!resultCard) return;
    const targetId = resultCard.dataset.targetId;
    if (!targetId) return;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      searchBox.classList.remove('open'); searchBtn.classList.remove('active');
      targetEl.scrollIntoView({ behavior:'smooth', block:'center' });
      targetEl.classList.remove('search-hit');
      void targetEl.offsetWidth;
      targetEl.classList.add('search-hit');
      setTimeout(() => targetEl.classList.remove('search-hit'), 2500);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const activeResult = document.activeElement?.closest?.('.search-result');
      if (activeResult) { e.preventDefault(); activeResult.click(); }
    }
  });

  buildSearchIndex();
}

/* ============================================================
   UI: MOBILE MENU, DARK MODE, TOP BUTTON, SCROLL PROGRESS, NAV
   ============================================================ */
function initUI() {
  // Mobile Menu
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');
  function openMobileMenu(){ navLinks?.classList.add('open'); mobileNavBackdrop?.classList.add('open'); if(menuBtn){menuBtn.classList.add('active');menuBtn.setAttribute('aria-expanded','true');menuBtn.setAttribute('aria-label','Close menu');menuBtn.textContent='✕';} }
  function closeMobileMenu(){ navLinks?.classList.remove('open'); mobileNavBackdrop?.classList.remove('open'); if(menuBtn){menuBtn.classList.remove('active');menuBtn.setAttribute('aria-expanded','false');menuBtn.setAttribute('aria-label','Open menu');menuBtn.textContent='☰';} }
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', (e) => { e.stopPropagation(); navLinks.classList.contains('open') ? closeMobileMenu() : openMobileMenu(); });
    mobileNavBackdrop?.addEventListener('click', closeMobileMenu);
    document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', closeMobileMenu));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMobileMenu(); });
    document.addEventListener('click', (e) => { if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) closeMobileMenu(); });
  }

  // Dark Mode
  const themeBtn = document.getElementById('themeBtn');
  const savedTheme = localStorage.getItem('fahim-theme');
  if (themeBtn) {
    if (savedTheme) { document.documentElement.setAttribute('data-theme', savedTheme); themeBtn.textContent = savedTheme==='dark'?'☀':'☾'; }
    themeBtn.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', dark?'light':'dark');
      localStorage.setItem('fahim-theme', dark?'light':'dark');
      themeBtn.textContent = dark?'☾':'☀';
    });
  }

  // Top Button
  const topBtn = document.getElementById('topBtn');
  if (topBtn) {
    window.addEventListener('scroll', () => topBtn.classList.toggle('show', window.scrollY > 500), { passive:true });
    topBtn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
  }

  // Scroll Progress
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    const updateProgress = () => { const h = document.documentElement.scrollHeight - window.innerHeight; scrollProgress.style.width = (h>0?(window.scrollY/h)*100:0)+'%'; };
    window.addEventListener('scroll', updateProgress, { passive:true });
    updateProgress();
  }

  // Nav Active Section
  const navSections = [...document.querySelectorAll('main section[id]')];
  if (navSections.length > 0) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
          document.querySelector(`.nav-links a[href="#${entry.target.id}"]`)?.classList.add('active');
        }
      });
    }, { rootMargin:'-35% 0px -55% 0px', threshold:0 });
    navSections.forEach(s => navObserver.observe(s));
  }

  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Scroll Reveal
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } });
  }, { rootMargin:'0px 0px -8% 0px', threshold:0.08 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  window.refreshReveal = () => document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));

  // Global See More / See Less toggle
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.desc-toggle-btn');
    if (btn) toggleCardDesc(btn, e);
  });
}

/* ============================================================
   CONTACT FORM (Supabase)
   ============================================================ */
function initContactForm() {
  const contactForm = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  const formStatus = document.getElementById("formStatus");
  if (!contactForm || !submitBtn || !formStatus) return;

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    formStatus.style.display = "none";

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    try {
      const { error } = await supabase.from('messages').insert({ name, email, subject, message });
      if (error) throw error;
      formStatus.style.display = "block";
      formStatus.textContent = "✓ Message sent successfully. Thank you!";
      formStatus.style.color = "#16a34a";
      contactForm.reset();
    } catch {
      formStatus.style.display = "block";
      formStatus.textContent = "Something went wrong. Please try again.";
      formStatus.style.color = "#dc2626";
    }
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Message →";
  });
}

/* ============================================================
   BLOG (Supabase)
   ============================================================ */
let allBlogPosts = [];
let activeFilteredBlog = [];
const BLOG_PAGE_SIZE = 4;
let blogVisibleCount = 4;
let blogSeeMoreInitialized = false;

function createBlogCardHtml(post) {
  const category = String(post.category || 'Blog').trim();
  const image = String(post.image || '').trim() || 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1000&q=85';
  const title = String(post.title || 'Untitled').trim();
  const date = formatDateValue(post.date);
  const readTime = String(post.read_time || '5').trim();
  const summary = String(post.summary || post.content || '...').trim();
  const link = String(post.link || '#').trim();
  return `
    <article class="card blog-card" data-category="${escapeHtml(category.toLowerCase())}">
      <img class="blog-cover" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">
      <div class="blog-body">
        <div class="blog-meta"><span>${escapeHtml(category)}</span><span>${escapeHtml(date)} · ${escapeHtml(readTime)} min</span></div>
        <h4>${escapeHtml(title)}</h4>
        ${formatTruncatedDesc(summary, 22)}
        <a class="read-more" href="${escapeHtml(link)}">Read article →</a>
      </div>
    </article>`;
}

function renderBlogCards(append = false) {
  const blogGrid = document.getElementById('blogGrid');
  const seeMoreWrap = document.getElementById('blogSeeMoreWrap');
  const seeMoreBtn = document.getElementById('blogSeeMoreBtn');
  if (!blogGrid) return;
  if (!activeFilteredBlog.length) {
    blogGrid.innerHTML = '<div style="grid-column:1/-1;padding:36px;text-align:center;color:var(--muted);border:1px dashed var(--border);border-radius:16px;">No published blog posts yet.</div>';
    if (seeMoreWrap) seeMoreWrap.style.display = 'none';
    return;
  }
  const visiblePosts = activeFilteredBlog.slice(0, blogVisibleCount);
  if (!append) blogGrid.innerHTML = visiblePosts.map(createBlogCardHtml).join('');
  else {
    const startIndex = blogVisibleCount - BLOG_PAGE_SIZE;
    blogGrid.insertAdjacentHTML('beforeend', activeFilteredBlog.slice(startIndex, blogVisibleCount).map(createBlogCardHtml).join(''));
  }
  if (seeMoreWrap) {
    if (blogVisibleCount < activeFilteredBlog.length) {
      seeMoreWrap.style.display = 'flex';
      if (seeMoreBtn) seeMoreBtn.innerHTML = `See More (${activeFilteredBlog.length - blogVisibleCount} remaining) ↓`;
    } else seeMoreWrap.style.display = 'none';
  }
  window.updateSearchIndex?.();
}

async function loadBlogContent() {
  const blogGrid = document.getElementById('blogGrid');
  if (!blogGrid) return;
  try {
    const { data, error } = await supabase.from('blog_posts').select('*').eq('published', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (error) throw error;
    allBlogPosts = data || [];
  } catch { allBlogPosts = []; }

  activeFilteredBlog = [...allBlogPosts];
  blogVisibleCount = BLOG_PAGE_SIZE;

  const blogToolbar = document.getElementById('blogToolbar');
  if (blogToolbar && allBlogPosts.length > 0) {
    const rawCategories = allBlogPosts.map(p => (p.category || 'Blog').trim()).filter(Boolean);
    const uniqueCats = [...new Set(rawCategories)];
    blogToolbar.innerHTML = `<button class="filter-btn active" data-filter="all">All (${allBlogPosts.length})</button>${uniqueCats.map(cat => `<button class="filter-btn" data-filter="${escapeHtml(cat)}">${escapeHtml(cat)} (${allBlogPosts.filter(p => (p.category||'').toLowerCase() === cat.toLowerCase()).length})</button>`).join('')}`;
    blogToolbar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        blogToolbar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        activeFilteredBlog = filter === 'all' ? [...allBlogPosts] : allBlogPosts.filter(p => (p.category||'').toLowerCase() === filter.toLowerCase());
        blogVisibleCount = BLOG_PAGE_SIZE;
        renderBlogCards();
      });
    });
  }

  const seeMoreBtn = document.getElementById('blogSeeMoreBtn');
  if (seeMoreBtn && !blogSeeMoreInitialized) {
    blogSeeMoreInitialized = true;
    seeMoreBtn.addEventListener('click', () => { blogVisibleCount += BLOG_PAGE_SIZE; renderBlogCards(true); });
  }
  renderBlogCards();
}

/* ============================================================
   GALLERY (Supabase)
   ============================================================ */
let allGalleryPhotos = [];
let activeFilteredGallery = [];
const GALLERY_PAGE_SIZE = 8;
let galleryVisibleCount = 8;
let gallerySeeMoreInitialized = false;
let currentLightboxIndex = 0;

function createGalleryItemHtml(photo, index) {
  return `
    <div class="gallery-item" data-category="${escapeHtml(photo.category)}" data-index="${index}" role="button" tabindex="0" title="Click to view full screen">
      <img src="${escapeHtml(photo.image_url)}" alt="${escapeHtml(photo.caption || photo.category)}" loading="lazy" />
      <span class="gallery-badge">${escapeHtml(photo.category)}</span>
      <div class="gallery-overlay"><span class="gallery-zoom-icon">🔍</span><span class="gallery-caption">${escapeHtml(photo.caption || photo.category)}</span></div>
    </div>`;
}

function renderGalleryCards(append = false) {
  const galleryGrid = document.getElementById('galleryGrid');
  const seeMoreWrap = document.getElementById('gallerySeeMoreWrap');
  const seeMoreBtn = document.getElementById('gallerySeeMoreBtn');
  if (!galleryGrid) return;
  if (!activeFilteredGallery.length) {
    galleryGrid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No photos found.</div>';
    if (seeMoreWrap) seeMoreWrap.style.display = 'none';
    return;
  }
  const visible = activeFilteredGallery.slice(0, galleryVisibleCount);
  if (!append) galleryGrid.innerHTML = visible.map((p, i) => createGalleryItemHtml(p, i)).join('');
  else {
    const startIndex = galleryVisibleCount - GALLERY_PAGE_SIZE;
    galleryGrid.insertAdjacentHTML('beforeend', activeFilteredGallery.slice(startIndex, galleryVisibleCount).map((p, i) => createGalleryItemHtml(p, startIndex + i)).join(''));
  }
  galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
    if (item.dataset.hasListener) return;
    item.dataset.hasListener = 'true';
    item.addEventListener('click', () => openLightbox(parseInt(item.dataset.index, 10)));
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter') openLightbox(parseInt(item.dataset.index, 10)); });
  });
  if (seeMoreWrap) {
    if (galleryVisibleCount < activeFilteredGallery.length) {
      seeMoreWrap.style.display = 'flex';
      if (seeMoreBtn) seeMoreBtn.innerHTML = `See More (${activeFilteredGallery.length - galleryVisibleCount} remaining) ↓`;
    } else seeMoreWrap.style.display = 'none';
  }
}

function renderGallerySection() {
  const galleryToolbar = document.getElementById('galleryToolbar');
  activeFilteredGallery = [...allGalleryPhotos];
  galleryVisibleCount = GALLERY_PAGE_SIZE;
  if (galleryToolbar) {
    const categories = [...new Set(allGalleryPhotos.map(p => p.category.trim()).filter(Boolean))];
    galleryToolbar.innerHTML = `<button class="filter-btn active" data-gallery-filter="all">All (${allGalleryPhotos.length})</button>${categories.map(cat => `<button class="filter-btn" data-gallery-filter="${escapeHtml(cat)}">${escapeHtml(cat)} (${allGalleryPhotos.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length})</button>`).join('')}`;
    galleryToolbar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        galleryToolbar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.galleryFilter;
        activeFilteredGallery = filter === 'all' ? [...allGalleryPhotos] : allGalleryPhotos.filter(p => p.category.toLowerCase() === filter.toLowerCase());
        galleryVisibleCount = GALLERY_PAGE_SIZE;
        renderGalleryCards();
      });
    });
  }
  const seeMoreBtn = document.getElementById('gallerySeeMoreBtn');
  if (seeMoreBtn && !gallerySeeMoreInitialized) {
    gallerySeeMoreInitialized = true;
    seeMoreBtn.addEventListener('click', () => { galleryVisibleCount += GALLERY_PAGE_SIZE; renderGalleryCards(true); });
  }
  renderGalleryCards();
}

function initGalleryLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox) return;
  document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxOverlay')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev')?.addEventListener('click', prevLightboxImage);
  document.getElementById('lightboxNext')?.addEventListener('click', nextLightboxImage);
  const downloadBtn = document.getElementById('lightboxDownload');
  downloadBtn?.addEventListener('click', () => {
    const current = activeFilteredGallery[currentLightboxIndex];
    if (!current) return;
    downloadImage(current.image_url, `fahim-${(current.category||'photo').toLowerCase()}-${currentLightboxIndex+1}.jpg`);
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevLightboxImage();
    if (e.key === 'ArrowRight') nextLightboxImage();
  });
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive:true });
  lightbox.addEventListener('touchend', (e) => { const tx = e.changedTouches[0].screenX; if (tx < touchStartX-50) nextLightboxImage(); if (tx > touchStartX+50) prevLightboxImage(); }, { passive:true });
}

function openLightbox(index) {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox || !activeFilteredGallery.length) return;
  currentLightboxIndex = (index + activeFilteredGallery.length) % activeFilteredGallery.length;
  updateLightboxView();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
function prevLightboxImage() {
  if (!activeFilteredGallery.length) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + activeFilteredGallery.length) % activeFilteredGallery.length;
  updateLightboxView();
}
function nextLightboxImage() {
  if (!activeFilteredGallery.length) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % activeFilteredGallery.length;
  updateLightboxView();
}
function updateLightboxView() {
  const photo = activeFilteredGallery[currentLightboxIndex];
  if (!photo) return;
  const imgEl = document.getElementById('lightboxImg');
  if (imgEl) { imgEl.classList.add('switching'); setTimeout(() => { imgEl.src = photo.image_url; imgEl.alt = photo.caption || photo.category; imgEl.classList.remove('switching'); }, 150); }
  document.getElementById('lightboxCategory').textContent = photo.category;
  document.getElementById('lightboxCounter').textContent = `${currentLightboxIndex+1} / ${activeFilteredGallery.length}`;
  document.getElementById('lightboxCaption').textContent = photo.caption || photo.category;
}

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url, { mode:'cors' });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl; a.download = filename || 'photo.jpg';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  } catch {
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.download = filename || 'photo.jpg';
    document.body.appendChild(a); a.click(); a.remove();
  }
}

async function loadGalleryContent() {
  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;
  try {
    const { data, error } = await supabase.from('gallery_photos').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    allGalleryPhotos = (data || []).map(p => ({ ...p, image: p.image_url }));
  } catch { allGalleryPhotos = []; }
  if (!allGalleryPhotos.length) {
    galleryGrid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No photos available.</div>';
    return;
  }
  renderGallerySection();
  initGalleryLightbox();
  window.updateSearchIndex?.();
}

/* ============================================================
   SERVICES (Supabase)
   ============================================================ */
let allServices = [];
let currentServicesCategory = 'All';
const SERVICES_PAGE_SIZE = 6;
let servicesVisibleCount = 6;
let servicesSeeMoreInitialized = false;

function formatFeeDisplay(val) {
  let clean = String(val || '1,000 BDT').replace(/bdt/gi,'').replace(/[৳,]/g,'').replace(/taka/gi,'').trim();
  const num = parseInt(clean, 10);
  if (!isNaN(num)) return `${num.toLocaleString('en-US')} BDT`;
  return clean ? `${clean} BDT` : '1,000 BDT';
}

function createServiceCardHtml(service) {
  const isImage = service.icon && (service.icon.startsWith('http') || service.icon.startsWith('//') || service.icon.startsWith('data:'));
  const iconMarkup = isImage ? `<img src="${escapeHtml(service.icon)}" alt="${escapeHtml(service.title)}" style="width:36px;height:36px;object-fit:contain;" />` : escapeHtml(service.icon || '💼');
  const displayFee = formatFeeDisplay(service.price);
  return `
    <article class="card service-card">
      <div class="service-card-body">
        <div class="card-header"><div class="card-icon">${iconMarkup}</div><h4>${escapeHtml(service.title)}</h4></div>
        ${formatTruncatedDesc(service.description, 22)}
      </div>
      <div class="service-footer">
        <div class="service-price-block"><span class="service-price-label">Charge:</span><span class="service-price-value">${escapeHtml(displayFee)}</span></div>
        <button type="button" class="service-request-btn" data-service-title="${escapeHtml(service.title)}" data-service-price="${escapeHtml(displayFee)}">I need this Service →</button>
      </div>
    </article>`;
}

function renderServicesFilterTabs() {
  const filterWrap = document.getElementById('servicesFilterWrap');
  if (!filterWrap) return;
  const rawCategories = allServices.map(s => s.category).filter(Boolean);
  const uniqueCats = ['All', ...new Set(rawCategories)];
  if (uniqueCats.length <= 2) { filterWrap.style.display = 'none'; return; }
  filterWrap.style.display = 'flex';
  filterWrap.innerHTML = uniqueCats.map(cat => {
    const count = cat === 'All' ? allServices.length : allServices.filter(s => s.category === cat).length;
    return `<button type="button" class="services-filter-btn ${cat === currentServicesCategory ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} <span class="services-filter-count">${count}</span></button>`;
  }).join('');
  filterWrap.querySelectorAll('.services-filter-btn').forEach(btn => {
    btn.onclick = () => { currentServicesCategory = btn.dataset.category || 'All'; servicesVisibleCount = SERVICES_PAGE_SIZE; renderServicesFilterTabs(); renderServicesCards(false); };
  });
}

function renderServicesCards(append = false) {
  const servicesGrid = document.getElementById('servicesGrid');
  const seeMoreWrap = document.getElementById('servicesSeeMoreWrap');
  const seeMoreBtn = document.getElementById('servicesSeeMoreBtn');
  if (!servicesGrid) return;
  const filtered = currentServicesCategory === 'All' ? allServices : allServices.filter(s => s.category === currentServicesCategory);
  const visible = filtered.slice(0, servicesVisibleCount);
  if (!append) servicesGrid.innerHTML = visible.map(createServiceCardHtml).join('');
  else {
    const startIndex = servicesVisibleCount - SERVICES_PAGE_SIZE;
    servicesGrid.insertAdjacentHTML('beforeend', filtered.slice(startIndex, servicesVisibleCount).map(createServiceCardHtml).join(''));
  }
  document.querySelectorAll('.service-request-btn').forEach(btn => {
    if (btn.dataset.hasListener) return;
    btn.dataset.hasListener = 'true';
    btn.addEventListener('click', () => openServiceBookingModal(btn.dataset.serviceTitle || 'Service', btn.dataset.servicePrice || '1,000 BDT'));
  });
  if (seeMoreWrap) {
    if (servicesVisibleCount < filtered.length) {
      seeMoreWrap.style.display = 'flex';
      if (seeMoreBtn) seeMoreBtn.innerHTML = `See More Services (${filtered.length - servicesVisibleCount} remaining) ↓`;
    } else seeMoreWrap.style.display = 'none';
  }
}

async function loadServicesContent() {
  const servicesGrid = document.getElementById('servicesGrid');
  if (!servicesGrid) return;
  try {
    const { data, error } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order', { ascending: true });
    if (error) throw error;
    allServices = data || [];
  } catch { allServices = []; }
  if (!allServices.length) {
    servicesGrid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No services available.</div>';
    return;
  }
  renderServicesFilterTabs();
  servicesVisibleCount = SERVICES_PAGE_SIZE;
  const seeMoreBtn = document.getElementById('servicesSeeMoreBtn');
  if (seeMoreBtn && !servicesSeeMoreInitialized) {
    servicesSeeMoreInitialized = true;
    seeMoreBtn.addEventListener('click', () => { servicesVisibleCount += SERVICES_PAGE_SIZE; renderServicesCards(true); });
  }
  renderServicesCards();
  initServiceModal();
  window.updateSearchIndex?.();
}

/* ============================================================
   SERVICE BOOKING MODAL (Supabase)
   ============================================================ */
let currentSelectedService = '';
let currentSelectedServicePrice = '1,000 BDT';
let currentSelectedGateway = 'bKash';
const PERSONAL_NUMBER = '01316831199';
let serviceModalInitialized = false;

function getGatewayNumber(gw) {
  return String(gw || '').toLowerCase().includes('rocket') ? '013168311990' : '01316831199';
}

function openServiceBookingModal(serviceTitle, servicePrice) {
  const modal = document.getElementById('serviceModal');
  if (!modal) return;
  currentSelectedService = serviceTitle;
  currentSelectedServicePrice = servicePrice || '1,000 BDT';
  document.getElementById('serviceModalSelectedTitle').innerHTML = `📌 <strong>${escapeHtml(serviceTitle)}</strong> <span class="service-modal-price-pill">Charge: ${escapeHtml(currentSelectedServicePrice)}</span>`;
  document.getElementById('summaryServiceTitle').textContent = serviceTitle;
  document.getElementById('summaryServicePrice').textContent = currentSelectedServicePrice;
  document.getElementById('serviceStep1').style.display = 'block';
  document.getElementById('serviceStep2').style.display = 'none';
  document.getElementById('serviceStep3').style.display = 'none';
  document.getElementById('serviceStepSuccess').style.display = 'none';
  document.getElementById('serviceSubmitStatus').style.display = 'none';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('serviceName')?.focus(), 100);
}

function initServiceModal() {
  if (serviceModalInitialized) return;
  const modal = document.getElementById('serviceModal');
  if (!modal) return;
  serviceModalInitialized = true;
  const overlay = document.getElementById('serviceModalOverlay');
  const closeBtn = document.getElementById('serviceModalClose');
  const step1 = document.getElementById('serviceStep1');
  const step2 = document.getElementById('serviceStep2');
  const step3 = document.getElementById('serviceStep3');
  const stepSuccess = document.getElementById('serviceStepSuccess');
  const doneBtn = document.getElementById('serviceSuccessDoneBtn');

  function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }
  overlay?.addEventListener('click', closeModal);
  closeBtn?.addEventListener('click', closeModal);
  doneBtn?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  ['serviceName','serviceMobile','serviceLocation'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => { const err = document.getElementById('serviceStep1Error'); if (err) err.style.display = 'none'; });
  });

  document.getElementById('serviceGoToPaymentBtn').onclick = (e) => {
    e.preventDefault();
    const name = document.getElementById('serviceName')?.value.trim();
    const mobile = document.getElementById('serviceMobile')?.value.trim();
    const location = document.getElementById('serviceLocation')?.value.trim();
    const step1Err = document.getElementById('serviceStep1Error');
    if (step1Err) step1Err.style.display = 'none';
    if (!name) { if (step1Err) { step1Err.textContent = 'Please enter your full name.'; step1Err.style.display = 'block'; } document.getElementById('serviceName')?.focus(); return; }
    if (!mobile) { if (step1Err) { step1Err.textContent = 'Please enter your phone number.'; step1Err.style.display = 'block'; } document.getElementById('serviceMobile')?.focus(); return; }
    if (!location) { if (step1Err) { step1Err.textContent = 'Please enter your address.'; step1Err.style.display = 'block'; } document.getElementById('serviceLocation')?.focus(); return; }
    step1.style.display = 'none'; step2.style.display = 'block'; step3.style.display = 'none'; stepSuccess.style.display = 'none';
    updateGatewayDisplay();
  };

  document.getElementById('serviceBackToStep1Btn').onclick = () => { step2.style.display = 'none'; step3.style.display = 'none'; step1.style.display = 'block'; };
  document.getElementById('serviceGoToStep3Btn').onclick = () => { step2.style.display = 'none'; step3.style.display = 'block'; updateGatewayDisplay(); setTimeout(() => document.getElementById('servicePaymentNumber')?.focus(), 50); };
  document.getElementById('serviceBackToStep2Btn').onclick = () => { step3.style.display = 'none'; step2.style.display = 'block'; };

  modal.querySelectorAll('.gateway-card').forEach(btn => {
    btn.onclick = () => { modal.querySelectorAll('.gateway-card').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentSelectedGateway = btn.dataset.gateway || 'bKash'; updateGatewayDisplay(); };
  });

  function updateGatewayDisplay() {
    const gwName = currentSelectedGateway || 'bKash';
    const activeNumber = getGatewayNumber(gwName);
    document.getElementById('gatewaySelectedLabel').textContent = `${gwName} Personal Number:`;
    document.getElementById('personalNumberText').textContent = activeNumber;
    document.getElementById('gatewayNameInDesc').textContent = gwName;
    document.getElementById('gatewayInstructions').innerHTML = `Send Money <span class="instruct-price">${escapeHtml(currentSelectedServicePrice)}</span> to the personal number <strong>${activeNumber}</strong> from your <strong>${gwName}</strong> account. After sending, enter your sender mobile number below.`;
  }

  const copyNumberBtn = document.getElementById('copyNumberBtn');
  copyNumberBtn?.addEventListener('click', () => {
    const activeNumber = getGatewayNumber(currentSelectedGateway);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(activeNumber).then(showCopySuccess).catch(() => fallbackCopy(activeNumber));
    else fallbackCopy(activeNumber);
  });
  function showCopySuccess() {
    copyNumberBtn.classList.add('copied');
    document.getElementById('copyIconDefault').style.display = 'none';
    document.getElementById('copyIconSuccess').style.display = 'block';
    setTimeout(() => { copyNumberBtn.classList.remove('copied'); document.getElementById('copyIconDefault').style.display = 'block'; document.getElementById('copyIconSuccess').style.display = 'none'; }, 2000);
  }
  function fallbackCopy(num) { const tmp = document.createElement('input'); tmp.value = num; tmp.style.position='fixed'; tmp.style.opacity='0'; document.body.appendChild(tmp); tmp.focus(); tmp.select(); try { if (document.execCommand('copy')) showCopySuccess(); } catch {} document.body.removeChild(tmp); }

  document.getElementById('serviceFinalSubmitBtn').onclick = async (e) => {
    e.preventDefault();
    const name = document.getElementById('serviceName')?.value.trim();
    const mobile = document.getElementById('serviceMobile')?.value.trim();
    const location = document.getElementById('serviceLocation')?.value.trim();
    const notes = document.getElementById('serviceNotes')?.value.trim();
    const paymentNumber = document.getElementById('servicePaymentNumber')?.value.trim();
    const trxId = document.getElementById('servicePaymentTrx')?.value.trim();
    const statusBox = document.getElementById('serviceSubmitStatus');
    if (!paymentNumber) {
      if (statusBox) { statusBox.style.display='block'; statusBox.style.background='#fef2f2'; statusBox.style.color='#dc2626'; statusBox.style.border='1px solid #fecaca'; statusBox.textContent='Please enter the sender phone number you paid from.'; }
      document.getElementById('servicePaymentNumber')?.focus();
      return;
    }
    const finalBtn = document.getElementById('serviceFinalSubmitBtn');
    finalBtn.disabled = true; finalBtn.textContent = 'Submitting Request...';
    if (statusBox) statusBox.style.display = 'none';

    try {
      const { error } = await supabase.from('bookings').insert({
        name, mobile, location, service_title: currentSelectedService, amount: currentSelectedServicePrice,
        payment_gateway: currentSelectedGateway, payment_number: paymentNumber, trx_id: trxId || '', notes: notes || ''
      });
      if (error) throw error;
      step1.style.display = 'none'; step2.style.display = 'none'; step3.style.display = 'none'; stepSuccess.style.display = 'block';
      document.getElementById('serviceSuccessMsg').innerHTML = `Thank you <strong>${escapeHtml(name)}</strong>! Your request for "<strong>${escapeHtml(currentSelectedService)}</strong>" (Charge: <strong>${escapeHtml(currentSelectedServicePrice)}</strong>) and payment details (<strong>${escapeHtml(currentSelectedGateway)}: ${escapeHtml(paymentNumber)}</strong>) have been received. I will review and reach out to you shortly.`;
      document.getElementById('serviceClientForm')?.reset();
      document.getElementById('servicePaymentForm')?.reset();
    } catch {
      if (statusBox) { statusBox.style.display='block'; statusBox.style.background='#fef2f2'; statusBox.style.color='#dc2626'; statusBox.textContent='Sorry, something went wrong. Please try again.'; }
    } finally {
      finalBtn.disabled = false; finalBtn.textContent = 'Confirm';
    }
  };
}

/* ============================================================
   ACHIEVEMENTS (Supabase)
   ============================================================ */
let allAchievements = [];
const ACHIEVEMENTS_PAGE_SIZE = 4;
let achievementsVisibleCount = 4;
let achievementsSeeMoreInitialized = false;

function createAchievementCardHtml(item) {
  const isImage = item.icon && (item.icon.startsWith('http') || item.icon.startsWith('//') || item.icon.startsWith('data:'));
  const iconMarkup = isImage ? `<img src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.title)}" style="width:36px;height:36px;object-fit:contain;" />` : escapeHtml(item.icon || '🏆');
  return `<article class="card"><div class="card-header"><div class="card-icon">${iconMarkup}</div><h4>${escapeHtml(item.title)}</h4></div>${formatTruncatedDesc(item.description, 22)}</article>`;
}

function renderAchievementsCards(append = false) {
  const grid = document.getElementById('achievementsGrid');
  const seeMoreWrap = document.getElementById('achievementsSeeMoreWrap');
  const seeMoreBtn = document.getElementById('achievementsSeeMoreBtn');
  if (!grid) return;
  const visible = allAchievements.slice(0, achievementsVisibleCount);
  if (!append) grid.innerHTML = visible.map(createAchievementCardHtml).join('');
  else {
    const startIndex = achievementsVisibleCount - ACHIEVEMENTS_PAGE_SIZE;
    grid.insertAdjacentHTML('beforeend', allAchievements.slice(startIndex, achievementsVisibleCount).map(createAchievementCardHtml).join(''));
  }
  if (seeMoreWrap) {
    if (achievementsVisibleCount < allAchievements.length) {
      seeMoreWrap.style.display = 'flex';
      if (seeMoreBtn) seeMoreBtn.innerHTML = `See More Achievements (${allAchievements.length - achievementsVisibleCount} remaining) ↓`;
    } else seeMoreWrap.style.display = 'none';
  }
}

async function loadAchievementsContent() {
  const grid = document.getElementById('achievementsGrid');
  if (!grid) return;
  try {
    const { data, error } = await supabase.from('achievements').select('*').eq('published', true).order('sort_order', { ascending: true });
    if (error) throw error;
    allAchievements = data || [];
  } catch { allAchievements = []; }
  achievementsVisibleCount = ACHIEVEMENTS_PAGE_SIZE;
  const seeMoreBtn = document.getElementById('achievementsSeeMoreBtn');
  if (seeMoreBtn && !achievementsSeeMoreInitialized) {
    achievementsSeeMoreInitialized = true;
    seeMoreBtn.addEventListener('click', () => { achievementsVisibleCount += ACHIEVEMENTS_PAGE_SIZE; renderAchievementsCards(true); });
  }
  renderAchievementsCards();
  window.updateSearchIndex?.();
}

/* ============================================================
   PROJECTS (Supabase)
   ============================================================ */
let allProjects = [];
let currentProjectsCategory = 'All';
const PROJECTS_PAGE_SIZE = 6;
let projectsVisibleCount = 6;
let projectsSeeMoreInitialized = false;

function formatCategoryName(cat) {
  if (!cat) return 'General';
  const str = String(cat).trim();
  if (str.toLowerCase() === 'commerce' || str.toLowerCase() === 'ecommerce' || str.toLowerCase() === 'e-commerce') return 'Commerce';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createProjectCardHtml(item, index) {
  const isImage = item.icon && (item.icon.startsWith('http') || item.icon.startsWith('//') || item.icon.startsWith('data:'));
  const iconMarkup = isImage ? `<img src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.title)}" style="width:36px;height:36px;object-fit:contain;" />` : escapeHtml(item.icon || '🚀');
  const hasLink = item.link && item.link.trim() !== '' && item.link !== '#';
  const targetAttr = hasLink && !item.link.startsWith('#') ? '_blank' : '_self';
  const relAttr = targetAttr === '_blank' ? 'rel="noopener noreferrer"' : '';
  const hrefAttr = hasLink ? escapeHtml(item.link) : '#';
  return `
    <article class="card project-card" data-project-index="${index}" data-project-link="${hasLink ? escapeHtml(item.link) : ''}">
      <div><div class="card-header"><div class="card-icon">${iconMarkup}</div><h4>${escapeHtml(item.title)}</h4></div>${formatTruncatedDesc(item.description, 22)}</div>
      <div class="project-card-footer">
        ${hasLink ? `<a href="${hrefAttr}" target="${targetAttr}" ${relAttr} class="project-view-details-btn">View details →</a>` : `<span class="project-view-details-btn" style="opacity:0.6;cursor:default;">View details →</span>`}
      </div>
    </article>`;
}

function renderProjectsFilterTabs() {
  const filterWrap = document.getElementById('projectsFilterWrap');
  if (!filterWrap) return;
  const rawCategories = allProjects.map(p => formatCategoryName(p.category)).filter(Boolean);
  const uniqueCats = ['All', ...new Set(rawCategories)];
  if (uniqueCats.length <= 1) { filterWrap.style.display = 'none'; return; }
  filterWrap.style.display = 'flex';
  filterWrap.innerHTML = uniqueCats.map(cat => {
    const count = cat === 'All' ? allProjects.length : allProjects.filter(p => formatCategoryName(p.category).toLowerCase() === cat.toLowerCase()).length;
    return `<button type="button" class="projects-filter-btn ${cat.toLowerCase() === currentProjectsCategory.toLowerCase() ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} <span class="projects-filter-count">${count}</span></button>`;
  }).join('');
  filterWrap.querySelectorAll('.projects-filter-btn').forEach(btn => {
    btn.onclick = () => { currentProjectsCategory = btn.dataset.category || 'All'; projectsVisibleCount = PROJECTS_PAGE_SIZE; renderProjectsFilterTabs(); renderProjectsCards(false); };
  });
}

function renderProjectsCards(append = false) {
  const grid = document.getElementById('projectsGrid');
  const seeMoreWrap = document.getElementById('projectsSeeMoreWrap');
  const seeMoreBtn = document.getElementById('projectsSeeMoreBtn');
  if (!grid) return;
  const filtered = currentProjectsCategory === 'All' ? allProjects : allProjects.filter(p => formatCategoryName(p.category).toLowerCase() === currentProjectsCategory.toLowerCase());
  if (!filtered.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--muted);"><p style="font-size:1.05rem;">No projects available yet.</p></div>';
    if (seeMoreWrap) seeMoreWrap.style.display = 'none';
    return;
  }
  const visible = filtered.slice(0, projectsVisibleCount);
  if (!append) grid.innerHTML = visible.map((item, idx) => createProjectCardHtml(item, idx)).join('');
  else {
    const startIndex = projectsVisibleCount - PROJECTS_PAGE_SIZE;
    grid.insertAdjacentHTML('beforeend', filtered.slice(startIndex, projectsVisibleCount).map((item, idx) => createProjectCardHtml(item, startIndex + idx)).join(''));
  }
  if (!grid.dataset.hasProjectDelegation) {
    grid.dataset.hasProjectDelegation = 'true';
    grid.addEventListener('click', (e) => {
      if (e.target.closest('.desc-toggle-btn') || e.target.closest('a')) return;
      const card = e.target.closest('.project-card');
      if (!card) return;
      const link = card.dataset.projectLink;
      if (link && link.trim() && link !== '#') { link.startsWith('#') ? window.location.hash = link : openExternalUrl(link); }
    });
  }
  if (seeMoreWrap) {
    if (projectsVisibleCount < filtered.length) {
      seeMoreWrap.style.display = 'flex';
      if (seeMoreBtn) seeMoreBtn.innerHTML = `See More Projects (${filtered.length - projectsVisibleCount} remaining) ↓`;
    } else seeMoreWrap.style.display = 'none';
  }
}

async function loadProjectsContent() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  try {
    const { data, error } = await supabase.from('projects').select('*').eq('published', true).order('sort_order', { ascending: true });
    if (error) throw error;
    allProjects = data || [];
  } catch { allProjects = []; }
  renderProjectsFilterTabs();
  projectsVisibleCount = PROJECTS_PAGE_SIZE;
  const seeMoreBtn = document.getElementById('projectsSeeMoreBtn');
  if (seeMoreBtn && !projectsSeeMoreInitialized) {
    projectsSeeMoreInitialized = true;
    seeMoreBtn.addEventListener('click', () => { projectsVisibleCount += PROJECTS_PAGE_SIZE; renderProjectsCards(true); });
  }
  renderProjectsCards();
  window.updateSearchIndex?.();
}

/* ============================================================
   TESTIMONIALS (Supabase)
   ============================================================ */
let allTestimonials = [];

function createTestimonialCardHtml(item) {
  const name = String(item.name || 'Anonymous').trim();
  const tag = String(item.tag || 'Friend').trim();
  const about = String(item.about || 'Website').trim();
  const role = String(item.role || '').trim();
  const feedback = String(item.feedback || '').trim().replace(/^[""']+|[""']+$/g, '').trim();
  const image = String(item.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=85').trim();
  const link = String(item.link || '#').trim();
  const isExternal = link.startsWith('http://') || link.startsWith('https://');
  const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
  return `
    <article class="card testimonial-card">
      <div class="testimonial-header">
        <a href="${escapeHtml(link)}" ${targetAttr} class="person-avatar-link" title="View ${escapeHtml(name)}'s profile"><img class="avatar" src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" /></a>
        <div class="person-info">
          <a href="${escapeHtml(link)}" ${targetAttr} class="person-name-link" title="View ${escapeHtml(name)}'s profile"><b>${escapeHtml(name)}</b></a>
          <div class="testimonial-meta-row">
            ${tag ? `<span class="person-relation-tag tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>` : ''}
            ${about ? `<span class="testimonial-about-badge">About: ${escapeHtml(about)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="testimonial-content">${formatTruncatedDesc(feedback, 22)}</div>
    </article>`;
}

async function loadTestimonialsContent() {
  const grid = document.getElementById('testimonialsGrid');
  if (!grid) return;
  try {
    const { data, error } = await supabase.from('testimonials').select('*').eq('published', true).order('sort_order', { ascending: true });
    if (error) throw error;
    allTestimonials = data || [];
  } catch { allTestimonials = []; }
  grid.innerHTML = allTestimonials.length ? allTestimonials.map(createTestimonialCardHtml).join('') : '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No testimonials yet.</div>';
  window.updateSearchIndex?.();
}

/* ============================================================
   DENTAL TIPS (Supabase)
   ============================================================ */
let allDentalTips = [];
let currentTipsCategory = 'All';
const TIPS_PAGE_SIZE = 6;
let tipsVisibleCount = 6;
let tipsSeeMoreInitialized = false;

function createDentalTipCardHtml(item) {
  const isImage = item.icon && (item.icon.startsWith('http') || item.icon.startsWith('//') || item.icon.startsWith('data:'));
  const iconMarkup = isImage ? `<img src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.title)}" style="width:36px;height:36px;object-fit:contain;" />` : escapeHtml(item.icon || '🦷');
  return `<article class="card"><div class="card-header"><div class="card-icon">${iconMarkup}</div><h4>${escapeHtml(item.title)}</h4></div>${formatTruncatedDesc(item.content, 22)}</article>`;
}

function renderDentalTipsCards(append = false) {
  const grid = document.getElementById('dentalTipsGrid');
  const seeMoreWrap = document.getElementById('dentalTipsSeeMoreWrap');
  const seeMoreBtn = document.getElementById('dentalTipsSeeMoreBtn');
  if (!grid) return;
  const filtered = currentTipsCategory === 'All' ? allDentalTips : allDentalTips.filter(t => t.category === currentTipsCategory);
  const visible = filtered.slice(0, tipsVisibleCount);
  if (!append) grid.innerHTML = visible.map(createDentalTipCardHtml).join('');
  else {
    const startIndex = tipsVisibleCount - TIPS_PAGE_SIZE;
    grid.insertAdjacentHTML('beforeend', filtered.slice(startIndex, tipsVisibleCount).map(createDentalTipCardHtml).join(''));
  }
  if (seeMoreWrap) {
    if (tipsVisibleCount < filtered.length) {
      seeMoreWrap.style.display = 'flex';
      if (seeMoreBtn) seeMoreBtn.innerHTML = `See More Tips (${filtered.length - tipsVisibleCount} remaining) ↓`;
    } else seeMoreWrap.style.display = 'none';
  }
}

function renderDentalTipsFilterTabs() {
  const filterWrap = document.getElementById('dentalTipsFilterWrap');
  if (!filterWrap) return;
  const rawCategories = allDentalTips.map(t => t.category).filter(Boolean);
  const uniqueCats = ['All', ...new Set(rawCategories)];
  if (uniqueCats.length <= 2) { filterWrap.style.display = 'none'; return; }
  filterWrap.style.display = 'flex';
  filterWrap.innerHTML = uniqueCats.map(cat => {
    const count = cat === 'All' ? allDentalTips.length : allDentalTips.filter(t => t.category === cat).length;
    return `<button type="button" class="services-filter-btn ${cat === currentTipsCategory ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} <span class="services-filter-count">${count}</span></button>`;
  }).join('');
  filterWrap.querySelectorAll('.services-filter-btn').forEach(btn => {
    btn.onclick = () => { currentTipsCategory = btn.dataset.category || 'All'; tipsVisibleCount = TIPS_PAGE_SIZE; renderDentalTipsFilterTabs(); renderDentalTipsCards(false); };
  });
}

async function loadDentalTipsContent() {
  const grid = document.getElementById('dentalTipsGrid');
  if (!grid) return;
  try {
    const { data, error } = await supabase.from('dental_tips').select('*').eq('published', true).order('sort_order', { ascending: true });
    if (error) throw error;
    allDentalTips = data || [];
  } catch { allDentalTips = []; }
  renderDentalTipsFilterTabs();
  tipsVisibleCount = TIPS_PAGE_SIZE;
  const seeMoreBtn = document.getElementById('dentalTipsSeeMoreBtn');
  if (seeMoreBtn && !tipsSeeMoreInitialized) {
    tipsSeeMoreInitialized = true;
    seeMoreBtn.addEventListener('click', () => { tipsVisibleCount += TIPS_PAGE_SIZE; renderDentalTipsCards(true); });
  }
  renderDentalTipsCards();
  window.updateSearchIndex?.();
}

/* ============================================================
   FAQ (Supabase)
   ============================================================ */
async function loadFaqContent() {
  const faqList = document.getElementById('faqList');
  if (!faqList) return;
  let faqs = [];
  try {
    const { data, error } = await supabase.from('faq').select('*').eq('published', true).order('sort_order', { ascending: true });
    if (error) throw error;
    faqs = data || [];
  } catch { faqs = []; }
  if (!faqs.length) {
    faqList.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted);">No FAQs available at the moment.</div>';
    return;
  }
  faqList.innerHTML = faqs.map(faq => `
    <div class="faq-item" data-faq-id="${escapeHtml(faq.id)}">
      <button type="button" class="faq-question" aria-expanded="false">
        <span><span class="faq-category-badge">${escapeHtml(faq.category)}</span><br>${escapeHtml(faq.question)}</span>
        <span class="faq-toggle">+</span>
      </button>
      <div class="faq-answer"><p>${escapeHtml(faq.answer)}</p></div>
    </div>
  `).join('');
  faqList.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqList.querySelectorAll('.faq-item').forEach(fi => { fi.classList.remove('open'); fi.querySelector('.faq-question').setAttribute('aria-expanded','false'); });
      if (!isOpen) { item.classList.add('open'); question.setAttribute('aria-expanded','true'); }
    });
  });
}

/* ============================================================
   CV SYSTEM (Supabase)
   ============================================================ */
let allCvs = [];
let currentSelectedCv = null;

function renderCvList() {
  const container = document.getElementById('cvListContainer');
  if (!container) return;
  if (!allCvs.length) { container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);">No CV documents available.</div>'; return; }
  container.innerHTML = allCvs.map((cv, index) => {
    const title = escapeHtml(cv.title || 'CV Document');
    const pwdStr = String(cv.password ?? '').trim();
    const isProtected = pwdStr !== '0' && pwdStr !== '' && pwdStr !== 'null';
    return `
      <div class="cv-item">
        <div class="cv-item-left">
          <div class="cv-item-icon" aria-hidden="true">📄</div>
          <div class="cv-item-info">
            <h4 class="cv-item-title">${title}</h4>
            <span class="cv-item-badge ${isProtected ? 'protected' : 'free'}">${isProtected ? '🔒 Password Protected' : '✓ Direct Download'}</span>
          </div>
        </div>
        <button type="button" class="cv-download-btn" data-cv-index="${index}" aria-label="Download ${title}" title="Download ${title}"><span style="font-size:1.25rem;line-height:1;display:inline-block;">↓</span></button>
      </div>`;
  }).join('');
}

async function loadCvContent() {
  try {
    const { data, error } = await supabase.from('cvs').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    allCvs = data || [];
    renderCvList();
  } catch { console.warn('CV load error'); }
}

function openCvModal() {
  const modal = document.getElementById('cvModal');
  if (!modal) return;
  document.getElementById('cvStepList').style.display = 'block';
  document.getElementById('cvStepPassword').style.display = 'none';
  renderCvList();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  loadCvContent();
}

function closeCvModal() {
  const modal = document.getElementById('cvModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  currentSelectedCv = null;
}

function handleCvDownloadClick(index) {
  const cv = allCvs[index];
  if (!cv) return;
  const downloadLink = cv.download_link;
  const pwdStr = String(cv.password ?? '').trim();
  const isProtected = pwdStr !== '0' && pwdStr !== '' && pwdStr !== 'null';
  if (!isProtected) { if (downloadLink) openExternalUrl(downloadLink); return; }
  currentSelectedCv = cv;
  document.getElementById('cvStepList').style.display = 'none';
  document.getElementById('cvStepPassword').style.display = 'block';
  document.getElementById('cvPasswordTitle').textContent = cv.title || 'Enter CV Password';
  document.getElementById('cvPasswordSubtitle').textContent = `"${cv.title || 'This CV'}" is protected with a password. Please enter the password to download.`;
  const pwInput = document.getElementById('cvPasswordInput');
  if (pwInput) { pwInput.value = ''; pwInput.type = 'password'; setTimeout(() => pwInput.focus(), 60); }
  const errEl = document.getElementById('cvPasswordError');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
}

function verifyCvPassword() {
  if (!currentSelectedCv) return;
  const input = document.getElementById('cvPasswordInput');
  const errorEl = document.getElementById('cvPasswordError');
  const entered = String(input?.value || '').trim();
  const expected = String(currentSelectedCv.password ?? '').trim();
  if (entered === expected) {
    if (errorEl) errorEl.style.display = 'none';
    if (currentSelectedCv.download_link) openExternalUrl(currentSelectedCv.download_link);
    closeCvModal();
  } else {
    if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = '❌ Incorrect password. Please try again or contact Fahim.'; }
    input?.select(); input?.focus();
  }
}

function initCvModal() {
  renderCvList();
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('#openCvModalBtn, .open-cv-modal-btn, [data-action="download-cv"], a[href="#cv-download"], a[href="#download-cv"]');
    if (trigger) { e.preventDefault(); openCvModal(); return; }
    const dlBtn = e.target.closest('.cv-download-btn');
    if (dlBtn && dlBtn.dataset.cvIndex !== undefined) { e.preventDefault(); handleCvDownloadClick(parseInt(dlBtn.dataset.cvIndex, 10)); return; }
  });
  document.getElementById('cvModalClose')?.addEventListener('click', closeCvModal);
  document.getElementById('cvModalOverlay')?.addEventListener('click', closeCvModal);
  document.getElementById('cvBackToListBtn')?.addEventListener('click', () => {
    document.getElementById('cvStepList').style.display = 'block';
    document.getElementById('cvStepPassword').style.display = 'none';
    currentSelectedCv = null;
  });
  document.getElementById('cvPasswordForm')?.addEventListener('submit', (e) => { e.preventDefault(); verifyCvPassword(); });
  const toggleBtn = document.getElementById('cvTogglePasswordVisibility');
  const pwInput = document.getElementById('cvPasswordInput');
  if (toggleBtn && pwInput) toggleBtn.addEventListener('click', () => { if (pwInput.type === 'password') { pwInput.type = 'text'; toggleBtn.textContent = '🙈'; } else { pwInput.type = 'password'; toggleBtn.textContent = '👁'; } });
  document.getElementById('cvContactRedirectBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const cvName = currentSelectedCv ? currentSelectedCv.title : 'Curriculum Vitae';
    closeCvModal();
    document.getElementById('contact')?.scrollIntoView({ behavior:'smooth' });
    setTimeout(() => {
      const subjectField = document.getElementById('subject');
      const msgField = document.getElementById('message');
      if (subjectField) subjectField.value = `Request Access Password: ${cvName}`;
      if (msgField && !msgField.value.trim()) msgField.value = `Hi Fahim,\n\nI would like to request the password to download your "${cvName}".\n\nThank you!`;
      document.getElementById('name')?.focus();
    }, 400);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const m = document.getElementById('cvModal'); if (m && m.classList.contains('open')) closeCvModal(); } });
}

/* ============================================================
   BACKGROUND AUDIO
   ============================================================ */
function initBackgroundAudio() {
  const audio = document.getElementById('bgMusic');
  if (!audio || !audio.getAttribute('src')) return;
  audio.loop = true; audio.volume = 0.45;
  let started = false;
  const tryPlay = () => {
    if (started) return;
    audio.play()?.then(() => {
      started = true;
      ['click','touchstart','scroll','keydown'].forEach(evt => { window.removeEventListener(evt, tryPlay); document.removeEventListener(evt, tryPlay); });
    }).catch(() => {});
  };
  tryPlay();
  ['click','touchstart','scroll','keydown'].forEach(evt => { window.addEventListener(evt, tryPlay, { passive:true }); document.addEventListener(evt, tryPlay, { passive:true }); });
}

/* ============================================================
   MAIN INIT
   ============================================================ */
async function initSite() {
  initUI();
  initSearch();
  initContactForm();

  ['blogGrid','galleryGrid','servicesGrid','achievementsGrid','projectsGrid','testimonialsGrid','dentalTipsGrid'].forEach(id => {
    const grid = document.getElementById(id);
    if (!grid) return;
    const count = id === 'galleryGrid' ? 8 : id === 'blogGrid' ? 4 : 6;
    grid.innerHTML = Array.from({length: count}, () => {
      if (id === 'galleryGrid') return `<div style="border-radius:18px;aspect-ratio:1/1;background:linear-gradient(90deg,var(--surface2) 25%,var(--border) 50%,var(--surface2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border:1px solid var(--border);"></div>`;
      return `<div class="skeleton-card"><div class="skeleton-line icon"></div><div class="skeleton-line medium"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>`;
    }).join('');
  });

  await Promise.allSettled([
    loadBlogContent(),
    loadGalleryContent(),
    loadServicesContent(),
    loadAchievementsContent(),
    loadProjectsContent(),
    loadTestimonialsContent(),
    loadDentalTipsContent(),
    loadFaqContent(),
    loadCvContent()
  ]);

  window.refreshReveal?.();
  initCvModal();
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    supabase = await initSupabase();
    if (!supabase) {
      console.error('Supabase not initialized — content will not load.');
      return;
    }
    initBackgroundAudio();
    await loadSections();
    await initSite();
  } catch(error) {
    console.error('Site initialization failed:', error);
  }
});
