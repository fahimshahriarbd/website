function escapeHtml(value){
  return String(value ?? '').replace(
    /[&<>"']/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char])
  );
}

function formatDateValue(val, formatted){
  if(!val && !formatted) return 'Today';
  const str = String(val || '').trim();

  // 1. Google Visualization Date(YYYY, M, D)
  const gvizMatch = str.match(/Date\((\d+),\s*(\d+),\s*(\d+)/i);
  if(gvizMatch){
    const y = gvizMatch[1];
    // Month is 0-indexed in Date(Y, M, D)
    const m = String(parseInt(gvizMatch[2], 10) + 1).padStart(2, '0');
    const d = String(parseInt(gvizMatch[3], 10)).padStart(2, '0');
    return `${d}-${m}-${y}`;
  }

  // 2. YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if(isoMatch){
    const y = isoMatch[1];
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${d}-${m}-${y}`;
  }

  // 3. DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if(dmyMatch){
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = dmyMatch[3];
    return `${d}-${m}-${y}`;
  }

  // 4. Formatted string fallback
  if(formatted && typeof formatted === 'string'){
    const fGviz = formatted.match(/Date\((\d+),\s*(\d+),\s*(\d+)/i);
    if(fGviz){
      const y = fGviz[1];
      const m = String(parseInt(fGviz[2], 10) + 1).padStart(2, '0');
      const d = String(parseInt(fGviz[3], 10)).padStart(2, '0');
      return `${d}-${m}-${y}`;
    }
  }

  // 5. Native Date fallback
  const parsed = new Date(str);
  if(!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990){
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}-${m}-${y}`;
  }

  return str.replace(/Date\((.*?)\)/gi, '$1');
}

async function loadSections(){
  const slots=[...document.querySelectorAll('[data-section]')];

  for(const slot of slots){
    const name=slot.dataset.section;

    try{
      const response=await fetch(`sections/${name}.html`,{
        cache:'no-store'
      });

      if(!response.ok){
        throw new Error(`Section not found: ${name}`);
      }

      slot.outerHTML=await response.text();

    }catch(error){
      console.warn(`Skipping section: ${name}`,error);

      slot.innerHTML=`
        <div style="padding:40px;text-align:center;color:#999;">
          Section not available
        </div>`;
    }
  }
}


async function initSite(){

  const contactForm=document.getElementById("contactForm");
  const submitBtn=document.getElementById("submitBtn");
  const formStatus=document.getElementById("formStatus");

  if(contactForm && submitBtn && formStatus){

    const GOOGLE_SCRIPT_URL=
      "https://script.google.com/macros/s/AKfycbz16uxYP0BOLHZi3ymkFZJfrpIUZdK3dhADmD-ABvBwpm-wUeYNcxRm5iOLpVdyz0yp/exec";

    contactForm.addEventListener("submit",async function(e){

      e.preventDefault();

      submitBtn.disabled=true;
      submitBtn.textContent="Sending...";
      formStatus.style.display="none";

      const data={
        action: "contact",
        sheet: "Messages",
        sheetName: "Messages",
        tab: "Messages",
        spreadsheetId: "1LtXbQRHeCscgqb79T8pnLCb5GdZwz8TeH_AX-PIXpd0",
        Timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
        timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
        name:document.getElementById("name").value.trim(),
        email:document.getElementById("email").value.trim(),
        subject:document.getElementById("subject").value.trim(),
        message:document.getElementById("message").value.trim(),
        Name:document.getElementById("name").value.trim(),
        Email:document.getElementById("email").value.trim(),
        Subject:document.getElementById("subject").value.trim(),
        Message:document.getElementById("message").value.trim()
      };

      try{

        await fetch(GOOGLE_SCRIPT_URL,{
          method:"POST",
          mode:"no-cors",
          headers:{
            "Content-Type":"text/plain;charset=utf-8"
          },
          body:JSON.stringify(data)
        });

        // Also save to server backend backup
        await fetch('/api/contact-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(() => {});

        formStatus.style.display="block";
        formStatus.textContent=
          "✓ Message sent successfully. Thank you!";
        formStatus.style.color="#16a34a";

        contactForm.reset();

      }catch(error){

        formStatus.style.display="block";
        formStatus.textContent=
          "Something went wrong. Please try again.";
        formStatus.style.color="#dc2626";
      }

      submitBtn.disabled=false;
      submitBtn.textContent="Send Message →";
    });
  }


  /* MOBILE MENU */

  const menuBtn=document.getElementById('menuBtn');
  const navLinks=document.getElementById('navLinks');

  if(menuBtn && navLinks){

    menuBtn.addEventListener('click',()=>{
      navLinks.classList.toggle('open');
    });

    document.querySelectorAll('.nav-links a').forEach(a=>{
      a.addEventListener('click',()=>{
        navLinks.classList.remove('open');
      });
    });
  }


  /* DARK MODE */

  const themeBtn=document.getElementById('themeBtn');
  const savedTheme=localStorage.getItem('fahim-theme');

  if(themeBtn){

    if(savedTheme){

      document.documentElement.setAttribute(
        'data-theme',
        savedTheme
      );

      themeBtn.textContent=
        savedTheme==='dark'?'☀':'☾';
    }

    themeBtn.addEventListener('click',()=>{

      const dark=
        document.documentElement.getAttribute(
          'data-theme'
        )==='dark';

      document.documentElement.setAttribute(
        'data-theme',
        dark?'light':'dark'
      );

      localStorage.setItem(
        'fahim-theme',
        dark?'light':'dark'
      );

      themeBtn.textContent=
        dark?'☾':'☀';
    });
  }


  /* TOP BUTTON */

  const topBtn=document.getElementById('topBtn');

  if(topBtn){

    window.addEventListener('scroll',()=>{

      topBtn.classList.toggle(
        'show',
        window.scrollY>500
      );

    });

    topBtn.addEventListener('click',()=>{
      window.scrollTo({
        top:0,
        behavior:'smooth'
      });
    });
  }


  /* SEARCH & TAGS SYSTEM */

  const searchBtn = document.getElementById('searchBtn');
  const searchBox = document.getElementById('searchBox');
  const closeSearch = document.getElementById('closeSearch');
  const siteSearch = document.getElementById('siteSearch');
  const searchResults = document.getElementById('searchResults');

  let searchItems = [];

  function highlightMatch(text, query) {
    if (!text) return '';
    const str = String(text);
    if (!query) return escapeHtml(str);

    const cleanTerms = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (!cleanTerms.length) return escapeHtml(str);

    const regex = new RegExp(`(${cleanTerms.join('|')})`, 'gi');
    const testRegex = new RegExp(`^(?:${cleanTerms.join('|')})$`, 'i');

    const parts = str.split(regex);
    return parts
      .map(part => testRegex.test(part) ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part))
      .join('');
  }

  function getSnippet(text, query) {
    if (!text) return '';
    const str = String(text).trim();
    if (str.length <= 130) return highlightMatch(str, query);

    const lower = str.toLowerCase();
    const qClean = query.trim().toLowerCase();
    const index = lower.indexOf(qClean);

    if (index === -1) {
      return highlightMatch(str.slice(0, 120) + '...', query);
    }

    const start = Math.max(0, index - 40);
    const end = Math.min(str.length, index + qClean.length + 80);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < str.length ? '...' : '';
    return highlightMatch(prefix + str.slice(start, end) + suffix, query);
  }

  function buildSearchIndex() {
    const items = [];
    let counter = 0;

    // Index all main sections
    document.querySelectorAll('main section').forEach(section => {
      const secId = section.id || '';
      const eyebrow = section.querySelector('.eyebrow')?.textContent.trim() || '';
      const secHeading = section.querySelector('.section-head h4, .section-head h2')?.textContent.trim() || '';
      const sectionName = eyebrow || secHeading || secId || 'Section';

      // Index cards in this section
      section.querySelectorAll('.card').forEach(card => {
        if (card.classList.contains('blog-card')) return;

        counter++;
        if (!card.id) {
          card.id = `card-item-${secId || 'sec'}-${counter}`;
        }

        const title = card.querySelector('h3, h4')?.textContent.trim() || '';
        const text = card.querySelector('p')?.textContent.trim() || '';
        const tags = [...card.querySelectorAll('.tag')].map(t => t.textContent.trim()).filter(Boolean);

        if (title || text || tags.length) {
          items.push({
            id: card.id,
            title: title || sectionName,
            text: text,
            meta: sectionName,
            tags: tags,
            sectionId: secId
          });
        }
      });

      // Journey items
      if (secId === 'journey') {
        section.querySelectorAll('.info-row').forEach(row => {
          counter++;
          if (!row.id) row.id = `journey-row-${counter}`;
          const title = row.querySelector('b')?.textContent.trim() || '';
          const text = row.querySelector('.muted, span')?.textContent.trim() || '';
          if (title || text) {
            items.push({
              id: row.id,
              title: title || 'Academic Milestone',
              text: text,
              meta: 'Journey · Education',
              tags: ['Education', 'Journey', 'Academic', 'BDS', 'Dentistry', 'HSC', 'SSC', 'CMC'],
              sectionId: 'journey'
            });
          }
        });

        section.querySelectorAll('.focus-card').forEach(fc => {
          counter++;
          if (!fc.id) fc.id = `journey-focus-${counter}`;
          const title = fc.querySelector('strong')?.textContent.trim() || '';
          const text = fc.querySelector('span')?.textContent.trim() || '';
          if (title) {
            items.push({
              id: fc.id,
              title: title,
              text: text,
              meta: 'Journey · Experience',
              tags: ['Journey', 'Experience', 'Daraz', 'IT', 'Caretutors', 'Local Guide', title],
              sectionId: 'journey'
            });
          }
        });
      }

      // CV Section
      if (secId === 'cv') {
        const cvPanel = section.querySelector('.panel');
        if (cvPanel) {
          if (!cvPanel.id) cvPanel.id = 'cv-download-panel';
          items.push({
            id: cvPanel.id,
            title: 'Curriculum Vitae (CV) Download',
            text: 'Download Fahim Shahriar complete resume and academic credentials in PDF format.',
            meta: 'Resume / CV',
            tags: ['CV', 'Resume', 'Download', 'PDF', 'Credentials'],
            sectionId: 'cv'
          });
        }
      }

      // About section
      if (secId === 'about') {
        const bioP = section.querySelector('.panel p');
        if (bioP) {
          if (!bioP.id) bioP.id = 'about-bio-text';
          items.push({
            id: bioP.id,
            title: 'About Fahim Shahriar',
            text: bioP.textContent.trim(),
            meta: 'About Me',
            tags: ['About', 'Bio', 'CMC', 'BDS', 'Dentistry', 'Medical', 'Student'],
            sectionId: 'about'
          });
        }

        section.querySelectorAll('.focus-card').forEach(fc => {
          counter++;
          if (!fc.id) fc.id = `focus-card-${counter}`;
          const title = fc.querySelector('strong')?.textContent.trim() || '';
          const text = fc.querySelector('span')?.textContent.trim() || '';
          if (title) {
            items.push({
              id: fc.id,
              title: title,
              text: text,
              meta: 'About · Focus Area',
              tags: ['Focus', title],
              sectionId: 'about'
            });
          }
        });

        section.querySelectorAll('.focus-interests .tag').forEach(tagEl => {
          counter++;
          const tagText = tagEl.textContent.trim();
          if (!tagEl.id) tagEl.id = `interest-tag-${counter}`;
          items.push({
            id: tagEl.id,
            title: tagText,
            text: `Core interest and exploration: ${tagText}`,
            meta: 'Interest / Passion',
            tags: [tagText],
            sectionId: 'about'
          });
        });
      }
    });

    // Blog cards
    document.querySelectorAll('#blogGrid .blog-card').forEach(card => {
      counter++;
      if (!card.id) {
        card.id = `blog-item-${counter}`;
      }
      const title = card.querySelector('h4, h3')?.textContent.trim() || '';
      const text = card.querySelector('p')?.textContent.trim() || '';
      const category = card.dataset.category || card.querySelector('.blog-meta span:first-child')?.textContent.trim() || 'Blog';
      const metaInfo = card.querySelector('.blog-meta')?.textContent.replace(/\s+/g, ' ').trim() || '';
      const cardTags = [...card.querySelectorAll('.tag')].map(t => t.textContent.trim()).filter(Boolean);
      const tags = [...new Set([category, 'Blog', 'Article', ...cardTags])];

      if (title || text) {
        items.push({
          id: card.id,
          title: title,
          text: text,
          meta: `Blog · ${category}${metaInfo ? ' (' + metaInfo + ')' : ''}`,
          tags: tags,
          sectionId: 'blog'
        });
      }
    });

    // Gallery photos
    document.querySelectorAll('#galleryGrid .gallery-item').forEach(item => {
      counter++;
      if (!item.id) item.id = `gallery-item-${counter}`;
      const caption = item.querySelector('.gallery-caption')?.textContent.trim() || '';
      const category = item.dataset.category || 'Moments';
      items.push({
        id: item.id,
        title: caption || `${category} Photo`,
        text: `Gallery photo in category ${category}`,
        meta: `Gallery · ${category}`,
        tags: [category, 'Gallery', 'Photos', 'Moments'],
        sectionId: 'gallery'
      });
    });

    // Ensure all tags have accessibility attributes
    document.querySelectorAll('.tag').forEach(tag => {
      if (!tag.hasAttribute('tabindex')) tag.setAttribute('tabindex', '0');
      if (!tag.hasAttribute('role')) tag.setAttribute('role', 'button');
      if (!tag.hasAttribute('title')) tag.setAttribute('title', `Search for "${tag.textContent.trim()}"`);
    });

    searchItems = items;
  }

  window.updateSearchIndex = buildSearchIndex;

  function renderSearch(query) {
    if (!searchResults) return;

    const q = String(query || '').trim().toLowerCase();

    if (!q) {
      searchResults.innerHTML =
        '<div class="search-empty">Search blogs, projects, education, skills, services and tags.</div>';
      return;
    }

    if (searchItems.length === 0) {
      buildSearchIndex();
    }

    const words = q.split(/\s+/).filter(Boolean);

    const matches = searchItems
      .map(item => {
        let score = 0;
        const itemTitle = item.title.toLowerCase();
        const itemText = item.text.toLowerCase();
        const itemMeta = item.meta.toLowerCase();
        const itemTags = item.tags.map(t => t.toLowerCase());

        // Exact match with any tag
        if (itemTags.some(t => t === q)) {
          score += 120;
        } else if (itemTags.some(t => t.includes(q))) {
          score += 80;
        }

        if (itemTitle === q) {
          score += 100;
        } else if (itemTitle.includes(q)) {
          score += 60;
        }

        if (itemMeta.includes(q)) {
          score += 35;
        }

        if (itemText.includes(q)) {
          score += 25;
        }

        if (words.length > 1) {
          words.forEach(w => {
            if (itemTags.some(t => t.includes(w))) score += 30;
            if (itemTitle.includes(w)) score += 20;
            if (itemText.includes(w)) score += 10;
          });
        }

        return { item, score };
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item);

    if (matches.length === 0) {
      searchResults.innerHTML = `
        <div class="search-empty">
          No matches found for "<b>${escapeHtml(query)}</b>".
          <br><small style="margin-top:6px;display:block;color:var(--muted)">Try searching for BDS, Daraz, Web Development, Caretutors, or click on any tag.</small>
        </div>
      `;
      return;
    }

    searchResults.innerHTML = matches.slice(0, 12).map(item => {
      const tagHtml = (item.tags || []).length
        ? `<div class="tags" style="margin-top:7px;gap:5px;">${item.tags.map(t => `<span class="tag" style="font-size:0.72rem;padding:2px 8px;">${escapeHtml(t)}</span>`).join('')}</div>`
        : '';

      return `
        <div class="search-result" data-target-id="${escapeHtml(item.id)}" role="button" tabindex="0">
          <span class="search-result-meta">${escapeHtml(item.meta)}</span>
          <strong class="search-result-title">${highlightMatch(item.title, q)}</strong>
          <span class="search-snippet">${getSnippet(item.text, q)}</span>
          ${tagHtml}
        </div>
      `;
    }).join('');
  }

  if (
    searchBtn &&
    searchBox &&
    closeSearch &&
    siteSearch &&
    searchResults
  ) {
    searchBtn.addEventListener('click', () => {
      const isOpen = searchBox.classList.toggle('open');
      searchBtn.classList.toggle('active', isOpen);
      if (isOpen) {
        siteSearch.focus();
        renderSearch(siteSearch.value);
      }
    });

    closeSearch.addEventListener('click', () => {
      searchBox.classList.remove('open');
      searchBtn.classList.remove('active');
    });

    siteSearch.addEventListener('input', () => {
      renderSearch(siteSearch.value);
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchBox.classList.add('open');
        searchBtn.classList.add('active');
        siteSearch.focus();
        renderSearch(siteSearch.value);
      }

      if (e.key === 'Escape') {
        searchBox.classList.remove('open');
        searchBtn.classList.remove('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.tag')) return;
      if (!e.target.closest('.search-wrap')) {
        searchBox.classList.remove('open');
        searchBtn.classList.remove('active');
      }
    });

    searchResults.addEventListener('click', (e) => {
      if (e.target.closest('.tag')) return;

      const resultCard = e.target.closest('.search-result');
      if (!resultCard) return;

      const targetId = resultCard.dataset.targetId;
      if (!targetId) return;

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        searchBox.classList.remove('open');
        searchBtn.classList.remove('active');

        if (targetEl.classList.contains('blog-card')) {
          const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
          if (allBtn) allBtn.click();
        }

        if (targetEl.classList.contains('gallery-item')) {
          const allGalleryBtn = document.querySelector('.filter-btn[data-gallery-filter="all"]');
          if (allGalleryBtn) allGalleryBtn.click();
        }

        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.remove('search-hit');
        void targetEl.offsetWidth;
        targetEl.classList.add('search-hit');
        setTimeout(() => {
          targetEl.classList.remove('search-hit');
        }, 2500);
      }
    });
  }

  // GLOBAL TAG CLICK LISTENER
  document.addEventListener('click', (e) => {
    const tag = e.target.closest('.tag');
    if (!tag) return;

    e.preventDefault();
    e.stopPropagation();

    const tagText = tag.textContent.trim();
    if (!tagText) return;

    const contentModal = document.getElementById('contentModal');
    if (contentModal && contentModal.classList.contains('open')) {
      contentModal.classList.remove('open');
      contentModal.setAttribute('aria-hidden', 'true');
    }

    if (searchBox && siteSearch && searchBtn) {
      searchBox.classList.add('open');
      searchBtn.classList.add('active');
      siteSearch.value = tagText;
      renderSearch(tagText);
      siteSearch.focus();
      siteSearch.select();

      const header = document.querySelector('.header');
      if (header) {
        const headerRect = header.getBoundingClientRect();
        if (headerRect.top < 0) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  });

  // Handle Enter key on focused tags or search results
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const activeTag = document.activeElement?.closest?.('.tag');
      if (activeTag) {
        e.preventDefault();
        activeTag.click();
      }
      const activeResult = document.activeElement?.closest?.('.search-result');
      if (activeResult) {
        e.preventDefault();
        activeResult.click();
      }
    }
  });

  buildSearchIndex();


  /* SCROLL PROGRESS */

  const scrollProgress=
    document.getElementById('scrollProgress');

  if(scrollProgress){

    const updateProgress=()=>{

      const h=
        document.documentElement.scrollHeight-
        window.innerHeight;

      scrollProgress.style.width=
        (h>0?(window.scrollY/h)*100:0)+'%';
    };

    window.addEventListener(
      'scroll',
      updateProgress,
      {passive:true}
    );

    updateProgress();
  }


  /* NAVIGATION ACTIVE SECTION */

  const navSections=[
    ...document.querySelectorAll('main section[id]')
  ];

  if(navSections.length>0){

    const navObserver=
      new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

          if(entry.isIntersecting){

            document
              .querySelectorAll('.nav-links a')
              .forEach(a=>{
                a.classList.remove('active');
              });

            const link=
              document.querySelector(
                '.nav-links a[href="#'+
                entry.target.id+
                '"]'
              );

            if(link){
              link.classList.add('active');
            }
          }
        });

      },{
        rootMargin:'-35% 0px -55% 0px',
        threshold:0
      });

    navSections.forEach(section=>{
      navObserver.observe(section);
    });
  }


  /* CURRENT YEAR */

  const yearEl=document.getElementById('year');

  if(yearEl){
    yearEl.textContent=
      new Date().getFullYear();
  }


  /* LOAD GOOGLE SHEET CONTENT (BLOG, GALLERY, SERVICES, ACHIEVEMENTS & PROJECTS) */

  await Promise.allSettled([
    loadWebsiteContent(),
    loadGalleryContent(),
    loadServicesContent(),
    loadAchievementsContent(),
    loadProjectsContent()
  ]);
}



