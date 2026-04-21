"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styles from './LogsApp.module.css';
import { Shield, Search, Filter, Lock, Calendar, Zap, AlertCircle } from 'lucide-react';
import { AuditLogEntry, LogType } from '@/lib/auditLogger';

export default function LogsApp() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [visibleCount, setVisibleCount] = useState(20);

  const fetchLogs = () => {
    const saved = localStorage.getItem('taskly_audit_logs');
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Listen for real-time updates
    window.addEventListener('taskly_logs_updated', fetchLogs);
    return () => window.removeEventListener('taskly_logs_updated', fetchLogs);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterType === 'ALL' || log.type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [logs, searchQuery, filterType]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  const getBadgeColor = (type: LogType) => {
    switch (type) {
      case 'CREATE': return styles.badgeCreate;
      case 'DELETE': return styles.badgeDelete;
      case 'MODIFY': return styles.badgeModify;
      case 'LOGIN': return styles.badgeLogin;
      case 'LOGOUT': return styles.badgeLogout;
      case 'SETTINGS_CHANGE':
      case 'PASSWORD_CHANGE':
      case '2FA_TOGGLE': return styles.badgeSettings;
      default: return styles.badgeDefault;
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).replace(',', ' ·');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Shield className={styles.headerIcon} />
          <div>
            <h1>Audit Logs</h1>
            <p className={styles.subtitle}>
              <Lock size={12} className={styles.lockIcon} /> 
              Protected Activity Record · Tamper-Evident
            </p>
          </div>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search logs by keyword..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterWrapper}>
          <Filter size={18} className={styles.filterIcon} />
          <select 
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">ALL EVENTS</option>
            <option value="CREATE">CREATE</option>
            <option value="DELETE">DELETE</option>
            <option value="MODIFY">MODIFY</option>
            <option value="LOGIN">LOGIN</option>
            <option value="SETTINGS_CHANGE">SETTINGS</option>
          </select>
        </div>
      </div>

      <div className={styles.logList}>
        {filteredLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} opacity={0.2} />
            <h3>No activities found</h3>
            <p>User actions will appear here automatically as they occur.</p>
          </div>
        ) : (
          <>
            {filteredLogs.slice(0, visibleCount).map((log) => (
              <div key={log.id} className={`${styles.logCard} animate-fade-in`}>
                <div className={styles.logLeft}>
                  <div className={`${styles.badge} ${getBadgeColor(log.type)}`}>
                    <Zap size={12} />
                    {log.type}
                  </div>
                  <div className={styles.timestamp}>
                    <Calendar size={14} />
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </div>
                </div>
                
                <div className={styles.logBody}>
                  <p className={styles.description}>{log.description}</p>
                  <p className={styles.source}>Source: {log.source}</p>
                </div>
              </div>
            ))}
            
            {visibleCount < filteredLogs.length && (
              <button className={styles.loadMore} onClick={loadMore}>
                Load More Entries
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
