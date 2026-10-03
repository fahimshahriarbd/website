async function loadSections(){
  const slots=[...document.querySelectorAll('[data-section]')];
  await Promise.all(slots.map(async slot=>{
    const name=slot.dataset.section;
    const response=await fetch(`sections/${name}.html`,{cache:'no-store'});
    if(!response.ok) throw new Error(`Could not load section: ${name}`);
    slot.outerHTML=await response.text();
  }));
}

async function initSite(){
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbztBbwboWpdr3xxAxlgau8aEB216GJ9cyQcFm1OOrxvjjXiXR5otElvwx3AyvZWnkgt3Q/exec"; 
const contactForm = document.getElementById("contactForm"); 
const submitBtn = document.getElementById("submitBtn"); 
const formStatus = document.getElementById("formStatus"); 

contactForm.addEventListener("submit", async function(e) { 
  e.preventDefault(); 
  submitBtn.disabled = true; 
  submitBtn.textContent = "Sending..."; 
  formStatus.style.display = "none"; 
  const data = { 
    name: document.getElementById("name").value.trim(), 
    email: document.getElementById("email").value.trim(), 
    subject: document.getElementById("subject").value.trim(), 
    message: document.getElementById("message").value.trim() 
  }; 
  try { 
    await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) }); 
    formStatus.style.display = "block"; 
    formStatus.textContent = "✓ Message sent successfully. Thank you!"; 
    formStatus.style.color = "#16a34a"; 
    contactForm.reset(); 
  } catch (error) { 
    formStatus.style.display = "block"; 
    formStatus.textContent = "Something went wrong. Please try again."; 
    formStatus.style.color = "#dc2626"; 
  } 
  submitBtn.disabled = false; 
  submitBtn.textContent = "Send Message →"; 
});

/* Mobile menu */
const menuBtn=document.getElementById('menuBtn');
const navLinks=document.getElementById('navLinks');
menuBtn.addEventListener('click',()=>navLinks.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a=>{
  a.addEventListener('click',()=>navLinks.classList.remove('open'));
});

/* Dark mode */
const themeBtn=document.getElementById('themeBtn');
const savedTheme=localStorage.getItem('fahim-theme');
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

/* Blog category filter */
const filterButtons=document.querySelectorAll('.filter-btn');
const posts=document.querySelectorAll('.blog-card');
filterButtons.forEach(btn=>{
  btn.addEventListener('click',()=>{
    filterButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const filter=btn.dataset.filter;
    posts.forEach(post=>{
      post.style.display=(filter==='all'||post.dataset.category===filter)?'block':'none';
    });
  });
});

/* Back to top */
const topBtn=document.getElementById('topBtn');
window.addEventListener('scroll',()=>{
  topBtn.classList.toggle('show',window.scrollY>500);
});
topBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

/* ================= CONTENT CMS ================= */
const CONTENT_API_URL = "PASTE_YOUR_CONTENT_APPS_SCRIPT_URL_HERE";
const projectsGrid = document.getElementById('projectsGrid');
const blogGrid = document.getElementById('blogGrid');
const contentModal = document.getElementById('contentModal');
const contentModalClose = document.getElementById('contentModalClose');
const contentModalCover = document.getElementById('contentModalCover');
const contentModalMeta = document.getElementById('contentModalMeta');
const contentModalTitle = document.getElementById('contentModalTitle');
const contentModalText = document.getElementById('contentModalText');
const contentModalTags = document.getElementById('contentModalTags');

let cmsItems = [];

function safeUrl(url){
  try{
    const u=new URL(url,location.href);
    return ['http:','https:'].includes(u.protocol)?u.href:'';
  }catch{return '';}
}

function normalizeContentItem(row){
  const clean=v=>String(v??'').trim();
  return {
    type:clean(row.Type||row.type||'Blog'),
    title:clean(row.Title||row.title||'Untitled'),
    category:clean(row.Category||row.category||'General'),
    date:clean(row.Date||row.date||''),
    readTime:clean(row.ReadTime||row.readTime||''),
    summary:clean(row.Summary||row.summary||''),
    content:clean(row.Content||row.content||''),
    tags:clean(row.Tags||row.tags||'').split(',').map(x=>x.trim()).filter(Boolean),
    image:safeUrl(clean(row.Image||row.image||'')),
    icon:clean(row.Icon||row.icon||'📄'),
    link:safeUrl(clean(row.Link||row.link||'')),
    published:clean(row.Published||row.published||'Yes').toLowerCase()
  };
}

