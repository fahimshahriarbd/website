/* ============================================================
   GOOGLE SHEETS DATABASE CLIENT
   Fahim Shahriar Website

   Loads and syncs all live content directly with Google Sheets
   via server proxy (/api/sheet-proxy) and direct Apps Script URL.
   ============================================================ */

let supabaseInstance = null;

const DEFAULT_DATABASE = {
  blog_posts: [
    {
      id: 'b-sheet-1',
      title: 'আমি কেন স্বাস্থ্যসেবা ও প্রযুক্তিকে একসঙ্গে কাজে লাগাতে চাই',
      category: 'Education',
      image: 'https://res.cloudinary.com/ltd7gw9d/image/upload/fahim200KB.png',
      date: '2026-10-10',
      read_time: '5',
      summary: 'চিকিৎসাবিজ্ঞান এবং আধুনিক প্রযুক্তির সমন্বয় কীভাবে স্বাস্থ্যসেবা ও শিক্ষাক্ষেত্রে নতুন দিগন্ত উন্মোচন করতে পারে তা নিয়ে আমার ভাবনা।',
      content: 'চিকিৎসাবিজ্ঞান এবং আধুনিক প্রযুক্তির সমন্বয় কীভাবে স্বাস্থ্যসেবা ও শিক্ষাক্ষেত্রে নতুন দিগন্ত উন্মোচন করতে পারে তা নিয়ে আমার ভাবনা।',
      link: '#',
      published: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  gallery_photos: [
    { id: 'g-sheet-1', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655295/18.jpg', caption: '৫ আগস্ট ২০২৪ । শেখ হাসিনার পতন হয়।', category: 'Events', sort_order: 1, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-2', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655295/16.jpg', caption: 'এডমিশন প্রস্তুরির শীতের এক রাতে ঢাকা শহরে।', category: 'Single', sort_order: 2, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-3', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655295/17.jpg', caption: 'রমনা পার্ক, ঢাকা', category: 'Single', sort_order: 3, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-4', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655295/15.jpg', caption: 'Green Road, Dhaka', category: 'Single', sort_order: 4, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-5', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655294/14.jpg', caption: 'চট্টগ্রাম মেডিকেল কলেজ টার্ফে খেলাধুলার সময়।', category: 'Single', sort_order: 5, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-6', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655294/9.jpg', caption: 'Magic Paradise, Cumilla in 2022 with college friends', category: 'Single', sort_order: 6, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-7', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655294/11.jpg', caption: 'খৈয়াছড়া ঝর্ণা, চট্টগ্রাম', category: 'Travel', sort_order: 7, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-8', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655294/13.jpg', caption: 'কাচ্চি ডাইন, জিইসি', category: 'Single', sort_order: 8, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-9', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655294/12.jpg', caption: 'তাজমহল রেস্টুরেন্ট, হোমনা, কুমিল্লা (ইফতার পার্টি)', category: 'Single', sort_order: 9, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-10', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655294/8.jpg', caption: 'BUET Campus Visiting Memory 2022', category: 'Single', sort_order: 10, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-11', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655293/7.jpg', caption: 'ঘনিয়ারচর ব্রীজে, হোমনা, কুমিল্লা', category: 'Single', sort_order: 11, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-12', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655293/6.jpg', caption: 'ঘনিয়ারচর, হোমনা, কুমিল্লা', category: 'Single', sort_order: 12, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-13', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655293/5.jpg', caption: 'গ্রামীন পরিবেশে, শ্রীনগর', category: 'Single', sort_order: 13, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-14', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655293/4.jpg', caption: 'জাতীয় জাদুঘর, ঢাকা', category: 'Single', sort_order: 14, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-15', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655293/3.jpg', caption: 'Batch Day of CMC 66-35', category: 'CMC', sort_order: 15, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-16', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655293/2.jpg', caption: 'Medilogy Invitaton for Hunting Medical College', category: 'Events', sort_order: 16, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-17', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655293/24.jpg', caption: 'Magic Paradise Pool, Cumilla', category: 'Single', sort_order: 17, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-18', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655293/22.jpg', caption: 'Magic Paradise Pool, Cumilla', category: 'Single', sort_order: 18, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-19', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655292/20.jpg', caption: 'Near My Primary School', category: 'Single', sort_order: 19, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-20', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655292/21.jpg', caption: 'কবরস্থান, শ্রীনগর', category: 'Single', sort_order: 20, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-21', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655292/28.jpg', caption: 'Royal Restaurant, Bancharampur, Brammanbaria', category: 'Single', sort_order: 21, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-22', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655292/27.jpg', caption: 'Birthday Celebration 2024', category: 'Single', sort_order: 22, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-23', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655292/23.jpg', caption: 'Magic Paradise', category: 'Single', sort_order: 23, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-24', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655291/19.jpg', caption: 'ঈদগাহ, বাশগাড়ি', category: 'Single', sort_order: 24, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-25', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655291/26.jpg', caption: 'চমেকের লাইব্রেরিতে', category: 'CMC', sort_order: 25, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-26', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655291/WhatsApp_Image_2026-09-03_at_3.01.14_PM.jpg', caption: 'Cox\'s Bazar Night View', category: 'Single', sort_order: 26, created_at: '2026-10-09T00:00:00.000Z' },
    { id: 'g-sheet-27', image_url: 'https://res.cloudinary.com/ltd7gw9d/image/upload/v1791655291/WhatsApp_Image_2026-09-03_at_3.02.24_PM.jpg', caption: '1st Medicalian Batchmate marriage', category: 'Single', sort_order: 27, created_at: '2026-10-09T00:00:00.000Z' }
  ],
  services: [
    {
      id: 's-sheet-1',
      icon: '🏠',
      title: 'Home Tutoring - HSC',
      category: 'Tuition',
      price: '9,000 BDT',
      description: 'Days: 3 Days/Week, Subjects: Biology, Chemistry, Duration: 1 hour',
      is_active: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  achievements: [
    {
      id: 'a-sheet-1',
      icon: '🎓',
      title: 'Admission to CMC',
      description: 'Secured admission to the Dental Unit of Chittagong Medical College in 2024, achieving 285 out of 300 marks (95%) in the competitive national admission process.',
      published: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  projects: [
    {
      id: 'p-sheet-1',
      icon: '🎓',
      title: 'DTC Web App',
      category: 'Education',
      description: 'A question-card system to save studied topics, revisit important questions, and refresh forgotten knowledge through quick revision.',
      details: 'A specialized active-recall platform with 1,000+ high-yield question cards, categorized by subject and chapter for rapid dental and medical student revision.',
      link: 'https://bds-to-bcs.vercel.app/',
      published: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'p-sheet-2',
      icon: '🎓',
      title: 'StudyWise App',
      category: 'Education',
      description: 'StudyWise helps students access daily lessons, download notes, and practice topic-based quizzes.',
      details: 'Comprehensive educational companion facilitating structured daily curriculum, lecture note downloads, and interactive performance tracking.',
      link: 'https://fahimshahriar.com.bd',
      published: true,
      sort_order: 2,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'p-sheet-3',
      icon: 'Ω',
      title: 'Omega Tuition Media',
      category: 'Business',
      description: 'Connecting students with suitable tutors and helping build reliable tuition opportunities through a simple and trusted platform.',
      details: 'Transparent mentorship network bridging 500+ verified teachers with school and college candidates across Chittagong and Cumilla regions.',
      link: 'https://www.facebook.com/omega.tuition.media',
      published: true,
      sort_order: 3,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'p-sheet-4',
      icon: '🎯',
      title: 'MediXm',
      category: 'Education',
      description: 'Created 8,000+ original questions from core textbooks and organized free study materials, videos, and PDFs for medical and dental admission candidates.',
      details: 'Large-scale question bank repository with detailed answer rationales, model test suites, and syllabus roadmap for medical exam aspirants.',
      link: 'https://sites.google.com/view/medixm/home',
      published: true,
      sort_order: 4,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'p-sheet-5',
      icon: '🍱',
      title: 'Food Order Web App',
      category: 'Automation',
      description: 'A digital Sehri food-ordering system that collects orders from students and sends organized data directly to dining authorities, eliminating tokens and manual hassle.',
      details: 'Automated dining ordering workflow streamlining hostel student food requests, token validation, and real-time meal counts during Ramadan.',
      link: 'https://food-peach-three-45.vercel.app/',
      published: true,
      sort_order: 5,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  testimonials: [
    {
      id: 't-sheet-1',
      name: 'Nahomir Islam Chowdhury',
      tag: 'Friend',
      about: 'Website',
      feedback: 'Exceptionally well conceived and meticulously executed. The seamless interplay of contemporary design, intuitive navigation, and purposeful functionality creates a digital experience that is both sophisticated and engaging, particularly well suited to presenting medical and research-oriented content with clarity and credibility. I truly appreciate the thought, effort, and attention to detail invested in transforming complex professional work into such an accessible and compelling digital platform. A truly distinctive piece of work that reflects creativity, precision, technical expertise, and a strong sense of vision.',
      image: 'https://media.licdn.com/dms/image/v2/D4E03AQGN605C8Vp12A/profile-displayphoto-scale_400_400/B4EZqsGV3LKMAg-/0/1763823938540?e=1792627200&v=beta&t=XQKmfSFFITO7sTIrZ9Ft54rjl8t72kmS2BHD05OtxFY',
      link: 'https://www.linkedin.com/in/nahomirislamchowdhury/',
      published: true,
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  cvs: [
    {
      id: 'c-sheet-1',
      title: 'Student CV',
      download_link: 'https://i.postimg.cc/3JZxV4yk/screenshot-10.png',
      password: '12',
      sort_order: 1,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'c-sheet-2',
      title: 'Tuition CV',
      download_link: 'https://i.postimg.cc/3JZxV4yk/screenshot-10.png',
      password: '12',
      sort_order: 2,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'c-sheet-3',
      title: 'Marrige CV',
      download_link: 'https://i.postimg.cc/3JZxV4yk/screenshot-10.png',
      password: '12',
      sort_order: 3,
      created_at: '2026-10-09T00:00:00.000Z'
    },
    {
      id: 'c-sheet-4',
      title: 'Career CV',
      download_link: 'https://i.postimg.cc/3JZxV4yk/screenshot-10.png',
      password: '12',
      sort_order: 4,
      created_at: '2026-10-09T00:00:00.000Z'
    }
  ],
  messages: [],
  bookings: []
};

const STORAGE_KEY = 'fahim_website_sheet_cache_v2';
const AUTH_STORAGE_KEY = 'fahim_website_auth_v2';

function getLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [tName, defaultRows] of Object.entries(DEFAULT_DATABASE)) {
        if (!Array.isArray(parsed[tName])) {
          parsed[tName] = defaultRows;
        }
      }
      return parsed;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_DATABASE));
}

function saveLocalStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {}
}

function parseBoolFlag(val, defaultVal = true) {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (['yes', 'true', '1', 'active', 'published'].includes(s)) return true;
  if (['no', 'false', '0', 'inactive', 'hidden', 'unpublished'].includes(s)) return false;
  return defaultVal;
}

/* ---- GOOGLE SHEET TO MODEL CONVERTERS (Matches deployed Google Sheet headers) ---- */
function mapSheetRowToModel(tableName, row, idx) {
  const _rowIndex = Number(row._rowIndex || (idx + 2));
  const id = String(row.id || ('row-' + (_rowIndex - 1)));
  const sortOrder = Number(row.Sort_Order ?? row.sort_order ?? (idx + 1)) || (idx + 1);
  const createdAt = row.Time || row.time || row.Created_At || row.created_at || new Date().toISOString();

  if (tableName === 'projects') {
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? 'Project').trim(),
      icon: String(row.Icon ?? row.icon ?? '🚀').trim(),
      category: String(row.Category ?? row.category ?? 'General').trim(),
      description: String(row.Description ?? row.description ?? '').trim(),
      details: String(row['Key Details & Impact'] ?? row['Key Details'] ?? row['Key Details and Impact'] ?? row['Key Details &amp; Impact'] ?? row.Key_Details_Impact ?? row.Key_Details ?? row.key_details ?? row.Details ?? row.details ?? row.Impact ?? row.impact ?? '').trim(),
      link: String(row.Link ?? row.link ?? '#').trim(),
      tags: String(row.Tags ?? row.tags ?? '').trim(),
      sort_order: sortOrder,
      published: parseBoolFlag(row.Published ?? row.published, true),
      created_at: createdAt
    };
  }
  if (tableName === 'services') {
    const rawPrice = String(row.Fee ?? row.fee ?? row.Price ?? row.price ?? '1,000').trim();
    const formattedPrice = rawPrice.toUpperCase().includes('BDT') ? rawPrice : `${rawPrice} BDT`;
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? 'Service').trim(),
      icon: String(row.Icon ?? row.icon ?? '💼').trim(),
      category: String(row.Catagory ?? row.Category ?? row.category ?? 'General').trim(),
      price: formattedPrice,
      description: String(row.Description ?? row.description ?? '').trim(),
      sort_order: sortOrder,
      is_active: parseBoolFlag(row.Active ?? row.active ?? row.is_active, true),
      created_at: createdAt
    };
  }
  if (tableName === 'testimonials') {
    return {
      id,
      _rowIndex,
      name: String(row.Name ?? row.name ?? 'Anonymous').trim(),
      tag: String(row.Tag ?? row.Relation ?? row.relation ?? row.tag ?? 'Friend').trim(),
      about: String(row.About ?? row.about ?? 'Website').trim(),
      feedback: String(row.Feedback ?? row.feedback ?? '').trim(),
      image: String(row.Image ?? row.image ?? '').trim(),
      link: String(row.Link ?? row.link ?? '#').trim(),
      sort_order: sortOrder,
      published: parseBoolFlag(row.Published ?? row.published, true),
      created_at: createdAt
    };
  }
  if (tableName === 'blog_posts' || tableName === 'blog') {
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? 'Blog Post').trim(),
      category: String(row.Category ?? row.category ?? 'Blog').trim(),
      image: String(row.Image ?? row.image ?? '').trim(),
      date: String(row.Date ?? row.date ?? '').trim(),
      read_time: String(row.ReadTime ?? row['Read Time'] ?? row.read_time ?? '5').trim(),
      summary: String(row.Summary ?? row.summary ?? '').trim(),
      content: String(row.Content ?? row.content ?? row.Summary ?? row.summary ?? '').trim(),
      link: String(row.Link ?? row.link ?? '#').trim(),
      sort_order: sortOrder,
      published: parseBoolFlag(row.Published ?? row.published, true),
      created_at: createdAt
    };
  }
  if (tableName === 'achievements') {
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? '').trim(),
      icon: String(row.Icon ?? row.icon ?? '🏆').trim(),
      description: String(row.Description ?? row.description ?? '').trim(),
      sort_order: sortOrder,
      published: parseBoolFlag(row.Published ?? row.published, true),
      created_at: createdAt
    };
  }
  if (tableName === 'gallery_photos' || tableName === 'gallery') {
    return {
      id,
      _rowIndex,
      image_url: String(row.ImageLink ?? row['Image Link'] ?? row.Image_Link ?? row.Image_URL ?? row.image_url ?? row.Image ?? row.image ?? '').trim(),
      caption: String(row.Caption ?? row.caption ?? row.Title ?? row.title ?? '').trim(),
      category: String(row.Catagory ?? row.Category ?? row.catagory ?? row.category ?? 'General').trim() || 'General',
      sort_order: sortOrder,
      created_at: createdAt
    };
  }
  if (tableName === 'cvs' || tableName === 'cv') {
    return {
      id,
      _rowIndex,
      title: String(row.Title ?? row.title ?? '').trim(),
      download_link: String(row['Download Link'] ?? row.Download_Link ?? row.download_link ?? row.Link ?? row.link ?? '').trim(),
      password: row.Password !== undefined ? String(row.Password) : (row.password !== undefined ? String(row.password) : '0'),
      sort_order: sortOrder,
      created_at: createdAt
    };
  }
  if (tableName === 'messages') {
    return {
      id,
      _rowIndex,
      name: String(row.Name ?? row.name ?? 'Anonymous').trim(),
      email: String(row.Email ?? row.email ?? '').trim(),
      subject: String(row.Subject ?? row.subject ?? '').trim(),
      message: String(row.Message ?? row.message ?? '').trim(),
      created_at: createdAt
    };
  }
  if (tableName === 'bookings') {
    return {
      id,
      _rowIndex,
      name: String(row.Name ?? row.name ?? 'Anonymous').trim(),
      mobile: String(row.Mobile ?? row.mobile ?? '').trim(),
      location: String(row.Location ?? row.location ?? '').trim(),
      service_title: String(row.Service ?? row.service ?? row.Service_Title ?? row.service_title ?? 'Service').trim(),
      amount: String(row.Amount ?? row.amount ?? '').trim(),
      payment_gateway: String(row.Gateway ?? row.gateway ?? row.Payment_Gateway ?? row.payment_gateway ?? 'bKash').trim(),
      payment_number: String(row.Payment_Number ?? row.payment_number ?? '').trim(),
      trx_id: String(row.TrxID ?? row.trx_id ?? row.Trx_Id ?? '').trim(),
      notes: String(row.Notes ?? row.notes ?? '').trim(),
      created_at: createdAt
    };
  }
  return { id, _rowIndex, ...row };
}

