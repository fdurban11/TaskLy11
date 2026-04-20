"use client";
import React from 'react';
import { LayoutDashboard, Settings, LogOut, Hexagon, FileText, Archive as ArchiveIcon, Calendar as CalendarIcon, Sun, Moon, User as UserIcon } from 'lucide-react';
import { supabase, isMockMode } from '@/lib/supabaseClient';
import styles from './Sidebar.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [displayName, setDisplayName] = React.useState('User');
  const pathname = usePathname();

  React.useEffect(() => {
    // Theme sync
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Function to derive name from session or storage
    const resolveName = (session?: any) => {
      // 1. Priority: Manual display name from Settings
      const savedName = localStorage.getItem('taskly_display_name');
      if (savedName) return savedName;

      // 2. Secondary: Session user metadata
      if (session?.user?.user_metadata?.full_name) return session.user.user_metadata.full_name;
      if (session?.user?.user_metadata?.display_name) return session.user.user_metadata.display_name;

      // 3. Fallback: Email handle
      if (isMockMode) {
        const mockEmail = localStorage.getItem('mockUserEmail');
        if (mockEmail) return mockEmail.split('@')[0];
      } else if (session?.user?.email) {
        return session.user.email.split('@')[0];
      }

      return 'User';
    };

    // Auth sync logic
    const checkAuth = async () => {
      if (isMockMode) {
        const userId = localStorage.getItem('mockUserId');
        setIsLoggedIn(!!userId);
        if (userId) setDisplayName(resolveName());
      } else {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setIsLoggedIn(!!session?.user);
          if (session?.user) setDisplayName(resolveName(session));
        } catch (e) {
          console.error("Auth check failed", e);
        }
      }
    };

    checkAuth();

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'taskly_display_name') {
        const newName = e.newValue || 'User';
        setDisplayName(newName);
      }
    };

    // Listen for custom event from Settings page (immediate sync)
    const handleDisplayNameUpdate = (e: any) => {
      setDisplayName(e.detail || 'User');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('taskly_name_updated', handleDisplayNameUpdate);

    let authSubscription: any;
    if (!isMockMode) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsLoggedIn(!!session?.user);
        if (session?.user) setDisplayName(resolveName(session));
      });
      authSubscription = subscription;
    } else {
      // Mock mode periodic check to handle local login/logout
      const interval = setInterval(checkAuth, 1000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('taskly_name_updated', handleDisplayNameUpdate);
      };
    }

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('taskly_name_updated', handleDisplayNameUpdate);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMockMode) {
      localStorage.removeItem('mockUserId');
      localStorage.removeItem('mockUserEmail');
      localStorage.removeItem('taskly_display_name');
      window.location.reload();
    } else {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  if (!isLoggedIn) return null;

  // Extract first name for a warmer greeting
  const firstName = displayName.split(' ')[0] || 'User';

  return (
    <aside className={`glass-panel ${styles.sidebar}`}>
      <div className={styles.brand}>
        <Hexagon size={32} color="var(--accent-blue)" />
        <h2>Taskly</h2>
      </div>

      <div className={styles.greeting}>
        <UserIcon size={16} />
        <span>Hello, {firstName}</span>
      </div>
      
      <nav className={styles.navMenu}>
        <Link href="/dashboard" className={`${styles.navLink} ${pathname === '/dashboard' ? styles.active : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link href="/notes" className={`${styles.navLink} ${pathname === '/notes' ? styles.active : ''}`}>
          <FileText size={20} />
          <span>Note Taker</span>
        </Link>
        <Link href="/calendar" className={`${styles.navLink} ${pathname === '/calendar' ? styles.active : ''}`}>
          <CalendarIcon size={20} />
          <span>Calendar</span>
        </Link>
        <Link href="/archive" className={`${styles.navLink} ${pathname === '/archive' ? styles.active : ''}`}>
          <ArchiveIcon size={20} />
          <span>Archived Tasks</span>
        </Link>
        <button className={styles.navLink} onClick={toggleTheme} style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </nav>

      <div className={styles.sidebarFooter}>
        <Link href="/settings" className={`${styles.navLink} ${pathname === '/settings' ? styles.active : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <a href="#" className={styles.navLink} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </a >
      </div>
    </aside>
  );
}