/* =========================================================
   GOOGLE SHEETS BLOG SYSTEM
   ========================================================= */

async function loadWebsiteContent(){

  const CONTENT_API_URL=
    "https://docs.google.com/spreadsheets/d/1FPDlW0ugDgBLds5AD86sTo-Arw0r9T4cJZ8b4Vl5s5w/gviz/tq?tqx=out:json&sheet=Blog%26Articles";


  const blogGrid=
    document.getElementById('blogGrid');

  if(!blogGrid){
    return;
  }


  /* HTML নিরাপদ করার জন্য */

  const escapeHtml=value=>
    String(value??'').replace(
      /[&<>"']/g,
      char=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      }[char])
    );


  /* Category normalize */

  const categoryKey=value=>{

    const key=
      String(value??'')
      .trim()
      .toLowerCase();


    if(
      key==='tech' ||
      key==='technology'
    ){
      return 'technology';
    }


    if(key==='medical'){
      return 'medical';
    }


    if(key==='education'){
      return 'education';
    }


    if(key==='personal'){
      return 'personal';
    }


    return key;
  };

  let allBlogPosts = [];
  let activeFilteredBlog = [];
  const BLOG_PAGE_SIZE = 4;
  let blogVisibleCount = 4;
  let blogSeeMoreInitialized = false;

  function createBlogCardHtml(post) {
    const category = String(post.Category || 'Blog').trim();
    const categoryKeyValue = categoryKey(category);
    const image = String(post.Image || '').trim() ||
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1000&q=85';
    const title = String(post.Title || 'Untitled').trim();
    const date = formatDateValue(post.Date, post.Date_formatted);
    const readTime = String(post.ReadTime || '5').trim();
    const summary = String(post.Summary || post.Content || '...').trim();
    const link = String(post.Link || '#').trim();

    return `
      <article class="card blog-card" data-category="${escapeHtml(categoryKeyValue)}">
        <img class="blog-cover" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">
        <div class="blog-body">
          <div class="blog-meta">
            <span>${escapeHtml(category)}</span>
            <span>${escapeHtml(date)} · ${escapeHtml(readTime)} min</span>
          </div>
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(summary)}</p>
          <a class="read-more" href="${escapeHtml(link)}">Read article →</a>
        </div>
      </article>
    `;
  }

  function renderBlogCards(append = false) {
    const seeMoreWrap = document.getElementById('blogSeeMoreWrap');
    const seeMoreBtn = document.getElementById('blogSeeMoreBtn');
    if (!blogGrid) return;

    if (!activeFilteredBlog.length) {
      blogGrid.innerHTML = `
        <div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--muted)">
          No published blog posts found in Google Sheets.
        </div>
      `;
      if (seeMoreWrap) seeMoreWrap.style.display = 'none';
      return;
    }

    const visiblePosts = activeFilteredBlog.slice(0, blogVisibleCount);

    if (!append) {
      blogGrid.innerHTML = visiblePosts.map(post => createBlogCardHtml(post)).join('');
    } else {
      const startIndex = blogVisibleCount - BLOG_PAGE_SIZE;
      const newPosts = activeFilteredBlog.slice(startIndex, blogVisibleCount);
      const newHtml = newPosts.map(post => createBlogCardHtml(post)).join('');
      blogGrid.insertAdjacentHTML('beforeend', newHtml);
    }

    if (seeMoreWrap) {
      if (blogVisibleCount < activeFilteredBlog.length) {
        seeMoreWrap.style.display = 'flex';
        const remaining = activeFilteredBlog.length - blogVisibleCount;
        if (seeMoreBtn) {
          seeMoreBtn.innerHTML = `See More (${remaining} remaining) ↓`;
        }
      } else {
        seeMoreWrap.style.display = 'none';
      }
    }

    if (typeof window.updateSearchIndex === 'function') {
      window.updateSearchIndex();
    }
  }

  function initBlogSeeMore() {
    if (blogSeeMoreInitialized) return;
    const seeMoreBtn = document.getElementById('blogSeeMoreBtn');
    if (!seeMoreBtn) return;
    blogSeeMoreInitialized = true;

    seeMoreBtn.addEventListener('click', () => {
      blogVisibleCount += BLOG_PAGE_SIZE;
      renderBlogCards(true);
    });
  }


  try{

    /* Google Sheet থেকে data আনবে */

    const response=
      await fetch(
        CONTENT_API_URL,
        {
          cache:'no-store'
        }
      );


    if(!response.ok){

      throw new Error(
        `Google Sheet returned HTTP ${response.status}`
      );
    }


    const rawText=
      await response.text();


    /*
      Google Visualization API সাধারণত এমন response দেয়:

      google.visualization.Query.setResponse({...});

      তাই প্রথম { এবং শেষ } বের করছি।
    */

    const firstBrace=
      rawText.indexOf('{');

    const lastBrace=
      rawText.lastIndexOf('}');


    if(
      firstBrace===-1 ||
      lastBrace===-1 ||
      lastBrace<=firstBrace
    ){

      throw new Error(
        'Google Sheet response did not contain valid JSON.'
      );
    }


    const data=
      JSON.parse(
        rawText.slice(
          firstBrace,
          lastBrace+1
        )
      );


    /* Sheet-এর column বের করা */

    const columns=
      (data.table?.cols||[])
      .map(col=>
        String(
          col.label||
          col.id||
          ''
        ).trim()
      );


    const rows=
      data.table?.rows||[];


    /* প্রতিটি row object বানানো */

    const posts=
      rows
      .map(row=>{

        const cells=
          row.c||[];

        const obj={};


        columns.forEach(
          (column,index)=>{
            const cell = cells[index];
            obj[column] = cell && typeof cell.v !== 'undefined' ? String(cell.v) : '';
            if (cell && typeof cell.f !== 'undefined') {
              obj[column + '_formatted'] = String(cell.f);
            }
          }
        );


        return obj;
      })


      /* Published yes হলে দেখাবে */

      .filter(post=>{

        const title=
          String(
            post.Title||''
          ).trim();


        const published=
          String(
            post.Published||''
          )
          .trim()
          .toLowerCase();


        return(
          title &&
          published!=='no' &&
          published!=='false' &&
          published!=='draft'
        );
      });


    /* কোনো post না পাওয়া গেলে */

    if(!posts.length){

      blogGrid.innerHTML=`

        <div style="
          grid-column:1/-1;
          padding:30px;
          text-align:center;
          color:var(--muted);
        ">

          No published blog posts found

        </div>

      `;

      const seeMoreWrap = document.getElementById('blogSeeMoreWrap');
      if (seeMoreWrap) seeMoreWrap.style.display = 'none';
      return;
    }

    allBlogPosts = posts;
    activeFilteredBlog = [...allBlogPosts];
    blogVisibleCount = BLOG_PAGE_SIZE;

    const blogToolbar = document.getElementById('blogToolbar') || document.querySelector('.blog-toolbar');
    if (blogToolbar) {
      const categories = [...new Set(allBlogPosts.map(p => (p.Category || 'Blog').trim()).filter(Boolean))];
      blogToolbar.innerHTML = `
        <button class="filter-btn active" data-filter="all">All (${allBlogPosts.length})</button>
        ${categories.map(cat => {
          const count = allBlogPosts.filter(p => (p.Category || '').trim().toLowerCase() === cat.toLowerCase()).length;
          return `<button class="filter-btn" data-filter="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</button>`;
        }).join('')}
      `;

      blogToolbar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          blogToolbar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const filter = btn.dataset.filter || 'all';
          if (!filter || filter === 'all') {
            activeFilteredBlog = [...allBlogPosts];
          } else {
            activeFilteredBlog = allBlogPosts.filter(p => (p.Category || '').trim().toLowerCase() === filter.toLowerCase());
          }

          blogVisibleCount = BLOG_PAGE_SIZE;
          renderBlogCards();
        });
      });
    }

    initBlogSeeMore();
    renderBlogCards();

  }catch(error){

    console.error(
      'Blog content could not be loaded:',
      error
    );

    /*
      Google Sheet থেকে data না এলে
      সরাসরি Blog-এর জায়গায় error দেখাবে।
    */

    blogGrid.innerHTML=`

      <div style="
        grid-column:1/-1;
        padding:30px;
        text-align:center;
        color:#dc2626;
      ">

        <strong>
          Blog posts could not be loaded.
        </strong>

        <br><br>

        Please make sure the Google Sheet
        is published to the web.

      </div>

    `;

    if(typeof window.updateSearchIndex==='function'){
      window.updateSearchIndex();
    }
  }
}



/* =========================================================
   GOOGLE SHEETS GALLERY SYSTEM & LIGHTBOX VIEWER
   ========================================================= */

const DEFAULT_GALLERY_PHOTOS = [
  {
    category: 'Campus',
    image: 'https://i.postimg.cc/rFLt87HR/screenshot-7.png?auto=format&fit=crop&w=1200&q=85',
    caption: 'Campus Life & CMC Dental Unit'
  },
  {
    category: 'Medical',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85',
    caption: 'Dental Surgery & Clinical Study'
  },
  {
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85',
    caption: 'Web Development & IT Systems'
  },
  {
    category: 'Projects',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85',
    caption: 'Digital Projects & Team Collaboration'
  },
  {
    category: 'Work',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85',
    caption: 'Operations & Management Experience'
  },
  {
    category: 'Writing',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=85',
    caption: 'Content Creation & Educational Notes'
  },
  {
    category: 'Learning',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=85',
    caption: 'Continuous Reading & Research'
  },
  {
    category: 'Personal',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    caption: 'Personal Life & Interests'
  }
];

let allGalleryPhotos = [...DEFAULT_GALLERY_PHOTOS];
let activeFilteredGallery = [...DEFAULT_GALLERY_PHOTOS];
let currentLightboxIndex = 0;

async function loadGalleryContent() {
  const GALLERY_API_URL =
    "https://docs.google.com/spreadsheets/d/1FPDlW0ugDgBLds5AD86sTo-Arw0r9T4cJZ8b4Vl5s5w/gviz/tq?tqx=out:json&sheet=Photos%26Moments";

  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;

  try {
    const response = await fetch(GALLERY_API_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Google Sheet returned HTTP ${response.status}`);
    }

    const rawText = await response.text();
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Google Sheet response did not contain valid JSON.');
    }

    const data = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
    const cols = data.table?.cols || [];
    const rows = data.table?.rows || [];

    const isCatName = str => /^(catagory|category|type|tag|group)$/i.test(String(str || '').trim());
    const isImgName = str => /^(imagelink|image|photo|link|url|img|photolink)$/i.test(String(str || '').trim());
    const isCapName = str => /^(caption|title|name|description)$/i.test(String(str || '').trim());

    let catColIdx = -1;
    let imgColIdx = -1;
    let capColIdx = -1;
    let headerRowIdx = -1;

    // Check cols labels first
    cols.forEach((col, idx) => {
      const lbl = String(col.label || col.id || '').trim();
      if (isCatName(lbl)) catColIdx = idx;
      if (isImgName(lbl)) imgColIdx = idx;
      if (isCapName(lbl)) capColIdx = idx;
    });

    // Check rows[0] if headers are in the data row
    if ((catColIdx === -1 || imgColIdx === -1) && rows.length > 0) {
      const firstRowCells = rows[0]?.c || [];
      firstRowCells.forEach((cell, idx) => {
        const val = String(cell?.v || '').trim();
        if (isCatName(val)) { catColIdx = idx; headerRowIdx = 0; }
        if (isImgName(val)) { imgColIdx = idx; headerRowIdx = 0; }
        if (isCapName(val)) { capColIdx = idx; headerRowIdx = 0; }
      });
    }

    // Default indices if not detected
    if (catColIdx === -1) catColIdx = 0;
    if (imgColIdx === -1) imgColIdx = 1;

    const parsedPhotos = [];
    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

    for (let i = startRow; i < rows.length; i++) {
      const cells = rows[i]?.c || [];
      const catVal = String(cells[catColIdx]?.v || '').trim();
      const imgVal = String(cells[imgColIdx]?.v || '').trim();
      const capVal = capColIdx >= 0 ? String(cells[capColIdx]?.v || '').trim() : '';

      // Validate image link and avoid re-parsing headers
      if (
        imgVal &&
        !isImgName(imgVal) &&
        !isCatName(catVal) &&
        (imgVal.startsWith('http://') || imgVal.startsWith('https://') || imgVal.startsWith('data:') || imgVal.startsWith('//'))
      ) {
        parsedPhotos.push({
          category: catVal || 'Moments',
          image: imgVal,
          caption: capVal || catVal || 'Moments'
        });
      }
    }

    if (parsedPhotos.length > 0) {
      allGalleryPhotos = parsedPhotos;
    }
  } catch (error) {
    console.warn('Photos&Moments could not be fetched, using default gallery:', error);
  }

  renderGallerySection();
  initGalleryLightbox();

  if (typeof window.updateSearchIndex === 'function') {
    window.updateSearchIndex();
  }
}

