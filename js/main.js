async function loadSections(){
  const slots=[...document.querySelectorAll('[data-section]')];
  for(const slot of slots){
    const name=slot.dataset.section;
    try{
      const response=await fetch(`sections/${name}.html`,{cache:'no-store'});
      if(!response.ok) throw new Error(`Section not found: ${name}`);
      slot.outerHTML=await response.text();
    }catch(error){
      console.warn(`Skipping section: ${name}`,error);
      slot.innerHTML=`<div style="padding:40px;text-align:center;color:#999;">Section not available</div>`;
    }
  }
}

async function initSite(){
  const contactForm=document.getElementById("contactForm");
  const submitBtn=document.getElementById("submitBtn");
  const formStatus=document.getElementById("formStatus");

  if(contactForm && submitBtn && formStatus){
    const GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/AKfycbztBbwboWpdr3xxAxlgau8aEB216GJ9cyQcFm1OOrxvjjXiXR5otElvwx3AyvZWnkgt3Q/exec";
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
        await fetch(GOOGLE_SCRIPT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)});
        formStatus.style.display="block";
        formStatus.textContent="✓ Message sent successfully. Thank you!";
        formStatus.style.color="#16a34a";
        contactForm.reset();
      }catch(error){
        formStatus.style.display="block";
        formStatus.textContent="Something went wrong. Please try again.";
        formStatus.style.color="#dc2626";
      }
      submitBtn.disabled=false;
      submitBtn.textContent="Send Message →";
    });
  }

  const menuBtn=document.getElementById('menuBtn');
  const navLinks=document.getElementById('navLinks');
  if(menuBtn && navLinks){
    menuBtn.addEventListener('click',()=>navLinks.classList.toggle('open'));
    document.querySelectorAll('.nav-links a').forEach(a=>{
      a.addEventListener('click',()=>navLinks.classList.remove('open'));
    });
  }

  const themeBtn=document.getElementById('themeBtn');
  const savedTheme=localStorage.getItem('fahim-theme');
  if(themeBtn){
    if(savedTheme){
      document.documentElement.setAttribute('data-theme',savedTheme);
      themeBtn.textContent=savedTheme==='dark'?'☀':'☾';
    }
    themeBtn.addEventListener('click',()=>{
      const dark=document.documentElement.getAttribute('data-theme')==='dark';
      document.documentElement.setAttribute('data-theme',dark?'light':'dark');
      localStorage.setItem('fahim-theme',dark?'light':'dark');
      themeBtn.textContent=dark?'☾':'☀';
    });
  }

  const topBtn=document.getElementById('topBtn');
  if(topBtn){
    window.addEventListener('scroll',()=>{
      topBtn.classList.toggle('show',window.scrollY>500);
    });
    topBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  }

  const searchBtn=document.getElementById('searchBtn');
  const searchBox=document.getElementById('searchBox');
  const closeSearch=document.getElementById('closeSearch');
  const siteSearch=document.getElementById('siteSearch');
  const searchResults=document.getElementById('searchResults');
  const searchItems=[];

  if(searchBtn && searchBox && closeSearch && siteSearch && searchResults){
    function renderSearch(query){
      const q=query.trim().toLowerCase();
      if(!q){
        searchResults.innerHTML='<div class="search-empty">Search blogs, projects, education, skills, services and more.</div>';
        return;
      }
      searchResults.innerHTML='<div class="search-empty">Type to search...</div>';
    }

    searchBtn.addEventListener('click',()=>{
      if(searchBox.classList.contains('open')){
        searchBox.classList.remove('open');
      }else{
        searchBox.classList.add('open');
        siteSearch.focus();
      }
    });

    closeSearch.addEventListener('click',()=>searchBox.classList.remove('open'));
    siteSearch.addEventListener('input',()=>renderSearch(siteSearch.value));

    document.addEventListener('keydown',(e)=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
        e.preventDefault();
        searchBox.classList.add('open');
        siteSearch.focus();
      }
      if(e.key==='Escape') searchBox.classList.remove('open');
    });

    document.addEventListener('click',(e)=>{
      if(!e.target.closest('.search-wrap')) searchBox.classList.remove('open');
    });
  }

  const scrollProgress=document.getElementById('scrollProgress');
  if(scrollProgress){
    const updateProgress=()=>{
      const h=document.documentElement.scrollHeight-window.innerHeight;
      scrollProgress.style.width=(h>0?(window.scrollY/h)*100:0)+'%';
    };
    window.addEventListener('scroll',updateProgress,{passive:true});
    updateProgress();
  }

  const navSections=[...document.querySelectorAll('main section[id]')];
  if(navSections.length>0){
    const navObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active'));
          const link=document.querySelector('.nav-links a[href="#'+entry.target.id+'"]');
          if(link) link.classList.add('active');
        }
      });
    },{rootMargin:'-35% 0px -55% 0px',threshold:0});
    navSections.forEach(section=>navObserver.observe(section));
  }

  const yearEl=document.getElementById('year');
  if(yearEl) yearEl.textContent=new Date().getFullYear();

  await loadWebsiteContent();
}

