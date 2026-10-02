import { BlogPost, Project, Service, GalleryItem, Achievement, Testimonial, TimelineItem } from '../types';

export const PROFILE = {
  name: "Fahim Shahriar",
  tagline: "Medical Student (BDS) · Web Developer · Content Creator",
  badgeText: "Welcome to my personal space",
  avatarUrl: "https://i.postimg.cc/3JFfY1zb/screenshot-5.png?auto=format&fit=crop&w=900&q=85",
  shortBio: "A personal space for my journey in dentistry, technology, education, creative projects, research notes and everyday life.",
  longAbout: `I’m Fahim Shahriar, a dental student at Chittagong Medical College, Bangladesh. I’m interested in dentistry, healthcare, technology, education, and creativity. This is my personal space where I share my journey, thoughts, and experiences through photos, videos, articles, and other content. You can also learn about my studies, interests, skills, projects, and work here.`,
  storyParagraph1: `I am Fahim Shahriar, a BDS student interested in dentistry, medical education, technology and creative digital work. I enjoy learning practical tools and turning ideas into useful projects.`,
  storyParagraph2: `My long-term interests include modern dental systems, research, education, web development and building useful digital platforms that bridge healthcare and modern technology.`,
  institution: "Chattogram Medical College, Dental Unit",
  degree: "BDS (Bachelor of Dental Surgery)",
  location: "Chattogram, Bangladesh",
  primaryEmail: "x.fahim.shahriar@gmail.com",
  contactEmail: "fahim.shahriar@mail.com",
  websiteUrl: "https://www.fahimshahriar.com.bd",
  googleScriptUrl: "https://script.google.com/macros/s/AKfycbztBbwboWpdr3xxAxlgau8aEB216GJ9cyQcFm1OOrxvjjXiXR5otElvwx3AyvZWnkgt3Q/exec",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // embeddable format
  youtubeChannelUrl: "https://www.youtube.com/@fahim-shahriar-bd",
  socials: [
    {
      name: "Facebook",
      brand: "facebook",
      url: "https://www.facebook.com/fahim.shahriar.cumilla/",
      color: "#1877f2",
      icon: "facebook"
    },
    {
      name: "Instagram",
      brand: "instagram",
      url: "https://www.instagram.com/fahim.shahriar.bd/",
      color: "#e1306c",
      icon: "instagram"
    },
    {
      name: "YouTube",
      brand: "youtube",
      url: "https://www.youtube.com/@fahim-shahriar-bd",
      color: "#ff0000",
      icon: "youtube"
    },
    {
      name: "LinkedIn",
      brand: "linkedin",
      url: "https://www.linkedin.com/in/drfahimshahriar/",
      color: "#0a66c2",
      icon: "linkedin"
    },
    {
      name: "X (Twitter)",
      brand: "x",
      url: "https://x.com/fahimshahriarbd",
      color: "#111827",
      icon: "twitter"
    },
    {
      name: "TikTok",
      brand: "tiktok",
      url: "https://www.tiktok.com/@fahim.shahriar.bd",
      color: "#000000",
      icon: "video"
    }
  ],
  focusAreas: [
    { percentage: "40%", label: "Dental Learning", color: "from-blue-600 to-indigo-600" },
    { percentage: "30%", label: "Web & Digital Projects", color: "from-sky-500 to-blue-500" },
    { percentage: "10%", label: "Education & Content", color: "from-amber-500 to-orange-500" },
    { percentage: "20%", label: "Creative Personal Work", color: "from-emerald-500 to-teal-500" }
  ],
  tags: [
    "Dentistry",
    "Research",
    "Cooking",
    "Content",
    "Writing",
    "Photography",
    "Education",
    "Technology"
  ]
};

export const TIMELINE: TimelineItem[] = [
  {
    id: "journey-cmc",
    period: "Current",
    badge: "Current Academic Pursuit",
    title: "Studying at Chattogram Medical College, Dental Unit",
    institution: "Chattogram Medical College (CMC)",
    description: "Rigorous clinical dental training, oral anatomy, pathology, pharmacology, restorative procedures, patient communication, and comprehensive medical science.",
    grade: "BDS Student"
  },
  {
    id: "journey-hsc-ssc",
    period: "Academic Milestones",
    badge: "Board Examinations",
    title: "HSC & SSC Science with Perfect GPA 5.00",
    institution: "Ramkrishnapur College & Ramkrishnapur KKRK High School",
    description: "Completed Higher Secondary Certificate (HSC) in Science with GPA 5.00 from Ramkrishnapur College, and Secondary School Certificate (SSC) in Science with GPA 5.00 from Ramkrishnapur KKRK High School.",
    grade: "GPA 5.00 / 5.00"
  },
  {
    id: "journey-tech",
    period: "Continuous Learning",
    badge: "Self-Taught Engineering",
    title: "Technology, Web & Creative Digital Projects",
    institution: "Independent & Open Source Exploration",
    description: "Self-driven study in web standards, responsive front-end engineering, DNS routing, GitHub workflows, digital automation, design systems, and digital media production.",
    grade: "Independent Creator"
  }
];