const GALLERY_PAGE_SIZE = 6;
let galleryVisibleCount = 6;
let gallerySeeMoreInitialized = false;

function renderGallerySection() {
  const galleryToolbar = document.getElementById('galleryToolbar');
  activeFilteredGallery = [...allGalleryPhotos];
  galleryVisibleCount = GALLERY_PAGE_SIZE;

  if (galleryToolbar) {
    const categories = [...new Set(allGalleryPhotos.map(p => p.category.trim()).filter(Boolean))];
    galleryToolbar.innerHTML = `
      <button class="filter-btn active" data-gallery-filter="all">All (${allGalleryPhotos.length})</button>
      ${categories.map(cat => {
        const count = allGalleryPhotos.filter(p => p.category.trim().toLowerCase() === cat.toLowerCase()).length;
        return `<button class="filter-btn" data-gallery-filter="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</button>`;
      }).join('')}
    `;

    galleryToolbar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        galleryToolbar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.galleryFilter;
        if (!filter || filter === 'all') {
          activeFilteredGallery = [...allGalleryPhotos];
        } else {
          activeFilteredGallery = allGalleryPhotos.filter(p => p.category.trim().toLowerCase() === filter.toLowerCase());
        }

        galleryVisibleCount = GALLERY_PAGE_SIZE;
        renderGalleryCards();
      });
    });
  }

  initGallerySeeMore();
  renderGalleryCards();
}

function createGalleryItemHtml(photo, index) {
  return `
    <div class="gallery-item" data-category="${escapeHtml(photo.category)}" data-index="${index}" role="button" tabindex="0" title="Click to view full screen">
      <img src="${escapeHtml(photo.image)}" alt="${escapeHtml(photo.caption || photo.category)}" loading="lazy" />
      <span class="gallery-badge">${escapeHtml(photo.category)}</span>
      <div class="gallery-overlay">
        <span class="gallery-zoom-icon">🔍</span>
        <span class="gallery-caption">${escapeHtml(photo.caption || photo.category)}</span>
      </div>
    </div>
  `;
}

function attachGalleryEvents() {
  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;
  galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
    if (item.dataset.hasListener) return;
    item.dataset.hasListener = 'true';

    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index, 10);
      openLightbox(idx);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const idx = parseInt(item.dataset.index, 10);
        openLightbox(idx);
      }
    });
  });
}

function renderGalleryCards(append = false) {
  const galleryGrid = document.getElementById('galleryGrid');
  const seeMoreWrap = document.getElementById('gallerySeeMoreWrap');
  const seeMoreBtn = document.getElementById('gallerySeeMoreBtn');
  if (!galleryGrid) return;

  if (activeFilteredGallery.length === 0) {
    galleryGrid.innerHTML = `
      <div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">
        No photos found in this category.
      </div>
    `;
    if (seeMoreWrap) seeMoreWrap.style.display = 'none';
    return;
  }

  const visiblePhotos = activeFilteredGallery.slice(0, galleryVisibleCount);

  if (!append) {
    galleryGrid.innerHTML = visiblePhotos.map((photo, index) => createGalleryItemHtml(photo, index)).join('');
  } else {
    const startIndex = galleryVisibleCount - GALLERY_PAGE_SIZE;
    const newPhotos = activeFilteredGallery.slice(startIndex, galleryVisibleCount);
    const newHtml = newPhotos.map((photo, i) => createGalleryItemHtml(photo, startIndex + i)).join('');
    galleryGrid.insertAdjacentHTML('beforeend', newHtml);
  }

  attachGalleryEvents();

  if (seeMoreWrap) {
    if (galleryVisibleCount < activeFilteredGallery.length) {
      seeMoreWrap.style.display = 'flex';
      const remaining = activeFilteredGallery.length - galleryVisibleCount;
      if (seeMoreBtn) {
        seeMoreBtn.innerHTML = `See More (${remaining} remaining) ↓`;
      }
    } else {
      seeMoreWrap.style.display = 'none';
    }
  }
}

function initGallerySeeMore() {
  if (gallerySeeMoreInitialized) return;
  const seeMoreBtn = document.getElementById('gallerySeeMoreBtn');
  if (!seeMoreBtn) return;
  gallerySeeMoreInitialized = true;

  seeMoreBtn.addEventListener('click', () => {
    galleryVisibleCount += GALLERY_PAGE_SIZE;
    renderGalleryCards(true);
  });
}

function initGalleryLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  const closeBtn = document.getElementById('lightboxClose');
  const overlay = document.getElementById('lightboxOverlay');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const downloadBtn = document.getElementById('lightboxDownload');

  if (!lightbox) return;

  if (closeBtn) closeBtn.onclick = closeLightbox;
  if (overlay) overlay.onclick = closeLightbox;
  if (prevBtn) prevBtn.onclick = prevLightboxImage;
  if (nextBtn) nextBtn.onclick = nextLightboxImage;

  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const current = activeFilteredGallery[currentLightboxIndex];
      if (!current) return;
      downloadImage(current.image, `fahim-${(current.category || 'photo').toLowerCase()}-${currentLightboxIndex + 1}.jpg`);
    };
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevLightboxImage();
    if (e.key === 'ArrowRight') nextLightboxImage();
  });

  // Touch swipe support
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 50) nextLightboxImage();
    if (touchEndX > touchStartX + 50) prevLightboxImage();
  }, { passive: true });
}

function openLightbox(index) {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox || activeFilteredGallery.length === 0) return;

  currentLightboxIndex = (index + activeFilteredGallery.length) % activeFilteredGallery.length;
  updateLightboxView();

  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function prevLightboxImage() {
  if (activeFilteredGallery.length === 0) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + activeFilteredGallery.length) % activeFilteredGallery.length;
  updateLightboxView();
}

function nextLightboxImage() {
  if (activeFilteredGallery.length === 0) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % activeFilteredGallery.length;
  updateLightboxView();
}

function updateLightboxView() {
  const imgEl = document.getElementById('lightboxImg');
  const catEl = document.getElementById('lightboxCategory');
  const counterEl = document.getElementById('lightboxCounter');
  const capEl = document.getElementById('lightboxCaption');

  const photo = activeFilteredGallery[currentLightboxIndex];
  if (!photo) return;

  if (imgEl) {
    imgEl.classList.add('switching');
    setTimeout(() => {
      imgEl.src = photo.image;
      imgEl.alt = photo.caption || photo.category;
      imgEl.classList.remove('switching');
    }, 150);
  }

  if (catEl) catEl.textContent = photo.category;
  if (counterEl) counterEl.textContent = `${currentLightboxIndex + 1} / ${activeFilteredGallery.length}`;
  if (capEl) capEl.textContent = photo.caption || photo.category;
}

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = filename || 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}



/* =========================================================
   GOOGLE SHEETS SERVICES & BOOKING/PAYMENT SYSTEM
   ========================================================= */

const DEFAULT_SERVICES = [
  { icon: '🎓', title: 'Tuition Media & Mentorship', category: 'Education', price: '1,500 BDT', description: 'Education-focused digital promotion, tutoring experience, and mentoring.', active: 'yes' },
  { icon: '💻', title: 'Web Development & IT', category: 'Technology', price: '3,000 BDT', description: 'Basic website setup, static pages, DNS mapping, and BTCL domain guidance.', active: 'yes' },
  { icon: '🛒', title: 'E-commerce Management', category: 'Business', price: '2,500 BDT', description: 'Guidance on seller operations and logistics management based on Daraz experience.', active: 'yes' },
  { icon: '🎬', title: 'Creative Content', category: 'Creative', price: '1,200 BDT', description: 'Ideas and support for digital content, visuals and online projects.', active: 'yes' },
  { icon: '🦷', title: 'Oral Health & Dental Consultation', category: 'Health & Medical', price: '800 BDT', description: 'Basic dental advice, oral hygiene tips, and clinical health guidance.', active: 'yes' },
  { icon: '📊', title: 'Digital Skills & Academic Support', category: 'Education', price: '1,000 BDT', description: 'Help with presentation slides, software tools, student projects, and career guidance.', active: 'yes' }
];

let allServices = [...DEFAULT_SERVICES];
let currentServicesCategory = 'All';
const SERVICES_PAGE_SIZE = 6;
let servicesVisibleCount = 6;
let servicesSeeMoreInitialized = false;

let currentSelectedService = '';
let currentSelectedServicePrice = '1,000 BDT';
let currentSelectedGateway = 'bKash';
const PERSONAL_NUMBER = '01316831199';

function getDefaultPriceForService(title) {
  const match = DEFAULT_SERVICES.find(s => s.title.toLowerCase().trim() === String(title || '').toLowerCase().trim());
  if (match && match.price) return match.price;
  const t = String(title || '').toLowerCase();
  if (t.includes('web') || t.includes('dev') || t.includes('software')) return '3,000 BDT';
  if (t.includes('e-commerce') || t.includes('commerce') || t.includes('business')) return '2,500 BDT';
  if (t.includes('tuition') || t.includes('mentor')) return '1,500 BDT';
  if (t.includes('content') || t.includes('video') || t.includes('media')) return '1,200 BDT';
  if (t.includes('dental') || t.includes('health') || t.includes('doctor')) return '800 BDT';
  return '1,000 BDT';
}

function formatFeeDisplay(val, title) {
  const raw = val || getDefaultPriceForService(title);
  let clean = String(raw).replace(/bdt/gi, '').replace(/[৳,]/g, '').trim();
  const num = parseInt(clean, 10);
  if (!isNaN(num)) {
    clean = num.toLocaleString('en-US');
  }
  return `${clean || '1,000'} BDT`;
}

async function loadServicesContent() {
  const MASTER_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbz16uxYP0BOLHZi3ymkFZJfrpIUZdK3dhADmD-ABvBwpm-wUeYNcxRm5iOLpVdyz0yp/exec?sheet=Services";
  const GVIZ_SERVICES_URL =
    "https://docs.google.com/spreadsheets/d/1LtXbQRHeCscgqb79T8pnLCb5GdZwz8TeH_AX-PIXpd0/gviz/tq?tqx=out:json&sheet=Services";

  const servicesGrid = document.getElementById('servicesGrid');
  if (!servicesGrid) return;

  let loadedItems = [];

  // 1. Try reading from Master Web App
  try {
    const res = await fetch(MASTER_SCRIPT_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(item => {
          const title = item.Title || item.title || item.Service || item.name;
          if (!title) return;
          const activeVal = String(item.Active || item.active || item.Status || item.status || item.Published || item.published || item['On/Off'] || 'yes').trim().toLowerCase();
          if (activeVal === 'no' || activeVal === 'off' || activeVal === 'false' || activeVal === '0' || activeVal === 'inactive' || activeVal === 'hide') {
            return; // Skip inactive services (On/Off feature)
          }
          const rawPrice = item.Fee || item.fee || item.Price || item.price || item.Amount || item.amount || '';
          loadedItems.push({
            icon: item.Icon || item.icon || '💼',
            title: title,
            category: item.Category || item.category || 'General',
            price: formatFeeDisplay(rawPrice, title),
            description: item.Description || item.description || item.Summary || 'Professional quality service tailored to your requirements.',
            active: 'yes'
          });
        });
      }
    }
  } catch (err) {
    // fallback
  }

  // 2. Fallback to GViz if master script didn't return rows yet
  if (loadedItems.length === 0) {
    try {
      const gRes = await fetch(GVIZ_SERVICES_URL, { cache: 'no-store' });
      if (gRes.ok) {
        const rawText = await gRes.text();
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const data = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
          const cols = data.table?.cols || [];
          const rows = data.table?.rows || [];

          let iconColIdx = -1, titleColIdx = -1, descColIdx = -1, priceColIdx = -1, catColIdx = -1, activeColIdx = -1;

          cols.forEach((col, idx) => {
            const lbl = String(col.label || col.id || '').trim().toLowerCase();
            if (lbl.includes('icon')) iconColIdx = idx;
            if (lbl.includes('title') || lbl.includes('service') || lbl.includes('name')) titleColIdx = idx;
            if (lbl.includes('desc') || lbl.includes('detail')) descColIdx = idx;
            if (lbl.includes('price') || lbl.includes('fee') || lbl.includes('amount') || lbl.includes('bdt') || lbl.includes('খরচ') || lbl.includes('ফি') || lbl.includes('টাকা')) priceColIdx = idx;
            if (lbl.includes('cat') || lbl.includes('type')) catColIdx = idx;
            if (lbl.includes('active') || lbl.includes('status') || lbl.includes('publish') || lbl.includes('on')) activeColIdx = idx;
          });

          for (let i = 0; i < rows.length; i++) {
            const cells = rows[i]?.c || [];
            const titleVal = String(cells[titleColIdx]?.v || '').trim();
            if (!titleVal || titleVal.toLowerCase() === 'title') continue;

            const activeVal = activeColIdx >= 0 ? String(cells[activeColIdx]?.v || '').trim().toLowerCase() : 'yes';
            if (activeVal === 'no' || activeVal === 'off' || activeVal === 'false' || activeVal === '0' || activeVal === 'hide') continue;

            const iconVal = iconColIdx >= 0 ? (String(cells[iconColIdx]?.v || '').trim() || '💼') : '💼';
            const descVal = descColIdx >= 0 ? String(cells[descColIdx]?.v || '').trim() : '';
            const catVal = catColIdx >= 0 ? String(cells[catColIdx]?.v || '').trim() : 'General';
            const rawPrice = priceColIdx >= 0 ? String(cells[priceColIdx]?.v || '').trim() : '';

            loadedItems.push({
              icon: iconVal,
              title: titleVal,
              category: catVal || 'General',
              price: formatFeeDisplay(rawPrice, titleVal),
              description: descVal || 'Quality service tailored to your requirements.',
              active: 'yes'
            });
          }
        }
      }
    } catch (e) {
      // fallback
    }
  }

  if (loadedItems.length > 0) {
    allServices = loadedItems;
  }

  renderServicesFilterTabs();
  servicesVisibleCount = SERVICES_PAGE_SIZE;
  initServicesSeeMore();
  renderServicesCards();
  initServiceModal();

  if (typeof window.updateSearchIndex === 'function') {
    window.updateSearchIndex();
  }
}

function renderServicesFilterTabs() {
  const filterWrap = document.getElementById('servicesFilterWrap');
  if (!filterWrap) return;

  const rawCategories = allServices.map(s => s.category).filter(Boolean);
  const uniqueCats = ['All', ...new Set(rawCategories)];

  if (uniqueCats.length <= 2) {
    filterWrap.style.display = 'none';
    return;
  }

  filterWrap.style.display = 'flex';
  filterWrap.innerHTML = uniqueCats.map(cat => {
    const count = cat === 'All' ? allServices.length : allServices.filter(s => s.category === cat).length;
    const isActive = cat === currentServicesCategory;
    return `
      <button type="button" class="services-filter-btn ${isActive ? 'active' : ''}" data-category="${escapeHtml(cat)}">
        ${escapeHtml(cat)} <span class="services-filter-count">${count}</span>
      </button>
    `;
  }).join('');

  filterWrap.querySelectorAll('.services-filter-btn').forEach(btn => {
    btn.onclick = () => {
      currentServicesCategory = btn.dataset.category || 'All';
      servicesVisibleCount = SERVICES_PAGE_SIZE;
      renderServicesFilterTabs();
      renderServicesCards(false);
    };
  });
}

function getFilteredServices() {
  if (currentServicesCategory === 'All') return allServices;
  return allServices.filter(s => s.category === currentServicesCategory);
}

function renderServicesCards(append = false) {
  const servicesGrid = document.getElementById('servicesGrid');
  const seeMoreWrap = document.getElementById('servicesSeeMoreWrap');
  const seeMoreBtn = document.getElementById('servicesSeeMoreBtn');
  if (!servicesGrid) return;

  const filtered = getFilteredServices();
  const visibleServices = filtered.slice(0, servicesVisibleCount);

  if (!append) {
    servicesGrid.innerHTML = visibleServices.map(service => createServiceCardHtml(service)).join('');
  } else {
    const startIndex = servicesVisibleCount - SERVICES_PAGE_SIZE;
    const newItems = filtered.slice(startIndex, servicesVisibleCount);
    const newHtml = newItems.map(service => createServiceCardHtml(service)).join('');
    servicesGrid.insertAdjacentHTML('beforeend', newHtml);
  }

  attachServiceRequestEvents();

  if (seeMoreWrap) {
    if (servicesVisibleCount < filtered.length) {
      seeMoreWrap.style.display = 'flex';
      const remaining = filtered.length - servicesVisibleCount;
      if (seeMoreBtn) {
        seeMoreBtn.innerHTML = `See More Services (${remaining} remaining) ↓`;
      }
    } else {
      seeMoreWrap.style.display = 'none';
    }
  }
}

function createServiceCardHtml(service) {
  const isImage = service.icon.startsWith('http') || service.icon.startsWith('//') || service.icon.startsWith('data:');
  const iconMarkup = isImage
    ? `<img src="${escapeHtml(service.icon)}" alt="${escapeHtml(service.title)}" style="width:36px;height:36px;object-fit:contain;" />`
    : escapeHtml(service.icon);
  const displayFee = formatFeeDisplay(service.price, service.title);

  return `
    <article class="card service-card">
      <div class="service-card-body">
        <div class="card-header">
          <div class="card-icon">${iconMarkup}</div>
          <h4>${escapeHtml(service.title)}</h4>
        </div>
        <p>${escapeHtml(service.description)}</p>
        <div class="service-price-row">
          <span class="service-price-label">Fee</span>
          <span class="service-price-value">${escapeHtml(displayFee)}</span>
        </div>
      </div>
      <div class="service-action-wrap">
        <button type="button" class="service-request-btn" data-service-title="${escapeHtml(service.title)}" data-service-price="${escapeHtml(displayFee)}">
          I need this Service →
        </button>
      </div>
    </article>
  `;
}

function initServicesSeeMore() {
  if (servicesSeeMoreInitialized) return;
  const seeMoreBtn = document.getElementById('servicesSeeMoreBtn');
  if (!seeMoreBtn) return;
  servicesSeeMoreInitialized = true;

  seeMoreBtn.addEventListener('click', () => {
    servicesVisibleCount += SERVICES_PAGE_SIZE;
    renderServicesCards(true);
  });
}

/* =========================================================
   ACHIEVEMENTS SYSTEM (INITIAL 4 + SEE MORE + GOOGLE SHEET)
   ========================================================= */

const DEFAULT_ACHIEVEMENTS = [
  {
    icon: '🦷',
    title: 'CMC Dental Unit Merit',
    description: 'Secured national medical admission merit and currently studying Bachelor of Dental Surgery (BDS) at Chattogram Medical College.',
    tags: ['CMC', 'BDS Merit', 'Medical'],
    published: 'yes'
  },
  {
    icon: '📜',
    title: 'Double GPA 5.00 Excellence',
    description: 'Achieved GPA 5.00 in both SSC (Ramkrishnapur KKRK High School) and HSC Science (Ramkrishnapur College, Cumilla).',
    tags: ['GPA 5.00', 'HSC', 'SSC'],
    published: 'yes'
  },
  {
    icon: '🏆',
    title: 'Face of Caretutors',
    description: 'Applied and actively participated as an ambassador candidate for the national "Become a Face of Caretutors" initiative.',
    tags: ['Caretutors', 'Ambassador', 'Mentorship'],
    published: 'yes'
  },
  {
    icon: '📍',
    title: 'Google Maps Top Contributor',
    description: 'Consistent local guide contributor, submitting verified place edits and regional navigation data for institutions and landmarks.',
    tags: ['Google Maps', 'Local Guide', 'Community'],
    published: 'yes'
  },
  {
    icon: '🛒',
    title: 'Daraz Hub Operations',
    description: 'Successfully managed seller fulfillment, product handling, and drop-off logistics for Daraz e-commerce marketplace.',
    tags: ['Daraz', 'Operations', 'E-commerce'],
    published: 'yes'
  },
  {
    icon: '🌐',
    title: 'BTCL .bd Domain & Systems',
    description: 'Registered and configured .com.bd / .info.bd institutional domains via BTCL, setting up complete DNS and hosting infrastructure.',
    tags: ['BTCL', 'DNS', 'Web Hosting'],
    published: 'yes'
  }
];

let allAchievements = [...DEFAULT_ACHIEVEMENTS];
const ACHIEVEMENTS_PAGE_SIZE = 4;
let achievementsVisibleCount = 4;
let achievementsSeeMoreInitialized = false;

async function loadAchievementsContent() {
  const grid = document.getElementById('achievementsGrid');
  if (!grid) return;

  const MASTER_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbz16uxYP0BOLHZi3ymkFZJfrpIUZdK3dhADmD-ABvBwpm-wUeYNcxRm5iOLpVdyz0yp/exec?sheet=Achievements";
  const GVIZ_ACHIEVEMENTS_URL =
    "https://docs.google.com/spreadsheets/d/1LtXbQRHeCscgqb79T8pnLCb5GdZwz8TeH_AX-PIXpd0/gviz/tq?tqx=out:json&sheet=Achievements";

  let loaded = [];

  try {
    const res = await fetch(MASTER_SCRIPT_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(item => {
          const title = item.Title || item.title || item.Achievement || item.name;
          if (!title) return;
          const pub = String(item.Published || item.published || item.Active || item.active || item.Status || item.status || 'yes').trim().toLowerCase();
          if (pub === 'no' || pub === 'off' || pub === 'false' || pub === '0' || pub === 'hide') return;

          const rawTags = item.Tags || item.tags || '';
          const tags = Array.isArray(rawTags)
            ? rawTags
            : String(rawTags).split(',').map(t => t.trim()).filter(Boolean);

          loaded.push({
            icon: item.Icon || item.icon || '🏆',
            title: title,
            description: item.Description || item.description || item.Summary || '',
            tags: tags.length ? tags : ['Achievement'],
            published: pub
          });
        });
      }
    }
  } catch (err) {
    // fallback
  }

  if (loaded.length === 0) {
    try {
      const gRes = await fetch(GVIZ_ACHIEVEMENTS_URL, { cache: 'no-store' });
      if (gRes.ok) {
        const rawText = await gRes.text();
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const data = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
          const cols = data.table?.cols || [];
          const rows = data.table?.rows || [];

          let iconCol = -1, titleCol = -1, descCol = -1, tagsCol = -1, pubCol = -1;
          cols.forEach((col, idx) => {
            const lbl = String(col.label || col.id || '').trim().toLowerCase();
            if (lbl.includes('icon')) iconCol = idx;
            if (lbl.includes('title') || lbl.includes('name') || lbl.includes('achievement')) titleCol = idx;
            if (lbl.includes('desc') || lbl.includes('detail')) descCol = idx;
            if (lbl.includes('tag')) tagsCol = idx;
            if (lbl.includes('publish') || lbl.includes('active') || lbl.includes('status')) pubCol = idx;
          });

          for (let i = 0; i < rows.length; i++) {
            const cells = rows[i]?.c || [];
            const titleVal = String(cells[titleCol]?.v || '').trim();
            if (!titleVal || titleVal.toLowerCase() === 'title') continue;

            const pubVal = pubCol >= 0 ? String(cells[pubCol]?.v || '').trim().toLowerCase() : 'yes';
            if (pubVal === 'no' || pubVal === 'off' || pubVal === 'false' || pubVal === '0') continue;

            const iconVal = iconCol >= 0 ? (String(cells[iconCol]?.v || '').trim() || '🏆') : '🏆';
            const descVal = descCol >= 0 ? String(cells[descCol]?.v || '').trim() : '';
            const rawTags = tagsCol >= 0 ? String(cells[tagsCol]?.v || '').trim() : '';
            const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : ['Achievement'];

            loaded.push({
              icon: iconVal,
              title: titleVal,
              description: descVal,
              tags: tags,
              published: pubVal
            });
          }
        }
      }
    } catch (e) {
      // fallback
    }
  }

  if (loaded.length > 0) {
    allAchievements = loaded;
  }

  achievementsVisibleCount = ACHIEVEMENTS_PAGE_SIZE;
  initAchievementsSeeMore();
  renderAchievementsCards();
}

function renderAchievementsCards(append = false) {
  const grid = document.getElementById('achievementsGrid');
  const seeMoreWrap = document.getElementById('achievementsSeeMoreWrap');
  const seeMoreBtn = document.getElementById('achievementsSeeMoreBtn');
  if (!grid) return;

  const visible = allAchievements.slice(0, achievementsVisibleCount);

  if (!append) {
    grid.innerHTML = visible.map(item => createAchievementCardHtml(item)).join('');
  } else {
    const startIndex = achievementsVisibleCount - ACHIEVEMENTS_PAGE_SIZE;
    const newItems = allAchievements.slice(startIndex, achievementsVisibleCount);
    grid.insertAdjacentHTML('beforeend', newItems.map(item => createAchievementCardHtml(item)).join(''));
  }

  if (seeMoreWrap) {
    if (achievementsVisibleCount < allAchievements.length) {
      seeMoreWrap.style.display = 'flex';
      const remaining = allAchievements.length - achievementsVisibleCount;
      if (seeMoreBtn) {
        seeMoreBtn.innerHTML = `See More Achievements (${remaining} remaining) ↓`;
      }
    } else {
      seeMoreWrap.style.display = 'none';
    }
  }
}

function createAchievementCardHtml(item) {
  const isImage = item.icon.startsWith('http') || item.icon.startsWith('//') || item.icon.startsWith('data:');
  const iconMarkup = isImage
    ? `<img src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.title)}" style="width:36px;height:36px;object-fit:contain;" />`
    : escapeHtml(item.icon);

  const tagsMarkup = (item.tags || [])
    .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('');

  return `
    <article class="card">
      <div class="card-header">
        <div class="card-icon">${iconMarkup}</div>
        <h4>${escapeHtml(item.title)}</h4>
      </div>
      <p>${escapeHtml(item.description)}</p>
      ${tagsMarkup ? `<div class="tags">${tagsMarkup}</div>` : ''}
    </article>
  `;
}