function categoryKey(value){
  return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();
}

function renderTags(tags){
  return tags.map(tag=>`<span class="tag" role="button" tabindex="0" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`).join('');
}

function renderCMSCard(item, index){
  const isProject=categoryKey(item.type)==='project' || item.type.toLowerCase().includes('project');
  const id=`cms-${isProject?'project':'content'}-${index}`;
  const categoryClass=categoryKey(item.category)||'general';
  const meta=[item.category,item.date,item.readTime].filter(Boolean).map(escapeHtml).join(' · ');
  const image=item.image ? `<img class="cms-card-image" src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy">` : '';
  const icon=item.icon||'📄';
  return `<article class="card ${isProject?'':'blog-card'}" id="${id}" data-category="${escapeHtml(categoryClass)}" data-cms-index="${index}" data-search-content="${escapeHtml(item.content+' '+item.tags.join(' '))}">
    ${image}
    <div class="card-header"><div class="card-icon">${escapeHtml(icon)}</div><h4>${escapeHtml(item.title)}</h4></div>
    ${isProject?'':'<div class="blog-meta"><span>'+escapeHtml(item.category)+'</span><span>'+meta.replace(escapeHtml(item.category)+' · ','')+'</span></div>'}
    <p>${escapeHtml(item.summary||item.content.slice(0,220))}${(item.content.length>220||item.summary.length>220)?'…':''}</p>
    <div class="tags">${renderTags(item.tags)}</div>
    <a href="#" class="read-more cms-read-more" data-cms-index="${index}">See more →</a>
  </article>`;
}

function openContentModal(item){
  contentModalTitle.textContent=item.title;
  contentModalMeta.textContent=[item.category,item.date,item.readTime].filter(Boolean).join(' · ');
  contentModalText.innerHTML='';
  const paragraphs=item.content.split(/\n\s*\n|\n/).map(x=>x.trim()).filter(Boolean);
  (paragraphs.length?paragraphs:[item.summary]).forEach(p=>{
    const el=document.createElement('p'); el.textContent=p; contentModalText.appendChild(el);
  });
  contentModalTags.innerHTML=renderTags(item.tags);
  if(item.image){contentModalCover.src=item.image;contentModalCover.alt=item.title;contentModalCover.style.display='block';}
  else{contentModalCover.removeAttribute('src');contentModalCover.style.display='none';}
  contentModal.classList.add('open');
  contentModal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  bindTags(contentModalTags);
}
function closeContentModal(){contentModal.classList.remove('open');contentModal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
contentModalClose.addEventListener('click',closeContentModal);
contentModal.addEventListener('click',e=>{if(e.target===contentModal)closeContentModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&contentModal.classList.contains('open'))closeContentModal();});

function bindReadMore(){
  document.querySelectorAll('.cms-read-more').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();
    const item=cmsItems[Number(a.dataset.cmsIndex)];
    if(item) openContentModal(item);
  }));
}

function bindTags(scope=document){
  scope.querySelectorAll('.tag').forEach(tag=>{
    if(tag.dataset.bound==='1') return;
    tag.dataset.bound='1';
    tag.setAttribute('role','button');
    tag.setAttribute('tabindex','0');

    /* Keyboard support for tags. Mouse clicks are handled centrally below. */
    tag.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        openSearch(tag.dataset.tag||tag.textContent.trim());
      }
    });
  });
}

function applyBlogFilters(){
  const active=document.querySelector('.filter-btn.active')?.dataset.filter||'all';
  document.querySelectorAll('#blogGrid .blog-card').forEach(post=>{
    const category=post.dataset.category||'';
    post.style.display=(active==='all'||category===active||categoryKey(category)===categoryKey(active))?'block':'none';
  });
}

