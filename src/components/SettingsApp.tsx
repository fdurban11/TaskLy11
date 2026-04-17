"use client";
import React, { useState } from 'react';
import styles from './SettingsApp.module.css';
import { User, Bell, Palette, Shield, Trash2, LogOut, Check } from 'lucide-react';

export default function SettingsApp({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [gmailRemindersEnabled, setGmailRemindersEnabled] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = () => {
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
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
              <label className="form-label">User ID (Mock / System)</label>
              <input type="text" className="form-input" value={userId} disabled />
              <p className={styles.helpText}>This is your unique identifier in the system.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input type="text" className="form-input" placeholder="e.g. John Doe" defaultValue="Taskly User" />
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
                <option value="light">Light Theme (Coming Soon)</option>
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
            <h2>Security & Privacy</h2>
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
            <button className={styles.dangerButton}>
              Delete Account
            </button>
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