function initAchievementsSeeMore() {
  if (achievementsSeeMoreInitialized) return;
  const seeMoreBtn = document.getElementById('achievementsSeeMoreBtn');
  if (!seeMoreBtn) return;
  achievementsSeeMoreInitialized = true;

  seeMoreBtn.addEventListener('click', () => {
    achievementsVisibleCount += ACHIEVEMENTS_PAGE_SIZE;
    renderAchievementsCards(true);
  });
}

/* =========================================================
   PROJECTS SYSTEM (PORTFOLIO, CATEGORIES, MODAL & GOOGLE SHEET)
   ========================================================= */

const DEFAULT_PROJECTS = [
  {
    icon: '🛒',
    title: 'E-commerce Operations',
    category: 'E-commerce',
    description: 'Managed seller operations, product listings, and drop-off hub arrangements for Daraz.',
    details: 'Streamlined fulfillment processes, product quality checks, inventory handling, and daily courier handovers at regional Daraz drop-off stations.',
    tags: ['E-commerce', 'Daraz', 'Management'],
    link: '#contact',
    published: 'yes'
  },
  {
    icon: '📱',
    title: 'Android App Development',
    category: 'Technology',
    description: 'Generated and tested a demo Android application build using the Swing2App platform.',
    details: 'Customized web-to-app conversion workflows, push notification triggers, responsive UI webview optimization, and APK signing.',
    tags: ['Android', 'Swing2App', 'App Dev'],
    link: '#projects',
    published: 'yes'
  },
  {
    icon: '🌐',
    title: 'Domain & Hosting Management',
    category: 'Technology',
    description: 'Successfully registered and managed .com.bd and .info.bd domains, along with DNS setup via BTCL.',
    details: 'Configured NS records, A/CNAME mappings, SSL certificate installations, and custom email routing for institutional web presences.',
    tags: ['BTCL', 'DNS', 'Web Hosting'],
    link: '#services',
    published: 'yes'
  },
  {
    icon: '🎓',
    title: 'Tutoring & Mentorship',
    category: 'Education',
    description: 'Conducted active tutoring through Caretutors and participated as a candidate for the "Face of Caretutors" initiative.',
    details: 'Guided secondary and higher secondary science students in Biology, Chemistry, and ICT with personalized study plans and assessment tracking.',
    tags: ['Education', 'Caretutors', 'Mentorship'],
    link: '#services',
    published: 'yes'
  },
  {
    icon: '🗺️',
    title: 'Google Maps Local Guide',
    category: 'Community',
    description: 'Actively submitted map edits and updates for local institutions and landmarks to improve regional navigation.',
    details: 'Level-contributor verified place details, operating hours, road corrections, and photo contributions across Chattogram and Cumilla regions.',
    tags: ['Google Maps', 'Local Guide'],
    link: 'https://maps.app.goo.gl/HGjXCdkwxR2FPkSF9',
    published: 'yes'
  },
  {
    icon: '📚',
    title: 'Medical / Dental Notes',
    category: 'Medical',
    description: 'A growing collection of study notes and educational material organized for quick personal reference.',
    details: 'Curated clinical summaries, anatomy illustrations, pharmacology charts, and dental surgical procedures prepared during CMC BDS coursework.',
    tags: ['Dental', 'Research', 'Medical'],
    link: '#blog',
    published: 'yes'
  }
];

