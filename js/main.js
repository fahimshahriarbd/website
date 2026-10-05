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
      "https://script.google.com/macros/s/AKfycbztBbwboWpdr3xxAxlgau8aEB216GJ9cyQcFm1OOrxvjjXiXR5otElvwx3AyvZWnkgt3Q/exec";

    contactForm.addEventListener("submit",async function(e){

      e.preventDefault();

      submitBtn.disabled=true;
      submitBtn.textContent="Sending...";
      formStatus.style.display="none";

      const data={
        name:document.getElementById("name").value.trim(),
        email:document.getElementById("email").value.trim(),
        subject:document.getElementById("subject").value.trim(),
        message:document.getElementById("message").value.trim()
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


  /* LOAD GOOGLE SHEET CONTENT (BLOG, GALLERY & SERVICES) */

  await Promise.allSettled([
    loadWebsiteContent(),
    loadGalleryContent(),
    loadServicesContent()
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
  { icon: '🎓', title: 'Tuition Media & Mentorship', description: 'Education-focused digital promotion, tutoring experience, and mentoring.' },
  { icon: '💻', title: 'Web Development & IT', description: 'Basic website setup, static pages, DNS mapping, and BTCL domain guidance.' },
  { icon: '🛒', title: 'E-commerce Management', description: 'Guidance on seller operations and logistics management based on Daraz experience.' },
  { icon: '🎬', title: 'Creative Content', description: 'Ideas and support for digital content, visuals and online projects.' },
  { icon: '🦷', title: 'Oral Health & Dental Consultation', description: 'Basic dental advice, oral hygiene tips, and clinical health guidance.' },
  { icon: '📊', title: 'Digital Skills & Academic Support', description: 'Help with presentation slides, software tools, student projects, and career guidance.' }
];

let allServices = [...DEFAULT_SERVICES];
const SERVICES_PAGE_SIZE = 5;
let servicesVisibleCount = 5;
let servicesSeeMoreInitialized = false;

let currentSelectedService = '';
let currentSelectedGateway = 'bKash';
const PERSONAL_NUMBER = '01316831199';

async function loadServicesContent() {
  const SERVICES_API_URL =
    "https://docs.google.com/spreadsheets/d/1FPDlW0ugDgBLds5AD86sTo-Arw0r9T4cJZ8b4Vl5s5w/gviz/tq?tqx=out:json&sheet=Services";

  const servicesGrid = document.getElementById('servicesGrid');
  if (!servicesGrid) return;

  try {
    const response = await fetch(SERVICES_API_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Google Sheet Services returned HTTP ${response.status}`);
    }

    const rawText = await response.text();
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Invalid JSON from Services sheet');
    }

    const data = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
    const cols = data.table?.cols || [];
    const rows = data.table?.rows || [];

    let iconColIdx = -1;
    let titleColIdx = -1;
    let descColIdx = -1;
    let headerRowIdx = -1;

    // Check cols labels
    cols.forEach((col, idx) => {
      const lbl = String(col.label || col.id || '').trim().toLowerCase();
      if (lbl.includes('icon')) iconColIdx = idx;
      if (lbl.includes('title') || lbl.includes('service') || lbl.includes('name')) titleColIdx = idx;
      if (lbl.includes('desc') || lbl.includes('detail')) descColIdx = idx;
    });

    // If headers in row 0
    if ((titleColIdx === -1 || descColIdx === -1) && rows.length > 0) {
      const firstRowCells = rows[0]?.c || [];
      firstRowCells.forEach((cell, idx) => {
        const val = String(cell?.v || '').trim().toLowerCase();
        if (val.includes('icon')) { iconColIdx = idx; headerRowIdx = 0; }
        if (val.includes('title') || val.includes('service') || val.includes('name')) { titleColIdx = idx; headerRowIdx = 0; }
        if (val.includes('desc') || val.includes('detail')) { descColIdx = idx; headerRowIdx = 0; }
      });
    }

    if (iconColIdx === -1) iconColIdx = 0;
    if (titleColIdx === -1) titleColIdx = 1;
    if (descColIdx === -1) descColIdx = 2;

    const parsedServices = [];
    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

    for (let i = startRow; i < rows.length; i++) {
      const cells = rows[i]?.c || [];
      const iconVal = String(cells[iconColIdx]?.v || '').trim() || '💼';
      const titleVal = String(cells[titleColIdx]?.v || '').trim();
      const descVal = String(cells[descColIdx]?.v || '').trim();

      // Ensure valid entry (not repeated header and has title)
      if (
        titleVal &&
        titleVal.toLowerCase() !== 'title' &&
        titleVal.toLowerCase() !== 'icon' &&
        titleVal.toLowerCase() !== 'description'
      ) {
        parsedServices.push({
          icon: iconVal,
          title: titleVal,
          description: descVal || 'Quality service tailored to your requirements.'
        });
      }
    }

    if (parsedServices.length > 0) {
      allServices = parsedServices;
    }
  } catch (error) {
    console.warn('Could not load services from Google Sheets, using defaults:', error);
  }

  servicesVisibleCount = SERVICES_PAGE_SIZE;
  initServicesSeeMore();
  renderServicesCards();
  initServiceModal();

  if (typeof window.updateSearchIndex === 'function') {
    window.updateSearchIndex();
  }
}

function renderServicesCards(append = false) {
  const servicesGrid = document.getElementById('servicesGrid');
  const seeMoreWrap = document.getElementById('servicesSeeMoreWrap');
  const seeMoreBtn = document.getElementById('servicesSeeMoreBtn');
  if (!servicesGrid) return;

  const visibleServices = allServices.slice(0, servicesVisibleCount);

  if (!append) {
    servicesGrid.innerHTML = visibleServices.map(service => createServiceCardHtml(service)).join('');
  } else {
    const startIndex = servicesVisibleCount - SERVICES_PAGE_SIZE;
    const newItems = allServices.slice(startIndex, servicesVisibleCount);
    const newHtml = newItems.map(service => createServiceCardHtml(service)).join('');
    servicesGrid.insertAdjacentHTML('beforeend', newHtml);
  }

  attachServiceRequestEvents();

  if (seeMoreWrap) {
    if (servicesVisibleCount < allServices.length) {
      seeMoreWrap.style.display = 'flex';
      const remaining = allServices.length - servicesVisibleCount;
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

  return `
    <article class="card service-card">
      <div class="service-card-body">
        <div class="card-header">
          <div class="card-icon">${iconMarkup}</div>
          <h4>${escapeHtml(service.title)}</h4>
        </div>
        <p>${escapeHtml(service.description)}</p>
      </div>
      <div class="service-action-wrap">
        <button type="button" class="service-request-btn" data-service-title="${escapeHtml(service.title)}">
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

function attachServiceRequestEvents() {
  document.querySelectorAll('.service-request-btn').forEach(btn => {
    if (btn.dataset.hasListener) return;
    btn.dataset.hasListener = 'true';

    btn.addEventListener('click', () => {
      const serviceTitle = btn.dataset.serviceTitle || 'Service';
      openServiceBookingModal(serviceTitle);
    });
  });
}

function openServiceBookingModal(serviceTitle) {
  const modal = document.getElementById('serviceModal');
  const titleDisplay = document.getElementById('serviceModalSelectedTitle');
  const step1 = document.getElementById('serviceStep1');
  const step2 = document.getElementById('serviceStep2');
  const stepSuccess = document.getElementById('serviceStepSuccess');
  const statusBox = document.getElementById('serviceSubmitStatus');

  if (!modal) return;
  currentSelectedService = serviceTitle;

  if (titleDisplay) {
    titleDisplay.textContent = `📌 ${serviceTitle}`;
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
        alert('অনুগ্রহ করে আপনার নাম লিখুন।');
        document.getElementById('serviceName')?.focus();
        return;
      }
      if (!mobile) {
        alert('অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন।');
        document.getElementById('serviceMobile')?.focus();
        return;
      }
      if (!location) {
        alert('অনুগ্রহ করে আপনার ঠিকানা / লোকেশন লিখুন।');
        document.getElementById('serviceLocation')?.focus();
        return;
      }

      step1.style.display = 'none';
      step2.style.display = 'block';
      stepSuccess.style.display = 'none';
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
    const gwName = currentSelectedGateway === 'bKash' ? 'বিকাশ' :
                   currentSelectedGateway === 'Nagad' ? 'নগদ' :
                   currentSelectedGateway === 'Upay' ? 'উপায়' : 'রকেট';

    if (label) label.textContent = `${gwName} (${currentSelectedGateway}) পার্সোনাল নাম্বার:`;
    if (descName) descName.textContent = gwName;
    if (desc) {
      desc.innerHTML = `আপনার <strong>${gwName}</strong> অ্যাকাউন্ট থেকে উপরের পার্সোনাল নম্বর <strong>${PERSONAL_NUMBER}</strong>-এ সেন্ড মানি (Send Money) করুন। টাকা পাঠানোর পর আপনি যে নম্বর থেকে টাকা পাঠিয়েছেন তা নিচের বক্সে লিখুন।`;
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
    if (textSpan) textSpan.textContent = '✓ কপি হয়েছে!';
    setTimeout(() => {
      copyNumberBtn.classList.remove('copied');
      if (textSpan) textSpan.textContent = 'নম্বর কপি করুন';
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
      prompt('নম্বরটি কপি করুন:', PERSONAL_NUMBER);
    }
    document.body.removeChild(tempInput);
  }

  // Step 2 Final Submit to Google Apps Script / Services Sheet
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
        alert('অনুগ্রহ করে আপনি যে নম্বর থেকে টাকা পাঠিয়েছেন সেই নম্বরটি লিখুন।');
        document.getElementById('servicePaymentNumber')?.focus();
        return;
      }

      finalSubmitBtn.disabled = true;
      finalSubmitBtn.textContent = 'সাবমিট হচ্ছে...';
      if (statusBox) statusBox.style.display = 'none';

      const GOOGLE_SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbztBbwboWpdr3xxAxlgau8aEB216GJ9cyQcFm1OOrxvjjXiXR5otElvwx3AyvZWnkgt3Q/exec";

      const payload = {
        sheet: "Services",
        targetSheet: "Services",
        Name: name,
        Mobile: mobile,
        Location: location,
        "Payment Gateway": currentSelectedGateway,
        "Payment Number": paymentNumber,
        "Services Title": currentSelectedService || "General Service",
        TrxID: trxId || "",
        Notes: notes || "",
        Timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
        name: name,
        mobile: mobile,
        location: location,
        payment_gateway: currentSelectedGateway,
        payment_number: paymentNumber,
        service_title: currentSelectedService || "General Service",
        subject: `New Service Booking: ${currentSelectedService} - ${name}`,
        message: `Service Title: ${currentSelectedService}\nName: ${name}\nMobile: ${mobile}\nLocation: ${location}\nPayment Gateway: ${currentSelectedGateway}\nPayment Number: ${paymentNumber}\nTrxID: ${trxId || 'N/A'}\nNotes: ${notes || 'N/A'}`
      };

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload)
        });

        // Show Success Step
        step1.style.display = 'none';
        step2.style.display = 'none';
        stepSuccess.style.display = 'block';

        const successMsg = document.getElementById('serviceSuccessMsg');
        if (successMsg) {
          successMsg.textContent = `ধন্যবাদ ${name}! "${currentSelectedService}" সেবার অনুরোধ এবং পেমেন্টের তথ্য (${currentSelectedGateway}: ${paymentNumber}) আমাদের গুগল শিটে সফলভাবে জমা হয়েছে। আমরা দ্রুত আপনার সাথে যোগাযোগ করব।`;
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
          statusBox.textContent = 'দুঃখিত, কোনো সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        }
      } finally {
        finalSubmitBtn.disabled = false;
        finalSubmitBtn.textContent = 'কনফার্ম ও সাবমিট করুন ✓';
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