async function loadWebsiteContent(){
  const CONTENT_API_URL="https://docs.google.com/spreadsheets/d/1FPDlW0ugDgBLds5AD86sTo-Arw0r9T4cJZ8b4Vl5s5w/gviz/tq?tqx=out:json&sheet=Blog%26Articles";
  if(!CONTENT_API_URL || CONTENT_API_URL.includes('PASTE_YOUR_CONTENT')) return;

  const blogGrid=document.getElementById('blogGrid');
  if(!blogGrid) return;

  try{
    const response=await fetch(CONTENT_API_URL,{cache:'no-store'});
    if(!response.ok) throw new Error('Content API error');

    const rawText=await response.text();
    const jsonMatch=rawText.match(/\{[\s\S]*\}$/);
    if(!jsonMatch) throw new Error('Unable to parse Google Sheet');

    const data=JSON.parse(jsonMatch[0]);
    const columns=(data.table?.cols||[]).map(col=>String(col.label||col.id||'').trim()).filter(Boolean);
    const rows=data.table?.rows||[];

    const posts=rows.map(row=>{
      const cells=row.c||[];
      const obj={};
      columns.forEach((column,index)=>{
        obj[column]=cells[index] && typeof cells[index].v !== 'undefined' ? String(cells[index].v) : '';
      });
      return obj;
    }).filter(x=>x.Title && x.Published && x.Published.toLowerCase()!=='no' && x.Published.toLowerCase()!=='false');

    if(posts.length>0){
      blogGrid.innerHTML=posts.map((post,index)=>{
        const category=(post.Category||'').toLowerCase();
        return `<article class="card blog-card" data-category="${category}">
          <img class="blog-cover" src="${post.Image||'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1000&q=85'}" alt="${post.Title}" loading="lazy">
          <div class="blog-body">
            <div class="blog-meta"><span>${post.Category||'Blog'}</span><span>${post.Date||'Today'} · ${post.ReadTime||'5'} min</span></div>
            <h4>${post.Title||'Untitled'}</h4>
            <p>${post.Summary||post.Content||'...'}</p>
            <a class="read-more" href="${post.Link||'#'}">Read article →</a>
          </div>
        </article>`;
      }).join('');

      const filterButtons=document.querySelectorAll('.filter-btn');
      const blogCards=document.querySelectorAll('#blogGrid .blog-card');

      filterButtons.forEach(btn=>{
        btn.addEventListener('click',()=>{
          filterButtons.forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          const filter=btn.dataset.filter;
          blogCards.forEach(card=>{
            const category=card.dataset.category||'';
            card.style.display=(filter==='all'||category===filter)?'block':'none';
          });
        });
      });
    }
  }catch(error){
    console.warn('Blog content could not be loaded',error);
  }
}

window.addEventListener('DOMContentLoaded',async()=>{
  try{
    await loadSections();
    await initSite();
  }catch(error){
    console.error('Site initialization failed:',error);
  }
});
