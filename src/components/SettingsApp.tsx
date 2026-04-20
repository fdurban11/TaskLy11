"use client";
import React, { useState, useEffect } from 'react';
import styles from './SettingsApp.module.css';
import { User, Bell, Shield, Trash2, Mail, Check, X, Lock, Key, AlertTriangle } from 'lucide-react';
import { supabase, isMockMode } from '@/lib/supabaseClient';

interface SettingsState {
  displayName: string;
  gmail: string;
  remindersEnabled: boolean;
  '2faEnabled': boolean;
  dueTaskAlerts: boolean;
  dailyDigest: boolean;
}

export default function SettingsApp({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [settings, setSettings] = useState<SettingsState>({
    displayName: 'Taskly User',
    gmail: userEmail || '',
    remindersEnabled: true,
    '2faEnabled': false,
    dueTaskAlerts: true,
    dailyDigest: false,
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Password Modal Fields
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('taskly_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    
    // Explicitly check for display name for sidebar sync
    const savedName = localStorage.getItem('taskly_display_name');
    if (savedName) setSettings(prev => ({ ...prev, displayName: savedName }));
  }, [userEmail]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveToStorage = (newSettings: Partial<SettingsState>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('taskly_settings', JSON.stringify(updated));
    
    if (newSettings.displayName !== undefined) {
      localStorage.setItem('taskly_display_name', newSettings.displayName);
      window.dispatchEvent(new CustomEvent('taskly_name_updated', { detail: newSettings.displayName }));
    }
  };

  const handleProfileSave = () => {
    saveToStorage({ displayName: settings.displayName });
    showToast('Profile updated successfully!');
  };

  const handleGmailSave = () => {
    saveToStorage({ 
      gmail: settings.gmail, 
      remindersEnabled: settings.remindersEnabled 
    });
    showToast('Gmail connectivity saved!');
  };

  const handleToggleChange = (key: keyof SettingsState) => {
    const newVal = !settings[key];
    saveToStorage({ [key]: newVal });
    showToast(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${newVal ? 'enabled' : 'disabled'}`);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    if (passwords.new.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    // Mock save
    showToast('Password changed successfully!');
    setIsPasswordModalOpen(false);
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    showToast('Account data cleared. Redirecting...');
    
    setTimeout(() => {
      localStorage.clear();
      if (isMockMode) {
        window.location.href = '/';
      } else {
        supabase.auth.signOut().then(() => {
          window.location.href = '/';
        });
      }
    }, 2000);
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p className={styles.subtitle}>Configure your account and application behavior</p>
      </div>

      <div className={styles.settingsGrid}>
        {/* Profile Card */}
        <div className={`glass-panel ${styles.settingsCard} animate-fade-in`}>
          <div className={styles.cardHeader}>
            <User className={styles.cardIcon} size={24} />
            <h2>Profile Details</h2>
          </div>
          <div className={styles.cardBody}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <div className={styles.inputWithButton}>
                <input 
                  type="text" 
                  className="form-input" 
                  value={settings.displayName} 
                  onChange={(e) => setSettings({...settings, displayName: e.target.value})}
                  placeholder="Your Name"
                />
                <button className="btn btn-primary" onClick={handleProfileSave}>Save</button>
              </div>
            </div>
            <p className={styles.helpText}>This name will be used in your sidebar greeting.</p>
          </div>
        </div>

        {/* Security & Privacy Card */}
        <div className={`glass-panel ${styles.settingsCard} animate-fade-in delay-100`}>
          <div className={styles.cardHeader}>
            <Shield className={styles.cardIcon} size={24} />
            <h2>Security & Privacy</h2>
          </div>
          <div className={styles.cardBody}>
            <button className="btn btn-secondary" onClick={() => setIsPasswordModalOpen(true)} style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Lock size={18} /> Change Password
            </button>
            <div className={styles.toggleRow}>
              <div>
                <strong>Two-Factor Authentication</strong>
                <p className={styles.helpText}>Add an extra layer of security.</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={settings['2faEnabled']} 
                  onChange={() => handleToggleChange('2faEnabled')} 
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>

        {/* Gmail Connectivity Card */}
        <div className={`glass-panel ${styles.settingsCard} animate-fade-in delay-200`}>
          <div className={styles.cardHeader}>
            <Mail className={styles.cardIcon} size={24} />
            <h2>Gmail Connectivity</h2>
          </div>
          <div className={styles.cardBody}>
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={settings.gmail} 
                onChange={(e) => setSettings({...settings, gmail: e.target.value})}
              />
            </div>
            <div className={styles.toggleRow}>
              <div>
                <strong>Automated Reminders</strong>
                <p className={styles.helpText}>Gmails for tasks due within 1 hour.</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={settings.remindersEnabled} 
                  onChange={() => setSettings({...settings, remindersEnabled: !settings.remindersEnabled})} 
                />
                <span className={styles.slider}></span>
              </label>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={handleGmailSave}>Save Changes</button>
          </div>
        </div>

        {/* Notifications Card */}
        <div className={`glass-panel ${styles.settingsCard} animate-fade-in delay-300`}>
          <div className={styles.cardHeader}>
            <Bell className={styles.cardIcon} size={24} />
            <h2>Notifications</h2>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.toggleRow}>
              <div>
                <strong>Due Task Alerts</strong>
                <p className={styles.helpText}>Alerts for soon-to-be overdue tasks.</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={settings.dueTaskAlerts} 
                  onChange={() => handleToggleChange('dueTaskAlerts')} 
                />
                <span className={styles.slider}></span>
              </label>
            </div>
            <hr className={styles.divider} />
            <div className={styles.toggleRow}>
              <div>
                <strong>Daily Digest</strong>
                <p className={styles.helpText}>Morning summary of your day.</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={settings.dailyDigest} 
                  onChange={() => handleToggleChange('dailyDigest')} 
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className={`glass-panel ${styles.settingsCard} ${styles.dangerZone} animate-fade-in delay-300`}>
          <div className={styles.cardHeader}>
            <Trash2 className={styles.cardIcon} size={24} color="var(--accent-pink)" />
            <h2 style={{ color: 'var(--accent-pink)' }}>Danger Zone</h2>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.helpText}>Permanently delete your account and all associated data.</p>
            <button className={styles.dangerButton} onClick={() => setIsDeleteModalOpen(true)}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass-panel`}>
            <div className={styles.modalHeader}>
              <Key size={24} color="var(--primary)" />
              <h2>Change Password</h2>
              <button className={styles.closeBtn} onClick={() => setIsPasswordModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handlePasswordChange} className={styles.modalBody}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass-panel`}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={24} color="var(--accent-pink)" />
              <h2 style={{ color: 'var(--accent-pink)' }}>Delete Account?</h2>
              <button className={styles.closeBtn} onClick={() => setIsDeleteModalOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you absolutely sure? This action is <strong>irreversible</strong> and will delete all your tasks, notes, and profile data.</p>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Type <strong>DELETE</strong> to confirm</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
              <div className={styles.modalFooter}>
                <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                <button 
                  className={`${styles.dangerButton} ${deleteConfirmText !== 'DELETE' ? styles.disabled : ''}`} 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                >
                  Confirm Deletion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
