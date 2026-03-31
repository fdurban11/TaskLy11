"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Info, X, Trash2, Edit } from 'lucide-react';
import styles from './CalendarBoard.module.css';
import { supabase, isMockMode, Task } from '@/lib/supabaseClient';

export default function CalendarBoard({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    setLoading(true);
    if (isMockMode) {
      setTimeout(() => {
        const localTasks = localStorage.getItem(`tasks_${userId}`);
        if (localTasks) {
          setTasks(JSON.parse(localTasks));
        }
        setLoading(false);
      }, 500);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false);

    if (!error && data) setTasks(data);
    setLoading(false);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const days = [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const lastMonthDays = getDaysInMonth(year, month - 1);

  // Padding from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: lastMonthDays - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      current: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      current: true
    });
  }

  // Padding from next month
  const totalDays = 42; // 6 rows of 7 days
  const remainingDays = totalDays - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      current: false
    });
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getPriorityClass = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return styles.highPriority;
      case 'Medium': return styles.mediumPriority;
      case 'Low': return styles.lowPriority;
      default: return '';
    }
  };

  const getTasksForDay = (day: number, m: number, y: number) => {
    return tasks.filter(t => {
      const taskDate = new Date(t.due_date);
      return taskDate.getDate() === day && 
             taskDate.getMonth() === m && 
             taskDate.getFullYear() === y;
    });
  };

  const isToday = (day: number, m: number, y: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === m && 
           today.getFullYear() === y;
  };

  return (
    <div className={styles.container}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarControls}>
             <CalendarIcon size={24} color="var(--accent-blue)" />
             <div className={styles.monthYear}>
                {monthNames[month]} {year}
             </div>
             <button className={styles.navButton} onClick={prevMonth}>
                <ChevronLeft size={20} />
             </button>
             <button className={styles.navButton} onClick={nextMonth}>
                <ChevronRight size={20} />
             </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
             <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date())}>
                Today
             </button>
             <button className="btn btn-primary" onClick={fetchTasks}>
                Refresh
             </button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {dayNames.map(d => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
        {days.map((d, i) => {
          const dayTasks = getTasksForDay(d.day, d.month, d.year);
          return (
            <div 
              key={i} 
              className={`${styles.dayCell} ${!d.current ? styles.otherMonth : ''} ${isToday(d.day, d.month, d.year) ? styles.today : ''}`}
            >
              <div className={styles.dayNumber}>{d.day}</div>
              <div className={styles.taskList}>
                {dayTasks.map(t => (
                  <div 
                    key={t.id} 
                    className={`${styles.taskItem} ${getPriorityClass(t.priority)}`}
                    title={`${t.title}: ${t.description}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(t);
                    }}
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedTask && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTask(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Task Details</h2>
              <button className={styles.closeButton} onClick={() => setSelectedTask(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--text-highlight)', margin: '5px 0' }}>{selectedTask.title}</h3>
                <p style={{ opacity: 0.7, lineHeight: '1.6', fontSize: '1rem' }}>{selectedTask.description || 'No description provided.'}</p>
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div className={styles.badge} style={{ background: 'rgba(0, 168, 255, 0.15)', color: 'var(--accent-blue)' }}>
                  Due: {new Date(selectedTask.due_date).toLocaleDateString()}
                </div>
                <div 
                  className={styles.badge} 
                  style={{ 
                    background: selectedTask.priority === 'High' ? 'rgba(255, 87, 87, 0.1)' : 'rgba(255, 165, 0, 0.1)',
                    color: selectedTask.priority === 'High' ? 'var(--accent-pink)' : 'var(--accent-orange)'
                  }}
                >
                  {selectedTask.priority} Priority
                </div>
                <div className={styles.badge} style={{ background: 'rgba(0, 255, 168, 0.1)', color: 'var(--primary)' }}>
                  {selectedTask.status}
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSelectedTask(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="glass-panel" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
        <Info size={20} color="var(--accent-blue)" />
        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Tasks are displayed on their <strong>Due Date</strong>. Click on a task to view details.</span>
      </div>
    </div>
  );
}
