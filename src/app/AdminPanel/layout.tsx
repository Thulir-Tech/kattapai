'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FolderTree, 
  BookOpen, 
  TrendingUp, 
  Settings as SettingsIcon,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { AuthService } from '@/services/auth.service';
import { clearAdminSessionCookie } from '@/features/auth/auth.actions';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/AdminPanel', icon: LayoutDashboard },
  { label: 'Products', href: '/AdminPanel/products', icon: ShoppingBag },
  { label: 'Categories', href: '/AdminPanel/categories', icon: FolderTree },
  { label: 'Blogs', href: '/AdminPanel/blogs', icon: BookOpen },
  { label: 'Analytics', href: '/AdminPanel/analytics', icon: TrendingUp },
  { label: 'Settings', href: '/AdminPanel/settings', icon: SettingsIcon },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  // States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<{ email: string | null; displayName: string | null } | null>(null);

  // Authentication & Session Guard
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        // No client user - enforce cleanup
        await clearAdminSessionCookie();
        setIsAuthenticated(false);
        setIsVerifying(false);
        if (pathname !== '/AdminPanel/login') {
          router.push('/AdminPanel/login');
        }
        return;
      }

      // Valid authenticated admin session
      setAdminUser({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Site Administrator',
      });
      setIsAuthenticated(true);
      setIsVerifying(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Theme Syncing
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      await clearAdminSessionCookie();
      router.push('/AdminPanel/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 1. Skip entire shell layout if page is `/AdminPanel/login`
  if (pathname === '/AdminPanel/login') {
    return <>{children}</>;
  }

  // 2. Loading State (Guard)
  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-300">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide uppercase">Securing Session...</p>
      </div>
    );
  }

  // 3. Fallback Protection
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-300 px-6 text-center">
        <ShieldAlert className="w-14 h-14 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Session Unauthorized</h2>
        <p className="text-sm text-zinc-500 mt-2 max-w-sm">
          Please check your admin credentials or sign in again.
        </p>
        <button
          onClick={() => router.push('/AdminPanel/login')}
          className="mt-6 bg-violet-600 hover:bg-violet-500 px-6 py-2.5 rounded-xl font-semibold text-white transition-all shadow-[0_4px_15px_rgba(139,92,246,0.2)]"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl shrink-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.2)]">
            <LayoutDashboard className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            EasyKart Admin
          </span>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/AdminPanel' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-violet-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.2)]' 
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Profile / Logout) */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-100/30 dark:bg-zinc-900/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700">
              <UserIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200">{adminUser?.displayName}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{adminUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors border border-red-500/20 group cursor-pointer"
          >
            <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* 2. Mobile Nav Drawer Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="font-bold">EasyKart Admin</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/AdminPanel' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive 
                    ? 'bg-violet-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.15)]' 
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0 text-zinc-400" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate">{adminUser?.displayName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{adminUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="hidden md:block text-sm font-semibold tracking-wide uppercase text-zinc-500">
              {pathname === '/AdminPanel' ? 'Admin Overview' : pathname.split('/').slice(2).join(' / ')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all cursor-pointer hover:shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500 animate-fadeIn" />
              ) : (
                <Moon className="w-4 h-4 text-violet-500 animate-fadeIn" />
              )}
            </button>

            {/* Quick Profile Summary Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">ADMIN</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel Viewport */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
