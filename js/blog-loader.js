// গুগল শীট থেকে ব্লগ ডাটা লোড করার স্ক্রিপ্ট
// SHEET_ID এবং SHEET_NAME আপডেট করুন

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // গুগল শীটের আইডি
const SHEET_NAME = 'Blog'; // শীটের নাম

// গুগল শীট থেকে ডাটা ফেচ করার ফাংশন
async function fetchBlogPosts() {
  try {
    // Google Sheets CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error('Failed to fetch blog data');
    
    const csvText = await response.text();
    const posts = parseCSV(csvText);
    
    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

// CSV টেক্সট পার্স করার ফাংশন
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const posts = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length < headers.length) continue;
    
    const post = {};
    headers.forEach((header, index) => {
      post[header] = values[index];
    });
    
    posts.push(post);
  }
  
  return posts;
}

// ব্লগ কার্ড HTML তৈরি করার ফাংশন
function createBlogCard(post) {
  const category = post.category.toLowerCase();
  const categoryLabel = {
    'medical': 'Medical',
    'tech': 'Technology',
    'education': 'Education',
    'personal': 'Personal'
  }[category] || post.category;

  return `
    <article class="card blog-card" data-category="${category}">
      <img class="blog-cover"
        src="${post.imageUrl}"
        alt="${post.title}">
      <div class="blog-body">
        <div class="blog-meta">
          <span>${categoryLabel}</span>
          <span>${post.date} · ${post.readTime} min</span>
        </div>
        <h4>${post.title}</h4>
        <p>${post.description}</p>
        <a class="read-more" href="${post.articleLink}">Read article →</a>
      </div>
    </article>
  `;
}

// ব্লগ গ্রিড আপডেট করার ফাংশন
async function loadBlogPosts() {
  const blogGrid = document.getElementById('blogGrid');
  
  if (!blogGrid) {
    console.error('Blog grid element not found');
    return;
  }
  
  // লোডিং স্টেট দেখান
  blogGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Loading blog posts...</p>';
  
  const posts = await fetchBlogPosts();
  
  if (posts.length === 0) {
    blogGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No blog posts found.</p>';
    return;
  }
  
  // ব্লগ কার্ড জেনারেট করুন
  blogGrid.innerHTML = posts.map(post => createBlogCard(post)).join('');
  
  // ফিল্টার ফাংশন পুনরায় যুক্ত করুন
  initializeBlogFilters();
}

// ব্লগ ফিল্টার ইনিশিয়ালাইজ করার ফাংশন
function initializeBlogFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const blogCards = document.querySelectorAll('.blog-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filterValue = button.getAttribute('data-filter');
      
      // অ্যাক্টিভ বাটন আপডেট করুন
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // কার্ড ফিল্টার করুন
      blogCards.forEach(card => {
        if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// পেজ লোড হলে ব্লগ পোস্ট লোড করুন
document.addEventListener('DOMContentLoaded', loadBlogPosts);