export const SKILLS_CATEGORIES = [
  {
    id: "skill-dental",
    icon: "🦷",
    title: "Dental & Medical",
    description: "Study notes, tooth anatomy, oral physiology, dental materials, pharmacology, restorative dentistry, and evidence-based clinical summaries.",
    tags: ["BDS", "Medical Notes", "Tooth Anatomy", "Clinical Prep"]
  },
  {
    id: "skill-web",
    icon: "💻",
    title: "Web Development",
    description: "Personal and organizational websites, static architecture, GitHub Pages deployment, custom domain DNS, modern UI styling, and lightweight tools.",
    tags: ["HTML5", "CSS3 / Tailwind", "TypeScript", "GitHub", "DNS"]
  },
  {
    id: "skill-creative",
    icon: "🎨",
    title: "Creative Content",
    description: "Social media conceptualization, educational infographics, video scripting and editing, digital storytelling, and photography.",
    tags: ["Content Strategy", "Digital Graphics", "Video Production", "Photography"]
  }
];

export const PROJECTS: Project[] = [
  {
    id: "omega-tuition-media",
    title: "Omega Tuition Media",
    icon: "🎓",
    category: "education",
    description: "A specialized tuition media and educational digital initiative connecting dedicated tutors, passionate students, and guardians across Chattogram and beyond.",
    tags: ["Education", "Media", "Community", "Tutoring"],
    link: "https://www.facebook.com/omega.tuition.media",
    linkLabel: "View Project on Facebook",
    details: "Omega Tuition Media was established to simplify the process of pairing students with qualified home tutors and academic mentors. It handles screening, syllabus matching, and regular feedback channels for parents."
  },
  {
    id: "personal-website",
    title: "Personal Website & Portfolio",
    icon: "🌐",
    category: "web",
    description: "My personal digital identity, clinical study portal, article repository, and long-term knowledge hub built with modern web architecture and high performance.",
    tags: ["HTML / TSX", "Tailwind", "DNS", "GitHub Pages"],
    link: "https://www.fahimshahriar.com.bd",
    linkLabel: "Visit fahimshahriar.com.bd",
    details: "A custom portfolio engineered for blazing fast load times, accessible design, dark mode preference detection, and interactive content querying for visitors."
  },
  {
    id: "medical-dental-notes",
    title: "Medical & Dental Notes Library",
    icon: "📚",
    category: "medical",
    description: "A structured repository of high-yield dental anatomy, pharmacology, histology, and oral pathology notes tailored for medical and dental learners.",
    tags: ["Dental", "Research", "Notes", "BDS"],
    link: "#blog",
    linkLabel: "Read Study Notes",
    details: "High-yield diagrams, memory mnemonics, and distilled clinical summaries written during BDS coursework at Chattogram Medical College."
  },
  {
    id: "digital-tools",
    title: "Everyday Digital Automation Tools",
    icon: "⚙️",
    category: "tools",
    description: "Experiments with Google Apps Script, smart forms, automated data pipelines, spreadsheets, and productivity tools that streamline everyday administrative work.",
    tags: ["Automation", "Google Workspace", "Apps Script", "Productivity"],
    details: "Custom automation workflows handling contact form submissions directly to Google Sheets and sending confirmation notices automatically."
  },
  {
    id: "research-ideas",
    title: "Dental Research & Clinical Notes",
    icon: "🧪",
    category: "research",
    description: "A designated archive for documenting emerging dental technologies, public oral health strategies, antimicrobial advances, and research ideas.",
    tags: ["Research", "Public Health", "Oral Medicine"],
    details: "Literature reviews focusing on preventive dentistry, community fluoride programs in Bangladesh, and modern minimally invasive restorative techniques."
  },
  {
    id: "creative-productions",
    title: "Content Lab & Digital Identity",
    icon: "✨",
    category: "education",
    description: "New upcoming experiments, short-form medical educational clips, campus life vlogs, and creative photography projects currently in production.",
    tags: ["Future", "Video", "Creative", "Upcoming"],
    details: "A continuous creative incubator testing new formats for breaking down complex medical facts into engaging 60-second social videos."
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "article-dental-journey",
    title: "Dental Study Notes — My Learning Journey",
    category: "medical",
    categoryLabel: "Medical",
    date: "Oct 03, 2026",
    readTime: "4 min read",
    summary: "Reflections on transitioning into clinical dentistry at Chattogram Medical College, mastering oral anatomy, and the discipline required for clinical excellence.",
    coverImage: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=1000&q=85",
    tags: ["Dentistry", "Medical Education", "CMC", "Study Habits"],
    content: `Entering dental school at Chattogram Medical College has been both intensely demanding and deeply rewarding. Dentistry is a unique field where medical knowledge, fine surgical craftsmanship, and patient psychology converge.

### 1. The Anatomy of Dental Education
From dental anatomy and morphology to pharmacology and pathology, our curriculum lays down the groundwork before we pick up any handpiece. Every single groove, cusp, and pulp canal matters when preparing an effective restoration.

### 2. Clinical Observation & Hand Skills
One of the most critical early lessons is that textbook knowledge must quickly translate into tactile precision. Practicing on phantom heads and observing senior clinicians teaches you that patience and attention to micro-details dictate procedural success.

### 3. Sharing Knowledge Openly
I started writing down summarized study notes so that classmates and junior dental students can quickly review challenging concepts before clinical rounds. When you teach or write down a concept in plain English or Bengali, your own retention multiplies significantly.`
  },
  {
    id: "article-web-building",
    title: "How I Built My Personal Website from Scratch",
    category: "tech",
    categoryLabel: "Technology",
    date: "Oct 02, 2026",
    readTime: "5 min read",
    summary: "My experience configuring HTML, CSS, DNS records, GitHub Pages, and building a fast, sustainable personal digital identity independent of social media algorithms.",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=85",
    tags: ["Web Development", "DNS", "GitHub", "Self-Hosting"],
    content: `In an era where personal identity is often trapped within closed social media platforms, having an independent website is like owning your own plot of land on the internet.

### Why Every Student Should Own a Domain
A custom domain like \`fahimshahriar.com.bd\` represents your permanent digital portfolio. Whether applying for clinical electives, academic fellowships, or freelancing in digital media, a portfolio website gives you authority and trust.

### The Architecture & Lessons
1. **Semantic HTML & Clean Styling**: Fast load times matter, especially in areas with moderate mobile internet speeds. Stripping away heavy dependencies made this site load in under 400 milliseconds.
2. **Instant Search Indexing**: Rather than relying on external search engines, building client-side indexing lets visitors instantly search every note, project, and service card.
3. **Google Apps Script Form Endpoint**: You don't always need a paid backend to handle contact inquiries. A lightweight serverless Apps Script connects form inputs straight to Google Sheets with zero monthly cost.`
  },
  {
    id: "article-life-moments",
    title: "Life, College & Everyday Moments in Chattogram",
    category: "personal",
    categoryLabel: "Personal",
    date: "Oct 01, 2026",
    readTime: "3 min read",
    summary: "Balancing intense academic pressures with cooking, photography, tech hobbies, friendship, and the beauty of Chattogram.",
    coverImage: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1000&q=85",
    tags: ["Campus Life", "Chattogram", "Mindset", "Productivity"],
    content: `Medical school is a marathon, not a sprint. Without intentional breaks and creative hobbies, burnout is practically guaranteed.

### Finding Balance Through Making Things
Whenever clinical study sessions get overwhelming, shifting gears into cooking a hearty meal, tinkering with a web project, or walking around the campus with a camera resets my mental focus. 

The hills and breezy coastlines of Chattogram provide an incredible backdrop for reflection. Every day presents an opportunity to learn something new—whether it is a clinical technique, a cleaner snippet of code, or simply being a more empathetic human.`
  },
  {
    id: "article-education-tuition",
    title: "Omega Tuition Media: Empowering Learners",
    category: "education",
    categoryLabel: "Education",
    date: "Sep 28, 2026",
    readTime: "4 min read",
    summary: "The vision behind Omega Tuition Media: bridging the gap between student aspirations and trustworthy mentorship in Bangladesh.",
    coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85",
    tags: ["Mentorship", "Omega", "Education", "Tutoring"],
    content: `Education is the most transformative force in any society. However, finding dedicated tutors who understand individual student learning speeds is often difficult for parents.

Through **Omega Tuition Media**, we created a transparent platform where students are matched with vetted university scholars who not only teach the textbook curriculum but also share examination strategies, scientific curiosity, and study discipline.`
  }
];

