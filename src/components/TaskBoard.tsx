"use client";
import React, { useState, useEffect } from 'react';
import { Plus, X, ListTodo, Activity, CheckCircle2, Bell, Filter } from 'lucide-react';
import styles from './TaskBoard.module.css';
import TaskCard from './TaskCard';
import { supabase, isMockMode, Task } from '@/lib/supabaseClient';

const generateMockTasks = (userId: string): Task[] => {
  const today = new Date();
  const tmrw = new Date(today); tmrw.setDate(tmrw.getDate() + 1);
  const ystr = new Date(today); ystr.setDate(ystr.getDate() - 1);
  
  return [
    { id: '1', user_id: userId, title: 'Design Landing Page', description: 'Create premium glassmorphism UI for the landing page', status: 'Pending', priority: 'High', assigned_date: today.toISOString(), due_date: tmrw.toISOString(), created_at: today.toISOString() },
    { id: '2', user_id: userId, title: 'Supabase Integration', description: 'Setup database tables and policies', status: 'In Progress', priority: 'Medium', assigned_date: ystr.toISOString(), due_date: today.toISOString(), created_at: ystr.toISOString() },
    { id: '3', user_id: userId, title: 'Write Documentation', description: 'Document APIs', status: 'Completed', priority: 'Low', assigned_date: ystr.toISOString(), due_date: ystr.toISOString(), created_at: ystr.toISOString() }
  ];
};