/* ---- MODEL TO GOOGLE SHEET CONVERTERS (Matches deployed Google Sheet headers) ---- */
function mapModelToSheetRow(tableName, item) {
  if (tableName === 'projects') {
    const detailsVal = item.details || item.key_details || '';
    return {
      Title: item.title || '',
      Icon: item.icon || '🚀',
      Category: item.category || 'General',
      Catagory: item.category || 'General',
      Description: item.description || '',
      'Key Details & Impact': detailsVal,
      'Key Details': detailsVal,
      Key_Details: detailsVal,
      Details: detailsVal,
      details: detailsVal,
      Impact: detailsVal,
      Link: item.link || '#',
      Tags: item.tags || item.category || '',
      Published: item.published !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'services') {
    const cleanNumPrice = String(item.price || '1000').replace(/bdt/gi, '').replace(/,/g, '').trim();
    return {
      Title: item.title || '',
      Icon: item.icon || '💼',
      Catagory: item.category || 'General',
      Category: item.category || 'General',
      Fee: cleanNumPrice,
      Price: cleanNumPrice,
      Description: item.description || '',
      Active: item.is_active !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'testimonials') {
    return {
      Name: item.name || '',
      Tag: item.tag || 'Friend',
      Relation: item.tag || 'Friend',
      About: item.about || 'Website',
      Feedback: item.feedback || '',
      Image: item.image || '',
      ImageLink: item.image || '',
      Link: item.link || '#',
      Published: item.published !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'blog_posts' || tableName === 'blog') {
    return {
      Title: item.title || '',
      Category: item.category || 'Blog',
      Catagory: item.category || 'Blog',
      Image: item.image || '',
      ImageLink: item.image || '',
      Date: item.date || new Date().toISOString().split('T')[0],
      ReadTime: item.read_time || '5',
      Summary: item.summary || '',
      Content: item.content || '',
      Link: item.link || '#',
      Published: item.published !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'achievements') {
    return {
      Title: item.title || '',
      Icon: item.icon || '🏆',
      Description: item.description || '',
      Published: item.published !== false ? 'yes' : 'no'
    };
  }
  if (tableName === 'gallery_photos' || tableName === 'gallery') {
    return {
      ImageLink: item.image_url || '',
      'Image Link': item.image_url || '',
      Image_Link: item.image_url || '',
      Image_URL: item.image_url || '',
      Image: item.image_url || '',
      Caption: item.caption || '',
      Catagory: item.category || 'General',
      Category: item.category || 'General'
    };
  }
  if (tableName === 'cvs' || tableName === 'cv') {
    return {
      Title: item.title || '',
      'Download Link': item.download_link || '',
      Download_Link: item.download_link || '',
      Password: item.password !== undefined ? String(item.password) : '0'
    };
  }
  if (tableName === 'messages') {
    return {
      Time: item.created_at || new Date().toISOString(),
      Name: item.name || '',
      Email: item.email || '',
      Subject: item.subject || '',
      Message: item.message || ''
    };
  }
  if (tableName === 'bookings') {
    return {
      Time: item.created_at || new Date().toISOString(),
      Name: item.name || '',
      Mobile: item.mobile || '',
      Location: item.location || '',
      Service: item.service_title || 'Service',
      Amount: item.amount || '',
      Gateway: item.payment_gateway || 'bKash',
      Payment_Number: item.payment_number || '',
      TrxID: item.trx_id || '',
      Notes: item.notes || ''
    };
  }
  return item;
}

let DIRECT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFIJVTNzF50zCcv6Ppk2n041_tXHFEWcKM1ouSQsCQ-HzcNUkjUTjNvesNnN_KZ38ovg/exec';

try {
  fetch('/api/config')
    .then(res => res.json())
    .then(cfg => {
      if (cfg && cfg.googleScriptUrl) {
        DIRECT_SCRIPT_URL = cfg.googleScriptUrl;
      }
    })
    .catch(() => {});
} catch (e) {}

function getSheetTabName(tn) {
  const m = {
    blog_posts: 'blog',
    gallery_photos: 'gallery',
    cvs: 'cv',
    blog: 'blog',
    gallery: 'gallery',
    cv: 'cv'
  };
  return m[tn] || tn;
}

async function syncToSheet(tableName, action, data, rowIndex) {
  const sheetTab = getSheetTabName(tableName);
  const payload = {
    sheet: sheetTab,
    action: action,
    data: data
  };
  if (rowIndex) payload.rowIndex = Number(rowIndex);

  // 1. Primary: Server-side Google Sheet proxy (handles redirects & CORS cleanly)
  try {
    const res = await fetch('/api/sheet-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        return JSON.parse(text);
      }
    }
  } catch (e) {}

  // 2. Fallback: Direct browser call to Google Apps Script (for static hosting / GitHub Pages)
  try {
    const res = await fetch(DIRECT_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        return JSON.parse(text);
      }
    }
  } catch (e) {}

  return null;
}

async function fetchSheetRows(tableName, forceRefresh = false) {
  const sheetTab = getSheetTabName(tableName);
  const refreshQuery = forceRefresh ? '&refresh=1' : '';

  // 1. Primary: Server proxy
  try {
    const res = await fetch(`/api/sheet-proxy?sheet=${encodeURIComponent(sheetTab)}${refreshQuery}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        if (Array.isArray(data)) return data;
      }
    }
  } catch (e) {}

  // 2. Fallback: Direct call to Google Apps Script
  try {
    const res = await fetch(`${DIRECT_SCRIPT_URL}?sheet=${encodeURIComponent(sheetTab)}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        if (Array.isArray(data)) return data;
      }
    }
  } catch (e) {}

  return null;
}

function createLocalSupabaseClient() {
  const authListeners = [];

  const auth = {
    async getSession() {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          return { data: { session }, error: null };
        }
      } catch (e) {}
      return { data: { session: null }, error: null };
    },
    async signInWithPassword({ email, password }) {
      if (!email || !password) {
        return { data: { user: null, session: null }, error: new Error('Email and password are required.') };
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanPassword = String(password).trim();

      let loginSuccess = false;
      let userEmail = cleanEmail;
      let token = 'admin_session_' + Date.now();

      // 1. Try server endpoint first
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
        });
        const text = await res.text();
        if (text && !text.trim().startsWith('<')) {
          try {
            const result = JSON.parse(text);
            if (res.ok && result.success) {
              loginSuccess = true;
              token = result.token || token;
              userEmail = result.email || cleanEmail;
            } else if (result && result.error) {
              return { data: { user: null, session: null }, error: new Error(result.error) };
            }
          } catch (e) {}
        }
      } catch (err) {}

      // 2. Fallback SHA-256 verification for static hosting
      if (!loginSuccess) {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(cleanPassword);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const passHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          const authorizedAccounts = [
            { email: 'admin@fahimshahriar.com.bd', hash: '3ff079a374fde5672c297e589940eef0b28c6af353854be19da6a54d18141206' },
            { email: 'admin@fahimshahriar.com', hash: '1d43be89254b53dc6ec82c6e9710874251893571704b4e7ccf41ebd10ac1f842' }
          ];

          const isMatch = authorizedAccounts.some(acc => acc.email === cleanEmail && acc.hash === passHash);
          if (isMatch) {
            loginSuccess = true;
            userEmail = cleanEmail;
          } else {
            return { data: { user: null, session: null }, error: new Error('Invalid email or password.') };
          }
        } catch (hashErr) {
          return { data: { user: null, session: null }, error: new Error('Invalid email or password.') };
        }
      }

      const session = {
        access_token: token,
        user: {
          id: 'admin-1',
          email: userEmail,
          role: 'authenticated'
        }
      };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } catch (e) {}
      authListeners.forEach(cb => {
        try { cb('SIGNED_IN', session); } catch (e) {}
      });
      return { data: { user: session.user, session }, error: null };
    },
    async signOut() {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (e) {}
      authListeners.forEach(cb => {
        try { cb('SIGNED_OUT', null); } catch (e) {}
      });
      return { error: null };
    },
    onAuthStateChange(callback) {
      if (typeof callback === 'function') {
        authListeners.push(callback);
      }
      return {
        data: {
          subscription: {
            unsubscribe() {
              const idx = authListeners.indexOf(callback);
              if (idx !== -1) authListeners.splice(idx, 1);
            }
          }
        }
      };
    }
  };

  function from(tableName) {
    const filters = [];
    const sorts = [];
    let limitCount = null;
    let isSingle = false;
    let maybeSingleMode = false;
    let operation = 'select';
    let updatePayload = null;
    let insertPayload = null;

    const builder = {
      select() {
        if (operation !== 'update' && operation !== 'delete' && operation !== 'insert') {
          operation = 'select';
        }
        return builder;
      },
      eq(column, value) {
        filters.push(row => {
          if (typeof value === 'boolean') {
            return Boolean(row[column]) === value;
          }
          return String(row[column] ?? '').toLowerCase() === String(value ?? '').toLowerCase();
        });
        return builder;
      },
      neq(column, value) {
        filters.push(row => {
          if (typeof value === 'boolean') {
            return Boolean(row[column]) !== value;
          }
          return String(row[column] ?? '').toLowerCase() !== String(value ?? '').toLowerCase();
        });
        return builder;
      },
      order(column, options = {}) {
        const ascending = options.ascending !== false;
        sorts.push({ column, ascending });
        return builder;
      },
      limit(count) {
        limitCount = count;
        return builder;
      },
      single() {
        isSingle = true;
        return builder;
      },
      maybeSingle() {
        maybeSingleMode = true;
        return builder;
      },
      insert(dataOrArray) {
        operation = 'insert';
        insertPayload = dataOrArray;
        return builder;
      },
      update(updateFields) {
        operation = 'update';
        updatePayload = updateFields;
        return builder;
      },
      delete() {
        operation = 'delete';
        return builder;
      },

      then(onFulfilled, onRejected) {
        const execute = async () => {
          // --- INSERT INTO GOOGLE SHEET ---
          if (operation === 'insert') {
            const store = getLocalStore();
            if (!store[tableName]) store[tableName] = [];

            const items = Array.isArray(insertPayload) ? insertPayload : [insertPayload];
            const inserted = [];

            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              const createdAt = item.created_at || new Date().toISOString();
              const tempRowIndex = store[tableName].length + i + 2;
              const newItem = {
                id: item.id || ('row-' + (tempRowIndex - 1)),
                _rowIndex: tempRowIndex,
                created_at: createdAt,
                ...item
              };

              const sheetPayload = mapModelToSheetRow(tableName, newItem);
              const sheetRes = await syncToSheet(tableName, 'insert', sheetPayload);
              if (sheetRes && sheetRes.rowIndex) {
                newItem._rowIndex = Number(sheetRes.rowIndex);
                newItem.id = 'row-' + (Number(sheetRes.rowIndex) - 1);
              }
              inserted.push(newItem);
            }

            store[tableName].push(...inserted);
            saveLocalStore(store);

            const resData = Array.isArray(insertPayload) ? inserted : inserted[0];
            return { data: resData, error: null };
          }

          // --- UPDATE IN GOOGLE SHEET ---
          if (operation === 'update') {
            const store = getLocalStore();
            if (!store[tableName]) store[tableName] = [];

            let count = 0;
            const updatedRows = [];
            store[tableName] = store[tableName].map(row => {
              let matches = true;
              for (const fn of filters) {
                if (!fn(row)) { matches = false; break; }
              }
              if (matches) {
                count++;
                const merged = { ...row, ...updatePayload };
                updatedRows.push(merged);
                return merged;
              }
              return row;
            });

            saveLocalStore(store);

            for (const row of updatedRows) {
              let rowIndex = row._rowIndex;
              if (!rowIndex && String(row.id).startsWith('row-')) {
                rowIndex = parseInt(String(row.id).replace('row-', ''), 10) + 1;
              }
              const sheetPayload = mapModelToSheetRow(tableName, row);
              if (rowIndex) {
                await syncToSheet(tableName, 'update', sheetPayload, rowIndex);
              } else {
                await syncToSheet(tableName, 'insert', sheetPayload);
              }
            }

            return { data: updatedRows, count, error: null };
          }

          // --- DELETE FROM GOOGLE SHEET ---
          if (operation === 'delete') {
            const store = getLocalStore();
            if (!store[tableName]) store[tableName] = [];

            const deletedRows = [];
            store[tableName] = store[tableName].filter(row => {
              let matches = true;
              for (const fn of filters) {
                if (!fn(row)) { matches = false; break; }
              }
              if (matches) {
                deletedRows.push(row);
                return false;
              }
              return true;
            });

            saveLocalStore(store);

            for (const row of deletedRows) {
              let rowIndex = row._rowIndex;
              if (!rowIndex && String(row.id).startsWith('row-')) {
                rowIndex = parseInt(String(row.id).replace('row-', ''), 10) + 1;
              }
              if (rowIndex) {
                await syncToSheet(tableName, 'delete', null, rowIndex);
              }
            }

            return { data: deletedRows, error: null };
          }

          // --- SELECT FROM GOOGLE SHEET ---
          let sheetRows = null;
          try {
            const rawData = await fetchSheetRows(tableName);
            if (Array.isArray(rawData)) {
              sheetRows = rawData.map((row, idx) => mapSheetRowToModel(tableName, row, idx));
            }
          } catch (e) {}

          const store = getLocalStore();
          let rows;
          if (Array.isArray(sheetRows) && sheetRows.length > 0) {
            rows = sheetRows.slice();
            store[tableName] = sheetRows;
            saveLocalStore(store);
          } else if (Array.isArray(sheetRows) && sheetRows.length === 0) {
            const fallbackRows = DEFAULT_DATABASE[tableName] || [];
            rows = fallbackRows.slice();
          } else {
            rows = (store[tableName] && store[tableName].length > 0 ? store[tableName] : (DEFAULT_DATABASE[tableName] || [])).slice();
          }

          // Apply filters
          for (const fn of filters) {
            rows = rows.filter(fn);
          }

          // Apply sorts
          if (sorts.length) {
            rows.sort((a, b) => {
              for (const { column, ascending } of sorts) {
                const valA = a[column];
                const valB = b[column];
                if (valA === valB) continue;
                if (valA === undefined || valA === null) return ascending ? 1 : -1;
                if (valB === undefined || valB === null) return ascending ? -1 : 1;
                if (valA < valB) return ascending ? -1 : 1;
                if (valA > valB) return ascending ? 1 : -1;
              }
              return 0;
            });
          }

          if (limitCount !== null) {
            rows = rows.slice(0, limitCount);
          }

          let result = rows;
          if (isSingle || maybeSingleMode) {
            result = rows[0] || null;
          }

          return { data: result, error: null };
        };

        return execute().then(onFulfilled, onRejected);
      }
    };

    return builder;
  }

  return {
    auth,
    from
  };
}

async function initSupabase() {
  if (supabaseInstance) return supabaseInstance;
  supabaseInstance = createLocalSupabaseClient();
  return supabaseInstance;
}

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createLocalSupabaseClient();
  }
  return supabaseInstance;
}

// Aliases for modern DB interface
const initDb = initSupabase;
const getDb = getSupabase;