let allProjects = [...DEFAULT_PROJECTS];
let currentProjectsCategory = 'All';
const PROJECTS_PAGE_SIZE = 6;
let projectsVisibleCount = 6;
let projectsSeeMoreInitialized = false;
let projectModalInitialized = false;

async function loadProjectsContent() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const MASTER_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbz16uxYP0BOLHZi3ymkFZJfrpIUZdK3dhADmD-ABvBwpm-wUeYNcxRm5iOLpVdyz0yp/exec?sheet=Projects";
  const GVIZ_PROJECTS_URL =
    "https://docs.google.com/spreadsheets/d/1LtXbQRHeCscgqb79T8pnLCb5GdZwz8TeH_AX-PIXpd0/gviz/tq?tqx=out:json&sheet=Projects";

  let loaded = [];

  // 1. Try reading from Master Web App (JSON)
  try {
    const res = await fetch(MASTER_SCRIPT_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(item => {
          const title = item.Title || item.title || item.Project || item.name;
          if (!title) return;
          const pub = String(item.Published || item.published || item.Active || item.active || item.Status || item.status || 'yes').trim().toLowerCase();
          if (pub === 'no' || pub === 'off' || pub === 'false' || pub === '0' || pub === 'hide' || pub === 'inactive') return;

          const rawTags = item.Tags || item.tags || item.TechStack || item.Stack || '';
          const tags = Array.isArray(rawTags)
            ? rawTags
            : String(rawTags).split(',').map(t => t.trim()).filter(Boolean);

          loaded.push({
            icon: item.Icon || item.icon || '🚀',
            title: title,
            category: item.Category || item.category || 'Portfolio',
            description: item.Description || item.description || item.Summary || '',
            details: item.Details || item.details || item.LongDescription || item.Description || '',
            image: item.Image || item.image || '',
            tags: tags.length ? tags : ['Project'],
            link: item.Link || item.link || item.Url || item.url || '',
            published: pub
          });
        });
      }
    }
  } catch (err) {
    // fallback
  }

  // 2. Fallback to GViz
  if (loaded.length === 0) {
    try {
      const gRes = await fetch(GVIZ_PROJECTS_URL, { cache: 'no-store' });
      if (gRes.ok) {
        const rawText = await gRes.text();
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const data = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
          const cols = data.table?.cols || [];
          const rows = data.table?.rows || [];

          let iconCol = -1, titleCol = -1, catCol = -1, descCol = -1, detailsCol = -1, tagsCol = -1, linkCol = -1, pubCol = -1, imgCol = -1;
          cols.forEach((col, idx) => {
            const lbl = String(col.label || col.id || '').trim().toLowerCase();
            if (lbl.includes('icon')) iconCol = idx;
            if (lbl.includes('title') || lbl.includes('project') || lbl.includes('name')) titleCol = idx;
            if (lbl.includes('cat') || lbl.includes('type')) catCol = idx;
            if (lbl.includes('desc') || lbl.includes('summary')) descCol = idx;
            if (lbl.includes('detail') || lbl.includes('long') || lbl.includes('impact')) detailsCol = idx;
            if (lbl.includes('tag') || lbl.includes('stack')) tagsCol = idx;
            if (lbl.includes('link') || lbl.includes('url')) linkCol = idx;
            if (lbl.includes('image') || lbl.includes('img') || lbl.includes('photo')) imgCol = idx;
            if (lbl.includes('publish') || lbl.includes('active') || lbl.includes('status')) pubCol = idx;
          });

          for (let i = 0; i < rows.length; i++) {
            const cells = rows[i]?.c || [];
            const titleVal = String(cells[titleCol]?.v || '').trim();
            if (!titleVal || titleVal.toLowerCase() === 'title') continue;

            const pubVal = pubCol >= 0 ? String(cells[pubCol]?.v || '').trim().toLowerCase() : 'yes';
            if (pubVal === 'no' || pubVal === 'off' || pubVal === 'false' || pubVal === '0') continue;

            const iconVal = iconCol >= 0 ? (String(cells[iconCol]?.v || '').trim() || '🚀') : '🚀';
            const catVal = catCol >= 0 ? (String(cells[catCol]?.v || '').trim() || 'Portfolio') : 'Portfolio';
            const descVal = descCol >= 0 ? String(cells[descCol]?.v || '').trim() : '';
            const detailsVal = detailsCol >= 0 ? String(cells[detailsCol]?.v || '').trim() : descVal;
            const imgVal = imgCol >= 0 ? String(cells[imgCol]?.v || '').trim() : '';
            const linkVal = linkCol >= 0 ? String(cells[linkCol]?.v || '').trim() : '';
            const rawTags = tagsCol >= 0 ? String(cells[tagsCol]?.v || '').trim() : '';
            const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : ['Project'];

            loaded.push({
              icon: iconVal,
              title: titleVal,
              category: catVal,
              description: descVal,
              details: detailsVal,
              image: imgVal,
              tags: tags,
              link: linkVal,
              published: pubVal
            });
          }
        }
      }
    } catch (e) {
      // fallback
    }
  }

  if (loaded.length > 0) {
    allProjects = loaded;
  }

  renderProjectsFilterTabs();
  projectsVisibleCount = PROJECTS_PAGE_SIZE;
  initProjectsSeeMore();
  renderProjectsCards();
  initProjectModal();
}

