export interface BlogPost {
  id: string;
  title: string;
  category: 'medical' | 'tech' | 'education' | 'personal';
  categoryLabel: string;
  date: string;
  readTime: string;
  summary: string;
  content: string;
  coverImage: string;
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  icon: string;
  description: string;
  tags: string[];
  link?: string;
  linkLabel?: string;
  details?: string;
  category: 'web' | 'education' | 'medical' | 'tools' | 'research';
}

export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlights: string[];
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  caption: string;
  date?: string;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  institution: string;
  year?: string;
  description: string;
  badge?: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar: string;
  context: string;
}

export interface TimelineItem {
  id: string;
  period: string;
  badge: string;
  title: string;
  institution: string;
  description: string;
  grade?: string;
}

export interface SearchItem {
  id: string;
  title: string;
  type: string;
  sectionId: string;
  snippet: string;
  keywords: string;
}
