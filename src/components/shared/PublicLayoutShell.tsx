'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  ChevronDown, 
  Menu, 
  X, 
  Mail, 
  ArrowRight, 
  ShoppingBag, 
  BookOpen, 
  Globe, 
  ExternalLink,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { Category, SiteSettings } from '@/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface PublicLayoutShellProps {
  children: React.ReactNode;
  categories: Category[];
  settings: SiteSettings;
}

// Bulletproof Brand Icons
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

export default function PublicLayoutShell({ children, categories, settings: initialSettings }: PublicLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Dynamic live settings state synced with Firestore in real-time
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);

  // Navigation Drawer States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  // Instant Search Dialog Modal States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Newsletter States
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // 1. Sync settings dynamically with Firestore in real-time on the client side
  useEffect(() => {
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SiteSettings;
        setSettings(data);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Sync active theme color variables dynamically on theme settings update
  useEffect(() => {
    const themeColor = settings.themeColor || 'violet';
    const themeColorMapping: Record<string, { p400: string; p500: string; p600: string }> = {
      violet: { p400: '#a78bfa', p500: '#8b5cf6', p600: '#7c3aed' },
      blue: { p400: '#60a5fa', p500: '#3b82f6', p600: '#2563eb' },
      emerald: { p400: '#34d399', p500: '#10b981', p600: '#059669' },
      rose: { p400: '#fb7185', p500: '#f43f5e', p600: '#e11d48' },
      amber: { p400: '#fbbf24', p500: '#f59e0b', p600: '#d97706' },
      indigo: { p400: '#818cf8', p500: '#6366f1', p600: '#4f46e5' }
    };
    const activeColor = themeColorMapping[themeColor] || themeColorMapping.violet;
    
    document.documentElement.style.setProperty('--primary-400', activeColor.p400);
    document.documentElement.style.setProperty('--primary-500', activeColor.p500);
    document.documentElement.style.setProperty('--primary-600', activeColor.p600);
  }, [settings.themeColor]);

  // Close mobile menus on path shifts
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCategoryOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Enforce session isolation for Admin Dashboard Panel paths
  const isAdminPath = pathname.startsWith('/AdminPanel');
  if (isAdminPath) {
    return <>{children}</>;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setIsSubscribed(false), 5000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* 1. Header Navigation Bar (Glassmorphic) */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/50 dark:border-zinc-900/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {!settings.logoURL && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex items-center gap-2">
              {settings.logoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={settings.logoURL} 
                  alt="" 
                  className="h-7 w-auto object-contain max-w-[100px]" 
                />
              )}
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-zinc-950 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent group-hover:opacity-90">
                {settings.siteName}
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            {/* Home */}
            <Link href="/" className={`transition-colors hover:text-violet-600 dark:hover:text-violet-400 ${pathname === '/' ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
              Home
            </Link>

            {/* Categories Dropdown */}
            <div className="relative group/dropdown">
              <button 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors py-2 cursor-pointer"
              >
                Categories
                <ChevronDown className="w-4 h-4 transition-transform group-hover/dropdown:rotate-180" />
              </button>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-56 mt-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:translate-y-0 group-hover/dropdown:pointer-events-auto transition-all duration-200 before:content-[''] before:absolute before:inset-x-0 before:-top-3 before:h-3">
                {categories.length === 0 ? (
                  <span className="block px-4 py-2.5 text-xs text-zinc-400">No categories config</span>
                ) : (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className="block px-4 py-2.5 text-xs rounded-xl font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Products (Shop) */}
            <Link href="/products" className={`transition-colors hover:text-violet-600 dark:hover:text-violet-400 ${pathname.startsWith('/products') ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
              Recommend Shop
            </Link>

            {/* Blogs */}
            <Link href="/blog" className={`transition-colors hover:text-violet-600 dark:hover:text-violet-400 ${pathname.startsWith('/blog') ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
              Articles & Guides
            </Link>
          </nav>

          {/* Quick Access Icons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all cursor-pointer hover:shadow-sm"
              aria-label="Search Catalogue"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggler */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Mobile Drawer Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-xs md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Drawer Menu */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-zinc-950 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            Navigation
          </span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto font-semibold">
          <Link href="/" className="block px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300">
            Home Overview
          </Link>
          <Link href="/products" className="block px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300">
            Recommend Shop
          </Link>
          <Link href="/blog" className="block px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300">
            Articles & Guides
          </Link>
          
          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-4">
            <span className="block px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Popular Verticals</span>
            {categories.slice(0, 5).map(cat => (
              <Link 
                key={cat.id} 
                href={`/products?category=${cat.slug}`}
                className="block px-4 py-2.5 text-sm rounded-xl font-semibold text-zinc-500 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* 3. Floating Search Dialog Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-28 px-4 animate-fadeIn">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs" onClick={() => setIsSearchOpen(false)} />
          
          {/* Search box content */}
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800/80 flex flex-col">
            <form onSubmit={handleSearchSubmit} className="flex items-center px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/80 gap-3">
              <Search className="w-5 h-5 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Type keywords to search catalogue..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-zinc-900 dark:text-zinc-50 outline-none text-sm"
              />
              <button 
                type="button" 
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
            
            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/10 text-right shrink-0">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block">Press Enter key to execute search query</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Page Viewport Children Content */}
      <main className="flex-grow flex flex-col min-w-0">
        {children}
      </main>

      {/* 5. Public Footer Component */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800/60 pt-16 pb-8 px-6 shrink-0 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
          
          {/* Footer Logo & Brand info */}
          <div className="space-y-4 md:col-span-2 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md">
                {settings.logoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={settings.logoURL} 
                    alt="" 
                    className="h-7 w-auto object-contain max-w-[100px] absolute" 
                  />
                )}
              </div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-zinc-950 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
                {settings.siteName}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {settings.siteDescription}
            </p>
            {/* Legal Amazon Affiliate Disclaimer */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 text-[10px] text-zinc-400/90 leading-relaxed font-medium">
              <strong>Affiliate Disclosure:</strong> {settings.siteName} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, we earn from qualifying purchases. All references are subject to real-time changes.
            </div>
          </div>

          {/* Quick Category Footer Links */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs tracking-wider uppercase text-zinc-400">Popular Categories</h4>
            <div className="space-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {categories.slice(0, 4).map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="block hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  {cat.name}
                </Link>
              ))}
              <Link href="/products" className="block text-violet-500 hover:underline">
                Explore Full catalogue
              </Link>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs tracking-wider uppercase text-zinc-400 text-zinc-500">Subscribe newsletter</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">Get curated product reviews, hand-picked buying guides, and exclusive discount deals direct to your inbox.</p>
            
            {isSubscribed ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl text-xs font-bold animate-pulse">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Subscribed! Check email soon.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl pl-10 pr-3 py-2.5 text-xs outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl transition-all cursor-pointer shadow-md"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Social Mapping Redirection Icons */}
            <div className="flex items-center gap-3 pt-4 text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/40">
              {settings.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-violet-500 transition-colors">
                  <FacebookIcon />
                </a>
              )}
              {settings.socialLinks?.twitter && (
                <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-violet-500 transition-colors">
                  <TwitterIcon />
                </a>
              )}
              {settings.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-violet-500 transition-colors">
                  <InstagramIcon />
                </a>
              )}
              {settings.socialLinks?.youtube && (
                <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-violet-500 transition-colors">
                  <YoutubeIcon />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer bottom links */}
        <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-400 font-medium gap-4">
          <span>&copy; {new Date().getFullYear()} {settings.siteName} Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Terms of Service</Link>
            <Link href="/cookie-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