function renderProjectsFilterTabs() {
  const filterWrap = document.getElementById('projectsFilterWrap');
  if (!filterWrap) return;

  const rawCategories = allProjects.map(p => p.category).filter(Boolean);
  const uniqueCats = ['All', ...new Set(rawCategories)];

  if (uniqueCats.length <= 2) {
    filterWrap.style.display = 'none';
    return;
  }

  filterWrap.style.display = 'flex';
  filterWrap.innerHTML = uniqueCats.map(cat => {
    const count = cat === 'All' ? allProjects.length : allProjects.filter(p => p.category === cat).length;
    const isActive = cat === currentProjectsCategory;
    return `
      <button type="button" class="projects-filter-btn ${isActive ? 'active' : ''}" data-category="${escapeHtml(cat)}">
        ${escapeHtml(cat)} <span class="projects-filter-count">${count}</span>
      </button>
    `;
  }).join('');

  filterWrap.querySelectorAll('.projects-filter-btn').forEach(btn => {
    btn.onclick = () => {
      currentProjectsCategory = btn.dataset.category || 'All';
      projectsVisibleCount = PROJECTS_PAGE_SIZE;
      renderProjectsFilterTabs();
      renderProjectsCards(false);
    };
  });
}

function getFilteredProjects() {
  if (currentProjectsCategory === 'All') return allProjects;
  return allProjects.filter(p => p.category === currentProjectsCategory);
}

