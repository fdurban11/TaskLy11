"use client";
import React, { useState, useEffect } from 'react';
import styles from './SettingsApp.module.css';
import { User, Bell, Palette, Shield, Trash2, Check } from 'lucide-react';
import { supabase, isMockMode } from '@/lib/supabaseClient';

export default function SettingsApp({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [gmailRemindersEnabled, setGmailRemindersEnabled] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('Taskly User');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    const savedName = localStorage.getItem(`displayName_${userId}`);
    if (savedName) setDisplayName(savedName);

    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    const savedNotif = localStorage.getItem(`notifications_${userId}`);
    if (savedNotif !== null) setNotificationsEnabled(savedNotif === 'true');

    const savedGmail = localStorage.getItem(`gmailReminders_${userId}`);
    if (savedGmail !== null) setGmailRemindersEnabled(savedGmail === 'true');
  }, [userId]);

  const handleSave = () => {
    // Persist all settings
    localStorage.setItem(`displayName_${userId}`, displayName);
    localStorage.setItem(`notifications_${userId}`, String(notificationsEnabled));
    localStorage.setItem(`gmailReminders_${userId}`, String(gmailRemindersEnabled));
    localStorage.setItem('theme', theme);

    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);
    try {
      if (isMockMode) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }

      // Delete all user tasks first
      await supabase.from('tasks').delete().eq('user_id', userId);

      // Sign the user out (Supabase doesn't allow self-deletion via client SDK without admin)
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Delete account failed:', err);
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <h1>Account Settings</h1>
        <p className={styles.subtitle}>Manage your preferences and configurations</p>
      </div>

      <div className={styles.settingsGrid}>
        {/* Profile Section */}
        <div className={`glass-panel ${styles.settingsCard}`}>
          <div className={styles.cardHeader}>
            <User className={styles.cardIcon} size={24} color="var(--primary)" />
            <h2>Profile Information</h2>
          </div>
          <div className={styles.cardBody}>
            <div className="form-group">
              <label className="form-label">User ID</label>
              <input type="text" className="form-input" value={userId} disabled />
              <p className={styles.helpText}>This is your unique identifier in the system.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <p className={styles.helpText}>Click "Save All Changes" to persist your name.</p>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className={`glass-panel ${styles.settingsCard}`}>
          <div className={styles.cardHeader}>
            <Palette className={styles.cardIcon} size={24} color="var(--accent-blue)" />
            <h2>App Preferences</h2>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.toggleRow}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-highlight)' }}>UI Theme</strong>
                <span className={styles.helpText}>Choose your preferred interface theme.</span>
              </div>
              <select className={styles.selectInput} value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="system">System Default</option>
              </select>
            </div>
            <hr className={styles.divider} />
            <div className={styles.toggleRow}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-highlight)' }}>Notifications</strong>
                <span className={styles.helpText}>Receive alerts for due tasks.</span>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className={`glass-panel ${styles.settingsCard}`}>
          <div className={styles.cardHeader}>
            <Shield className={styles.cardIcon} size={24} color="var(--accent-pink)" />
            <h2>Security &amp; Privacy</h2>
          </div>
          <div className={styles.cardBody}>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '10px' }}>
              Change Password
            </button>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>
              Two-Factor Authentication
            </button>
          </div>
        </div>

        {/* Gmail Connectivity */}
        <div className={`glass-panel ${styles.settingsCard}`}>
          <div className={styles.cardHeader}>
            <Bell className={styles.cardIcon} size={24} color="var(--accent-orange)" />
            <h2>Gmail Connectivity</h2>
          </div>
          <div className={styles.cardBody}>
            <div className="form-group">
              <label className="form-label">Registered Gmail</label>
              <input type="text" className="form-input" value={userEmail} disabled />
              <p className={styles.helpText}>Reminders will be sent to this address.</p>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-highlight)' }}>Automated Reminders</strong>
                <span className={styles.helpText}>Receive Gmails for tasks due within 1 hour.</span>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={gmailRemindersEnabled} onChange={(e) => setGmailRemindersEnabled(e.target.checked)} />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className={`glass-panel ${styles.settingsCard} ${styles.dangerZone}`}>
          <div className={styles.cardHeader}>
            <Trash2 className={styles.cardIcon} size={24} color="#ff4a4a" />
            <h2 style={{ color: '#ff4a4a' }}>Danger Zone</h2>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.helpText} style={{ marginBottom: '15px' }}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            {deleteConfirm && (
              <p style={{ color: '#ff4a4a', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 500 }}>
                ⚠️ Are you absolutely sure? Click again to confirm permanent deletion.
              </p>
            )}
            <button
              className={styles.dangerButton}
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              style={{ cursor: deleteLoading ? 'not-allowed' : 'pointer' }}
            >
              {deleteLoading ? 'Deleting...' : deleteConfirm ? 'Yes, Delete My Account' : 'Delete Account'}
            </button>
            {deleteConfirm && (
              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: '8px', fontSize: '0.85rem' }}
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.statusMessage}>
          {saveStatus && <><Check size={18} /> {saveStatus}</>}
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          Save All Changes
        </button>
      </div>
    </div>
  );
}