function renderCMS(items){
  cmsItems=items;
  const projects=items.filter(x=>x.type.toLowerCase().includes('project'));
  const blogs=items.filter(x=>!x.type.toLowerCase().includes('project'));
  if(projects.length) projectsGrid.innerHTML=projects.map(x=>renderCMSCard(x,items.indexOf(x))).join('');
  if(blogs.length) blogGrid.innerHTML=blogs.map(x=>renderCMSCard(x,items.indexOf(x))).join('');
  bindReadMore(); bindTags(); applyBlogFilters();
  buildSearchIndex();
}

async function loadWebsiteContent(){
  if(!CONTENT_API_URL || CONTENT_API_URL.includes('PASTE_YOUR_CONTENT')) return;
  try{
    const response=await fetch(CONTENT_API_URL,{cache:'no-store'});
    if(!response.ok) throw new Error('Content API error');
    const data=await response.json();
    const items=(Array.isArray(data)?data:(data.items||[])).map(normalizeContentItem)
      .filter(x=>x.title && x.published!=='no' && x.published!=='false' && x.published!=='draft');
    if(items.length) renderCMS(items);
  }catch(error){
    console.warn('Content sheet could not be loaded. Static website content remains active.',error);
  }
}

/* ================= WEBSITE SEARCH ================= */
const searchBtn=document.getElementById('searchBtn');
const searchBox=document.getElementById('searchBox');
const closeSearch=document.getElementById('closeSearch');
const siteSearch=document.getElementById('siteSearch');
const searchResults=document.getElementById('searchResults');
const searchItems=[];

function buildSearchIndex(){
  searchItems.length=0;
  document.querySelectorAll('main section[id]').forEach(section=>{
    const sectionTitle=(section.querySelector('h1,h2,h3,h4')?.textContent||section.id).trim();
    searchItems.push({id:section.id,title:sectionTitle,type:'Section',text:section.innerText.replace(/\s+/g,' ').trim(),element:section});
    section.querySelectorAll('article, .card, .panel, .timeline-item, .skill-card, .project-card, .blog-card').forEach((card,index)=>{
      const title=(card.querySelector('h1,h2,h3,h4')?.textContent||'Content').trim();
      const visibleText=card.innerText.replace(/\s+/g,' ').trim();
      const extraText=card.dataset.searchContent||'';
      const text=(visibleText+' '+extraText).replace(/\s+/g,' ').trim();
      if(text){
        const anchorId=card.id || `${section.id}-item-${index}`;
        if(!card.id) card.id=anchorId;
        searchItems.push({id:anchorId,title,type:sectionTitle,text,element:card});
      }
    });
  });
}