function renderProjectsCards(append = false) {
  const grid = document.getElementById('projectsGrid');
  const seeMoreWrap = document.getElementById('projectsSeeMoreWrap');
  const seeMoreBtn = document.getElementById('projectsSeeMoreBtn');
  if (!grid) return;

  const filtered = getFilteredProjects();
  const visible = filtered.slice(0, projectsVisibleCount);

  if (!append) {
    grid.innerHTML = visible.map((item, idx) => createProjectCardHtml(item, idx)).join('');
  } else {
    const startIndex = projectsVisibleCount - PROJECTS_PAGE_SIZE;
    const newItems = filtered.slice(startIndex, projectsVisibleCount);
    grid.insertAdjacentHTML('beforeend', newItems.map((item, idx) => createProjectCardHtml(item, startIndex + idx)).join(''));
  }

  attachProjectCardEvents();

  if (seeMoreWrap) {
    if (projectsVisibleCount < filtered.length) {
      seeMoreWrap.style.display = 'flex';
      const remaining = filtered.length - projectsVisibleCount;
      if (seeMoreBtn) {
        seeMoreBtn.innerHTML = `See More Projects (${remaining} remaining) ↓`;
      }
    } else {
      seeMoreWrap.style.display = 'none';
    }
  }
}

function createProjectCardHtml(item, index) {
  const isImage = item.icon.startsWith('http') || item.icon.startsWith('//') || item.icon.startsWith('data:');
  const iconMarkup = isImage
    ? `<img src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.title)}" style="width:36px;height:36px;object-fit:contain;" />`
    : escapeHtml(item.icon);

  const tagsMarkup = (item.tags || [])
    .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('');

  return `
    <article class="card project-card" data-project-index="${index}">
      <div>
        <div class="card-header">
          <div class="card-icon">${iconMarkup}</div>
          <h4>${escapeHtml(item.title)}</h4>
        </div>
        <p>${escapeHtml(item.description)}</p>
        ${tagsMarkup ? `<div class="tags" style="margin-top:12px;">${tagsMarkup}</div>` : ''}
      </div>
      <div class="project-card-footer">
        <button type="button" class="project-view-details-btn" data-project-index="${index}">
          View details →
        </button>
        ${item.link ? `<a href="${escapeHtml(item.link)}" target="${item.link.startsWith('#') ? '_self' : '_blank'}" rel="noopener" class="read-more" style="font-size:0.82rem;margin:0;" onclick="event.stopPropagation();">Visit ↗</a>` : ''}
      </div>
    </article>
  `;
}

function attachProjectCardEvents() {
  document.querySelectorAll('.project-card, .project-view-details-btn').forEach(el => {
    if (el.dataset.hasProjectListener) return;
    el.dataset.hasProjectListener = 'true';

    el.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'a') return;
      const index = parseInt(el.dataset.projectIndex, 10);
      const filtered = getFilteredProjects();
      const project = filtered[index];
      if (project) {
        openProjectModal(project);
      }
    });
  });
}

function initProjectsSeeMore() {
  if (projectsSeeMoreInitialized) return;
  const seeMoreBtn = document.getElementById('projectsSeeMoreBtn');
  if (!seeMoreBtn) return;
  projectsSeeMoreInitialized = true;

  seeMoreBtn.addEventListener('click', () => {
    projectsVisibleCount += PROJECTS_PAGE_SIZE;
    renderProjectsCards(true);
  });
}

function initProjectModal() {
  if (projectModalInitialized) return;
  const modal = document.getElementById('projectModal');
  if (!modal) return;
  projectModalInitialized = true;

  const overlay = document.getElementById('projectModalOverlay');
  const closeBtn = document.getElementById('projectModalClose');
  const closeActionBtn = document.getElementById('projectModalCloseBtn');

  function closeProjectModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (overlay) overlay.onclick = closeProjectModal;
  if (closeBtn) closeBtn.onclick = closeProjectModal;
  if (closeActionBtn) closeActionBtn.onclick = closeProjectModal;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeProjectModal();
    }
  });
}

function openProjectModal(project) {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const iconEl = document.getElementById('projectModalIcon');
  const catEl = document.getElementById('projectModalCategory');
  const titleEl = document.getElementById('projectModalTitle');
  const descEl = document.getElementById('projectModalDescription');
  const detailsWrap = document.getElementById('projectModalDetailsWrap');
  const detailsEl = document.getElementById('projectModalDetails');
  const imageWrap = document.getElementById('projectModalImageWrap');
  const imageEl = document.getElementById('projectModalImage');
  const tagsEl = document.getElementById('projectModalTags');
  const linkBtn = document.getElementById('projectModalLink');

  if (iconEl) {
    const isImage = project.icon.startsWith('http') || project.icon.startsWith('//') || project.icon.startsWith('data:');
    iconEl.innerHTML = isImage
      ? `<img src="${escapeHtml(project.icon)}" alt="${escapeHtml(project.title)}" style="width:36px;height:36px;object-fit:contain;" />`
      : escapeHtml(project.icon);
  }
  if (catEl) catEl.textContent = project.category || 'Portfolio';
  if (titleEl) titleEl.textContent = project.title || 'Project';
  if (descEl) descEl.textContent = project.description || '';

  if (detailsEl && detailsWrap) {
    if (project.details && project.details !== project.description) {
      detailsEl.textContent = project.details;
      detailsWrap.style.display = 'block';
    } else {
      detailsWrap.style.display = 'none';
    }
  }

  if (imageWrap && imageEl) {
    if (project.image) {
      imageEl.src = project.image;
      imageWrap.style.display = 'block';
    } else {
      imageWrap.style.display = 'none';
    }
  }

  if (tagsEl) {
    tagsEl.innerHTML = (project.tags || [])
      .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
      .join('');
  }

  if (linkBtn) {
    if (project.link) {
      linkBtn.href = project.link;
      linkBtn.style.display = 'inline-flex';
      linkBtn.target = project.link.startsWith('#') ? '_self' : '_blank';
    } else {
      linkBtn.style.display = 'none';
    }
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function attachServiceRequestEvents() {
  document.querySelectorAll('.service-request-btn').forEach(btn => {
    if (btn.dataset.hasListener) return;
    btn.dataset.hasListener = 'true';

    btn.addEventListener('click', () => {
      const serviceTitle = btn.dataset.serviceTitle || 'Service';
      const servicePrice = btn.dataset.servicePrice || getDefaultPriceForService(serviceTitle);
      openServiceBookingModal(serviceTitle, servicePrice);
    });
  });
}

function openServiceBookingModal(serviceTitle, servicePrice) {
  const modal = document.getElementById('serviceModal');
  const titleDisplay = document.getElementById('serviceModalSelectedTitle');
  const summaryTitle = document.getElementById('summaryServiceTitle');
  const summaryPrice = document.getElementById('summaryServicePrice');
  const step1 = document.getElementById('serviceStep1');
  const step2 = document.getElementById('serviceStep2');
  const stepSuccess = document.getElementById('serviceStepSuccess');
  const statusBox = document.getElementById('serviceSubmitStatus');

  if (!modal) return;
  currentSelectedService = serviceTitle;
  currentSelectedServicePrice = servicePrice || getDefaultPriceForService(serviceTitle);

  if (titleDisplay) {
    titleDisplay.innerHTML = `📌 <strong>${escapeHtml(serviceTitle)}</strong> <span class="service-modal-price-pill">Fee: ${escapeHtml(currentSelectedServicePrice)}</span>`;
  }
  if (summaryTitle) {
    summaryTitle.textContent = serviceTitle;
  }
  if (summaryPrice) {
    summaryPrice.textContent = currentSelectedServicePrice;
  }

  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';
  if (stepSuccess) stepSuccess.style.display = 'none';
  if (statusBox) statusBox.style.display = 'none';

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    document.getElementById('serviceName')?.focus();
  }, 100);
}

