"use client";
import React from 'react';
import { LayoutDashboard, Settings, LogOut, Hexagon, FileText, Archive as ArchiveIcon, Calendar as CalendarIcon, Sun, Moon } from 'lucide-react';
import { supabase, isMockMode } from '@/lib/supabaseClient';
import styles from './Sidebar.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }

    if (isMockMode) {
      setUserEmail("guest@taskly.app");
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userName = userEmail ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1) : null;

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
      window.location.reload();
    } else {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <aside className={`glass-panel ${styles.sidebar}`}>
      <div className={styles.brand}>
        <Hexagon size={32} color="var(--accent-blue)" />
        <h2>Taskly</h2>
      </div>

      {userName && (
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>{userName.charAt(0)}</div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userEmail}>{userEmail}</span>
          </div>
        </div>
      )}
      
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
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.navLink} onClick={toggleTheme} style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <Link href="/settings" className={`${styles.navLink} ${pathname === '/settings' ? styles.active : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <a href="#" className={styles.navLink} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}
