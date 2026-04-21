"use client";

export type LogType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREATE' 
  | 'MODIFY' 
  | 'DELETE' 
  | 'ARCHIVE' 
  | 'COMPLETE' 
  | 'SETTINGS_CHANGE' 
  | 'PASSWORD_CHANGE' 
  | '2FA_TOGGLE';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  description: string;
  source: string;
}

const STORAGE_KEY = 'taskly_audit_logs';

export const addAuditLog = (type: LogType, description: string, source: string) => {
  if (typeof window === 'undefined') return;

  try {
    const savedLogs = localStorage.getItem(STORAGE_KEY);
    const logs: AuditLogEntry[] = savedLogs ? JSON.parse(savedLogs) : [];

    const newLog: AuditLogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      type,
      description,
      source
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([newLog, ...logs]));
    
    // Dispatch custom event for real-time updates if the logs page is open
    window.dispatchEvent(new CustomEvent('taskly_logs_updated'));
  } catch (e) {
    console.error("Failed to add audit log", e);
  }
};
