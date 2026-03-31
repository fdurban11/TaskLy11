import React from 'react';
import { Clock, CalendarDays, CheckCircle, Trash2, Edit } from 'lucide-react';
import styles from './TaskCard.module.css';
import { Task } from '@/lib/supabaseClient';

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, newStatus: Task['status']) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onArchive?: (id: string) => void;
  index: number;
}

export default function TaskCard({ task, onStatusChange, onDelete, onEdit, onDragStart, onArchive, index }: TaskCardProps) {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'High': return 'var(--accent-pink)';
      case 'Medium': return 'var(--accent-blue)';
      case 'Low': return 'var(--border-color)';
      default: return 'var(--text-primary)';
    }
  };

  const statusClass = task.status === 'Pending' ? 'status-todo' : task.status === 'In Progress' ? 'status-in_progress' : 'status-done';

  const handleNextStatus = () => {
    if (task.status === 'Pending') onStatusChange(task.id, 'In Progress');
    else if (task.status === 'In Progress') onStatusChange(task.id, 'Completed');
  };

  const priorityClass = `priority-${task.priority.toLowerCase()}`;
  
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'Completed';

  return (
    <div 
      className={`${styles.card} animate-fade-in ${styles[priorityClass]}`} 
      style={{ animationDelay: `${index * 0.05}s` }}
      draggable={!!onDragStart && task.status !== 'Completed'}
      onDragStart={(e) => onDragStart && task.status !== 'Completed' ? onDragStart(e, task.id) : undefined}
    >
      <div className={styles.cardHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 className={styles.title}>{task.title}</h3>
          <span className={styles.priorityBadge} style={{ color: getPriorityColor(), borderColor: getPriorityColor() }}>
            {task.priority} Priority
          </span>
        </div>
        <div className={`badge ${statusClass}`}>
          {task.status}
        </div>
      </div>
      
      <p className={styles.description}>{task.description}</p>
      
      <div className={styles.footer}>
        <div className={styles.dates}>
          <div className={styles.schedule}>
            <CalendarDays size={14} color="var(--primary)" />
            <span>Assigned: {new Date(task.assigned_date).toLocaleDateString()}</span>
          </div>
          <div className={styles.schedule} style={{ color: isOverdue ? 'var(--accent-pink)' : 'inherit' }}>
            <Clock size={14} color={isOverdue ? "var(--accent-pink)" : "var(--accent-blue)"} />
            <span>Due: {new Date(task.due_date).toLocaleDateString()}{task.due_time ? ` at ${task.due_time}` : ''}</span>
          </div>
        </div>
        
        <div className={styles.actions}>
          {task.status !== 'Completed' && (
            <button className={styles.actionBtn} onClick={() => onEdit(task)} title="Edit task">
              <Edit size={16} />
            </button>
          )}
          {task.status !== 'Completed' && (
            <button 
              className={styles.actionBtn} 
              onClick={handleNextStatus}
              title="Move forward"
              style={{ color: 'var(--primary)' }}
            >
              <CheckCircle size={16} />
            </button>
          )}
          {task.status === 'Completed' && onArchive && (
            <button 
              className={styles.actionBtn} 
              onClick={() => onArchive(task.id)}
              title="Archive task"
              style={{ color: 'var(--accent-blue)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
            </button>
          )}
          <button 
            className={styles.actionBtn} 
            onClick={() => onDelete(task.id)}
            style={{ color: 'var(--accent-pink)' }}
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
