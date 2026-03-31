"use client";
import React, { useState, useEffect } from 'react';
import { Archive as ArchiveIcon } from 'lucide-react';
import styles from './TaskBoard.module.css';
import TaskCard from './TaskCard';
import { supabase, isMockMode, Task } from '@/lib/supabaseClient';

export default function ArchiveBoard({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    setLoading(true);
    if (isMockMode) {
      setTimeout(() => {
        const localTasks = localStorage.getItem(`tasks_${userId}`);
        if (localTasks) {
          const parsed = JSON.parse(localTasks);
          setTasks(parsed.filter((t: Task) => t.archived));
        }
        setLoading(false);
      }, 500);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', true)
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data);
    setLoading(false);
  };

  const syncMock = (newTasks: Task[]) => {
    setTasks(newTasks);
    if (isMockMode) {
      // Must read all tasks, update the ones in state, and rewrite
      const localTasks = localStorage.getItem(`tasks_${userId}`);
      if (localTasks) {
        let allTasks: Task[] = JSON.parse(localTasks);
        // Replace updated tasks
        const updatedIds = newTasks.map(t => t.id);
        allTasks = allTasks.filter(t => !updatedIds.includes(t.id)).concat(newTasks);
        localStorage.setItem(`tasks_${userId}`, JSON.stringify(allTasks));
      }
    }
  };

  const deleteTask = async (id: string) => {
    // We only update local state, actual deletion logic
    const nextTasks = tasks.filter(t => t.id !== id);
    setTasks(nextTasks);
    if (isMockMode) {
      const localTasks = localStorage.getItem(`tasks_${userId}`);
      if (localTasks) {
        let allTasks: Task[] = JSON.parse(localTasks);
        allTasks = allTasks.filter(t => t.id !== id);
        localStorage.setItem(`tasks_${userId}`, JSON.stringify(allTasks));
      }
    } else {
      await supabase.from('tasks').delete().eq('id', id);
    }
  };

  const restoreTask = async (id: string) => {
    const nextTasks = tasks.filter(t => t.id !== id);
    setTasks(nextTasks);

    if (isMockMode) {
      const localTasks = localStorage.getItem(`tasks_${userId}`);
      if (localTasks) {
        let allTasks: Task[] = JSON.parse(localTasks);
        allTasks = allTasks.map(t => t.id === id ? { ...t, archived: false } : t);
        localStorage.setItem(`tasks_${userId}`, JSON.stringify(allTasks));
      }
    } else {
      await supabase.from('tasks').update({ archived: false }).eq('id', id);
    }
  };

  return (
    <div className={styles.boardContainer}>
      <div className={styles.header} style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ArchiveIcon size={32} color="var(--primary)" />
            Archived Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>These tasks have been completed and archived.</p>
        </div>
        
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <input 
              type="text" 
              placeholder="Search archived tasks..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
          overflowY: 'auto'
      }}>
        {loading ? (
           <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading archived tasks...</div>
        ) : tasks.length === 0 ? (
           <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>No archived tasks found.</div>
        ) : (
          tasks.filter(t => 
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((task, index) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              index={index}
              onStatusChange={() => {}} // Disabled in archive
              onDelete={deleteTask}
              onEdit={() => {}} // Disabled in archive
              onDragStart={undefined}
              onArchive={() => restoreTask(task.id)} // Repurpose to Restore!
            />
          ))
        )}
      </div>
    </div>
  );
}
