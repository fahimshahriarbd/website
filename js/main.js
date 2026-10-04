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
        section.querySelectorAll('.timeline-item, .academic-item').forEach(tl => {
          counter++;
          if (!tl.id) {
            tl.id = `journey-item-${counter}`;
          }
          const badge = tl.querySelector('.timeline-badge')?.textContent.trim() || '';
          const title = tl.querySelector('h4')?.textContent.trim() || '';
          const subtitle = tl.querySelector('h5')?.textContent.trim() || '';
          const text = tl.querySelector('p')?.textContent.trim() || '';

          if (title || text) {
            items.push({
              id: tl.id,
              title: title,
              text: (subtitle ? subtitle + ' · ' : '') + text,
              meta: 'Journey · ' + (badge || 'Academic Milestone'),
              tags: ['Education', 'Journey', 'Academic', 'BDS', 'Dentistry', 'HSC', 'SSC'],
              sectionId: 'journey'
            });
          }
        });
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


  /* LOAD GOOGLE SHEET BLOG */

  await loadWebsiteContent();
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

            obj[column]=
              cells[index] &&
              typeof cells[index].v!=='undefined'
                ? String(cells[index].v)
                : '';
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

          No published blog posts found in Google Sheets.

        </div>

      `;

      return;
    }


    /* Blog Card তৈরি */

    blogGrid.innerHTML=
      posts
      .map(post=>{

        const category=
          String(
            post.Category||
            'Blog'
          ).trim();


        const categoryKeyValue=
          categoryKey(category);


        const image=
          String(
            post.Image||''
          ).trim() ||

          'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1000&q=85';


        const title=
          String(
            post.Title||
            'Untitled'
          ).trim();


        const date=
          String(
            post.Date||
            'Today'
          ).trim();


        const readTime=
          String(
            post.ReadTime||
            '5'
          ).trim();


        const summary=
          String(
            post.Summary||
            post.Content||
            '...'
          ).trim();


        const link=
          String(
            post.Link||
            '#'
          ).trim();


        return `

          <article
            class="card blog-card"
            data-category="${escapeHtml(categoryKeyValue)}"
          >

            <img
              class="blog-cover"
              src="${escapeHtml(image)}"
              alt="${escapeHtml(title)}"
              loading="lazy"
            >


            <div class="blog-body">

              <div class="blog-meta">

                <span>
                  ${escapeHtml(category)}
                </span>

                <span>
                  ${escapeHtml(date)}
                  ·
                  ${escapeHtml(readTime)}
                  min
                </span>

              </div>


              <h4>
                ${escapeHtml(title)}
              </h4>


              <p>
                ${escapeHtml(summary)}
              </p>


              <a
                class="read-more"
                href="${escapeHtml(link)}"
              >
                Read article →
              </a>

            </div>

          </article>

        `;

      })
      .join('');


    /* Filter buttons */

    const filterButtons=
      document.querySelectorAll(
        '.filter-btn'
      );


    const applyFilter=filter=>{

      const selected=
        categoryKey(filter);


      blogGrid
        .querySelectorAll(
          '.blog-card'
        )
        .forEach(card=>{

          const category=
            categoryKey(
              card.dataset.category||''
            );


          card.style.display=
            (
              selected==='all' ||
              category===selected
            )
              ? 'block'
              : 'none';

        });
    };


    /* Button click */

    filterButtons.forEach(btn=>{

      btn.addEventListener(
        'click',
        ()=>{

          filterButtons.forEach(b=>{
            b.classList.remove(
              'active'
            );
          });


          btn.classList.add(
            'active'
          );


          applyFilter(
            btn.dataset.filter||
            'all'
          );

        }
      );

    });


    /* প্রথমে All দেখাবে */

    applyFilter(
      document.querySelector(
        '.filter-btn.active'
      )?.dataset.filter||
      'all'
    );

    if(typeof window.updateSearchIndex==='function'){
      window.updateSearchIndex();
    }

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
   START WEBSITE
   ========================================================= */

window.addEventListener(
  'DOMContentLoaded',
  async()=>{

    try{

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