export const SERVICES: Service[] = [
  {
    id: "service-tuition",
    icon: "🎓",
    title: "Tuition Media Management",
    description: "Education-focused digital promotion, teacher-student matching, mentorship coordination, and academic support frameworks.",
    highlights: ["Vetted tutor allocation", "Academic performance tracking", "Parental consultation"]
  },
  {
    id: "service-web",
    icon: "💻",
    title: "Web Development Help",
    description: "Clean responsive website architecture, portfolio setup, DNS routing, GitHub Pages configuration, and performance optimization.",
    highlights: ["Personal portfolio design", "Zero-cost hosting guidance", "SEO & mobile responsiveness"]
  },
  {
    id: "service-medical",
    icon: "🦷",
    title: "Medical / Dental Guidance",
    description: "Curated study notes, entry-level guidance for dental and medical exams, anatomy tips, and clinical reference summaries.",
    highlights: ["BDS study techniques", "Oral anatomy notes", "Peer mentorship"]
  },
  {
    id: "service-creative",
    icon: "🎬",
    title: "Creative Content & Media",
    description: "Ideas, scripting, visual aesthetics, and execution strategies for educational and promotional digital content.",
    highlights: ["Educational video ideas", "Social branding & assets", "Infographic design"]
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Campus Morning",
    category: "Campus",
    imageUrl: "https://i.postimg.cc/rFLt87HR/screenshot-7.png?auto=format&fit=crop&w=800&q=85",
    caption: "Chattogram Medical College campus grounds, dental unit entrance."
  },
  {
    id: "gal-2",
    title: "Clinical Environment",
    category: "Medical",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=85",
    caption: "Modern clinical workspace and patient diagnostic equipment."
  },
  {
    id: "gal-3",
    title: "Code & Development",
    category: "Technology",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=85",
    caption: "Late evening programming session refining clean web interfaces."
  },
  {
    id: "gal-4",
    title: "Team Collaboration",
    category: "Projects",
    imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=85",
    caption: "Brainstorming educational initiatives and community learning."
  },
  {
    id: "gal-5",
    title: "Focus & Execution",
    category: "Work",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=85",
    caption: "Digital tools management, form automations, and media workflow."
  },
  {
    id: "gal-6",
    title: "Reflective Notes",
    category: "Writing",
    imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=85",
    caption: "Drafting clinical thoughts, research ideas, and article manuscripts."
  },
  {
    id: "gal-7",
    title: "Medical Literature",
    category: "Learning",
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=85",
    caption: "Anatomy reference volumes and standard medical textbooks."
  },
  {
    id: "gal-8",
    title: "Moments & Perspective",
    category: "Personal",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=85",
    caption: "Moments outside the library, quiet reflection and daily life."
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach-1",
    icon: "🏆",
    title: "Academic Excellence — HSC & SSC GPA 5.00",
    institution: "Ramkrishnapur College & Ramkrishnapur KKRK High School",
    year: "Academic Milestone",
    description: "Earned highest grade marks (GPA 5.00 out of 5.00) in Science board examinations, establishing solid foundations in physics, chemistry, biology, and mathematics.",
    badge: "Perfect GPA 5.00"
  },
  {
    id: "ach-2",
    icon: "📜",
    title: "Chattogram Medical College Dental Unit Admission",
    institution: "Directorate General of Health Services (DGHS)",
    year: "Medical Merit",
    description: "Successfully secured government medical merit placement for the prestigious Bachelor of Dental Surgery (BDS) programme at Chattogram Medical College.",
    badge: "Govt Merit Admission"
  },
  {
    id: "ach-3",
    icon: "🔬",
    title: "Digital Portfolio & Platform Architect",
    institution: "Independent Web & Community Media",
    year: "Digital Projects",
    description: "Founder and architect of Omega Tuition Media and personal digital portals, connecting hundreds of students with academic mentors and free study material.",
    badge: "Digital Creator"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    quote: "Fahim's study notes and clear explanations simplified oral histology and anatomy for many of us. He has a gift for breaking down tough concepts into memorable outlines.",
    author: "BDS Classmate",
    role: "Dental Student, CMC",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    context: "Academic Collaboration"
  },
  {
    id: "t-2",
    quote: "Omega Tuition Media solved our tutoring search within 24 hours. The professionalism and genuine care for students' learning pace sets Fahim apart.",
    author: "Guardian & Parent",
    role: "Chattogram Resident",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    context: "Tuition Mentorship"
  },
  {
    id: "t-3",
    quote: "Fahim blends clinical curiosity with a genuine grasp of web technology. His attention to detail on website setup, speed, and usability is remarkable.",
    author: "Tech & Design Colleague",
    role: "Web Collaborator",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    context: "Digital Project Partner"
  }
];