function escapeHtml(value){
  return value.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function highlightText(text, query){
  const safe=escapeHtml(text);
  if(!query) return safe;
  const words=query.trim().split(/\s+/).filter(Boolean).sort((a,b)=>b.length-a.length).map(escapeHtml);
  if(!words.length) return safe;
  const re=new RegExp('('+words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','gi');
  return safe.replace(re,'<mark>$1</mark>');
}

function getMatchingLine(text, query){
  const q=query.trim().toLowerCase();
  const lines=text.split(/(?<=[.!?।])\s+|\n+/).map(x=>x.trim()).filter(Boolean);
  const hit=lines.find(line=>line.toLowerCase().includes(q.split(/\s+/)[0])) || lines.find(line=>q.split(/\s+/).every(w=>line.toLowerCase().includes(w)));
  if(hit) return hit.length>260 ? hit.slice(0,260).trim()+'…' : hit;
  const idx=text.toLowerCase().indexOf(q.split(/\s+/)[0]);
  if(idx>=0){
    const start=Math.max(0,text.lastIndexOf(' ',Math.max(0,idx-90)));
    const end=Math.min(text.length,text.indexOf(' ',idx+170)>0?text.indexOf(' ',idx+170):idx+200);
    return (start>0?'…':'')+text.slice(start,end).trim()+(end<text.length?'…':'');
  }
  return text.slice(0,220)+(text.length>220?'…':'');
}

function highlightMatchingContentOnPage(query){
  const q = query.trim().toLowerCase();
  if(!q) return;
  const words = q.split(/\s+/).filter(Boolean);
  
  searchItems.forEach(item => {
    const hay = (item.title + ' ' + item.type + ' ' + item.text).toLowerCase();
    const isMatch = words.every(word => hay.includes(word));
    if(isMatch && item.element && item.id !== 'home'){
      item.element.classList.add('search-hit');
      setTimeout(() => item.element.classList.remove('search-hit'), 2200);
    }
  });
}

function openSearch(query=''){
  searchBox.classList.add('open');
  siteSearch.value=query;
  renderSearch(query);
  if(query){
    highlightMatchingContentOnPage(query);
  }
  setTimeout(()=>siteSearch.focus(),50);
}

function renderSearch(query){
  const q=query.trim().toLowerCase();
  if(!q){
    searchResults.innerHTML='<div class="search-empty">Search blogs, projects, education, skills, services and more.</div>';
    return;
  }
  const words=q.split(/\s+/).filter(Boolean);
  const matches=searchItems.filter(item=>{
    const hay=(item.title+' '+item.type+' '+item.text).toLowerCase();
    return words.every(word=>hay.includes(word));
  }).slice(0,15);
  searchResults.innerHTML='';
  if(!matches.length){
    searchResults.innerHTML='<div class="search-empty">No matching content found. Try another keyword or click a tag.</div>';
    return;
  }
  matches.forEach(item=>{
    const link=document.createElement('a');
    link.className='search-result';
    link.href='#'+item.id;
    const title=document.createElement('span');
    title.className='search-result-title';
    title.innerHTML=highlightText(item.title,q);
    const meta=document.createElement('span');
    meta.className='search-result-meta';
    meta.textContent=item.type;
    const snippet=document.createElement('span');
    snippet.className='search-snippet';
    snippet.innerHTML=highlightText(getMatchingLine(item.text,q),q);
    link.append(title,meta,snippet);
    link.addEventListener('click',()=>{
      searchBox.classList.remove('open');
      siteSearch.value='';
      setTimeout(()=>{
        item.element?.scrollIntoView({behavior:'smooth',block:'center'});
        item.element?.classList.add('search-hit');
        setTimeout(()=>item.element?.classList.remove('search-hit'),1800);
      },80);
    });
    searchResults.appendChild(link);
  });
}

searchBtn.addEventListener('click',()=>searchBox.classList.contains('open')?searchBox.classList.remove('open'):openSearch());
closeSearch.addEventListener('click',()=>searchBox.classList.remove('open'));
siteSearch.addEventListener('input',()=>{
  renderSearch(siteSearch.value);
  if(siteSearch.value.trim()){
    highlightMatchingContentOnPage(siteSearch.value);
  }
});

document.addEventListener('keydown',(e)=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}
  if(e.key==='Escape') searchBox.classList.remove('open');
});
document.addEventListener('click',(e)=>{
  const tag=e.target.closest('.tag');

  /* A tag click should open search and must not be immediately closed
     by the outside-click handler. */
  if(tag){
    e.preventDefault();
    e.stopPropagation();
    openSearch(tag.dataset.tag || tag.textContent.trim());
    return;
  }

  if(!e.target.closest('.search-wrap')) searchBox.classList.remove('open');
});



/* Scroll progress */
const scrollProgress=document.getElementById('scrollProgress');
const updateProgress=()=>{
  const h=document.documentElement.scrollHeight-window.innerHeight;
  scrollProgress.style.width=(h>0?(window.scrollY/h)*100:0)+'%';
};
window.addEventListener('scroll',updateProgress,{passive:true});
updateProgress();

/* Active navigation */
const navSections=[...document.querySelectorAll('main section[id]')];
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

/* Current year */
document.getElementById('year').textContent=new Date().getFullYear();
  await loadWebsiteContent();
  buildSearchIndex();
  bindTags();
}

window.addEventListener('DOMContentLoaded',async()=>{
  try{
    await loadSections();
    await initSite();
  }catch(error){
    console.error('Website initialization failed:',error);
    document.querySelectorAll('[data-section]').forEach(slot=>{
      slot.innerHTML='<p style="padding:20px;text-align:center">Unable to load this section. Please refresh the page.</p>';
    });
  }
});
