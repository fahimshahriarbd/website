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


  /* SEARCH */

  const searchBtn=document.getElementById('searchBtn');
  const searchBox=document.getElementById('searchBox');
  const closeSearch=document.getElementById('closeSearch');
  const siteSearch=document.getElementById('siteSearch');
  const searchResults=document.getElementById('searchResults');

  const searchItems=[];

  if(
    searchBtn &&
    searchBox &&
    closeSearch &&
    siteSearch &&
    searchResults
  ){

    function renderSearch(query){

      const q=query.trim().toLowerCase();

      if(!q){

        searchResults.innerHTML=
          '<div class="search-empty">Search blogs, projects, education, skills, services and more.</div>';

        return;
      }

      searchResults.innerHTML=
        '<div class="search-empty">Type to search...</div>';
    }


    searchBtn.addEventListener('click',()=>{

      if(searchBox.classList.contains('open')){

        searchBox.classList.remove('open');

      }else{

        searchBox.classList.add('open');
        siteSearch.focus();
      }
    });


    closeSearch.addEventListener('click',()=>{
      searchBox.classList.remove('open');
    });


    siteSearch.addEventListener('input',()=>{
      renderSearch(siteSearch.value);
    });


    document.addEventListener('keydown',(e)=>{

      if(
        (e.ctrlKey||e.metaKey) &&
        e.key.toLowerCase()==='k'
      ){

        e.preventDefault();

        searchBox.classList.add('open');
        siteSearch.focus();
      }

      if(e.key==='Escape'){
        searchBox.classList.remove('open');
      }
    });


    document.addEventListener('click',(e)=>{

      if(!e.target.closest('.search-wrap')){
        searchBox.classList.remove('open');
      }
    });
  }


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
