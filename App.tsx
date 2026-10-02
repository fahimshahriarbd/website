import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Journey } from './components/Journey';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { Blog } from './components/Blog';
import { FeaturedVideo } from './components/FeaturedVideo';
import { Services } from './components/Services';
import { Gallery } from './components/Gallery';
import { Achievements } from './components/Achievements';
import { Testimonials } from './components/Testimonials';
import { ResumeSection } from './components/ResumeSection';
import { ContentLibrary } from './components/ContentLibrary';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { SearchModal } from './components/SearchModal';
import { ResumeModal } from './components/ResumeModal';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fahim-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Sync dark mode class & data-theme on document element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('fahim-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('fahim-theme', 'light');
    }
  }, [darkMode]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        setSearchInitialQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // IntersectionObserver for active section highlighting in header
  useEffect(() => {
    const sectionIds = [
      'home',
      'about',
      'journey',
      'skills',
      'projects',
      'blog',
      'videos',
      'services',
      'gallery',
      'achievements',
      'testimonials',
      'library',
      'contact'
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleOpenSearchWithTag = (tag: string) => {
    setSearchInitialQuery(tag);
    setIsSearchOpen(true);
  };

  const handleSelectSearchResult = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('search-hit');
      setTimeout(() => {
        element.classList.remove('search-hit');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-[#0b1120] text-[#172033] dark:text-[#f1f5f9] font-sans antialiased selection:bg-blue-600/20 selection:text-blue-600 transition-colors duration-200">
      {/* Navigation Header with Reading Progress */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSearch={() => {
          setSearchInitialQuery('');
          setIsSearchOpen(true);
        }}
        activeSection={activeSection}
      />

      {/* Main Content Sections */}
      <main>
        <Hero
          onOpenSearchWithTag={handleOpenSearchWithTag}
          onOpenCvModal={() => setIsCvModalOpen(true)}
        />

        <About onOpenSearchWithTag={handleOpenSearchWithTag} />

        <Journey />

        <Skills onOpenSearchWithTag={handleOpenSearchWithTag} />

        <Projects onOpenSearchWithTag={handleOpenSearchWithTag} />

        <Blog onOpenSearchWithTag={handleOpenSearchWithTag} />

        <FeaturedVideo />

        <Services />

        <Gallery />

        <Achievements />

        <Testimonials />

        <ResumeSection onOpenCvModal={() => setIsCvModalOpen(true)} />

        <ContentLibrary onSelectTarget={handleSelectSearchResult} />

        <Contact />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Back to Top Button */}
      <BackToTop />

      {/* Interactive Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        initialQuery={searchInitialQuery}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Printable / Interactive CV Modal */}
      <ResumeModal
        isOpen={isCvModalOpen}
        onClose={() => setIsCvModalOpen(false)}
      />
    </div>
  );
}