export default function TaskBoard({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  
  // Filtering
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Notifications
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // Form State
  const defaultTask = { title: '', description: '', priority: 'Medium' as Task['priority'], status: 'Pending' as Task['status'], assigned_date: new Date().toISOString().split('T')[0], due_date: new Date().toISOString().split('T')[0], due_time: '' };
  const [newTask, setNewTask] = useState<{ id?: string; title: string; description: string; priority: Task['priority']; status: Task['status']; assigned_date: string; due_date: string; due_time: string; }>(defaultTask);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  // Reminder alert checker
  useEffect(() => {
    if (tasks.length === 0) return;
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status === 'Completed' || task.archived) return;
        const due = new Date(task.due_date);
        const timeDiff = due.getTime() - now.getTime();
        
        if (timeDiff > 0 && timeDiff <= 3600000) {
           // UI Notification
           if (!notifications.includes(task.id)) {
              setNotifications(prev => [...prev, task.id]);
           }
           // Server handles email reminders via /api/reminders/check
        }
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks, notifications]);

  const fetchTasks = async () => {
    setLoading(true);
    if (isMockMode) {
      setTimeout(() => {
        const localTasks = localStorage.getItem(`tasks_${userId}`);
        if (localTasks) {
          setTasks(JSON.parse(localTasks));
        } else {
          const mocks = generateMockTasks(userId);
          setTasks(mocks);
          localStorage.setItem(`tasks_${userId}`, JSON.stringify(mocks));
        }
        setLoading(false);
      }, 500);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      setDbError(`Database error: ${error.message}. Make sure the "tasks" table exists in your Supabase project.`);
    } else if (data) {
      setTasks(data);
      setDbError(null);
    }
    setLoading(false);
  };

  const syncMock = (newTasks: Task[]) => {
    setTasks(newTasks);
    if (isMockMode) localStorage.setItem(`tasks_${userId}`, JSON.stringify(newTasks));
  };

  const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    if (isEditing && newTask.id) {
      // Update logic
      const editDueDateStr = newTask.due_time
        ? `${newTask.due_date}T${newTask.due_time}:00`
        : newTask.due_date;
      const editedTask: Partial<Task> = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        assigned_date: new Date(newTask.assigned_date).toISOString(),
        due_date: new Date(editDueDateStr).toISOString(),
        due_time: newTask.due_time || undefined,
      };
      const updatedTasks = tasks.map(t => t.id === newTask.id ? { ...t, ...editedTask } as Task : t);
      syncMock(updatedTasks);

      // Check if status changed
      const originalTask = tasks.find(t => t.id === newTask.id);
      const statusChanged = originalTask && originalTask.status !== newTask.status;

      if (statusChanged && (newTask.status === 'In Progress' || newTask.status === 'Completed')) {
        const type = newTask.status === 'In Progress' ? 'status_in_progress' : 'status_completed';
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editedTask, to: userEmail, taskTitle: editedTask.title, type })
        }).catch(err => console.error("Failed to trigger email:", err));
      }

      if (!isMockMode) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { due_time: _dt, ...dbPayload } = editedTask as Task;
        await supabase.from('tasks').update(dbPayload).eq('id', newTask.id);
      }
    } else {
      // Create logic
      const dueDateStr = newTask.due_time
        ? `${newTask.due_date}T${newTask.due_time}:00`
        : newTask.due_date;
      const taskData: Omit<Task, 'id' | 'created_at'> = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        assigned_date: new Date(newTask.assigned_date).toISOString(),
        due_date: new Date(dueDateStr).toISOString(),
        due_time: newTask.due_time || undefined,
        user_id: userId,
      };
      // Strip due_time from DB payload — it's embedded in due_date already
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { due_time: _dueTime, ...dbTaskData } = taskData;

      if (isMockMode) {
        const createdTask: Task = {
          ...taskData,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        };
        syncMock([createdTask, ...tasks]);
      } else {
        const { data, error } = await supabase.from('tasks').insert([dbTaskData]).select();
        if (error) {
          console.error('Supabase insert error:', error);
          setDbError(`Failed to save task: ${error.message}. Make sure the "tasks" table exists in your Supabase project.`);
          return; // Don't close modal on error
        }
        if (data) {
          const newTaskData = data.map((d: Task) => ({ ...d, due_time: newTask.due_time || undefined }));
          setTasks([...newTaskData, ...tasks]);
          setDbError(null);
          
          // Send creation email
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...taskData, to: userEmail, taskTitle: taskData.title, type: 'creation' })
          }).catch(err => console.error("Failed to trigger email:", err));
        }
      }
    }

    setNewTask(defaultTask);
    setIsModalOpen(false);
    setIsEditing(false);
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    const originalTask = tasks.find(t => t.id === id);
    if (originalTask && originalTask.status !== status) {
      if (status === 'In Progress' || status === 'Completed') {
        const type = status === 'In Progress' ? 'status_in_progress' : 'status_completed';
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...originalTask, status, to: userEmail, taskTitle: originalTask.title, type })
        }).catch(err => console.error("Failed to trigger email:", err));
      }
    }

    syncMock(tasks.map(t => t.id === id ? { ...t, status } : t));
    if (!isMockMode) await supabase.from('tasks').update({ status }).eq('id', id);
  };

  const deleteTask = async (id: string) => {
    syncMock(tasks.filter(t => t.id !== id));
    if (!isMockMode) await supabase.from('tasks').delete().eq('id', id);
  };

  const openEditModal = (task: Task) => {
    setNewTask({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assigned_date: task.assigned_date.split('T')[0],
      due_date: task.due_date.split('T')[0],
      due_time: task.due_time || '',
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Drag and Drop
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };
  
  const onDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (draggedTaskId) {
      const draggedTask = tasks.find(t => t.id === draggedTaskId);
      if (draggedTask) {
        const statusOrder: Record<Task['status'], number> = {
          'Pending': 0,
          'In Progress': 1,
          'Completed': 2,
        };
        // Only allow forward moves (never backward)
        if (statusOrder[status] > statusOrder[draggedTask.status]) {
          updateTaskStatus(draggedTaskId, status);
        }
      }
      setDraggedTaskId(null);
    }
  };

  const archiveTask = async (id: string) => {
    syncMock(tasks.map(t => t.id === id ? { ...t, archived: true } : t));
    if (!isMockMode) await supabase.from('tasks').update({ archived: true }).eq('id', id);
  };

  const RenderColumn = ({ title, status, icon: Icon, titleClass }: { title: string; status: Task['status']; icon: any; titleClass: string }) => {
    let columnTasks = tasks.filter(t => t.status === status && !t.archived);
    
    // Apply filters
    if (filterPriority !== 'All') {
      columnTasks = columnTasks.filter(t => t.priority === filterPriority);
    }
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      columnTasks = columnTasks.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query)
      );
    }
    
    return (
      <div 
        className={`${styles.column} glass-panel`}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, status)}
      >
        <div className={styles.columnHeader}>
          <div className={`${styles.columnTitle} ${titleClass}`}>
            <Icon size={18} />
            {title}
          </div>
          <span className={styles.taskCount}>{columnTasks.length}</span>
        </div>
        
        <div className={styles.taskList}>
          {loading ? (
             <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Loading...</div>
          ) : columnTasks.length === 0 ? (
             <div style={{ padding: '20px', textAlign: 'center', opacity: 0.3, fontSize: '0.9rem' }}>Drop tasks here</div>
          ) : (
            columnTasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index}
                onStatusChange={updateTaskStatus}
                onDelete={deleteTask}
                onEdit={openEditModal}
                onDragStart={onDragStart}
                onArchive={archiveTask}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  // Metrics calculation
  const unarchivedTasks = tasks.filter(t => !t.archived);
  const totalTasks = unarchivedTasks.length;
  const completedTasks = unarchivedTasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = unarchivedTasks.filter(t => t.status === 'Pending').length;
  const overdueTasks = unarchivedTasks.filter(t => t.status !== 'Completed' && new Date(t.due_date) < new Date()).length;

  return (
    <div className={styles.boardContainer}>
      {dbError && (
        <div style={{
          background: 'rgba(255, 80, 80, 0.15)',
          border: '1px solid rgba(255, 80, 80, 0.5)',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '16px',
          color: '#ff8080',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>⚠️</span>
          <span>{dbError}</span>
          <button onClick={() => setDbError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}
      {/* Dashboard Top */}
      <div className={styles.dashboardStats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Tasks</span>
          <span className={styles.statValue}>{totalTasks}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel} style={{color: 'var(--primary)'}}>Completed</span>
          <span className={styles.statValue}>{completedTasks}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending</span>
          <span className={styles.statValue}>{pendingTasks}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel} style={{color: 'var(--accent-pink)'}}>Overdue</span>
          <span className={styles.statValue} style={{color: 'var(--accent-pink)'}}>{overdueTasks}</span>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Filter size={18} style={{color: 'var(--text-secondary)'}} />
          <select 
            className={styles.filterSelect} 
            value={filterPriority} 
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
        
        <button className="btn btn-primary" onClick={() => { setNewTask(defaultTask); setIsEditing(false); setIsModalOpen(true); }}>
          <Plus size={18} />
          New Task
        </button>
      </div>

      <div className={styles.boardColumns}>
        <RenderColumn title="Pending" status="Pending" icon={ListTodo} titleClass={styles.todoTitle} />
        <RenderColumn title="In Progress" status="In Progress" icon={Activity} titleClass={styles.inProgressTitle} />
        <RenderColumn title="Completed" status="Completed" icon={CheckCircle2} titleClass={styles.doneTitle} />
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
              <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                 <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdateTask} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="E.g., Prepare quarterly report"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-input" 
                  placeholder="More details about this task..."
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Assigned Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={newTask.assigned_date}
                    onChange={(e) => setNewTask({...newTask, assigned_date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Due Time <span style={{ opacity: 0.5, fontWeight: 400, fontSize: '0.8rem' }}>(optional)</span></label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={newTask.due_time}
                  onChange={(e) => setNewTask({...newTask, due_time: e.target.value})}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    className="form-input"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input"
                    value={newTask.status}
                    onChange={(e) => setNewTask({...newTask, status: e.target.value as any})}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Toasts */}
      <div className={styles.toastContainer}>
        {notifications.map(id => {
          const t = tasks.find(t => t.id === id);
          if (!t) return null;
          return (
            <div key={id} className={styles.toast}>
              <Bell size={20} color="var(--accent-pink)" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Reminder</strong>
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Task "{t.title}" is due soon!</span>
              </div>
              <button 
                className={styles.closeButton} 
                onClick={() => setNotifications(prev => prev.filter(n => n !== id))}
                style={{ marginLeft: 'auto' }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