let serviceModalInitialized = false;
function initServiceModal() {
  if (serviceModalInitialized) return;
  const modal = document.getElementById('serviceModal');
  if (!modal) return;
  serviceModalInitialized = true;

  const overlay = document.getElementById('serviceModalOverlay');
  const closeBtn = document.getElementById('serviceModalClose');
  const step1 = document.getElementById('serviceStep1');
  const step2 = document.getElementById('serviceStep2');
  const stepSuccess = document.getElementById('serviceStepSuccess');

  const goToPaymentBtn = document.getElementById('serviceGoToPaymentBtn');
  const backToStep1Btn = document.getElementById('serviceBackToStep1Btn');
  const copyNumberBtn = document.getElementById('copyNumberBtn');
  const finalSubmitBtn = document.getElementById('serviceFinalSubmitBtn');
  const doneBtn = document.getElementById('serviceSuccessDoneBtn');

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (overlay) overlay.onclick = closeModal;
  if (closeBtn) closeBtn.onclick = closeModal;
  if (doneBtn) doneBtn.onclick = closeModal;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Step 1 to Step 2
  if (goToPaymentBtn) {
    goToPaymentBtn.onclick = (e) => {
      e.preventDefault();
      const name = document.getElementById('serviceName')?.value.trim();
      const mobile = document.getElementById('serviceMobile')?.value.trim();
      const location = document.getElementById('serviceLocation')?.value.trim();

      if (!name) {
        alert('Please enter your full name.');
        document.getElementById('serviceName')?.focus();
        return;
      }
      if (!mobile) {
        alert('Please enter your mobile / phone number.');
        document.getElementById('serviceMobile')?.focus();
        return;
      }
      if (!location) {
        alert('Please enter your address / location.');
        document.getElementById('serviceLocation')?.focus();
        return;
      }

      step1.style.display = 'none';
      step2.style.display = 'block';
      stepSuccess.style.display = 'none';

      const summaryTitle = document.getElementById('summaryServiceTitle');
      const summaryPrice = document.getElementById('summaryServicePrice');
      if (summaryTitle) summaryTitle.textContent = currentSelectedService;
      if (summaryPrice) summaryPrice.textContent = currentSelectedServicePrice;

      updateGatewayDisplay();
    };
  }

  // Back to Step 1
  if (backToStep1Btn) {
    backToStep1Btn.onclick = () => {
      step2.style.display = 'none';
      step1.style.display = 'block';
    };
  }

  // Gateway Selection
  const gatewayButtons = modal.querySelectorAll('.gateway-card');
  gatewayButtons.forEach(btn => {
    btn.onclick = () => {
      gatewayButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSelectedGateway = btn.dataset.gateway || 'bKash';
      updateGatewayDisplay();
    };
  });

  function updateGatewayDisplay() {
    const label = document.getElementById('gatewaySelectedLabel');
    const desc = document.getElementById('gatewayInstructions');
    const descName = document.getElementById('gatewayNameInDesc');
    const gwName = currentSelectedGateway || 'bKash';

    if (label) label.textContent = `${gwName} Personal Number:`;
    if (descName) descName.textContent = gwName;
    if (desc) {
      desc.innerHTML = `Send Money <span class="instruct-price">${escapeHtml(currentSelectedServicePrice)}</span> to the personal number <strong>${PERSONAL_NUMBER}</strong> from your <strong>${gwName}</strong> account. After sending, enter your sender mobile number below.`;
    }
  }

  // Copy Number Button
  if (copyNumberBtn) {
    copyNumberBtn.onclick = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(PERSONAL_NUMBER).then(() => {
          showCopySuccess();
        }).catch(() => {
          fallbackCopy();
        });
      } else {
        fallbackCopy();
      }
    };
  }

  function showCopySuccess() {
    copyNumberBtn.classList.add('copied');
    const textSpan = document.getElementById('copyBtnText');
    if (textSpan) textSpan.textContent = '✓ Copied!';
    setTimeout(() => {
      copyNumberBtn.classList.remove('copied');
      if (textSpan) textSpan.textContent = 'Copy Number';
    }, 2200);
  }

  function fallbackCopy() {
    const tempInput = document.createElement('input');
    tempInput.value = PERSONAL_NUMBER;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showCopySuccess();
    } catch {
      prompt('Copy personal number:', PERSONAL_NUMBER);
    }
    document.body.removeChild(tempInput);
  }

  // Step 2 Final Submit: Saves to Bookings tab and Server Backend
  if (finalSubmitBtn) {
    finalSubmitBtn.onclick = async (e) => {
      e.preventDefault();
      const name = document.getElementById('serviceName')?.value.trim();
      const mobile = document.getElementById('serviceMobile')?.value.trim();
      const location = document.getElementById('serviceLocation')?.value.trim();
      const notes = document.getElementById('serviceNotes')?.value.trim();
      const paymentNumber = document.getElementById('servicePaymentNumber')?.value.trim();
      const trxId = document.getElementById('servicePaymentTrx')?.value.trim();
      const statusBox = document.getElementById('serviceSubmitStatus');

      if (!paymentNumber) {
        alert('Please enter the sender mobile number you paid from.');
        document.getElementById('servicePaymentNumber')?.focus();
        return;
      }

      finalSubmitBtn.disabled = true;
      finalSubmitBtn.textContent = 'Confirming...';
      if (statusBox) statusBox.style.display = 'none';

      const GOOGLE_SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbz16uxYP0BOLHZi3ymkFZJfrpIUZdK3dhADmD-ABvBwpm-wUeYNcxRm5iOLpVdyz0yp/exec";

      const payload = {
        action: "booking",
        sheet: "Bookings",
        sheetName: "Bookings",
        tab: "Bookings",
        spreadsheetId: "1LtXbQRHeCscgqb79T8pnLCb5GdZwz8TeH_AX-PIXpd0",
        Name: name,
        Mobile: mobile,
        Location: location,
        "Services Title": currentSelectedService || "General Service",
        "Amount (BDT)": currentSelectedServicePrice,
        Price: currentSelectedServicePrice,
        "Payment Gateway": currentSelectedGateway,
        "Payment Number": paymentNumber,
        TrxID: trxId || "N/A",
        Notes: notes || "",
        Timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
        name: name,
        mobile: mobile,
        location: location,
        service_title: currentSelectedService || "General Service",
        service_price: currentSelectedServicePrice,
        payment_gateway: currentSelectedGateway,
        payment_number: paymentNumber,
        trx_id: trxId || "",
        subject: `New Service Booking: ${currentSelectedService} (${currentSelectedServicePrice}) - ${name}`,
        message: `Service Title: ${currentSelectedService}\nAmount / Fee: ${currentSelectedServicePrice}\nClient Name: ${name}\nMobile: ${mobile}\nLocation: ${location}\nPayment Gateway: ${currentSelectedGateway}\nPayment Number: ${paymentNumber}\nTrxID: ${trxId || 'N/A'}\nNotes: ${notes || 'N/A'}`
      };

      try {
        // 1. Submit directly to Google Apps Script / Google Sheets (SINGLE SUBMISSION)
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('Google Script fetch status note:', err));

        // 2. Also record in local Express backend for guaranteed data preservation (will not re-forward to Google Script)
        await fetch('/api/book-service', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('Local backup booking note:', err));

        // Show Success Step
        step1.style.display = 'none';
        step2.style.display = 'none';
        stepSuccess.style.display = 'block';

        const successMsg = document.getElementById('serviceSuccessMsg');
        if (successMsg) {
          successMsg.innerHTML = `Thank you <strong>${escapeHtml(name)}</strong>! Your request for "<strong>${escapeHtml(currentSelectedService)}</strong>" (Fee: <strong>${escapeHtml(currentSelectedServicePrice)}</strong>) and payment details (<strong>${escapeHtml(currentSelectedGateway)}: ${escapeHtml(paymentNumber)}</strong>) have been successfully saved to our Google Sheet. We will reach out to you shortly.`;
        }

        // Reset forms
        document.getElementById('serviceClientForm')?.reset();
        document.getElementById('servicePaymentForm')?.reset();
      } catch (error) {
        console.error('Service booking submission error:', error);
        if (statusBox) {
          statusBox.style.display = 'block';
          statusBox.style.background = '#fef2f2';
          statusBox.style.color = '#dc2626';
          statusBox.textContent = 'Sorry, something went wrong. Please try again.';
        }
      } finally {
        finalSubmitBtn.disabled = false;
        finalSubmitBtn.textContent = 'Confirm';
      }
    };
  }
}

/* =========================================================
   BACKGROUND MUSIC SYSTEM (NO VISIBLE CONTROLS)
   ========================================================= */

function initBackgroundAudio() {
  const audio = document.getElementById('bgMusic') || new Audio('audio/background.mp3');
  audio.loop = true;
  audio.volume = 0.45;

  let started = false;

  const tryPlay = () => {
    if (started) return;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          started = true;
          ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt => {
            window.removeEventListener(evt, tryPlay);
            document.removeEventListener(evt, tryPlay);
          });
        })
        .catch(() => {
          // Waiting for first user gesture per browser autoplay policies
        });
    }
  };

  // Immediate attempt
  tryPlay();

  // Play upon first user interaction if autoplay was constrained
  ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt => {
    window.addEventListener(evt, tryPlay, { passive: true });
    document.addEventListener(evt, tryPlay, { passive: true });
  });
}



/* =========================================================
   START WEBSITE
   ========================================================= */

window.addEventListener(
  'DOMContentLoaded',
  async()=>{

    try{

      initBackgroundAudio();

      await loadSections();

      await initSite();

    }catch(error){

      console.error(
        'Site initialization failed:',
        error
      );

    }

  }
);
